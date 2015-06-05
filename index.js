var fs = require('fs');
var jsonfile = require('jsonfile');

var robotsDataFile = 'robots_data.json';
var robotsData = jsonfile.readFileSync(robotsDataFile).robots;


var log = console.log;
console.log = function () {
  log.call(this, 'My Console!!!');
  log.apply(this, Array.prototype.slice.call(arguments));
};

robotsData.forEach(function(data) {
  module.exports[data.robotname + '-' + data.manipname] = require(data.basePath)
});
