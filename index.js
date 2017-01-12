const express = require('express')
const path = require('path')

let indexs = require('./routes/index')
let users = require('./routes/user') 

let app = express()
app.set('views', path.join(__dirname, 'views'))    //设置存放模板的位置
app.set('view engine', 'ejs')   //设置末班引擎为ejs

app.use(express.static(path.join(__dirname, 'public')))


app.use('/', indexs)
app.use('/user', users)


app.get('/', (req, res) => {
  res.send("fdsfdsfs")
})

app.listen(3000)



