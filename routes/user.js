const express = require('express')

let router = express.Router()


router.get('/:name', (req, res) => {
  res.send("fdsfdsfds")
})

module.exports = router
