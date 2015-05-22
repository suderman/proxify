'use strict';

var _ = require('lodash');
require('shelljs/global');

// Pull up templates
var templates = require('./templates');

// Generate files
module.exports = function (command, files, options) {

  // Get args from command
  var args = require('./args')(command),
      key = '';

  // dnsimple subdomain alias bash script
  if (args.domain && args.subdomain && args.router && args.dnsimple) {
    key = '' + args.output + '/dnsimple/' + args.name + '.dnsimple.sh';
    files[key] = templates.dnsimple({
      domain: args.domain,
      subdomain: args.subdomain,
      router: args.router,
      dnsimple: args.dnsimple
    });
    options[key] = { user: args.user, force: args.force };
  }

  // dnsimple main bash script
  if (args.domain && args.subdomain && args.router && args.dnsimple) {
    key = '' + args.output + '/dnsimple.sh';
    files[key] = templates.main.dnsimple({
      output: args.output
    });
    options[key] = { user: args.user, force: args.force };
  }

  // dnsmasq sites configuration
  if (args.name && args.server) {
    key = '' + args.output + '/dnsmasq/' + args.name + '.dnsmasq.conf';
    files[key] = templates.dnsmasq({
      name: args.name,
      subdomain: args.subdomain,
      server: args.server
    });
    options[key] = { user: args.user, force: args.force };
  }

  // dnsmasq configuration
  if (args.user && args.domain && args.server && args.output) {
    key = '' + args.output + '/dnsmasq.conf';
    files[key] = templates.main.dnsmasq({
      user: args.user,
      domain: args.domain,
      server: args.server,
      output: args.output
    });
    options[key] = { user: args.user, force: args.force };
  }

  // htpasswd file
  if (args.htpasswd && args.logins && args.name && args.listen) {
    key = '' + args.output + '/htpasswd/' + args.name + '.' + args.listen.join('.') + '.htpasswd';
    files[key] = _.map(args.logins, function (password, username) {
      return '' + username + ':' + password;
    }).join('\n');
    options[key] = { user: args.user, force: args.force };
  }

  // nginx server block
  if (args.name && args.listen && args.target) {
    key = '' + args.output + '/nginx/' + args.name + '.' + args.listen.join('.') + '.nginx.conf';
    files[key] = templates.nginx({
      id: '' + args.name + '.' + args.listen.join('.'),
      name: args.name,
      listen: args.listen,
      target: args.target,
      directory: args.directory,
      domain: args.domain,
      subdomain: args.subdomain,
      redirect: args.redirect,
      error: args.error,
      certify: args.certify,
      htpasswd: args.htpasswd,
      secure: args.secure,
      output: args.output
    });
    options[key] = { user: args.user, force: args.force };
  }

  // nginx configuration
  if (args.name && args.listen && args.target) {
    key = '' + args.output + '/nginx/nginx.conf';
    files[key] = templates.main.nginx({
      user: args.user,
      error: args.error,
      output: args.output
    });
    options[key] = { user: args.user, force: args.force };
  }

  // Prepare to download certificate information
  if (args.name && args.secure) {

    // Server certificate/key
    key = '' + args.output + '/certs/' + args.name + '.pem';
    files[key] = '' + args.ca + '/' + args.name + '.pem';
    options[key] = { user: args.user, force: args.force };

    // CA certificate
    key = '' + args.output + '/certs/ca.crt';
    files[key] = '' + args.ca + '/ca.crt';
    options[key] = { user: args.user, force: args.force };

    // CA CRL
    key = '' + args.output + '/certs/ca.crl';
    files[key] = '' + args.ca + '/ca.crl.pem';
    options[key] = { user: args.user, force: args.force };
  }

  // Ensure log files exist
  mkdir('-p', '' + args.output + '/log');
  exec('cd ' + args.output + '/log && touch dnsmasq.log nginx.access.log nginx.error.log', { silent: true });
  if (options.user) {
    exec('chown -R ' + args.user + ' ' + args.output + '/log', { silent: true });
    exec('chgrp -R ' + args.user + ' ' + args.output + '/log', { silent: true });
  }

  return [files, options];
};