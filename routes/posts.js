const express = require('express')
let router = express.Router()

router.get('/', (req, res) => {
  res.render('posts', {
    title: "fdfd"
  })
})

module.exports = router


