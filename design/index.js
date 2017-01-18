
module.exports = function blog(opts, app) {
  const path = require('path');
  const async = require('async');
//  const cors = require('cors');
  const fs = require('fs')
  const bodyParser = require('body-parser')
  const DB = require('./db');
  const route = require('./routes');
  const dequire = require('./dequire')
  const Redis = require('ioredis')
  let config = opts;
  
  let db = new DB(config, dequire(path.join(config.appPath, 'design/models')));
  let redis = new Redis(config.redis.dsn);

  let routes = {};
  //获取raml目录
  let getRamlDirs = (routers) => {
    if(!routers) throw Error('invalid config.routers');
    let {ramldir, handir, ramlfileName = 'api.raml'} = routers;
    if(!ramldir || !handir) throw Error('invalid config.routers.ramldir or config.routers.handir');
    let dirs;
    try {
      dirs = fs.readdirSync(ramldir);
    } catch(e) {
      throw Error(`invalid config.routers.ramldir: ${ramldir}`);
    }
    try {
      fs.readdirSync(handir);
    } catch(e) {
      throw Error(`invalid config.routers.handir: ${handir}`);
    }
    return {ramldir, handir, ramlfileName, dirs};
  }
  //检查raml文件
  let checkRamlFile = (ramldir, handir, ramlfileName, dir) => {
    let ramlFile;
    try {
      let ramlfile = path.join(ramldir, dir, ramlfileName);
      let ramlhandir = path.join(handir, dir);
      fs.accessSync(ramlfile, fs.F_ok); //检查文件是否存在
      fs.accessSync(ramlhandir, fs.F_OK);
      let version = dir;
      ramlFile = {ramlfile, version, ramlhandir};
    } catch(e) {}
    return ramlFile;
  }
  //设置raml路由
  let setRamlRoute = (raml) => {
    raml.handlers = dequire(raml.ramlhandir);
    raml.moduleUrl = '/' + raml.version;
    return route(app, raml, db, config)
  }
  //获取raml缓存
  let getCacheRoute = (raml, route) => {
    let {verb, handlerFunc} = route;
    let uri = raml.moduleUrl + route.uri;
    return {verb, handlerFunc, uri}    
  }
/*  
  //缓存路由
  let cacheRoutes = () => {
    let {test} = config;
    return redis.get('blog:routes').then(data => {
      data = !data ? {} : JSON.parse(data);
      data['blog'] = routes;
      if(test) return Promise.resolve();
      return redis.set('blog:routes', JSON.stringify(data));
    })
  }
*/  
  async.parallel([
    (cb) => {
      db.connect(cb)
    }
  ], (err) => {
    if(err) throw err
  });

  app.use(bodyParser.json());

  //注册服务
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  //绑定路由
  app.routers = () => {
    let {ramldir, handir, ramlfileName, dirs} = getRamlDirs(config.routers);
    let ramls = dirs.map(dir => checkRamlFile(ramldir, handir, ramlfileName, dir)).filter(ramlFile => Boolean(ramlFile));
    ramls.forEach(raml => {
      routes[raml.version] = setRamlRoute(raml).map(route => getCacheRoute(raml, route))
    });
  }
  app.run = (cb) => {
    app.use((err, req, res, next) => {
      let code = err.code;
      let message = err.message;
      let status = err.status;
      if(!(err instanceof BlogError)) {
        code = 'UNC_SYS_EXP';
        message = '为捕获异常';
        status = 500;
      }
      res.status(status).send({code, message});
    });
    app.listen(config.port, config.host, undefined, cb)
  }

  return {db, redis}
}

