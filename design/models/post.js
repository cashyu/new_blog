const _ = require('lodash');
const blogError = require('../../error');
const ObjectId = require('../object');
//定义文章类
class Post {
  constructor(collection) {
    this.collection = collection;
    this.defaults = {
      created: new Date(),
      updated: new Date() 
    };
  }

  json(doc, _id) {
    doc['postid'] = doc._id || _id;
    delete doc._id;
    return doc;
  }
  
  //保存文章
  createPost(data) {
    let Coll = this.collection;
    data = _.omit(data, ['created', 'updated']);
    data = Object.assign({}, this.defaults, data);
    return Coll.findOne({title: data.title}).then(doc => {
      if(doc) throw new blogError('文章已经存在', 'MDL_ART_CRT_EXS');
      return Coll.insertOne(data).then(doc => {
        return this.json(data, doc.insertedId);
      })
    });
  }
  
  //获取某作者的文章列表
  getUserPostList(query) {
    let Coll = this.collection;
    return Coll.dbfind(query);
  }
  
  //更新文章
  updatePostInfo(postid, data) {
    let Coll = this.collection;
    let _id = ObjectId(postid);
    return Coll.findOne({_id}).then(doc => {
      if(!doc) throw new blogError('文章不存在', 'MDL_UPD_NOT_ART', {status: 400});
      return Coll.updateOne({_id}, {$set:data});
    });
  }

  //获取文章信息
  getPostInfo(postid) {
    let Coll = this.collection;
    let _id = ObjectId(postid);
    return Coll.findOne({_id}).then(doc => {
      if(!doc) throw new blogError('文章不存在', 'MDL_GET_NOT_ART', {status: 400});
      return this.json(doc);
    });
  }
}

exports.post = Post;

