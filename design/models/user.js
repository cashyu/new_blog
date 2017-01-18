const blogError = require('../../error')

class User {
  constructor(collection) {
    this.collection = collection
    this.defaults = {
      created: new Date()
    }
  }
  
  json(doc, _id){
    doc['userid'] = doc._id || _id;
    delete doc._id;
    return doc;
  }

  //生成哈希密码
  _hashPwd(passwd) {
    
  }

  createUser(data) {
    let Coll = this.collection;
    data = Object.assign({}, this.defaults, data) 
    return Coll.findOne({phonenum: data.phonenum}).then((doc) => {
      if(doc) throw new blogError('该手机号已被注册', 'MDL_USER_CRT_TEL', {status: 400})
      return Coll.insertOne(data).then(doc => {
        return this.json(data, doc.insertedId)
      });
    });
  }
  
}

exports.user = User;

