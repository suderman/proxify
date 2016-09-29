'use strict';

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

var _ = require('lodash');
var fs = require('fs');
var parse = require('shell-quote').parse;

// Build commands
var argv = require('yargs').boolean(['s', 'a', 'r']).argv;
var commands = [];

try {
  var lines = fs.readFileSync(argv._[0], 'utf8').split('\n');
  _.forEach(lines, function (line) {
    line = _.trim(line);
    if ((line) && (line.charAt(0) !== '#')) commands.push(parse(line));
  });
} catch (e) {
  var command = process.argv;
  commands.push((command.shift(), command.shift(), command));
}

// File generator
var generate = require('./generate'),
    files = {},
    options = {};

// Run all commands through generator
_.forEach(commands, function (command) {
  var _temp = generate(command, files, options);

  var _temp2 = _slicedToArray(_temp, 2);

  files = _temp2[0];
  options = _temp2[1];
  _temp;
});

// File writer/downloader
var save = require('./save');

// Save files to disk
_.forEach(files, function (data, filename) {
  save(filename, data, options[filename] || {});
});
