const BlogError = require('../../../error');
const redis = require('../../../index').redis;
const check = require('../../middlewares/check');

exports.listUser = function listUser(req, res, next){
  let {model, query: {q}} = req;
  res.status(200).json('用户列表');
}

exports.createUser = function createUser(req, res, next){
  let {model, body} = req;
  console.log("11111111111111111")
  console.log(req.sessionID)
  res.promise(model.createUser(body));
}

exports.getUserInfo = function getUserInfo(req, res, next) {
  let {model, params:{userid}} = req;
  res.promise(model.getUserInfo(userid));
}

exports.updateUserInfo = function updateUserInfo(req, res, next) {
  let {model, params:{userid}, body} = req;
  res.promise(model.updateUserInfo(userid, body))
}

exports.userLogin = function userLogin(req, res, next) {
  let {model, body} = req;
  res.promise(model.userLogin(body, req).then( doc=> {
    return ;
  }))
}

/*
exports.userLogout = function userLogout(req, res, next) {
  res.promise(redis.get(key)
}
*/
