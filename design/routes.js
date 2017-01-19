/*
 * 注入路由
 */

const path = require('path');
const raml = require('./raml');
const methods = require('./middlewares/methods')

module.exports = function route(app, ramlConfig, db, config) {
  let {moduleUrl, ramlfile, handlers} = ramlConfig;
  let Raml = raml(ramlfile);
  let routes = Raml.routes();
  let validates;
  let logRoute = (verb, uri, handlerFunc, status) => {
    if(!config.test && config.debug) 
      console.log(`[${status}] [${verb.toUpperCase()} ${uri}] ${handlerFunc}`);
  } 
  if(config.debug) {
    app.get(`${moduleUrl}/_/routes`, (req, res, next) => {
      res.status(200).json(routes)
    })
  }
  for (let route of routes) {
    let uri = (`${moduleUrl}` + route.uri).replace(/\{/g, ':').replace(/\}/g, '');
    let handler = handlers[route.handlerFunc];
    if(handler) {
      let mids = [methods]; //将methods加入mids数组中
      mids.push((req, res, next) => {
        let query = req.query;
        if(query.q) try {
          query.q = JSON.parse(query.q);
        } catch(e) {
          return res.err('q格式不正确', 'MDW_VAL_QUY', {status: 400});
        }
        try {
          req.model = req.db.getCollection(route.groupBy);
        } catch(e) {
          if (e.code === 'MON_COL_NMD') {
            req.model = undefined;
          } else {
            res.err(e)
          }
        }
        next();
      });
      if(route.xml) mids.push(xml);
      console.log(route.verb)
      console.log(uri)
      console.log(handler)
      app[route.verb](uri, mids, handler);  //设置路由的中间件
    }
    if (config.routers.verbose) {
      let status = handler ? 'work' : 'miss';
      logRoute(route.verb, uri, route.handlerFunc, status)
    }
  }
  return routes;
}



