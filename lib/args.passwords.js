'use strict';

var _ = require('lodash');
require('shelljs/global');

module.exports = function (argv) {
  var passwords;

  // Process password string into hash
  _.forEach(argv.p.toString().split(','), function (pair) {
    if (pair.split(':').length == 2) {
      var username = pair.split(':')[0];
      var password = pair.split(':')[1];
      if (username !== '' && password !== '') {
        passwords[username] = _.trim(exec('openssl passwd -apr1 ' + password, { silent: true }).output);
      }
    }
  });

  return passwords;
};