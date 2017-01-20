const EventEmitter = require('events').EventEmitter;
const mongodb = require('mongodb');
const BlogError = require('../error');

let MongoClient = mongodb.MongoClient

class Mongo extends EventEmitter{
  constructor(config, models){
    super();
    this.config = config.mongodb
    this.models = models
  }

  connect(cb) {
    MongoClient.connect(this.config.dsn, (err, db) => {
      if(err) return cb(err)
      this.instance = db;
      this.emit('connected', db);
      cb();
    })
  }
   
  getCollection(modelName) {
    let Model = this.models[modelName];
    let collection = this.instance.collection(`${modelName}`);
    collection.dbfind = (query) => {
      return this.find(modelName,query);
    }
    return new Model(collection);
  }

  find(modelName, query) {
    let Model = this.getCollection(modelName);
    let {find, sort, limit} = query;
    return new Promise((resolve, reject) => {
      let q = Model.collection.find(find);
      if(sort) q.sort(sort);
      if(limit) q.limit(limit);
      q.toArray((err, docs) => {
        if(err) return reject(new BlogError('', 'BLG_DBM_FID', {modelName, query}));
        resolve(docs.map(doc => Model.json(doc)))
      })
    });
  }
}

module.exports = Mongo


