var async = require('async');
var _ = require('lodash');
var spawn = require('child_process').spawn;
var fs = require('fs');

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

var invokeGenerator = function(data, callback) {
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
        '-O0',
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

var data = require('jsonfile').readFileSync('robots_data.json').robots;

// async.eachLimit(data, 3, invokeGenerator, function() {
  // console.log('done');
// });

async.eachLimit(data, 4, invokeEmscripten, function() {
  console.log('done');
});
