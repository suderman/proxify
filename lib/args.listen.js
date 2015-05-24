'use strict';

var _ = require('lodash');
module.exports = function (args) {

  // Ensure listen port doesn't start with :colon
  if (args.listen) {
    args.listen = _.map(args.listen.split(','), function (port) {
      return _.startsWith(port, ':') ? port.split(':')[1] : port;
    });
  }

  return args;
};