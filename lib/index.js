var _ = require('lodash');
var colors = require('colors');
var request = require('sync-request');
var hbs = require('handlebars');
var fs = require('fs');
var path = require('path');
require('shelljs/global');

var argv = require('yargs').boolean(['s','p','a','r']).argv;
if (fs.existsSync(argv._[0])) { 
  console.log('this is a file');
  // do something 
} else {
  console.log('this is a name');
} 

var args = require('./args');
var templates = require('./templates');


console.log(templates);
console.log(args)

// var data = { 
//   title: arg.name,
//   calc: arg.target
// }
// var template = Handlebars.compile(templates.nginx);
// var output = template(data);
// console.log(output);


var output = templates.dnsimple({
  router: `${args.router}`,
  domain: `${args.domain}`,
  subdomain: `hello`,
});
console.log(output);
fs.writeFileSync(`/tmp/dnsimple.${args.name}.sh`, output);
// fs.writeFileSync(filename, data[, options])

var output = templates.dnsmasq({
  name: `${args.name}`,
  server: `${args.server}`,
});
console.log(output);
fs.writeFileSync(`/tmp/dnsmasq.${args.name}.conf`, output);
