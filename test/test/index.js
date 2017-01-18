const path = require('path')
const request = require('superagent')
const util = require('./util')
const async = require('async')
const EventEmitter = require('events').EventEmitter;
const deepmerge = require('deepmerge')

class SgoTest extends EventEmitter {
  /**
  * groups  e.g.  [{name: 'manage', dir: '/tasks/', submodules: ['cat', 'attr']}]
  */
  constructor(server, groups) {
    super()
    this.groups = groups;
    this.routers = {}
    this.server = server
    this.submoduleDefers = []
    this.groupDefers = []
    this.marks = {}
    this.headers = {}
    this.sections = []
    this.sectionCursor = -1
    this.groupCursor = this.groups.length
    this.on('section', () => {
      let section = this.sections[this.sectionCursor]
      this.sectionCursor += 1
      let nextSection = this.sections[this.sectionCursor]
      if (nextSection) {
        if (section) {
          if (nextSection.groupName !== section.groupName && section.describe !== 'defer') {
            this.emit('group', section, nextSection)
            return
          }
          if (nextSection.submodule !== section.submodule && section.describe !== 'defer') {
            this.emit('submodule', section, nextSection)
            return
          }
        }
        this._testSection(nextSection)
      } else {
        if (this.groupDefers.length) {
          this.emit('group', section, nextSection)
        } else {
          this.emit('done')
        }
      }
    })
    this.on('submodule', (section, nextSection) => {
      if (this.submoduleDefers.length) {
        let deferSection = Object.assign({}, section, {
          describe: 'defer',
          children: this.submoduleDefers.splice(0, this.submoduleDefers.length),
          suits: []
        })
        this.sections.splice(this.sectionCursor, 0, deferSection)
        this.sectionCursor -= 1
        this.emit('section')
      } else if(nextSection) {
        this._testSection(nextSection)
      }
    })
    this.on('group', (section, nextSection) => {
      if (this.groupDefers.length) {
        let deferSection = Object.assign({}, section, {
          describe: 'defer',
          submodule: 'global',
          children: this.groupDefers.splice(0, this.groupDefers.length),
          suits: []
        })
        this.sections.splice(this.sectionCursor, 0, deferSection)
        this.sectionCursor -= 1
        this.emit('section')
      } else {
        this.emit('submodule', section, nextSection)
      }
    })
    this.on('done', () => {})
   }

  before(cb) {
    before(cb)
  }

  mergeCachedMarks(done) {
    this.server.redis.get('blogest:marks', (err, data) => {
      if (err) return done(err)
      if (data) {
        this.marks = deepmerge(JSON.parse(data), this.marks)
      }
      done()
    })
  }

  refreshCachedMarks(done) {
    this.server.redis.set('blogtest:marks', JSON.stringify(this.marks), function(err) {
      if (err) return done(err)
      done()
    })
  }

  after(cb) {
    after(cb)
  }

  run() {
    let self = this
    describe('init', function() {
      it('<init>', function(done) {
        self._prepareTest()
        self._prepareRouters(done)
      })
    })
  }

  _prepareRouters(cb) {
    let config = this.server.config
    let fetchRouter = (name, done) => {
      let uriParts = name.split('_')
      let moduleUri = uriParts.length === 3 ? uriParts.join('/') : uriParts[uriParts.length - 1]
      let uri = `${config.host + ':' + config.port}/${moduleUri}`
      this.routers[name] = this.routers[name] || {}
      request.get(`${uri}/_/routes`).end((err, res) => {
        if (err) return done(err)
        res.body.forEach(item => {
          this.routers[name][item.handlerFunc] = {
            verb: item.verb,
            uri: `${uri}${item.uri}`
          }
        })
        done()
      })
    }
    async.map(this.groups.map(item => item.name), fetchRouter, (err) => {
      if (err) return cb(err)
      this.emit('section')
      cb()
    })
  }

  _prepareTest() {
    for (let group of this.groups) {
      let groupName = group.name
      if (!this.marks[groupName]) {
        this.marks[groupName] = {}
      }
      for (let submodule of group.submodules) {
        group.sections = require(path.join(group.dir, submodule + '.json'))
        this.marks[groupName][submodule] = {}
        for (let section of group.sections) {
          section.groupName = groupName
          section.submodule = submodule
          this.sections.push(section)
        }
      }
    }
  }

  _testSection(section) {
    if (this.stop) {
      return
    }
    let self = this
    let secDesc = section.groupName + ': ' + section.describe
    if (!section.children || !section.children.length) {
      describe(secDesc, function() {
        it('(prepare)')
      })
      self.emit('section')
      return 
    }
    section.suits = []
    section.suitCursor = 0
    for (let suit of section.children) {
      suit.groupName = section.groupName
      suit.submodule = section.submodule
      suit.defer = suit.defer || section.defer
      suit.action = suit.action || section.action
      suit.secDesc = secDesc

      if (suit.defer) {
        if (suit.defer === 1) {
          suit.defer = 0
          this.submoduleDefers.push(suit)
        } else if (suit.defer === 2) {
          suit.defer = 0
          suit.describe = section.submodule + ':' + section.describe + ':' + suit.describe
          this.groupDefers.push(suit)
        }
        continue
      }
      section.suits.push(suit)
      ++section.suitCursor
      if (suit.stop) {
        this.stop = true
        break
      }
    }
    if (!section.suits || !section.suits.length) {
      self.emit('section')
      return 
    }
    describe(secDesc, function() {
      for (let suit of section.suits) {
        self._testSuit(self, section, suit)
      }
    })
  }

  _testSuit(self, section, suit) {
    let check = function() {
      section.suitCursor -= 1
      if(!section.suitCursor) {
        self.emit('section')
      }
    }
    if (suit.ignore) {
      it(suit.describe)
      check()
    } else {
      it(suit.describe, function(done) {
        if (suit.timeout) {
          this.timeout(suit.timeout)
        }
        util.doneIt(self.routers[suit.groupName], self.marks, self.headers, suit, function(err) {
          check()
          done(err)
        })
      })
    }
  }
}

module.exports = SgoTest
