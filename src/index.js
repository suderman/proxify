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
var files = { name: [], dnsimple: [], main: {}, dnsmasq: [], nginx: [], cert: {}, login: {}, output: [], user: [], force: [] }

// Loop all commands
_.forEach(commands, function(command) {

  var args = require('./args')(command);
  files.name.push(args.name);
  files.name.push(args.listen.toString());
  files.output.push(args.output);
  files.user.push(args.user);
  files.force.push(args.force);

  // dnsimple subdomain alias bash script
  if ((args.domain) && (args.subdomain) && (args.router) && (args.dnsimple)) {
    files.dnsimple.push(templates.dnsimple({
      domain:     args.domain,
      subdomain:  args.subdomain,
      router:     args.router,
      dnsimple:   args.dnsimple
    }));
  }

  // dnsmasq sites configuration
  if ((args.name) && (args.server)) {
    files.dnsmasq.push(templates.dnsmasq({
      name:     args.name,
      server:   args.server
    }));
  }

  // dnsmasq configuration
  if ((args.user) && (args.domain) && (args.server) && (args.output)) {
    files.main.dnsmasq = templates.main.dnsmasq({
      user:     args.user,
      domain:   args.domain,
      server:   args.server,
      output:   args.output
    });
  }

  // nginx server block
  if ((args.name) && (args.listen) && (args.target) && (args.output)) {
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
      ssl:        args.ssl,
      output:     args.output
    }));
  }

  // nginx configuration
  if ((args.user) && (args.output)) {
    files.main.nginx = templates.main.nginx({
      user:     args.user,
      output:   args.output
    });
  }
  
  // Prepare to download certificate information
  if ((args.name) && (args.ssl)) {

    // Download certificate and key
    files.cert[`${args.name}.pem`] = `${args.ca}/${args.name}.pem`;
    files.cert[`${args.name}.key`] = `${args.ca}/${args.name}.key`;

    // Download CA certificate and CRL
    files.cert[`ca.crt`]           = `${args.ca}/ca.crt`;
    files.cert[`ca.crl`]           = `${args.ca}/ca.crl`;
  }

  // Prepare credentials for htpasswd file
  if ((args.loginName) && (args.loginPass) && (args.pass)) {
    files.login[args.loginName] = _.trim(exec(`openssl passwd -apr1 ${args.loginPass}`, {silent:true}).output);
  }

});

// Prepare to write files
var id = [files.name[0], crypto.createHash('sha1').update(files.name.toString()).digest('hex').substring(0,5)].join('.'),
    output = files.output[0],
    save = require('./save'),
    options = { user: files.user[0], force: files.force[0] },
    filename, data, url;

// Save dnsimple shell script
filename = `${output}/${id}.dnsimple.sh`;
data = _.uniq(files.dnsimple).join("\n");
save(filename, data, options);

// Save dnsmasq configuration
filename = `${output}/${id}.dnsmasq.conf`;
data = _.uniq(files.dnsmasq).join("\n");
save(filename, data, options);

// Save main dnsmasq configuration
filename = `${output}/dnsmasq.conf`;
data = files.main.dnsmasq;
save(filename, data, options);

// Save nginx configuration
filename = `${output}/${id}.nginx.conf`;
data = _.uniq(files.nginx).join("\n");
save(filename, data, options);

// Save main nginx configuration
filename = `${output}/nginx.conf`;
data = files.main.nginx;
save(filename, data, options);

// Download certificates
_.forEach(files.cert, function(url, filename) {
  filename = `${output}/${filename}`;
  save(filename, url, options);
});

// Save htpasswd file
if (_.values(files.login).length) {
  filename = `${output}/htpasswd`;
  data = _.map(files.login, (pass, name) => `${name}:${pass}`);
  save(filename, data.join("\n"), options);
}
