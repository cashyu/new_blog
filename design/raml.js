/**
 * 解析raml文件
 */
const parser = require('raml-1-parser')

class Raml {

  constructor(api) {
    this.api = api
    this._routes = []
    this._validates = {}
    this._types = {}
  }

  routes() {
    if (this._routes.length) {
      return this._routes
    }
    let parseMethod = (ancestorUri, method) => {
      let annotations = method.annotations
      if (annotations.handlerFunc && annotations.groupBy) {
        this._routes.push({
          verb: method.method,
          uri: ancestorUri,
          description: method.description,
    //      securedBy: method.securedBy,
          handlerFunc: annotations.handlerFunc.structuredValue,
          groupBy: annotations.groupBy.structuredValue,
    //      apiGateway: annotations.apiGateway && annotations.apiGateway.structuredValue,
    //      xml: annotations.xml && annotations.xml.structuredValue,
    //      transport: annotations.transport && annotations.transport.structuredValue,
        })
      }
    }
    let parseResource = (ancestorUri, resource) => {
      let methods = resource.methods
      ancestorUri = ancestorUri + resource.relativeUri
      if (methods) {
        for (let method of methods) {
          parseMethod(ancestorUri, method)
        }
      }
      let resources = resource.resources
      if (resources) {
        for (let resource of resources) {
          parseResource(ancestorUri, resource)
        }
      }
    }
    let resources = this.api.resources
    if (resources) {
      for (let resource of resources) {
        parseResource('', resource)
      }
    }
    return this._routes
  }

  validates() {
    if (Object.keys(this._validates).length) {
      return this._validates
    }
    for (let type of this.api.types) {
      let name = Object.keys(type)[0]
      this._types[name] = type[name].type[0]
    }
    let parseMethod = (ancestorUri, method) => {
      if (method.body && method.body['application/json']) { 
        let typeRaw = method.body['application/json'].type[0]
        try {
          let body = JSON.parse(this._types[typeRaw])
          this._validates[`${method.method} ${ancestorUri}`] = Object.assign(
            this._validates[`${method.method} ${ancestorUri}`] || {}, 
            { body }
          )
        } catch (e) {}
      }
    }
    let parseResource = (ancestorUri, resource) => {
      let methods = resource.methods
      ancestorUri = ancestorUri + resource.relativeUri
      if (methods) {
        for (let method of methods) {
          parseMethod(ancestorUri, method)
        }
      }
      let resources = resource.resources
      if (resources) {
        for (let resource of resources) {
          parseResource(ancestorUri, resource)
        }
      }
    }
    let resources = this.api.resources
    if (resources) {
      for (let resource of resources) {
        parseResource('', resource)
      }
    }
    return this._validates
  }
}

module.exports = function raml(filepath) {
  let _api = parser.loadApiSync(filepath)
  let api = _api.toJSON()
  return new Raml(api)
}
