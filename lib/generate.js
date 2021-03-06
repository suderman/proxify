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

  // start bash script
  key = '' + args.output + '/start.sh';
  files[key] = templates.start({
    output: args.output
  });
  options[key] = { user: args.user, force: args.force };

  // cloudflare subdomain alias bash script
  if (args.domain && args.subdomain && args.router && args.cloudflare) {
    key = '' + args.output + '/dns/' + args.name + '.cloudflare.sh';
    files[key] = templates.cloudflare({
      domain: args.domain,
      subdomain: args.subdomain,
      router: args.router,
      cloudflare: args.cloudflare
    });
    options[key] = { user: args.user, force: args.force };
  }

  // dnsimple subdomain alias bash script
  if (args.domain && args.subdomain && args.router && args.dnsimple) {
    key = '' + args.output + '/dns/' + args.name + '.dnsimple.sh';
    files[key] = templates.dnsimple({
      domain: args.domain,
      subdomain: args.subdomain,
      router: args.router,
      dnsimple: args.dnsimple
    });
    options[key] = { user: args.user, force: args.force };
  }

  // dns main bash script
  if (args.domain && args.subdomain && args.router && (args.cloudflare || args.dnsimple)) {
    key = '' + args.output + '/dns.sh';
    files[key] = templates.main.dns({
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
  if (args.domain && args.server) {
    key = '' + args.output + '/dnsmasq.conf';
    files[key] = templates.main.dnsmasq({
      user: args.user,
      domain: args.domain,
      server: args.server,
      output: args.output
    });
    options[key] = { user: args.user, force: args.force };
  }

  // passwd file
  if (args.passwd && args.logins && args.name && args.listen) {
    key = '' + args.output + '/passwd/' + args.name + '.' + args.listen.join('.') + '.passwd';
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
      fallback: args.fallback,
      nginx: args.nginx,
      directory: args.directory,
      domain: args.domain,
      subdomain: args.subdomain,
      redirect: args.redirect,
      certify: args.certify,
      passwd: args.passwd,
      secure: args.secure,
      output: args.output
    });
    options[key] = { user: args.user, force: args.force };
  }

  // nginx configuration
  if (args.name && args.listen && args.target) {
    key = '' + args.output + '/nginx.conf';
    files[key] = templates.main.nginx({
      user: args.user,
      output: args.output
    });
    options[key] = { user: args.user, force: args.force };
  }

  // Prepare to download certificate information
  if (args.secure) {

    // Server certificate
    key = '' + args.output + '/certs/' + args.secure + '.crt';
    files[key] = '' + args.ca + '/' + args.secure + '.crt';
    options[key] = { user: args.user, force: args.force };

    // Server key
    key = '' + args.output + '/certs/' + args.secure + '.key';
    files[key] = '' + args.ca + '/' + args.secure + '.key';
    options[key] = { user: args.user, force: args.force };

    // CA certificate
    key = '' + args.output + '/certs/ca.crt';
    files[key] = '' + args.ca + '/ca.crt';
    options[key] = { user: args.user, force: args.force };

    // CA CRL
    key = '' + args.output + '/certs/ca.crl';
    files[key] = '' + args.ca + '/ca.crl.pem';
    options[key] = { user: args.user, force: args.force };

    // Diffie Hellman key
    key = '' + args.output + '/certs/dh.pem';
    files[key] = '' + args.ca + '/dh.pem';
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