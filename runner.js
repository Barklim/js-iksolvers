var async = require('async');
var _ = require('lodash');
var spawn = require('child_process').spawn;
var fs = require('fs');
var jsonfile = require('jsonfile');
jsonfile.spaces = 2;

var robotsDataFile = 'robots_data.json';

var numCores = require('os').cpus().length;
var numJobs = parseInt(numCores / 2);
// var numJobs = 1;
console.log('numJobs', numJobs);

var runCommand = function(command, args, callback, _timeout) {
  // _timeout = _timeout || 12 * 60 * 60 * 1000; // 12 hours
  _timeout = _timeout || 30 * 60 * 1000; // 30 minutes

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
  }, _timeout);

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
  var basePath = solverPath + data.robotname + '_' + data.manipname;
  var postPath = './post.cpp';
  var cppPath = basePath + '.cpp';
  var tmpPath = basePath + '.tmp.cpp';
  var jsPath = basePath + '.js';
  fs.exists(cppPath, function(exists) {
    if (exists) {

      var cpp = fs.readFileSync(cppPath);
      var post = fs.readFileSync(postPath);
      var program = cpp + '\n' + post;

      fs.writeFileSync(tmpPath, program);

      var cmd = runCommand('em++', [

        //'-g',
        '-O2',

        // ikfast
        '-DIKFAST_NO_MAIN',

        tmpPath,

        // emscripten (https://github.com/kripken/emscripten/blob/1.33.2/src/settings.js)
        '--pre-js', 'pre.js',
        '--post-js', 'post.js',
        '-s', 'INVOKE_RUN=0',
        '-s', 'ASSERTIONS=1',
        '-s', 'NO_EXIT_RUNTIME=1',
        '-s', 'NO_FILESYSTEM=1',
        '-s', 'NO_BROWSER=1',
        '-s', 'PRECISE_F32=1',
        '-s', 'DEMANGLE_SUPPORT=1',
        // '-s', 'MEMORY_INITIALIZER_PREFIX_URL="./solvers"',
        // '-s', 'memoryInitializerPrefixURL="./solvers"',
        // '-s', 'EXPORT_ALL=1',
        '-s', "EXPORTED_FUNCTIONS=['__Z16ComputeFkWrapperPKd', '__Z12GetNumJointsv']",
        //'-s', "EXPORTED_FUNCTIONS=['_main', '__Z16ComputeFkWrapperPKd']",

        '-o', jsPath], function() {
          try {
            fs.unlinkSync(tmpPath);
          } catch (e) {
          }
          console.log('Done ' + jsPath);
          // process.exit(0)
          callback(null);
        });
    } else {
      callback(null);
    }
  });
};

var getRobotsData = function(callback) {
  runCommand('python', ['get_robots_data.py'], callback);
};

var rewriteRobotsData = function() {

  var robotsData = jsonfile.readFileSync(robotsDataFile).robots;

  var robots = [];
  robotsData.forEach(function(data) {
    var basePath = './solvers/' + data.robotname + '_' + data.manipname;
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

//getRobotsData(function() {
  var robotsData = jsonfile.readFileSync(robotsDataFile).robots;
  // async.eachLimit(robotsData, numJobs, invokeSolverGenerator, function() {
    async.eachLimit(robotsData, numJobs, invokeEmscripten, function() {
      rewriteRobotsData();
      console.log('done');
    });
  // });
//});
