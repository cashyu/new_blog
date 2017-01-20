const Test = require('./test');
const async = require('async');
const server = require('../index');
const path = require('path');

let t = new Test(server, [
  {name: 'blog_v1', dir: path.join(__dirname, './json/v1'), submodules: ['user', 'post']}
]);

t.before(function(done){
  async.parallel([
    function(cb) {
      server.app.run(cb);
    },
    function(cb) {
      server.db.once('connected', function(db){
        db.dropDatabase(cb)
      });
    },
    function(cb) {
      t.mergeCachedMarks(cb);
    }
  ], done);
});

t.after(function(done){
  t.refreshCachedMarks(done);
})

t.run()



