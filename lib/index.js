var _ = require('lodash');
var colors = require('colors');
var request = require('sync-request');
var hbs = require('handlebars');
var fs = require('fs');
var path = require('path');
require('shelljs/global');

var commands = [];

var argv = require('yargs').boolean(['s','p','a','r']).argv;
var prefix = [process.argv[0], process.argv[1]];

try {
  var lines = fs.readFileSync(argv._[0], 'utf8').split("\n");
  _.forEach(lines, function(line) {
    // commands.push(prefix.concat(line.split(' ')));
    commands.push(line.split(' '));
  });

} catch (e) {
  var command = process.argv;
  command.shift();
  command.shift();
  commands.push(command);
}

var templates = require('./templates');
_.forEach(commands, function(command) {

  var args = require('./args')(command);
  console.log(args);

});

// var output = templates.dnsimple({
//   router: `${args.router}`,
//   domain: `${args.domain}`,
//   subdomain: `hello`,
// });
// console.log(output);
// fs.writeFileSync(`/tmp/dnsimple.${args.name}.sh`, output);
// // fs.writeFileSync(filename, data[, options])
//
// var output = templates.dnsmasq({
//   name: `${args.name}`,
//   server: `${args.server}`,
// });
// console.log(output);
// fs.writeFileSync(`/tmp/dnsmasq.${args.name}.conf`, output);
