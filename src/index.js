var _ = require('lodash');
var fs = require('fs');
var parse = require('shell-quote').parse;

// Build commands
var argv = require('yargs').boolean(['s','a','r']).argv;
var commands = [];

try {
  var lines = fs.readFileSync(argv._[0], 'utf8').split("\n");
  _.forEach(lines, function(line) {
    line = _.trim(line);
    if (line) commands.push(parse(line));
  });

} catch (e) {
  var command = process.argv;
  commands.push((command.shift(), command.shift(), command));
}

// File generator
var generate = require('./generate'),
    files = {}, options = {};

// Run all commands through generator
_.forEach(commands, function(command) {
  [ files, options ] = generate(command, files, options);
});

// File writer/downloader
var save = require('./save');

// Save files to disk
_.forEach(files, function(data, filename) {
  save(filename, data, options[filename] || {});
});
