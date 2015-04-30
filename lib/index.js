var _ = require('lodash');
var colors = require('colors');
var request = require('sync-request');
var Mustache = require('mustache');
var fs = require('fs');
require('shelljs/global');

var arg = require('./arg');
console.log('Args:');

console.log(arg)

var view = { 
  title: arg.name,
  calc: arg.target
}
var output = Mustache.render("{{{title}}} spends {{{calc}}}", view);
console.log(output);
// fs.writeFileSync(filename, data[, options])
