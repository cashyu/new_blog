class BlogError extends Error{
  //message：错误信息
  //code：错误代码
  //opts：错误编号，例如 {status:400}
  constructor(message, code, opts) {
    if(!message) message = '服务器异常'
    super(message);
    this.message = message;
    this.name = 'BlogError';
    this.code = code;
    if(opts && opts.status) {
      this.status = opts.status;
    }else {
      this.status = 500;
    }
    this.opsts = opts
  } 
}

module.exports = BlogError;


