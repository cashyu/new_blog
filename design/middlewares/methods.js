const _ = require('lodash')
const BlogError = require('../../error')

module.exports = function err(req, res, next) {
  //发送错误消息
  res.err = (message, code, opts = {}) => {
    if(!(message instanceof Error)) {
      let json = {code, message};
      if(opts.error) json.errors = opts.errors;
      res.status(opts.status || 500).json(json);
      return;
    }
   console.log(message) 
    let e = message;
    let status = e.status;
    code = e.code;
    message = e.message;
    opts = e.opts || {};
    if(!(e instanceof BlogError)) {
      code = 'UNC_MDW_EXP';
      message = '未捕获异常';
      status = 500;
    }
    json = {code, message};
    if(opts.errors) json.errors = opts.errors;
    res.status(status).json(json);
  }
  //发送成功message
  res.ok = (message = '操作成功') => {
    res.status(200).json({message});
  }

  //处理promise并发送
  res.promise = promise => {
    if (promise instanceof Promise || typeof promise.then === 'function'){
      promise.then(o => {
        if (o) {
          if (typeof o === 'object') {
            if (_.isPlainObject(o) || _.isArray(o)) return res.status(200).json(o);
            return res.ok();
          }
          res.status(200).json(o);
        }
        res.ok()
      }).catch(err => {
        res.err(err);
      });
    } else {
      console.log("wwwwwwwwwwwwwwwwwwwww")
      res.status(200).json(promise);
    }
  }
  next();
}



