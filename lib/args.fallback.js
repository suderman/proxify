'use strict';

var _ = require('lodash');
module.exports = function (args) {

  // Adjust fallback
  if (args.fallback) {

    // Fallback is http: protocol, extend it with name
    if (args.fallback == 'http:') {
      args.fallback = 'http://' + args.name;

      // Fallback is https: protocol, extend it with name
    } else if (args.fallback == 'https:') {
      args.fallback = 'https://' + args.name;

      // Fallback is missing protocol, set to $scheme
    } else if (!_.startsWith(args.fallback, 'http:') && !_.startsWith(args.fallback, 'https:')) {
      args.fallback = '$scheme://' + args.fallback;

      // Fallback is already URL, leave it alone
    } else if (_.startsWith(args.fallback, 'http://') || _.startsWith(args.fallback, 'https://')) {
      args.fallback = args.fallback;

      // Fallback is URL missing http, add it
    } else if (args.fallback.indexOf(':') > 0 && args.fallback.split(':')[0] !== '') {
      args.fallback = 'http://' + args.fallback;

      // Fallback is port number, add http and server IP
    } else if (_.parseInt(args.fallback) > 0) {
      args.fallback = 'http://' + args.server + ':' + _.parseInt(args.fallback);

      // Fallback is :port number, add http and server IP
    } else if (_.parseInt(args.fallback.split(':')[1]) > 0) {
      args.fallback = 'http://' + args.server + ':' + _.parseInt(args.fallback.split(':')[1]);
    }
  }

  return args;
};