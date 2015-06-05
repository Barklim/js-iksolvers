var fs = require('fs');
var jsonfile = require('jsonfile');

var robotsData = jsonfile.readFileSync('robots_data.json').robots;

require('events').EventEmitter.defaultMaxListeners = robotsData.length;

// var log = console.log;
// console.log = function () {
  // log.call(this, 'My Console!!!');
  // log.apply(this, Array.prototype.slice.call(arguments));
// };

robotsData.forEach(function(data) {
  var robotModuleName = data.robotname + '_' + data.manipname;
  module.exports[robotModuleName] = require(data.basePath);
});
