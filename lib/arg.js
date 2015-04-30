var _ = require('lodash');
var colors = require('colors');
var request = require('sync-request');

var argv = require('yargs')
    .usage('Usage: $0 [hostname] [listen] [target] --[options]')
    // .example('$0 count -f foo.js', 'count the lines in the given file')
    .alias('d', 'DOMAIN').describe('d', 'Domain name sub-domains built on').default('d', process.env.DOMAIN || 'local')
    .alias('i', 'SERVER').describe('i', 'IP address of the host server').default('i', process.env.SERVER || '127.0.0.1')
    .alias('c', 'CA').describe('c', 'Certificate Authority URL').default('c', process.env.CA)
    .alias('n', 'DNSIMPLE').describe('n', 'email:key').default('n', process.env.DNSIMPLE)
    .alias('s', 'ssl').describe('s', 'Create SSL host & certificate').boolean('s')
    .alias('a', 'auth').describe('a', 'Authenticate with client certificate (ssl implied)').boolean('a')
    .alias('p', 'password').describe('p', 'Authenticate with username/password (ssl implied)').boolean('p')
    .alias('r', 'redirect').describe('r', 'Redirect to target').boolean('r')
    .help('h').alias('h', 'help')
    .demand(1)
    .argv;

var arg = {
  name:       argv._[0],
  listen:    (argv._[1]) ? ('' + argv._[1]) : false,
  target:    (argv._[2]) ? ('' + argv._[2]) : false,
  ca:         argv.c || false,
  domain:     argv.d,
  server:     argv.i,
  dnsimple:   argv.n || false,
  ssl:        argv.s || false,
  password:   argv.p || false,
  auth:       argv.a || false,
  redirect:   argv.r || false
};

// Expand dot-ending sub-domain with domain
if (_.endsWith(arg.name, '.')) arg.name += arg.domain;
if (_.endsWith(arg.target, '.')) arg.target += arg.domain; 

// Ensure listen port doesn't start with :colon
if (_.startsWith(arg.listen, ':')) arg.listen = arg.listen.split(':')[1];

if (arg.target) {

  // Target is already URL, leave it alone
  if ((_.startsWith(arg.target, 'http://')) || (_.startsWith(arg.target, 'https://'))) {
    arg.target = arg.target; 

  // Target is URL missing http, add it
  } else if ((arg.target.indexOf(":")>0) && (arg.target.split(':')[0]!=='')) {
    arg.target = `http://${arg.target}`;

  // Target is port number, add http and server IP
  } else if (_.parseInt(arg.target)>0) {
    arg.target = `http://${arg.server}:${_.parseInt(arg.target)}`; 

  // Target is :port number, add http and server IP
  } else if (_.parseInt(arg.target.split(':')[1])>0) {
    arg.target = `http://${arg.server}:${_.parseInt(arg.target.split(':')[1])}`; 
  }

// Without target, these don't work
} else {
  if (arg.password || arg.auth || arg.redirect) {
    console.log(("Target is missing! Skipping nginx configuration.").red);
  }
  arg.password = false;
  arg.auth = false;
  arg.redirect = false;
}

// Append request_url nginx variable to end of target
if (arg.redirect) {
  if (('http://' + arg.name) == arg.target) arg.target += '$request_uri?';
  if (('https://' + arg.name) == arg.target) arg.target += '$request_uri?';
}

// SSL is implied when auth or password is enabled
if ((arg.auth) || (arg.password)) {
  arg.ssl = true
}

// If SSL is enabled, ensure Certificate Authority is available
if (arg.ssl) {
  try { request('GET', arg.ca); } 
  catch (e) { 
    var msg = (arg.ca) ? "not responding (" + arg.ca + ")!" : "missing!";
    console.log((`Certificate Authority is ${msg} Skipping SSL options.`).red);
    arg.ca = false;
    arg.ssl = false;
    arg.password = false;
    arg.auth = false;
  }
}

module.exports = arg;
