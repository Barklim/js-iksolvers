var async = require('async');
var _ = require('lodash');
var spawn = require('child_process').spawn;
var fs = require('fs');
var jsonfile = require('jsonfile');

var robotsDataFile = 'robots_data.json';
var robotsData = jsonfile.readFileSync(robotsDataFile).robots;

var runCommand = function(command, args, callback) {
  var cmd = spawn(command, args);

  var printData = function(data) {
    console.log(data.toString());
  };

  cmd.stdout.on('data', printData);
  cmd.stderr.on('data', printData);

  var timeout = setTimeout(function() {
    console.log('killing child process');
    cmd.stdin.pause();
    cmd.kill();
    callback(null);
  }, 12 * 60 * 60 * 1000); // let it run for 12 hours before killing it!

  cmd.on('close', function(code) {
    console.log('child process exited with code ' + code);
    clearTimeout(timeout);
    callback(null);
  });
};

var invokeSolverGenerator = function(data, callback) {
  var args = _.map(data, function(val, key) {
    return '--' + key + '=' + val;
  });
  var cmd = runCommand('python', ['solver_generator.py'].concat(args), callback);
};

var invokeEmscripten = function(data, callback) {
  var basePath = './solvers/' + data.robotname + '-' + data.manipname;
  var cppPath = basePath + '.cpp';
  var jsPath = basePath + '.js';
  fs.exists(cppPath, function(exists) {
    if (exists) {
      var cmd = runCommand('em++', [
        '-O1',
        '-s', 'INVOKE_RUN=0',
        '-s', 'NO_EXIT_RUNTIME=1',
        '-s', 'NO_FILESYSTEM=1',
        '-s', 'NO_BROWSER=1',
        '-o', jsPath, cppPath], callback);
    } else {
      callback(null);
    }
  });
};

var rewriteRobotsData = function() {

  var robotsData = jsonfile.readFileSync(robotsDataFile).robots;

  var robots = [];
  robotsData.forEach(function(data) {
    var basePath = './solvers/' + data.robotname + '-' + data.manipname;
    var cppPath = basePath + '.cpp';

    if (fs.existsSync(cppPath)) {
      data.basePath = basePath;
      robots.push(data);
    }
  });

  jsonfile.writeFileSync(robotsDataFile, {
    robots: robots
  });
};

var appendExportsToSolver = function(data, callback) {
  var solverExports = '\nmodule.exports = Module._main;\n';
  fs.appendFile(data.basePath + '.js', solverExports, function (err) {
    callback(null)
  });
};

// async.eachLimit(data, 3, invokeSolverGenerator, function() {
  async.eachLimit(robotsData, 4, invokeEmscripten, function() {
    rewriteRobotsData();
    async.eachLimit(robotsData, 4, appendExportsToSolver, function() {
      console.log('done');
    });
  });
// });
