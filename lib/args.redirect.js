'use strict';

var _ = require('lodash');
module.exports = function (args) {

  // Append request_url nginx variable to end of target
  if (args.redirect) {
    if ('http://' + args.name == args.target) args.target += '$request_uri?';
    if ('http://' + args.name == args.fallback) args.fallback += '$request_uri?';
    if ('https://' + args.name == args.target) args.target += '$request_uri?';
    if ('https://' + args.name == args.fallback) args.fallback += '$request_uri?';
  }

  return args;
};