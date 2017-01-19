
exports.listPost = function listPOst(req, res, next) {
  let {model, query: {q}} = req;
  res.status(200).json('文章列表');
}

exports.createPost = function createPost(req, res, next) {
  let {model, body} = req;
  ress.promise(model.createPost(body));
}


