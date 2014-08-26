var async = require('async');
var _ = require('lodash');
var spawn = require('child_process').spawn

var invokeGenerator = function(data, callback) {
  var args = _.map(data, function(val, key) {
    return '--' + key + '=' + val
  });
  var cmd = spawn('python', ['generator.py'].concat(args));

  cmd.stdout.on('data', function (data) {
    console.log('stdout: ' + data);
  });

  cmd.stderr.on('data', function (data) {
    console.log('stderr: ' + data);
  });

  cmd.on('close', function (code) {
    console.log('child process exited with code ' + code);
    callback(null);
  });
};

var data = require('jsonfile').readFileSync('robot_data.json').robots;

async.eachLimit(data, 4, invokeGenerator, function() {
  console.log('done');
});

