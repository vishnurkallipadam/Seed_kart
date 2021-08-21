const mongoClient=require('mongodb').MongoClient
const state={
    db:null
}
module.exports={
    connection:function(done){
        const url='mongodb://localhost:27017'
        const dbname='seedkart'
        mongoClient.connect(url,{ useUnifiedTopology: true },(error,data)=>{
            if (error) return done(error)
            state.db=data.db(dbname)
            done()
        })
    },
    get:function(){
        return state.db
    }
}