var async = require('async');
var _ = require('lodash');
var spawn = require('child_process').spawn

var runCommand = function(command, args, callback) {
  var args = _.map(data, function(val, key) {
    return '--' + key + '=' + val
  });
  var cmd = spawn('python', ['solver_generator.py'].concat(args));

  var printData = function(data) {
    console.log(data.toString());
  }
  
  cmd.stdout.on('data', printData);
  cmd.stderr.on('data', printData);

  var timeout = setTimeout(function() {
    console.log('killing child process')
    cmd.stdin.pause();
    cmd.kill();
    callback(null);
  }, 12 * 60 * 60 * 1000); // let it run for 12 hours before killing it!

  cmd.on('close', function (code) {
    console.log('child process exited with code ' + code);
    clearTimeout(timeout);
    callback(null);
  });
};

var invokeIKGenerator = function(data, callback) {
  var args = _.map(data, function(val, key) {
    return '--' + key + '=' + val
  });
  var cmd = runCommand('python', ['solver_generator.py'].concat(args), callback);
};



var data = require('jsonfile').readFileSync('collada_robots_data.json').robots;

async.eachLimit(data, 3, invokeGenerator, function() {
  console.log('done');
});
