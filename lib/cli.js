// npm-git

var fs = require('fs')
var path = require('path')
var exec = require('child_process').exec
var async = require('async')
var ini = require('ini')
var semver = require('semver')
var gitTag = require('git-tag')()

// Init
var getInfo = function() {
  if (!fs.existsSync('./.git/config')) {
    console.error('Please initialize your git repo first.')
    return process.exit(1)
  }
  // Get package.json
  var pkg = fs.readFileSync('./package.json', 'utf8').toString().replace(/^\ufeff/g, '')

  return {
    pkg: {
      file: pkg,
      json: JSON.parse(pkg)
    },
    git: ini.parse(fs.readFileSync('.git/config', 'utf-8'))
  }
}

// Compile coffee-script
var compile = function(cb) {
  exec('coffee -bc ./lib && find ./lib -name \'*\'.coffee\'*\' -exec rm -rf {} \\;', function(err) {
    if (err) throw err
    cb()
  })
}

// test
var test = function(cb) {
  build(function(){
    exec('npm test', cb)
  })
}

module.exports = function(){
  var info = getInfo()
  var publish = function(msg, cb) {
    async.auto({
      // clone & compile
      cc: function(next) {
        build(next)
      },
      // get version
      ver: ['cc', function(next, res){
        gitTag.latest(function(ver){
          if (!semver.valid(ver)) ver = '0.0.0'
          if (!semver.valid(info.pkg.json.version)) info.pkg.json.version = '0.0.1'

          if (semver.gt(info.pkg.json.version, ver)) {
            ver = info.pkg.json.version
          } else {
            var vers = ver.split('.')
            vers.push(Number(vers.pop()) + 1)
            ver = vers.join('.')
          }
          next(null, ver)
        })
      }],
      pkg: ['ver', function(next, res){
        info.pkg.json.version = res.ver
        var space = info.pkg.file.match(/^{(\s+)"/)[1].replace(/^[\r\n]+/g, '')
        fs.writeFile('./package.json', JSON.stringify(info.pkg.json, null, space), next)
      }],
      // commit changes
      cmt: ['pkg', function(next, res) {
        msg = msg || 'auto commit by npm-git'
        exec('git add -A && git commit -am \'' + msg + '\' && git pull origin && git push origin', function(err) {
          next()
        })
      }],
      // push tag
      push: ['cmt', function(next, res) {
        gitTag.create(res.ver, msg, function(name){
          next()
        })
      }]
    }, function(err, res){
      if (err) throw err
      cb({
        name: info.pkg.json.name,
        version: res.ver,
        repo: info.git['remote "origin"'].url
      })
    })
  }

  // copy ./src/* to ./lib/* if src is existed
  var build = function(cb) {
    async.series([
      function(next){
        if (!fs.existsSync('./src')) {
          return cb()
        }
        if (!fs.existsSync('./lib')) {
          return fs.mkdir('./lib', next)
        }
        next()
      },
      function(next) {
        exec('cp -urf ./src/* ./lib/', next)
      },
      function(next) {
        compile(function(){
          if (info.pkg.json.scripts && info.pkg.json.scripts.prepublish) {
            exec('npm run prepublish', next)
          } else {
            next()
          }
        })
      }
    ], cb)
  }

  return {
    build: build,
    test: test,
    publish: publish
  }
}