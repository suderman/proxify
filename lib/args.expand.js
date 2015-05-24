'use strict';

var _ = require('lodash');
module.exports = function (args) {

  // Expand dot-ending sub-domain with domain, set subdomain
  if (_.endsWith(args.name, '.')) {
    args.subdomain = _.trimRight(args.name, '.');
    args.name += args.domain;
  }

  // Expand dot-ending sub-domain with domain
  if (_.endsWith(args.target, '.')) args.target += args.domain;
  if (_.endsWith(args.fallback, '.')) args.fallback += args.domain;

  return args;
};