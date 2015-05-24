'use strict';

var _ = require('lodash');
var request = require('sync-request');
module.exports = function (args) {

  // Ensure CA starts with http protocol
  if (!_.startsWith(args.ca, 'http')) {
    args.ca = 'http://' + args.ca;
  }

  // Secure is implied when certify is enabled
  if (args.certify && args.secure == false) {
    args.secure = true;
  }

  // Ensure login format is correct if using password option
  if (args.secure) {

    if (_.isBoolean(args.secure)) {
      args.secure = args.name;
    } else if (args.secure == '.') {
      args.secure = args.domain;
    } else if (_.endsWith(args.secure, '.')) {
      args.secure += args.domain;
    }

    // If secure is enabled, ensure Certificate Authority is available
    try {
      request('GET', args.ca);
    } catch (e) {
      var msg = args.ca ? 'not responding (' + args.ca + ')!' : 'missing!';
      console.log(('Certificate Authority is ' + msg + ' Skipping secure options.').red);
      console.log(e);
      args.ca = false;
      args.secure = false;
      args.certify = false;
    }
  }

  return args;
};