const BlogError = require('../error');
const ObjectId = require('mongodb').ObjectId;

module.exports = (id) => {
  if(typeof id === 'object') return id;
  try {
    return ObjectId(id);
  } catch (e) {
    throw new BlogError('ObjectId格式错误', 'MON_COL_OBI');
  }
}


