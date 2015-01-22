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
  if (!fs.existsSync('./src')) {
    throw new Erro('Make sure your repo already have these folder: ./src ./lib')
  }
  if (!fs.existsSync('./.git/config')) {
    throw new Error('Please initialize your git repo first.')
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
    if (err) {
      console.warn(err)
      return cb()
    }
    cb()
  })
}

// Copy ./src/* to ./lib/*
var build = function(cb) {
  exec('cp -urf ./src/* ./lib/', function(err) {
    if (err) throw err
    compile(cb)
  })
}

module.exports = function(){
  var info = getInfo()
  var publish = function(msg, cb) {
    async.waterfall([
      // clone & compile
      function(next) {
        build(next)
      },
      // get version
      function(next) {
        gitTag.latest(function(ver){
          if (!semver.valid(ver)) ver = '0.0.0'
          if (!semver.valid(info.pkg.json.version)) info.pkg.json.version = '0.0.1'

          if (semver.gt(info.pkg.json.version, ver)) {
            next(null, info.pkg.json.version, false)
          } else {
            var vers = ver.split('.')
            vers.push(Number(vers.pop()) + 1)
            next(null, vers.join('.'), true)
          }
        })
      },
      // update package.json
      function(ver, update, next) {
        if (!update) {
          next(null, ver)
        } else {
          info.pkg.json.ver = ver
          var space = info.pkg.file.match(/^{(\s+)"/)[1].replace(/[^ ]/g,'')
          fs.writeFileSync('./package.json', JSON.stringify(info.pkg.json, null, space), 'utf8')
          next(null, ver)
        }
      },
      // commit changes
      function(ver, next){
        msg = msg || 'auto commit by npm-git'
        exec('git add -A && git commit -am \'' + msg + '\' && git pull origin',function(err) {
          next(null, ver)
        })
      },
      // push tag
      function(ver, next){
        gitTag.create(ver, msg, function(name){
          next(null, name)
        })
      }
    ], function(err, ver){
      if (err) {
        throw err
      }
      cb({
        name: info.pkg.json.name,
        version: ver,
        repo: info.git['remote "origin"'].url
      })
    })
  }

  return {
    build: build,
    publish: publish
  }
}