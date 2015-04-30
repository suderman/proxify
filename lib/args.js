var _ = require('lodash');
var colors = require('colors');
var request = require('sync-request');

var argv = require('yargs')
    .usage('Usage: proxify (<hostname> | <file>) [:listen] [:target] [--options]...')
    // .example('$0 count -f foo.js', 'count the lines in the given file')
    .alias('d', 'DOMAIN').describe('d', 'Domain name sub-domains built on').default('d', process.env.DOMAIN || 'local')
    .alias('i', 'SERVER').describe('i', 'Private IP address of the host server').default('i', process.env.SERVER || '127.0.0.1')
    .alias('o', 'ROUTER').describe('o', 'Domain pointing to home router').default('o', process.env.ROUTER || `router.${process.env.DOMAIN || 'local'}`)
    .alias('c', 'CA').describe('c', 'Certificate Authority URL').default('c', process.env.CA)
    .alias('n', 'DNSIMPLE').describe('n', 'email:key').default('n', process.env.DNSIMPLE)
    .alias('s', 'ssl').describe('s', 'Create SSL host & certificate').boolean('s')
    .alias('a', 'auth').describe('a', 'Authenticate with client certificate (ssl implied)').boolean('a')
    .alias('p', 'password').describe('p', 'Authenticate with username/password (ssl implied)').boolean('p')
    .alias('r', 'redirect').describe('r', 'Redirect to target').boolean('r')
    .help('h').alias('h', 'help')
    .demand(1)
    .argv;

var args = {
  name:       argv._[0],
  listen:    (argv._[1]) ? ('' + argv._[1]) : false,
  target:    (argv._[2]) ? ('' + argv._[2]) : false,
  ca:         argv.c || false,
  domain:     argv.d,
  subdomain:  false,
  server:     argv.i,
  router:     argv.o,
  dnsimple:   argv.n || false,
  ssl:        argv.s || false,
  password:   argv.p || false,
  auth:       argv.a || false,
  redirect:   argv.r || false,
  file:       false
};

// Expand dot-ending sub-domain with domain, set subdomain
if (_.endsWith(args.name, '.')) {
  args.subdomain = _.trimRight(args.name, '.');
  args.name += args.domain;
}

// Expand dot-ending sub-domain with domain
if (_.endsWith(args.target, '.')) args.target += args.domain; 

// Ensure listen port doesn't start with :colon
if (_.startsWith(args.listen, ':')) args.listen = args.listen.split(':')[1];

if (args.target) {

  // Target is already URL, leave it alone
  if ((_.startsWith(args.target, 'http://')) || (_.startsWith(args.target, 'https://'))) {
    args.target = args.target; 

  // Target is URL missing http, add it
  } else if ((args.target.indexOf(":")>0) && (args.target.split(':')[0]!=='')) {
    args.target = `http://${args.target}`;

  // Target is port number, add http and server IP
  } else if (_.parseInt(args.target)>0) {
    args.target = `http://${args.server}:${_.parseInt(args.target)}`; 

  // Target is :port number, add http and server IP
  } else if (_.parseInt(args.target.split(':')[1])>0) {
    args.target = `http://${args.server}:${_.parseInt(args.target.split(':')[1])}`; 
  }

// Without target, these don't work
} else {
  if (args.password || args.auth || args.redirect) {
    console.log(("Target is missing! Skipping nginx configuration.").red);
  }
  args.password = false;
  args.auth = false;
  args.redirect = false;
}

// Append request_url nginx variable to end of target
if (args.redirect) {
  if (('http://' + args.name) == args.target) args.target += '$request_uri?';
  if (('https://' + args.name) == args.target) args.target += '$request_uri?';
}

// SSL is implied when auth or password is enabled
if ((args.auth) || (args.password)) {
  args.ssl = true
}

// If SSL is enabled, ensure Certificate Authority is available
if (args.ssl) {
  try { request('GET', args.ca); } 
  catch (e) { 
    var msg = (args.ca) ? "not responding (" + args.ca + ")!" : "missing!";
    console.log((`Certificate Authority is ${msg} Skipping SSL options.`).red);
    args.ca = false;
    args.ssl = false;
    args.password = false;
    args.auth = false;
  }
}

module.exports = args;
