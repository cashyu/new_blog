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
      return Coll.inserOne(data).then(doc => {
        return this.json(data, doc.insertedId);
      })
    });
  }
}

exports.post = Post;

