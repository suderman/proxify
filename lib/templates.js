var fs = require('fs');
var hbs = require('handlebars');
var colors = require('colors');

var templates = {};
try {

  templates.nginx = hbs.compile(fs.readFileSync('./templates/nginx.conf.hbs', 'utf8'));
  templates.dnsmasq = hbs.compile(fs.readFileSync('./templates/dnsmasq.conf.hbs', 'utf8'));
  templates.dnsimple = hbs.compile(fs.readFileSync('./templates/dnsimple.sh.hbs', 'utf8'));

} catch (e) {
  console.log((`Error reading templates!`).red);
  process.exit(1);
}

module.exports = templates;
