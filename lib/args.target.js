'use strict';

var _ = require('lodash');
module.exports = function (args) {

  // Adjust target
  if (args.target) {

    // Target is a directory
    if (_.startsWith(args.target, '/')) {
      args.directory = '/' + _.trim(args.target, '/') + '/';

      // Target is http: protocol, extend it with name
    } else if (args.target == 'http:') {
      args.target = 'http://' + args.name;

      // Target is https: protocol, extend it with name
    } else if (args.target == 'https:') {
      args.target = 'https://' + args.name;

      // Target is missing protocol and this is a redirect, set to $scheme
    } else if (args.redirect && !_.startsWith(args.target, 'http:') && !_.startsWith(args.target, 'https:')) {
      args.target = '$scheme://' + args.target;

      // Target is already URL, leave it alone
    } else if (_.startsWith(args.target, 'http://') || _.startsWith(args.target, 'https://')) {
      args.target = args.target;

      // Target is URL missing http, add it
    } else if (args.target.indexOf(':') > 0 && args.target.split(':')[0] !== '') {
      args.target = 'http://' + args.target;

      // Target is port number, add http and server IP
    } else if (_.parseInt(args.target) > 0) {
      args.target = 'http://' + args.server + ':' + _.parseInt(args.target);

      // Target is :port number, add http and server IP
    } else if (_.parseInt(args.target.split(':')[1]) > 0) {
      args.target = 'http://' + args.server + ':' + _.parseInt(args.target.split(':')[1]);
    }

    // Without target, these don't work
  } else {
    if (args.passwd || args.certify || args.redirect) {
      console.log('Target is missing! Skipping nginx configuration.'.red);
    }
    args.passwd = false;
    args.certify = false;
    args.redirect = false;
    args.fallback = false;
  }

  return args;
};