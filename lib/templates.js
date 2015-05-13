'use strict';

var fs = require('fs'),
    path = require('path'),
    hbs = require('handlebars'),
    colors = require('colors');

var dir = path.resolve(path.join(__dirname, '../templates'));
var templates = { main: {} };

try {

  templates.main.nginx = hbs.compile(fs.readFileSync(dir + '/main.nginx.conf.hbs', 'utf8'));
  templates.nginx = hbs.compile(fs.readFileSync(dir + '/nginx.conf.hbs', 'utf8'));
  templates.main.dnsmasq = hbs.compile(fs.readFileSync(dir + '/main.dnsmasq.conf.hbs', 'utf8'));
  templates.dnsmasq = hbs.compile(fs.readFileSync(dir + '/dnsmasq.conf.hbs', 'utf8'));
  templates.main.dnsimple = hbs.compile(fs.readFileSync(dir + '/main.dnsimple.sh.hbs', 'utf8'));
  templates.dnsimple = hbs.compile(fs.readFileSync(dir + '/dnsimple.sh.hbs', 'utf8'));
} catch (e) {
  console.log('Error reading templates!'.red);
  process.exit(1);
}

module.exports = templates;