// 

var fs = require('fs')
var path = require('path')
var exec = require('child_process').exec
var async = require('async')
var ini = require('ini')
var gitTag = require('git-tag')()

// Get package.json
var pkg_file = fs.readFileSync('./package.json', 'utf8').toString().replace(/^\ufeff/g, '')
var pkg = JSON.parse(pkg_file)
var pkgVer = pkg.version

var gitConf = ini.parse(fs.readFileSync('.git/config', 'utf-8'))

if (!fs.existsSync('./.git/config')) {
  throw new Error('Please initialize your git repo first.')
}

// Init scaffold
var init = function() {
  if (!fs.existsSync('./src')) {
    fs.mkdir('./src')
  }
  if (!fs.existsSync('./lib')) {
    fs.mkdir('./lib')
  }
}

// Copy ./src/* to ./lib/*
var clone = function(cb) {
  exec('cp -urf ./src/* ./lib/', function(err) {
    if (err) {
      console.log(err)
      return cb(err)
    }
    compile(cb)
  })
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

// 
var push = function() {
  exec('git add -A && git commit -am "npmgit run pub" && git pull origin',function(err) {
    if (err) {
      console.warn(err)
      return cb(err)
    }
    cb()
  })
}

var publish = function(msg, cb) {
  async.waterfall([
    // clone & compile
    function(next) {
      clone(next)
    },
    // get version
    function(next) {
      gitTag.latest(function(ver){
        if (ver !== pkgVer) {
          next(null, pkgVer, false)
        } else {
          var vers = pkgVer.split('.')
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
        pkg.version = ver
        var space = pkg_file.match(/^{(\s+)"/)[1].replace(/[^ ]/g,'')
        fs.writeFileSync('./package.json', JSON.stringify(pkg, null, space), 'utf8')
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
      name: pkg.name,
      version: ver,
      repo: gitConf['remote "origin"'].url
    })
  })
}

module.exports = {
  init: init,
  build: clone,
  publish: publish
}