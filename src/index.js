var _ = require('lodash'),
    fs = require('fs'),
    crypto = require('crypto'),
    request = require('sync-request'),
    hbs = require('handlebars'),
    colors = require('colors');
require('shelljs/global');

var commands = [];
var argv = require('yargs').boolean(['s','p','a','r']).argv;

try {
  var lines = fs.readFileSync(argv._[0], 'utf8').split("\n");
  _.forEach(lines, function(line) {
    line = _.trim(line);
    if (line) commands.push(line.split(/\s+/));
  });

} catch (e) {
  var command = process.argv;
  commands.push((command.shift(), command.shift(), command));
}

// Pull up templates
var templates = require('./templates');
var files = { name: [], dnsimple: [], dnsmasq: [], nginx: [], cert: {}, login: {} }

// Loop all commands
_.forEach(commands, function(command) {

  var args = require('./args')(command);
  files.name.push(args.name);
  files.name.push(args.listen.toString());

  // dnsimple subdomain alias bash script
  if ((args.domain) && (args.subdomain) && (args.router) && (args.dnsimple)) {
    files.dnsimple.push(templates.dnsimple({
      domain:     args.domain,
      subdomain:  args.subdomain,
      router:     args.router,
      dnsimple:   args.dnsimple
    }));
  }

  // dnsmasq configuration
  if ((args.name) && (args.server)) {
    files.dnsmasq.push(templates.dnsmasq({
      name:     args.name,
      server:   args.server
    }));
  }

  // nginx server block
  if ((args.name) && (args.listen) && (args.target)) {
    files.nginx.push(templates.nginx({
      name:       args.name,
      listen:     args.listen,
      target:     args.target,
      directory:  args.directory,
      domain:     args.domain,
      subdomain:  args.subdomain,
      redirect:   args.redirect,
      auth:       args.auth,
      pass:       args.pass,
      ssl:        args.ssl
    }).replace(/^\s*[\r\n]/gm, ''));
  }
  
  // Prepare to download certificate information
  if ((args.name) && (args.ssl)) {
    dir = `${process.cwd()}`;

    // Download certificate and key
    files.cert[`${dir}/${args.name}.pem`] = `${args.ca}/${args.name}.pem`;
    files.cert[`${dir}/${args.name}.key`] = `${args.ca}/${args.name}.key`;

    // Download CA certificate and CRL
    files.cert[`${dir}/ca.crt`]           = `${args.ca}/ca.crt`;
    files.cert[`${dir}/ca.crl`]           = `${args.ca}/ca.crl`;
  }

  // Prepare credentials for htpasswd file
  if ((args.loginName) && (args.loginPass) && (args.pass)) {
    files.login[args.loginName] = _.trim(exec(`openssl passwd -apr1 ${args.loginPass}`, {silent:true}).output);
  }

});

// Prepare to write files
var id = [files.name[0], crypto.createHash('sha1').update(files.name.toString()).digest('hex').substring(0,5)].join('.'),
    dir = `${process.cwd()}`,
    save = require('./save'),
    filename, data, url;

// Download dnsimple shell script
filename = `${dir}/dnsimple.${id}.sh`;
data = _.uniq(files.dnsimple).join("\n");
save(filename, data);

// Download dnsmasq configuration
filename = `${dir}/dnsmasq.${id}.conf`;
data = _.uniq(files.dnsmasq).join("\n");
save(filename, data);

// Download nginx configuration
filename = `${dir}/nginx.${id}.conf`;
data = _.uniq(files.nginx).join("\n");
save(filename, data);

// Download certificates
_.forEach(files.cert, function(url, filename) {
  save(filename, url);
});

// Save htpasswd file
if (_.values(files.login).length) {
  filename = `${dir}/htaccess`;
  data = _.map(files.login, (pass, name) => `${name}:${pass}`);
  save(filename, data.join("\n"));
}
