
exports.listPost = function listPost(req, res, next) {
  let {model, query: {q}} = req;
  res.status(200).json('文章列表');
}

exports.createPost = function createPost(req, res, next) {
  let {model, body} = req;
  res.promise(model.createPost(body));
}

//获取某个用户的文章列表
exports.getUserPostList = function getUserPostList(req, res, next) {
  let {model, body} = req;  //body{"userid":"*",query:{find:"x",sort:"x",limit:"x"}}
  let query = {};
  query.find = {};
  if(body.userid) query.find.userid = body.userid;
  if(body.sort) query.sort = body.sort;
  if(body.limit) query.limit = body.limit;
  res.promise(model.getUserPostList(query));
}

//获取文章信息
exports.getPostInfo = function getPostInfo(req, res, next){
  let {model, params:{postid}} = req;
  res.promise(model.getPostInfo(postid));
}

//更新一篇文章
exports.updatePostInfo = function updatePostInfo(req, res, next){
  let {model, body, params:{postid}} = req;
  res.promise(model.updatePostInfo(postid, body));
}
