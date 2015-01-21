#!/usr/bin/env node

var selfPkg = require('../package.json')
var cli = require('../lib/cli')

program = require('commander')
program
  .version(selfPkg.version)
  .option('-v', 'get version')
  .option('-c, --coffee', 'specified a coffee-script package')


program.command('build')
.description('clone & compile "./src/*" to "./lib/*"')
.action(function(){
  cli.build(function(){
    console.log('build successed.')
  })
})

program.command('publish [message]')
.description('build & push to your remote origin repo...')
.action(function(message){
  cli.publish(message, function(res){
    console.log('git+' + res.repo + '#' + res.version + ' is published.')
  })
})

program.command('*')
  .action(function(){
    console.log('Command not found.')
    program.outputHelp()
    process.exit(1)
  })

program.parse(process.argv)