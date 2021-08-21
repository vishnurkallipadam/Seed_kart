const { resolve, reject } = require('promise')
const db=require('../config/connection')
const bcrypt=require('bcrypt')
const await = require('await')
const collection= require('../config/collections')
const objectId=require('mongodb').ObjectID
const { response, request } = require('express')
const { CART_COLLECTION } = require('../config/collections')
const razorpay=require('razorpay')
let instance=new razorpay({
    key_id:'rzp_test_ZGATXfSKdjDjl0',
    key_secret:'JlpCgDzCSpxdvfKUIofLPs6w'
})

module.exports={
    doSignup:(userdata)=>{
        return new Promise(async(resolve,reject)=>{
            var email=await db.get().collection(collection.USER_COLLECTION).findOne({email:userdata.email})
            if (email) {
                resolve({signuperror:true})
            }
            else{
            userdata.password=await bcrypt.hash(userdata.password,10)
            
            db.get().collection('users').insertOne(userdata)
            .then((data)=>{
                resolve(data.ops[0])
            })
        }
        })

        
    },
    doLogin:(userdata)=>{
        return new Promise(async(resolve,reject)=>{
            var response={}
            var email=await db.get().collection(collection.USER_COLLECTION).findOne({email:userdata.email})
            if(email) {
                bcrypt.compare(userdata.password,email.password)
                .then((status)=>{
                    if (status){
                        console.log('success')
                        response.user=email
                        resolve(response)
                    }else{
                        console.log('login failed')
                        resolve ({loginerror:true})
                    }
                })
            }else{
                console.log('login failed')
                resolve ({loginerror:true})
            }
        })

    },
    getAllAds:()=>{
        return new Promise(async(resolve,reject)=>{
            var ads=await db.get().collection(collection.ADS_COLLECTION).find().toArray()
            .then((data)=>{
                if(data){
                    resolve(data)
                }
            })
        })
    },
    addToCart:(userid,productid)=>{
        var productObject={
            item:objectId(productid),
            count:1
        }
        return new Promise(async(resolve,reject)=>{
            let usercart=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userid)})
            if(usercart){
                let proexist=usercart.products.findIndex(product => product.item==productid)
                if(proexist==-1){
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userid)},{
                        $push:{products:productObject}
                    }).then(()=>{
                        resolve()
                    })
                }else{
                    db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userid),'products.item':objectId(productid)},
                    {
                        $inc:{'products.$.count':1}
                    })
                }

            }else{
                var cartobj={
                    user:objectId(userid),
                    products:[productObject]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartobj)
                .then((response)=>{
                    resolve()
                }
                )

            }
        })


    },
    getCartProducts:(userid)=>{
        return new Promise(async(resolve,reject)=>{
            let cart=db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userid)}

                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        count:'$products.count'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                        item:1,
                        count:1,
                        product:{
                            $arrayElemAt:['$products',0]
                        }

                    }
                }
            ]).toArray()
            console.log(cart);
            resolve(cart)
        })

    },
    updateProductCount:(details)=>{
        let count=parseInt(details.count)
        let quantity=parseInt(details.quantity)
        console.log(details);
        return new Promise(async(resolve,reject)=>{
            if(count==-1 && quantity==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cartid)},{
                    $pull:{products:{item:objectId(details.productid)}}
                }).then((response)=>{
                    resolve({removeproduct:true})

                })
                
            }else{
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cartid),'products.item':objectId(details.productid)},
                {
                    $inc:{'products.$.count':count}
                    
                })
                resolve({success:true})
               
            }

        })
    },
    getCartTotal:(userid)=>{
        return new Promise(async(resolve,reject)=>{
            let total=await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match:{user:objectId(userid)}

                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        count:'$products.count'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'products'
                    }
                },
                {
                    $project:{
                        item:1,
                        count:1,
                        product:{
                            $arrayElemAt:['$products',0]
                        }

                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{
                            $sum:{$multiply:['$count', {$toInt:'$product.sellingprice'}]}

                        }

                    }
                }
            ]).toArray()
            
            resolve(total[0].total)


        })
    },
    removeProduct:(details)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cartid)},{
                $pull:{products:{item:objectId(details.productid)}}
            }).then((response)=>{
                resolve({removeproduct:true})


            })

        })
    },
    getCartProductList:(userid)=>{
        return new Promise(async(resolve,reject)=>{
            console.log('userid',userid);
           let productList=await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userid)})
           console.log('product list',productList);
           resolve(productList.products)
        })
    },
    placeOrder:(details,products,total)=>{
        return new Promise(async(resolve,reject)=>{
            console.log(products);
            let status=details.paymentMethod==='cash_on_delivery' ? 'placed' : 'pending'
            let paymethod=details.paymentMethod==='cash_on_delivery'?'Cash On Delivery' : 'Online Payment'
            let date=new Date().toLocaleDateString()
            let order={
                userid:objectId(details.userid),
                products:products,
                totalPrice:total,
                date:date,
                status:status,
                paymentMethod:paymethod,
                deliveryDetails:{
                    name:details.name,
                    phoneNumber:details.phoneno,
                    emailId:details.email,
                    address:details.address,
                    country:details.country,
                    state:details.state,
                    pinCode:details.pin
                }

            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(order)
            .then((response)=>{
                products.forEach(p => {
                    db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(p.item)})
                    .then((p2)=>{
                        if(parseInt(p2.quantity)-p.count>=0){
                            var q=parseInt(p2.quantity)-p.count
                            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(p.item)},
                            {
                                $set:{
                                    quantity:q
                                }
                            })
                            
                        }

                    })

                    
                });
                db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(details.userid)})
                resolve(response.ops[0])
                
            })
            

        })
    },
    getMyOrders:(userid)=>{
    
        return new Promise(async(resolve,reject)=>{
            let myOrder=await db.get().collection(collection.ORDER_COLLECTION).find({userid:objectId(userid)}).toArray()
            resolve(myOrder)
        })
    },
    addBlog:(data,author)=>{
        console.log(author);
        return new Promise(async(resolve,reject)=>{
            let date=new Date().toDateString()
            let blog={
                userid:objectId(data.userid),
                author:author,
                date:date,
                title:data.title,
                content:data.content,
                like:[],
                likecount:0
                


            }

            db.get().collection(collection.BLOG_COLLECTION).insertOne(blog)
            .then((response)=>{
                resolve(response.ops[0])
            })

        })

    },
    getAllBlogs:()=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.BLOG_COLLECTION).find().toArray()
            .then((data)=>{
                if(data){
                    resolve(data)
                }
            })
        })
    },
    findUser:(userid)=>{
        return new Promise(async(resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userid)})
            .then((data)=>{
                console.log(data.name);
                resolve(data.name)
            })
        })
    },
    createRazorpay:(total,orderid)=>{
        return new Promise(async(resolve,reject)=>{
            
            var options = {
                amount: total*100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: ""+orderid
              };
              instance.orders.create(options, function(err, order) {
                
                if(err){
                    console.log(err);
                }else{
                    console.log('order',order);
                    resolve(order)
                }
              });
        })
    },
    verifyPayment:(data)=>{
        return new Promise((resolve,reject)=>{
            const crypto=require('crypto')
            let hmac=crypto.createHmac('sha256','JlpCgDzCSpxdvfKUIofLPs6w')
            hmac.update(data['payment[razorpay_order_id]']+'|'+data['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==data['payment[razorpay_signature]']){
                resolve() 
            }else{
                reject()
            }

           
        })
    },
    updatePaymentStatus:(orderid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderid)},{
                $set:{
                    status:'placed'
                }

            }).then(()=>{
                resolve()
            })
            
        })
    },
    addLike:(blogid,userid)=>{
        return new Promise(async(resolve,reject)=>{
            let blog=await db.get().collection(collection.BLOG_COLLECTION).findOne({_id:objectId(blogid)})
            if(blog){
            let likeexist=blog.like.findIndex(like => like.userid == userid)
            if(likeexist!=-1){
                resolve({likesuccess:false})


            }else{
                db.get().collection(collection.BLOG_COLLECTION).updateOne({_id:objectId(blogid)},
                
                {
                    $push:{like:{userid:userid}},
                    $inc:{likecount:1}
                }).then(()=>{
                    resolve({likesuccess:true})
                })
            }}
        })
    }

}