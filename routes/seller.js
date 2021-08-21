const await = require('await');
const { response, request } = require('express');
var express = require('express');
const fileUpload = require('express-fileupload');
var router = express.Router();
var producthelpers=require('../helpers/producthelpers')
var sellerhelpers=require('../helpers/sellerhelpers')

const verifyLogin=(req,res,next)=>{
  if(req.session.seller)
  next()
  else
  res.redirect('/seller/login')
}
/* GET home page. */
router.get('/', function(req, res) {
  if(req.session.seller){
    producthelpers.getSellerProducts(req.session.seller._id).then((response)=>{
    sellerhelpers.getSellerAds(req.session.seller._id).then((data)=>{
      console.log(data);
      res.render('seller/my_product', {products:response,seller:req.session.seller,ads:data});

    })
   
   })
  }else{
    res.redirect('/seller/login')
  }
});
router.get('/add_product/:id',verifyLogin,function(req,res){
  res.render('seller/add_product', {seller:req.session.seller});
});

router.get('/sales_report',verifyLogin,function(req,res){
  res.render('seller/sales_report',{seller:req.session.seller})
});

router.get('/aboutus',function(req,res){
  res.render('user/about_us', {user:false});
});
router.post('/add_product',verifyLogin,function(req,res){
  console.log(req.body)
  console.log(req.files)
  req.body.seller=req.session.seller._id
  producthelpers.addProduct(req.body)
  .then((response)=>{
    if(response){
      let image=req.files.image
      let id=response._id
      image.mv('./public/product_images/'+id+'.jpg',(error,result)=>{
        if(error){
          res.redirect('/seller/my_product')
        }else console.log(error);
      })

    }
    res.redirect('/seller')
  })

});
router.get('/editproduct/:id',verifyLogin,async function(req,res){
  let productId=req.params.id
  let product=await producthelpers.getProduct(productId)
  res.render('seller/edit_product',{product})
});
router.post('/edit_product/:id',verifyLogin,function(req,res){
  producthelpers.editProduct(req.params.id,req.body)
  .then(()=>{
    res.redirect('/seller')
    if(req.files.image){
      var image=req.files.image
      var id=req.params.id
      image.mv('./public/product_images/'+id+'.jpg')
    }
  })
});
router.get('/removeproduct/:id',verifyLogin,async function(req,res){
  let productId=req.params.id
  producthelpers.removeProduct(productId)
  .then(()=>{
    res.redirect('/seller')
  })
  
});
router.get('/seller_signup',function(req,res){
  res.render('seller/seller_signup')
});
router.post('/seller_signup',function(req,res){
  sellerhelpers.doSignup(req.body)
  .then((data)=>{
    if(data.signuperror){
      res.redirect('/seller/seller_signup')
    }
    else{
      console.log(data)
      req.session.seller=data
      res.redirect('/seller')
    }
  })
  
})
router.get('/login',function(req,res){
  if(req.session.seller){
    res.redirect('/seller')
  }else
  res.render('seller/seller_login',{user:true})
})
router.post('/login',function(req,res){
  sellerhelpers.doLogin(req.body)
  .then((response)=>{
    if(response.loginerror){
      res.redirect('/seller/login')
    }else{
      console.log(response)
      req.session.seller=response.seller
      res.redirect('/seller')

    }

  })
});
router.get('/logout',function(req,res){
  req.session.seller=false
  res.redirect('/seller')
});
router.get('/advertisment',verifyLogin,function(req,res){
  res.render('seller/add_advertisment',{seller:req.session.seller})
});
router.post('/advertisment',verifyLogin,function(req,res){
  sellerhelpers.addAdvertisment(req.body,req.session.seller._id)
  .then((response)=>{
    console.log(response);
    if(req.files.image){
      var image=req.files.image
      var id=response._id
      image.mv('./public/ad_images/'+id+'.jpg')
    }
    res.redirect('/seller')
  })
});
router.get('/remove_ads/:id',async function(req,res){
  let adId=req.params.id
  console.log(adId);
  sellerhelpers.removeAdvertisement(adId)
  .then(()=>{
    res.redirect('/seller')
  })
  
});



module.exports = router;
