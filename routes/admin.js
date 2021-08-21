const await = require('await');
var express = require('express');
const adminhelpers = require('../helpers/adminhelpers');
const { route } = require('./seller');
var router = express.Router();

const verifyLogin=(req,res,next)=>{
  if(req.session.admin)
  next()
  else
  res.redirect('/admin/login')
}

/* GET users listing. */
router.get('/login',async function(req, res, next) {
  let admin=await adminhelpers.findAdmin()
  if(admin.length===0){
    adminhelpers.createAdmin()
    .then(()=>{
      res.render('admin/admin_login')
    })

    
  }
  else{
    console.log(admin)
    res.render('admin/admin_login');  
  }
  
});
router.post('/login',async function(req,res){
  adminhelpers.doLogin(req.body)
  .then((response)=>{
    if(response.admin){
      req.session.admin=response.admin
      res.redirect('/admin')
    }
    else{
      res.redirect('/admin/login')
    }

  })
});
router.get('/',async function(req,res){
  if(req.session.admin){
    let pendinglist=await adminhelpers.findPendingProducts()
    console.log(pendinglist);
    res.render('admin/admin_home',{admin:req.session.admin,pendinglist})

  }else{
    res.redirect('/admin/login')
  }
});
router.get('/all_users',async function(req,res){
  let userlist=await adminhelpers.getAllUsers()
  console.log(userlist);
  res.render('admin/all_users',{admin:req.session.admin,userlist})
});
router.get('/all_sellers',verifyLogin,async function(req,res){
  let sellerslist=await adminhelpers.getAllSellers()
  console.log(sellerslist);
  res.render('admin/all_sellers',{admin:req.session.admin,sellerslist})

});
router.get('/all_products',verifyLogin,async function(req,res){
  let productlist=await adminhelpers.getAllProducts()
  console.log(productlist);

  res.render('admin/all_products',{admin:req.session.admin,productlist})
  
})
router.get('/approve_product/:id',verifyLogin,function(req,res){
  console.log(req.params.id);
  adminhelpers.approveProduct(req.params.id)
  .then(()=>{
    res.redirect('/admin')
  })
  
})
router.get('/reject_product/:id',verifyLogin,function(req,res){
  adminhelpers.rejectProduct(req.params.id)
  .then(()=>{
    res.redirect('/admin')
  })
})
router.get('/all_orders',verifyLogin,async function(req,res){
  orderlist=await adminhelpers.findOrders()
  console.log(orderlist);
  res.render('admin/all_orders',{admin:req.session.admin,orderlist})
})


router.get('/logout',function(req,res){
  req.session.admin=false
  res.redirect('/admin')
});

router.get('/remove_user/:id',verifyLogin,async function(req,res){
  adminhelpers.removeUser(req.params.id)
  .then(()=>{
    res.redirect('/admin/all_users')
  })
  
});

router.get('/remove_seller/:id',verifyLogin,async function(req,res){
  adminhelpers.removeSeller(req.params.id)
  .then(()=>{
    res.redirect('/admin/all_sellers')
  })

});

router.get('/remove_product/:id',verifyLogin,async function(req,res){
  adminhelpers.removeProduct(req.params.id)
  .then(()=>{
    res.redirect('/admin/all_products')
  })
});



module.exports = router;
