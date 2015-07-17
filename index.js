var fs = require('fs');
var jsonfile = require('jsonfile');

var robotsData = jsonfile.readFileSync('robots_data.json').robots;

require('events').EventEmitter.defaultMaxListeners = robotsData.length;

// var log = console.log;
// console.log = function () {
  // log.call(this, 'My Console!!!');
  // log.apply(this, Array.prototype.slice.call(arguments));
// };

var solverPathMapping = {};
robotsData.forEach(function(data) {
  var robotModuleName = data.robotname + '_' + data.manipname;
  solverPathMapping[robotModuleName] = data.basePath;
});

var solverIds = Object.keys(solverPathMapping);
module.exports = {
  solverIds: solverIds,
  getSolver: function(robotModuleName) {
    var solverPath = solverPathMapping[robotModuleName];
    if (!solverPath) {
      throw new Error('Can\'t find solver for ' + robotModuleName + '\n\nAvailable solvers:\n  ' + solverIds.join('\n  ') + '\n');
    } else {
      return require(solverPath);
    }
  }
};