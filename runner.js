var async = require('async');
var _ = require('lodash');
var spawn = require('child_process').spawn;
var fs = require('fs');
var jsonfile = require('jsonfile');

var robotsDataFile = 'robots_data.json';
var robotsData = jsonfile.readFileSync(robotsDataFile).robots;

var numCores = require('os').cpus().length;

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
  var solverPath = './solvers/';
  var basePath = solverPath + data.robotname + '-' + data.manipname;
  var mainPath = solverPath + './main.cpp';
  var cppPath = basePath + '.cpp';
  var tmpPath = basePath + '.tmp.cpp'
  var jsPath = basePath + '.js';
  fs.exists(cppPath, function(exists) {
    if (exists) {
      
      fs.writeFileSync(tmpPath, fs.readFileSync(cppPath) + fs.readFileSync(mainPath))
  
      var cmd = runCommand('em++', [

        '-O1',

        // ikfast
        '-DIKFAST_NO_MAIN',

        tmpPath,

        // emscripten
        '--post-js', 'post.js',
        '-s', 'INVOKE_RUN=0',
        '-s', 'NO_EXIT_RUNTIME=1',
        '-s', 'NO_FILESYSTEM=1',
        '-s', 'NO_BROWSER=1',
        '-s', "EXPORTED_FUNCTIONS=['_main','_ComputeFk']",

        '-o', jsPath], function() {
          fs.unlinkSync(tmpPath)
          callback(null)
        });
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

// async.eachLimit(data, numCores, invokeSolverGenerator, function() {
  async.eachLimit(robotsData, numCores, invokeEmscripten, function() {
    rewriteRobotsData();
    console.log('done');
  });
// });
