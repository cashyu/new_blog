

exports.listUser = function listUser(req, res, next){
  let {model, query: {q}} = req;
  res.status(200).json("用户列表");
}

exports.createUser = function createUser(req, res, next){
  let {model, body} = req;
  res.promise(model.createUser(body));
}


