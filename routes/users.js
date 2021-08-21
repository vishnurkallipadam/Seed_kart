const { response } = require('express');
var express = require('express');
var router = express.Router();
const userhelpers=require('../helpers/userhelpers')
const producthelpers=require('../helpers/producthelpers');
const await = require('await');
const { updateProductCount } = require('../helpers/userhelpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.user)
  next()
  else
  res.redirect('/login')
}

/* GET home page. */
router.get('/', function(req, res, next) {
  
  producthelpers.getAllProducts().then((response)=>{
    var products=response 
    console.log(products);

    if(req.session.user){
      userhelpers.getAllAds().then((data)=>{
        console.log(data);
        res.render('user/user_index', { user:req.session.user,products,ads:data});
      })
      
      
    }else{
      res.redirect('/login')
    }
  })

 
  
});
router.get('/login',function(req,res){
  res.render('user/login',{user:true});
});
router.post('/login',function(req,res){
  console.log(req.body)
  userhelpers.doLogin(req.body)
  .then((response)=>{
    if(response.loginerror){
      res.redirect('/login')
    }else{
      console.log(response)
      req.session.user=response.user
      res.redirect('/')

    }
  })

})

router.get('/reguser',function(req,res){
  res.render('user/user_register',{user:true});
});
router.post('/register',function(req,res){
  console.log(req.body)
  userhelpers.doSignup(req.body)
  .then((data)=>{
    if(data.signuperror){
      res.redirect('/reguser')
    }
    else{
      console.log(data)
      req.session.user=data
      res.redirect('/')
    }
  })

}
)
router.get('/aboutus',verifyLogin,function(req,res){
  res.render('user/about_us',{user:req.session.user});
});

router.get('/blog',verifyLogin, function(req,res){
  userhelpers.getAllBlogs()
  .then((response)=>{
    
    res.render('user/blog',{user:req.session.user,blogs:response});
  })
 
});

router.get('/blog/add_blog',verifyLogin,function(req,res){
  res.render('user/add_blog',{user:req.session.user});
});
router.post('/submitblog',verifyLogin,async function(req,res){
  console.log(req.body);
  let author= await userhelpers.findUser(req.session.user._id)
  userhelpers.addBlog(req.body,author)
  .then((response)=>{
    if(req.files.image){
      var image=req.files.image
      var id=response._id
      image.mv('./public/blog_images/'+id+'.jpg')
    }
      res.redirect('/blog')
  })


})
router.get('/addlike/:id',verifyLogin,function(req,res){
  userhelpers.addLike(req.params.id,req.session.user._id)
  .then((response)=>{
    res.json(response)

  })
})

router.get('/logout',function(req,res){
  req.session.user=false
  res.redirect('/')
});
router.get('/add_to_cart/:id',verifyLogin,function(req,res){
  userhelpers.addToCart(req.session.user._id,req.params.id)
  .then(()=>{
    res.redirect('/')

  })

})
router.get('/cart',verifyLogin,async function(req,res){
  let product=await userhelpers.getCartProducts(req.session.user._id)

  if(product.length!=0){
    product.forEach((p) => {
      p.netamount=parseInt(p.count)*parseInt(p.product.sellingprice)
      
    });
    console.log(product);
    let total=await userhelpers.getCartTotal(req.session.user._id)
    console.log(total);
    
    res.render('user/cart',{user:req.session.user,product,total})
  }else{

    res.render('user/cart',{user:req.session.user,product,empty:true})
  }
  

  
})
router.post('/update_product_count',function(req,res){
  userhelpers.updateProductCount(req.body)
  .then(async(response)=>{
    response.total=await userhelpers.getCartTotal(req.body.userid)
    console.log(response.total);
    res.json(response)
  })
})
router.post('/remove_product_from_cart',function(req,res){
  userhelpers.removeProduct(req.body)
  .then(async(response)=>{
    console.log(response);
    res.json(response)
  })
})
router.get('/checkout',verifyLogin,function(req,res){
  res.render('user/checkout',{user:req.session.user})
})
router.post('/checkout',async function(req,res){
  console.log(req.body);
  let products=await userhelpers.getCartProductList(req.body.userid)
  console.log(products);
  let total=await userhelpers.getCartTotal(req.body.userid)
  userhelpers.placeOrder(req.body,products,total)
  .then((response)=>{
    if(req.body.paymentMethod=='cash_on_delivery'){
      console.log(req.body.paymentMethod);
      res.json({successMsg:true})
    }else{
      userhelpers.createRazorpay(total,response._id)
      .then((data)=>{
        res.json(data)

      })
    }

  })
})
router.get('/orders',verifyLogin,async function(req,res){
  userhelpers.getMyOrders(req.session.user._id)
  .then((myOrder)=>{
    console.log(myOrder);
    res.render('user/my_orders',{user:req.session.user,myOrder})

  }) 
})

router.post('/verify_payment',verifyLogin,function(req,res){
  console.log(req.body);
  userhelpers.verifyPayment(req.body)
  .then(()=>{
    userhelpers.updatePaymentStatus(req.body['order[receipt]'])
    .then(()=>{
      res.json({status:true})
    })
    

  })
  .catch(()=>{
    res.json({status:false})
  })

})
module.exports = router;
