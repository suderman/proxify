var _ = require('lodash'),
    fs = require('fs'),
    request = require('sync-request');

// Save data (or data from URL) to path
module.exports = function(path, data) {

  // If data empty, exit
  if (!_.trim(data)) return;

  // Don't do anything if the file already exists
  try {
    fs.readFileSync(path, 'utf8');

  // Otherwise, go for it
  } catch (e) {

    // Check if the data looks like a URL
    if ((_.startsWith(data, 'http://')) || (_.startsWith(data, 'https://'))) {

      // If so, download the URL and set data
      var url = data;
      data = request('GET', url).getBody('utf8');
    } 

    // Write the data to the path
    fs.writeFileSync(path, data);

    // If file is shell script, make executable
    if (_.endsWith(path, '.sh')) {
      fs.chmodSync(path, '755');
    }
  }
}
