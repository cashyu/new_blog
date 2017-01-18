const request = require('superagent')
const xml2js = require('xml2js')
const qs = require('qs')

//变量插补
function procStr(marks, suit, v) {
  let r = /^\<\$(\d+)(.\w+)?(.\w+)?\>$/;
  let m = r.exec(v)
  if (m) {
    try {
      if (m[3]) {
        v = marks[m[3].substr(1)][m[2].substr(1)][m[1]]
      } else if (m[2]) {
        v = marks[suit.groupName][m[2].substr(1)][m[1]]
      } else {
        v = marks[suit.groupName][suit.submodule][m[1]]
      }
    } catch (err) {
      throw Error(`var: ${v} not found`)
    }
  }
  return v 
}

//reqBody变量插补
function procReq(marks, suit, key) {
  let body = suit[key];
  let proc = tmp => {
    if (typeof tmp === 'object') {
      if (tmp instanceof Array) {
        return tmp.map(v => proc(v))
      } 
      Object.keys(tmp).forEach(k => {
        let v = tmp[k]
        if (typeof v === 'string') {
          tmp[k] = procStr(marks, suit, v)
        } else {
          tmp[k] = proc(v)
        }
      })
      return tmp
    } else if (typeof tmp === 'string') {
      return procStr(marks, suit, tmp)
    } else {
      return tmp
    }
  }
  proc(body)
  suit[key] = body
}

//检测返回结果并处理变量
function procResBody(marks, suit, body) {
  let r = /^\<\$(\d+)(.\w+)?(.\w+)?\>$/;
  let ref = suit.resBody;
  let message = '', path = ''
  let checkPrimitive = (a, b, path) => {
    if (a === b) return true
    message = `${path}: ${a} !== ${b}`
    return false
  }
  let proc = (a, b, path) => {
    switch(typeof b) {
    case 'string':
      let m = r.exec(b)
      if (m) {
        if (m[3]) {
          if (!marks[m[3].substr(1)][m[2].substr(1)]) {
            marks[m[3].substr(1)][m[2].substr(1)] = {}
          } 
          if (!marks[m[3].substr(1)][m[2].substr(1)][m[1]]) {
            marks[m[3].substr(1)][m[2].substr(1)][m[1]] = a
          }
          return checkPrimitive(a, marks[m[3].substr(1)][m[2].substr(1)][m[1]], path)
        }
        if (m[2]) {
          if (!marks[suit.groupName][m[2].substr(1)]) {
            marks[suit.groupName][m[2].substr(1)] = {}
          }
          if (!marks[suit.groupName][m[2].substr(1)][m[1]]) {
            marks[suit.groupName][m[2].substr(1)][m[1]] = a
          }
          return checkPrimitive(a, marks[suit.groupName][m[2].substr(1)][m[1]], path)
        } else {
          if (!marks[suit.groupName][suit.submodule][m[1]]) {
            marks[suit.groupName][suit.submodule][m[1]] = a
          }
          return checkPrimitive(a, marks[suit.groupName][suit.submodule][m[1]], path)
        }
        message = `${path}: bad format ${b}`
        return false
      } 
      if (b === '<$$>') {
        return true
      }
      return checkPrimitive(a, b, path)
    case 'object': 
      if (b === null)  {
        return checkPrimitive(a, b, path)
      }
      if (b instanceof Array) {
        if (!(a instanceof Array)) {
          message = `${path}: expect array but get ${a}`
          return false
        }
        if (suit.strict && b.length !== (a || []).length) {
          message = `${path}: array length not equal`
          return false
        }
        return b.every((v, i) => {
          let _path = path + '.' + i
          return proc(a[i], v, _path)
        })
      } else {
        if (!a || !(a instanceof Object)) {
          message = `${path}: expect object but get ${a}`
          return false
        }
        if (suit.strict && Object.keys(b).length !== Object.keys(a || {}).length) {
          message = `${path}: keys length not equal`
          return false
        }
        return Object.keys(b).every(k =>{
          if (!a.hasOwnProperty(k)) {
            message = `${path}: miss key ${k}`
          }
          return proc(a[k], b[k], path + '.' + k)
        })
      }
    default:
      return checkPrimitive(a, b, path)
    }
  }
  proc(body, ref, path)
  return message
}

