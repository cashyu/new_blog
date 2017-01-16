module.exports = {
  port: 3000,
  session: {
    secret: "cashyu",
    db: 'blog_session'
  },
  redis: {
    host: "127.0.0.1",
    port: 6379
  },
  mongodb: 'mongodb://localhost:27017/blog'
}



