'use strict';

var _ = require('lodash'),
    request = require('sync-request'),
    colors = require('colors');

module.exports = function (command) {

  var argv = require('yargs')(command).usage('Usage: proxify (<hostname> | <file>) [:listen] [:target] [--options]...').alias('d', 'DOMAIN').describe('d', 'Domain name sub-domains built on')['default']('d', process.env.DOMAIN || 'local').alias('i', 'SERVER').describe('i', 'Private IP address of the host server')['default']('i', process.env.SERVER || '127.0.0.1').alias('t', 'ROUTER').describe('t', 'Domain pointing to home router')['default']('t', process.env.ROUTER || 'router.' + (process.env.DOMAIN || 'local')).alias('o', 'OUTPUT').describe('o', 'Output directory, used in configuration')['default']('o', process.env.OUTPUT || process.cwd()).alias('u', 'USER').describe('u', 'User account running process')['default']('u', process.env.USER).alias('c', 'CA').describe('c', 'Certificate Authority URL')['default']('c', process.env.CA).alias('l', 'LOGIN').describe('l', 'name:password')['default']('l', process.env.LOGIN || '' + process.env.USER + ':' + process.env.USER).alias('n', 'DNSIMPLE').describe('n', 'email:key')['default']('n', process.env.DNSIMPLE).alias('s', 'ssl').describe('s', 'Create SSL host & certificate').boolean('s').alias('a', 'auth').describe('a', 'Authenticate with client certificate (ssl implied)').boolean('a').alias('p', 'pass').describe('p', 'Authenticate with HTTP password, create .htpasswd').boolean('p').alias('r', 'redirect').describe('r', 'Redirect to target').boolean('r').alias('f', 'force').describe('f', 'Force overwriting files').boolean('f').help('h').alias('h', 'help').demand(1).argv;

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
    login: argv.l,
    output: argv.o,
    dnsimple: argv.n || false,
    ssl: argv.s || false,
    pass: argv.p || false,
    auth: argv.a || false,
    redirect: argv.r || false,
    force: argv.f || false,
    directory: false,
    file: false
  };

  // Ensure login format is correct if using password option
  if (args.pass) {

    if (args.login.split(':').length != 2) {
      console.log('Invalid login format. Skipping pass option.'.red);
      args.pass = false;

      // Assign login name and password
    } else {
      args.loginName = args.login.split(':')[0];
      args.loginPass = args.login.split(':')[1];

      // Ensure name and password aren't empty
      if (args.loginName == '' || args.loginPass == '') {
        console.log('Missing login name or password. Skipping pass option.'.red);
        args.pass = false;
      }
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
  args.listen = _.map(args.listen.split(','), function (port) {
    return _.startsWith(port, ':') ? port.split(':')[1] : port;
  });

  if (args.target) {

    // Target is a directory
    if (_.startsWith(args.target, '/')) {
      args.directory = '/' + _.trim(args.target, '/') + '/';
    }

    // Target is already URL, leave it alone
    else if (_.startsWith(args.target, 'http://') || _.startsWith(args.target, 'https://')) {
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
    if (args.pass || args.auth || args.redirect) {
      console.log('Target is missing! Skipping nginx configuration.'.red);
    }
    args.pass = false;
    args.auth = false;
    args.redirect = false;
  }

  // Append request_url nginx variable to end of target
  if (args.redirect) {
    if ('http://' + args.name == args.target) args.target += '$request_uri?';
    if ('https://' + args.name == args.target) args.target += '$request_uri?';
  }

  // SSL is implied when auth is enabled
  if (args.auth) {
    args.ssl = true;
  }

  // If SSL is enabled, ensure Certificate Authority is available
  if (args.ssl) {
    try {
      request('GET', args.ca);
    } catch (e) {
      var msg = args.ca ? 'not responding (' + args.ca + ')!' : 'missing!';
      console.log(('Certificate Authority is ' + msg + ' Skipping SSL options.').red);
      args.ca = false;
      args.ssl = false;
      args.auth = false;
    }
  }

  return args;
};