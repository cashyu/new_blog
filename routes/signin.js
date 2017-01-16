const express = require('express')
let router = express.Router()

//用户注册页
router.get('/', (req, res) => {
  res.render('signup')
})

//用户注册
router.post('/', (req, res) => {
  
})

module.exports = router


