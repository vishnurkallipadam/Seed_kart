const { resolve, reject } = require('promise')
const db=require('../config/connection')
const bcrypt=require('bcrypt')
const await = require('await')
const collection= require('../config/collections')
const objectId=require('mongodb').ObjectID
const { response } = require('express')

module.exports={
    doSignup:(sellerdata)=>{
        return new Promise(async(resolve,reject)=>{
            var email=await db.get().collection(collection.SELLER_COLLECTION).findOne({email:sellerdata.email})
            if (email) {
                resolve({signuperror:true})
            }
            else{
            sellerdata.password=await bcrypt.hash(sellerdata.password,10)
            
            db.get().collection(collection.SELLER_COLLECTION).insertOne(sellerdata)
            .then((data)=>{
                resolve(data.ops[0])
            })
        }
        })
    },
    doLogin:(logindata)=>{
        return new Promise(async(resolve,reject)=>{
            var response={}
            var email=await db.get().collection(collection.SELLER_COLLECTION).findOne({email:logindata.email})
            if(email) {
                bcrypt.compare(logindata.password,email.password)
                .then((status)=>{
                    if (status){
                        console.log('success')
                        response.seller=email
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
    addAdvertisment:(addata,sellerid)=>{
        return new Promise(async(resolve,reject)=>{
            addata.seller=sellerid
            db.get().collection(collection.ADS_COLLECTION).insertOne(addata)
            .then((data)=>{
                resolve(data.ops[0])
            })

        
        })

    },
    getSellerAds:(sellerid)=>{
        return new Promise(async(resolve,reject)=>{
            var ads=await db.get().collection(collection.ADS_COLLECTION).find({seller:sellerid}).toArray()
            resolve(ads)
        })
    },
    removeAdvertisement:(adid)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADS_COLLECTION).removeOne({_id:objectId(adid)}).then(()=>{
                resolve()
            })
            
        })
    }

    

}