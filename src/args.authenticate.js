var _ = require('lodash');
require('shelljs/global');

module.exports = function(args, argv) {

  // Process password string into hash
  var passwords = {}; 
  _.forEach(argv.p.toString().split(','), function(pair) {
    if (pair.split(':').length == 2) {
      var username = pair.split(':')[0];
      var password = pair.split(':')[1];
      if ((username !== '') && (password !== '')) {
        passwords[username] = _.trim(exec(`openssl passwd -apr1 ${password}`, {silent:true}).output);
      }
    }
  });

  // Ensure login format is correct if using password option
  if (args.authenticate) {

    if (_.isBoolean(args.authenticate)) {
      args.certify = true

    } else {

      _.forEach(args.authenticate.toString().split(','), function(username) {
        if ((username == 'certificate') || (username == 'cert')) {
          args.certify = true
        } else {
          if (passwords[username]) {
            args.logins[username] = passwords[username];
          }
        }
      });

      // Determine if basic authentication should be used
      args.htpasswd = (_.keys(args.logins).length) ? true : false;
    }
  }

  return args;
}
