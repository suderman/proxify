var _ = require('lodash'),
    colors = require('colors');

module.exports = function(command) {

  var argv = require('yargs')(command)
      .usage('Usage: proxify (<hostname> | <file>) [:listen] [:target] [--options]...')
      .alias('d', 'DOMAIN').describe('d', 'Domain name sub-domains built on').default('d', process.env.DOMAIN || 'local')
      .alias('i', 'SERVER').describe('i', 'Private IP address of the host server').default('i', process.env.SERVER || '127.0.0.1')
      .alias('t', 'ROUTER').describe('t', 'Domain pointing to home router').default('t', process.env.ROUTER || `router.${process.env.DOMAIN || 'local'}`)
      .alias('o', 'OUTPUT').describe('o', 'Output directory, used in configuration').default('o', process.env.OUTPUT || process.cwd())
      .alias('u', 'USER').describe('u', 'User account running process').default('u', process.env.USER)
      .alias('c', 'CA').describe('c', 'Certificate Authority URL').default('c', process.env.CA || `${process.env.SERVER || '127.0.0.1'}:11443`)
      .alias('p', 'PASSWORDS').describe('p', 'Comma-delimited name:password').default('p', process.env.PASSWORDS || `${process.env.USER}:${process.env.USER}`)
      .alias('l', 'CLOUDFLARE').describe('l', 'email:key').default('l', process.env.CLOUDFLARE)
      .alias('n', 'DNSIMPLE').describe('n', 'email:key').default('n', process.env.DNSIMPLE)
      .alias('x', 'nginx').describe('x', 'Additional nginx configuration').default('x', false)
      .alias('s', 'secure').describe('s', 'Create secure host & certificate').default('s', false)
      .alias('a', 'authenticate').describe('a', 'Authenticate username or certificate').default('a', false)
      .alias('r', 'redirect').describe('r', 'Redirect to target').boolean('r')
      .alias('f', 'force').describe('f', 'Force overwriting files').boolean('f')
      .help('h').alias('h', 'help')
      .demand(1)
      .wrap(85)
      .argv;

  var args = {
    name:          argv._[0],
    listen:       (argv._[1]) ? ('' + argv._[1]) : false,
    target:       (argv._[2]) ? ('' + argv._[2]) : false,
    fallback:      false,
    ca:            argv.c || false,
    domain:        argv.d,
    subdomain:     false,
    server:        argv.i,
    user:          argv.u,
    router:        argv.t,
    output:        argv.o,
    nginx:         argv.x || '',
    cloudflare:    argv.l || false,
    dnsimple:      argv.n || false,
    secure:        argv.s || false,
    authenticate:  argv.a || false,
    redirect:      argv.r || false,
    force:         argv.f || false,
    logins:        {},
    passwd:        false,
    certify:       false,
    directory:     false,
    file:          false
  };

  // Set certifiy, logins, passwd
  args = require('./args.authenticate')(args, argv);

  // Extract fallback from second target
  if (args.target) {
    var targets = args.target.toString().split(',');
    args.target = targets[0];
    args.fallback = (targets[1]) ? targets[1] : false;
  }

  // Expand dot
  args = require('./args.expand')(args);

  // Adjust listen
  args = require('./args.listen')(args);

  // Adjust target & fallback
  args = require('./args.target')(args);
  args = require('./args.fallback')(args);

  // Redirect
  args = require('./args.redirect')(args);

  // Secure
  args = require('./args.secure')(args);

  return args;
}
