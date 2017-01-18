const EventEmitter = require('events').EventEmitter;
const mongodb = require('mongodb');

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
    let Model = this.models[modelName]
    let collection = this.instance.collection(`${modelName}`)
    return new Model(collection)
  }
}

module.exports = Mongo