//解析uri
function parseRoute(routes, marks, suit) {
  let route = routes[suit.action]
  suit.route = route
  if (!route) throw new Error(`unknown handlerFunc ${suit.action}`)
  let verb = route.verb
  let uri = route.uri
  if (uri.indexOf('{') > -1) {
    if (!suit.params || !suit.params.length || (uri.match(/\{/g) || []).length !== suit.params.length) {
      throw new Error(`mismatch uri ${uri} and params ${JSON.stringify(suit.params)}`)
    }
    suit.params.forEach(v => {
      uri = uri.replace(/\{\w+\}/, procStr(marks, suit, v))
    })
  }
  if (suit.query) {
    let query = suit.query
    procReq(marks, suit, 'query')
    for (let k in query) {
      if (typeof query[k] === 'object') {
        query[k] = JSON.stringify(query[k])
      }
    }
    uri += '?' + qs.stringify(suit.query)
  }
  suit.uri = uri
}

//inspect key访问路径
function divideInspectKey(key) {
  if (!/\w(\[.+\])*$/.test(key)) throw Error('inspect element should match v[v1][v2]...[vn]')
  let keyArr = key.split('[').map(node => {
    if (/\]$/.test(node)) {
      node = node.substr(0, node.length -1)
    }
    return node
  })
  return keyArr
}

//审视变量
function inspectVar(obj, varMessages) {
  for (let key of obj.suit.inspect || []) {
    let keyArr = divideInspectKey(key)
    let mainVar = obj[keyArr[0]]
    if (!mainVar) {
      varMessages[key] = undefined
      continue
    }
    let foundVar = keyArr.slice(1).reduce((prev, cur) => {
      return prev[cur]
    }, mainVar)
    varMessages[key] = foundVar
  }
}
//打印变量
function printVar(varMessages) {
  for (let key in varMessages) {
    console.log(`${key}: ${JSON.stringify(varMessages[key])}`);
  }
}


//json => xml
function buildXML(json, options) {
  let builder = new xml2js.Builder(options || {});
  return builder.buildObject(json);
}

//测试
exports.doneIt = function(routes, marks, headers, suit, done) {
  let varMessages = {}
  inspectVar({marks, suit, routes}, varMessages)
  try {
    parseRoute(routes, marks, suit)
  } catch (e) {
    printVar(varMessages)
    done(e)
  }
  fetch = request[suit.route.verb](suit.uri).set('Accept', 'application/json')
  if (suit.reqBody) {
    procReq(marks, suit, 'reqBody')
    if (suit.xml) {
      suit.reqBody = buildXML(suit.reqBody, suit.xml)
      fetch.set('Content-type', 'application/xml; charset=utf-8')
    }
    fetch = fetch.send(suit.reqBody)
  }
  if (headers || suit.headers) {
    suit.headers = Object.assign({}, headers[suit.groupName] || {}, suit.headers)
    procReq(marks, suit, 'headers')
    Object.keys(suit.headers).forEach(key => {
      let header = suit.headers[key]
      if (header) {
        fetch.set(key, typeof header === 'object' ? JSON.stringify(header) : header )
      }
    })
  }
  if (suit.token) {
    let token = procStr(marks, suit, suit.token)
    fetch.set('Authorization', 'Bearer ' + token)
  }
  fetch.end(function(err, res) {
    inspectVar({marks, suit, routes, res}, varMessages)
    let status = suit.status || 200;
    if (err && res.status !== status) {
      printVar(varMessages)
      return done(Error(`mismatch suit.status ${status} and res.status ${res.status}, res.body: ${JSON.stringify(res.body)}`))
    }
    if (suit.resBody) {
      inspectVar({marks, suit, routes, res}, varMessages)
      let message = procResBody(marks, suit, res.body)
      if (message) {
        printVar(varMessages)
        return done(Error(`mismatch res.body and suit.resBody at ${message}`))
      }
    }
    printVar(varMessages)
    done()
  })
} 
