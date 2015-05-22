var _ = require('lodash'),
    dirname = require("path").dirname,
    colors = require('colors'),
    request = require('sync-request');
var fs = require('fs');
require('shelljs/global');

// Regular express for blank lines
var blankLines = new RegExp(/^\s*[\r\n]/gm);

var saving = '=> Saving '.green,
    existing = '=> Existing '.yellow,
    overwriting = '=> Overwriting '.red,
    reverting = '=> Reverting '.yellow;

// Save or download a file
function save(path, data, options) {

  // Check if the data looks like a URL
  if ((_.startsWith(data, 'http://')) || (_.startsWith(data, 'https://'))) {

    // If so, download the URL and set data
    var url = data;
    data = request('GET', url).getBody('utf8');

  // Remove blank lines
  } else {
    data = data.replace(blankLines, '');
  } 

  // Ensure directory exists
  mkdir('-p', dirname(path));

  // Write the data to the path
  fs.writeFileSync(path, data);

  // Change ownership of file
  if (options.user) {
    exec(`chown ${options.user} ${path}`, { silent: true });
    exec(`chgrp ${options.user} ${path}`, { silent: true });
  }

  // If file is shell script, make executable
  if (_.endsWith(path, '.sh')) {
    fs.chmodSync(path, '755');
  }

  // Protect key, pem and htpasswd files
  if ((_.endsWith(path, '.key')) || (_.endsWith(path, '.pem')) || (_.endsWith(path, '.htpasswd'))) {
    fs.chmodSync(path, '600');
  }
}

// Save data (or data from URL) to path
module.exports = function(path, data, options = { force: false, user: process.env.USER }) {

  // If data empty, exit
  if (!_.trim(data)) return;

  // Don't do anything if the file already exists
  try {
    var existingData = fs.readFileSync(path, 'utf8');
    console.log(existing + path);

    // If file exists, only proceed to overwrite if force enabled
    if (options.force) { 

      // Delete the old file and write the new data
      console.log(overwriting + path);
      fs.unlinkSync(path);
      save(path, data, options); 

      // Ensure new data exists, otherwise revert to old data
      if (fs.readFileSync(path, 'utf8') == '') {
        console.log(reverting + path);
        save(path, existingData, options); 
      }
    }

  // Otherwise, go for it
  } catch (e) {
    console.log(saving + path);
    save(path, data, options);
  }

}
