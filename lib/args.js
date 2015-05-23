'use strict';

var _ = require('lodash'),
    request = require('sync-request'),
    colors = require('colors');
var process = require('process');
require('shelljs/global');

module.exports = function (command) {

  var argv = require('yargs')(command).usage('Usage: proxify (<hostname> | <file>) [:listen] [:target] [--options]...').alias('d', 'DOMAIN').describe('d', 'Domain name sub-domains built on')['default']('d', process.env.DOMAIN || 'local').alias('i', 'SERVER').describe('i', 'Private IP address of the host server')['default']('i', process.env.SERVER || '127.0.0.1').alias('t', 'ROUTER').describe('t', 'Domain pointing to home router')['default']('t', process.env.ROUTER || 'router.' + (process.env.DOMAIN || 'local')).alias('o', 'OUTPUT').describe('o', 'Output directory, used in configuration')['default']('o', process.env.OUTPUT || process.cwd()).alias('u', 'USER').describe('u', 'User account running process')['default']('u', process.env.USER).alias('c', 'CA').describe('c', 'Certificate Authority URL')['default']('c', process.env.CA || '' + (process.env.SERVER || '127.0.0.1') + ':11443').alias('e', 'ERROR').describe('e', 'Error pages URL')['default']('e', process.env.ERROR || 'http://error.' + (process.env.DOMAIN || 'local')).alias('p', 'PASSWORDS').describe('p', 'Comma-delimited name:password')['default']('p', process.env.PASSWORDS || '' + process.env.USER + ':' + process.env.USER).alias('n', 'DNSIMPLE').describe('n', 'email:key')['default']('n', process.env.DNSIMPLE).alias('s', 'secure').describe('s', 'Create secure host & certificate').boolean('s').alias('a', 'authenticate').describe('a', 'Authenticate username or certificate')['default']('a', false).alias('r', 'redirect').describe('r', 'Redirect to target').boolean('r').alias('f', 'force').describe('f', 'Force overwriting files').boolean('f').help('h').alias('h', 'help').demand(1).wrap(100).argv;

  var args = {
    name: argv._[0],
    listen: argv._[1] ? '' + argv._[1] : false,
    target: argv._[2] ? '' + argv._[2] : false,
    ca: argv.c || false,
    domain: argv.d,
    subdomain: false,
    server: argv.i,
    user: argv.u,
    router: argv.t,
    error: argv.e,
    output: argv.o,
    dnsimple: argv.n || false,
    secure: argv.s || false,
    authenticate: argv.a || false,
    redirect: argv.r || false,
    force: argv.f || false,
    passwords: {},
    logins: {},
    htpasswd: false,
    certify: false,
    directory: false,
    file: false
  };

  // Process password string into hash
  _.forEach(argv.p.toString().split(','), function (pair) {
    if (pair.split(':').length == 2) {
      var username = pair.split(':')[0];
      var password = pair.split(':')[1];
      if (username !== '' && password !== '') {
        args.passwords[username] = _.trim(exec('openssl passwd -apr1 ' + password, { silent: true }).output);
      }
    }
  });

  // Ensure login format is correct if using password option
  if (args.authenticate) {

    if (_.isBoolean(args.authenticate)) {
      args.certify = true;
    } else {

      _.forEach(args.authenticate.toString().split(','), function (username) {
        if (username == 'certificate' || username == 'cert') {
          args.certify = true;
        } else {
          if (args.passwords[username]) {
            args.logins[username] = args.passwords[username];
          }
        }
      });

      // Determine if basic authentication should be used
      args.htpasswd = _.keys(args.logins).length ? true : false;
    }
  }

  // Expand dot-ending sub-domain with domain, set subdomain
  if (_.endsWith(args.name, '.')) {
    args.subdomain = _.trimRight(args.name, '.');
    args.name += args.domain;
  }

  // Expand dot-ending sub-domain with domain
  if (_.endsWith(args.target, '.')) args.target += args.domain;

  // Ensure listen port doesn't start with :colon
  if (args.listen) {
    args.listen = _.map(args.listen.split(','), function (port) {
      return _.startsWith(port, ':') ? port.split(':')[1] : port;
    });
  }

  if (args.target) {

    // Target is a directory
    if (_.startsWith(args.target, '/')) {
      args.directory = '/' + _.trim(args.target, '/') + '/';

      // Target is http: protocol, extend it with name
    } else if (args.target == 'http:') {
      args.target = 'http://' + args.name;

      // Target is https: protocol, extend it with name
    } else if (args.target == 'https:') {
      args.target = 'https://' + args.name;

      // Target is missing protocol and this is a redirect, set to $scheme
    } else if (args.redirect && !_.startsWith(args.target, 'http:') && !_.startsWith(args.target, 'https:')) {
      args.target = '$scheme://' + args.target;

      // Target is already URL, leave it alone
    } else if (_.startsWith(args.target, 'http://') || _.startsWith(args.target, 'https://')) {
      args.target = args.target;

      // Target is URL missing http, add it
    } else if (args.target.indexOf(':') > 0 && args.target.split(':')[0] !== '') {
      args.target = 'http://' + args.target;

      // Target is port number, add http and server IP
    } else if (_.parseInt(args.target) > 0) {
      args.target = 'http://' + args.server + ':' + _.parseInt(args.target);

      // Target is :port number, add http and server IP
    } else if (_.parseInt(args.target.split(':')[1]) > 0) {
      args.target = 'http://' + args.server + ':' + _.parseInt(args.target.split(':')[1]);
    }

    // Without target, these don't work
  } else {
    if (args.htpasswd || args.certify || args.redirect) {
      console.log('Target is missing! Skipping nginx configuration.'.red);
    }
    args.htpasswd = false;
    args.certify = false;
    args.redirect = false;
  }

  // Append request_url nginx variable to end of target
  if (args.redirect) {
    if ('http://' + args.name == args.target) args.target += '$request_uri?';
    if ('https://' + args.name == args.target) args.target += '$request_uri?';
  }

  // Secure is implied when certify is enabled
  if (args.certify) {
    args.secure = true;
  }

  // Ensure ERROR starts with http protocol
  if (!_.startsWith(args.error, 'http')) {
    args.error = 'http://' + args.error;
  }

  // Ensure CA starts with http protocol
  if (!_.startsWith(args.ca, 'http')) {
    args.ca = 'http://' + args.ca;
  }

  // If secure is enabled, ensure Certificate Authority is available
  if (args.secure) {
    try {
      request('GET', args.ca);
    } catch (e) {
      var msg = args.ca ? 'not responding (' + args.ca + ')!' : 'missing!';
      console.log(('Certificate Authority is ' + msg + ' Skipping secure options.').red);
      console.log(e);
      args.ca = false;
      args.secure = false;
      args.certify = false;
    }
  }

  return args;
};