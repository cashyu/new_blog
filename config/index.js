const path = require('path');
let env = process.env.NODE_ENV || 'development';  //设置nodejs的环境变量
let test = process.env.NODE_ENV === 'test';
let debug = process.env.NODE_ENV !== 'production';
let host = process.env.HOST || '0.0.0.0';
let config = {
  env,
  test,
  debug,
  host,
  appPath: path.join(__dirname, '../'),
  routers: {
    verbose: true,
    ramldir: path.join(__dirname, '../design/api'),
    handir: path.join(__dirname, '../design/handlers')
  },
  port: 3000,
  session: {
    secret: "cashyu",
    db: 'blog_session'
  },
  redis: {
    host: "127.0.0.1",
    port: 6379,
    dsn: 'localhost:6379'
  },
  mongodb: {
    dsn: 'mongodb://localhost:27017/blog'
  }
}

let envConfig = {
  test(defaultConfig) {
    return {
      port: defaultConfig.port + 1,
      mongodb: Object.assign(defaultConfig.mongodb, {
        dsn: process.env.DB || 'mongodb://localhost:27017/blog'
      })
    }
  }
}

if(envConfig[env]) Object.assign(config, envConfig[env](config)) || {};

console.log("eeeeeeeeeeeeee")
console.log(config)
module.exports = config 

