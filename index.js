const express = require('express');
const path = require('path');
const session = require('express-session');
const cookie = require('cookie-parser');
const RedisStore = require('connect-redis')(session);
const flash = require('connect-flash');
const config = require("./config");
const blog = require('./design');

//let routes = require("./routes")

let app = express()


//设置模板
app.set('views', path.join(__dirname, 'views'))    //设置存放模板的位置
app.set('view engine', 'ejs')   //设置末班引擎为ejs

//设置静态文件目录
app.use(express.static(path.join(__dirname, 'public'))) 

/******session中间件 *********/
//1.设置cookie
app.use(cookie(config.session.secret))
//2.设置session
app.use(session({
  store: new RedisStore({
    host: config.redis.host,
    port: config.redis.port,
    db: config.session.db
  }),
  secret: config.session.secret
}))

//flash中间件，用来显示通知
//falsh是基于session来通知的，所以应该放在session中间件后面
app.use(flash())

let {db, redis} = blog(config, app);
app.routers();
/*
app.listen(config.port, () => {
  console.log(`blog listening on port ${config.port}`);
})
*/

if(!module.parent){
  app.run();
}
module.exports = {app, db, redis, config};
