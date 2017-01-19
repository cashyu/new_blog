const bcrypt = require('bcryptjs');
const _ = require('lodash')
const blogError = require('../../error');
const ObjectId = require('../object');
const SALT = 10;

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
    let Coll = this.collection;
    return new Promise((resolve, reject) => { //包装成promise对象
      bcrypt.genSalt(SALT, (err, salt) => {
        if(err) throw err;
        bcrypt.hash(passwd, salt, (err, hash) => {
          if(err) throw err;
          return resolve(hash);   //成功返回哈希值
        });
      });
    });    
  }

  //创建用户
  createUser(data) {
    let Coll = this.collection;
    data = _.omit(data, 'created')
    data = Object.assign({}, this.defaults, data) 
    return Coll.findOne({name: data.name}).then((doc) => {
      if(doc) throw new blogError('该手机号已被注册', 'MDL_USR_CRT_TEL', {status: 400})
      return this._hashPwd(data.passwd).then(hash => {
        data.passwd = hash;
        return Coll.insertOne(data).then(doc => {
          return this.json(data, doc.insertedId);
        });
      });
    });
  }
  
  //更新用户
  updateUserInfo(userid, data) {
    let Coll = this.collection;
    let _id = ObjectId(userid); //用来验证userid
    return Coll.findOne({_id}).then(doc => {
      if(!doc) throw new blogError('用户不存在', 'MDL_USR_UPD_NOU', {status: 400});
      return Coll.updateOne({_id}, {$set: data});
    }); 
  }

  //获取用户信息
  getUserInfo(userid) {
    let Coll = this.collection;
    let _id = ObjectId(userid); //用来验证userid
    return Coll.findOne({_id}).then(doc => {
      if(!doc) throw new blogError('无效用户', 'MDL_USR_GET_NOU', {status: 400}) ;
      return this.json(doc);
    });
  }
  
  //用户登录
  userLogin(data) {
    let Coll = this.collection;
    return Coll.findOne({name: data.name}).then(doc => {
      if(!doc) throw new blogError('用户名错误', 'MDL_USR_LOG_FIR', {status: 400});
      return new Promise((resolve, reject) => {
        bcrypt.compare(data.passwd, doc.passwd, (err, match) => {
          if(err) return err;
          if(!match) return reject(blogError('密码错误', 'MDL_USR_PWD_ERR', {status: 400}));
          return resolve(doc);
        });
      });
    });  
  }
}

exports.user = User;

