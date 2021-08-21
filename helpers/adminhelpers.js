const { resolve, reject } = require('promise')
const db=require('../config/connection')
const bcrypt=require('bcrypt')
const await = require('await')
const collection= require('../config/collections')
const objectId=require('mongodb').ObjectID
const { response } = require('express')

module.exports={
    findAdmin:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADMIN_COLLECTION).find().toArray()
            .then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    createAdmin:()=>{
        return new Promise(async(resolve,reject)=>{
            let password=await bcrypt.hash('admin123',10)
            let admin={
                username:'admin',
                password:password
            }
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(admin)
            .then(()=>{
                resolve()
            })

        })
    },
    doLogin:(admindata)=>{
        return new Promise(async(resolve,reject)=>{
            var response={}
            var admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({username:admindata.username})
            if(admin) {
                bcrypt.compare(admindata.password,admin.password)
                .then((status)=>{
                    if (status){
                        console.log('success')
                        response.admin=admin
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
    getAllUsers:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).find().toArray()
            .then((response)=>{
                resolve(response)
            })
        })
    },
    getAllSellers:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.SELLER_COLLECTION).find().toArray()
            .then((response)=>{
                resolve(response)
            })
        })
    },
    findPendingProducts:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find({status:'pending'}).toArray()
            .then((response)=>{
                resolve(response)

            })
        })
    },
    approveProduct:(productid)=>{
        return new Promise((resolve,reject)=>{

            
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productid)},{
                $set:{
                    status:'approved'
                }

            }).then(()=>{
                resolve()
            })
            })   
    },
    getAllProducts:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).find({status:'approved'}).toArray()
            .then((response)=>{
                resolve(response)
            })
        })
    },
    rejectProduct:(productid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productid)},{
                $set:{
                    status:'rejected'
                }

            }).then(()=>{
                resolve()
            })

        })
    },
    findOrders:()=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            .then((response)=>{
                resolve(response)
            })
        })
    },
    removeUser:(userid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.USER_COLLECTION).removeOne({_id:objectId(userid)})
            .then(()=>{
                resolve()
            })
        })

    },
    removeProduct:(productid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(productid)})
            .then(()=>{
                resolve()
            })
        })

    },
    removeSeller:(sellerid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.SELLER_COLLECTION).removeOne({_id:objectId(sellerid)})
            .then(()=>{
                resolve()
            })
        })

    }
    
}