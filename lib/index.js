var _ = require('lodash'),
    fs = require('fs'),
    path = require('path'),
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

var templates = require('./templates');
var files = { id: [], dnsimple: [], dnsmasq: [], nginx: [], cert: [], ca: '' }

// Loop all commands
_.forEach(commands, function(command) {

  var args = require('./args')(command);
  files.id.push((args.name + (!args.listen ? '' : `.${args.listen}`)));
  files.cert.push(args.name);
  files.ca = args.ca || files.ca;

  if ((args.domain) && (args.subdomain) && (args.router) && (args.dnsimple)) {
    files.dnsimple.push(templates.dnsimple({
      domain:     args.domain,
      subdomain:  args.subdomain,
      router:     args.router,
      dnsimple:   args.dnsimple
    }));
  }

  if ((args.name) && (args.server)) {
    files.dnsmasq.push(templates.dnsmasq({
      name:     args.name,
      server:   args.server
    }));
  }

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
      password:   args.password,
      ssl:        args.ssl
    }));
  }
});

var id = files.id.join('-'),
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
_.forEach(_.uniq(files.cert), function(name) {
  
  // Download PEM file
  filename = `${dir}/${name}.pem`;
  url = `${files.ca}/${name}.pem`
  save(filename, url);
  
  // Download key file
  filename = `${dir}/${name}.key`;
  url = `${files.ca}/${name}.key`
  save(filename, url);
});

// Download Root Certificate & CRL
_.forEach(['ca.crt', 'ca.crl'], function(file) {
  filename = `${dir}/${file}`;
  url = `${files.ca}/${file}`
  save(filename, url);
});
