const { resolve, reject } = require('promise')
const db=require('../config/connection')
const bcrypt=require('bcrypt')
const await = require('await')
const collection= require('../config/collections')
const objectId=require('mongodb').ObjectID
const { response } = require('express')

module.exports={
    addProduct:(products)=>{
        return new Promise((resolve,reject)=>{
            products.status='pending'
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(products)
            .then((response)=>{
                resolve(response.ops[0])
            })
        })


    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            var products=await db.get().collection(collection.PRODUCT_COLLECTION).find({status:'approved',quantity:{$ne:0}}).toArray()
            resolve(products)
        })
    },
    getProduct:(productid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(productid)}).then((response)=>{
                resolve(response)
            })

        })
    },
    editProduct:(productid,productdetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(productid)},{
                $set:{
                    productname:productdetails.productname,
                    category:productdetails.category,
                    description:productdetails.description,
                    mrp:productdetails.mrp,
                    sellingprice:productdetails.sellingprice,
                    quantity:productdetails.quantity
                }
            }).then(()=>{
                resolve()
            })
        })
    },
    removeProduct:(productid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(productid)}).then(()=>{
                resolve()
            })
        })
    },
    getSellerProducts:(sellerid)=>{
        return new Promise(async(resolve,reject)=>{
            var products=await db.get().collection(collection.PRODUCT_COLLECTION).find({seller:sellerid}).toArray()
            resolve(products)
        })
    },
    
    

}