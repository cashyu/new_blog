const Redis = require('ioredis');
const redis = new Redis('localhost:6379')
const BlogError = require('../../error')

module.exports = {
  hasLogin: function hasLogin(sessionid){
    console.log("ttttttttttttttttttttttt")
    console.log(sessionid)
    let key = "sess:" + sessionid;
    return redis.get(key).then( doc => {
      console.log("vvvvvvvvvvvvvvvvvvvvvv")
      console.log(doc)
      if(doc) return  new BlogError('已登录', 'MID_CHK_HAS_LOG', {status: 400}); 
      return doc;
    }) 
  },
  notLogin: function notLogin(sessionid){
    redis.get(key).then(doc => {
      console.log("3333333333333333")
      console.log(doc)
      if(!doc.user) throw new BlogError('未登录', 'MID_CHK_NOT_LOG', {status: 400});
      return ;
    })
  }
}




