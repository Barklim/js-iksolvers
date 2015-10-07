var async = require('async');
var _ = require('lodash');
var spawn = require('child_process').spawn;
var fs = require('fs');
var jsonfile = require('jsonfile');
jsonfile.spaces = 2;

var robotsDataFile = 'robots_data.json';

var numCores = require('os').cpus().length;
//var numJobs = parseInt(numCores / 2);
 var numJobs = 7;
console.log('numJobs', numJobs);

var runCommand = function(command, args, callback, _timeout) {
   _timeout = _timeout || 5 * 60 * 60 * 1000; // hours
  //_timeout = _timeout || 30 * 60 * 1000; // 30 minutes

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
  var solverDir = './solvers/';
  var basePath = solverDir + data.robotname + '_' + data.manipname;

  var postCppPath = './post.cpp';
  var postJSPath = './post.js';

  var solverCppPath = basePath + '.cpp';
  var solverJSPath = basePath + '.js';
  var solverHTMLPath = basePath + '.html';

  var tmpCppPath = basePath + '.tmp.cpp';
  var tmpJSPostPath = basePath + '-post.tmp.js';

  fs.exists(solverCppPath, function(exists) {
    if (exists) {

      var solverCpp = fs.readFileSync(solverCppPath);
      var postCpp = fs.readFileSync(postCppPath);
      var cppSolver = solverCpp + '\n' + postCpp;
      fs.writeFileSync(tmpCppPath, cppSolver);

      var postJS = fs.readFileSync(postJSPath);
      postJS = 'Module["solverInfo"] = ' + JSON.stringify(data) + ';\n' + postJS;
      fs.writeFileSync(tmpJSPostPath, postJS);

      var cmd = runCommand('em++', [

        '-g',
        //'-O2',

        // ikfast
        '-DIKFAST_NO_MAIN',

        tmpCppPath,

        // emscripten (https://github.com/kripken/emscripten/blob/1.33.2/src/settings.js)
        '--pre-js', 'pre.js',
        '--post-js', tmpJSPostPath,
        '-s', 'INVOKE_RUN=0',
        '-s', 'ASSERTIONS=1',
        '-s', 'NO_EXIT_RUNTIME=1',
        '-s', 'NO_FILESYSTEM=1',
        //'-s', 'NO_BROWSER=1',
        '-s', 'PRECISE_F32=1',
        '-s', 'DEMANGLE_SUPPORT=1',

        // use EXPORT_ALL to figure these functions out
        // TODO make this a little better by templating it
        // '-s', 'EXPORT_ALL=1',
        '-s', "EXPORTED_FUNCTIONS=['__Z16ComputeFkWrapperPKd', '__Z12GetNumJointsv']",

        '--shell-file', 'shell.html',

        '-o', solverHTMLPath

      ], function() {
          try {
            fs.unlinkSync(tmpCppPath);
            fs.unlinkSync(tmpJSPostPath);
          } catch (e) {
          }
          console.log('done ' + basePath);
          // process.exit(0)
          callback(null);
        });
    } else {
      callback(null);
    }
  });
};

var computeInitialRobotsData = function(callback) {
  runCommand('python', ['get_robots_data.py'], callback);
};

var getRobotsData = function() {
    var robotsData = jsonfile.readFileSync(robotsDataFile).robots;

    robotsData = _.filter(robotsData, function(robotItem) {
      return robotItem.scene.split('.').pop() === 'zae';
    });

    robotsData = _.uniq(robotsData, function(robotItem) {
        return robotItem.robotname + robotItem.manipname;
    });
    return robotsData;
};

var rewriteRobotsData = function() {

  var robotsData = getRobotsData();

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

computeInitialRobotsData(function() {
    var robotsData = getRobotsData();

   async.eachLimit(robotsData, numJobs, invokeSolverGenerator, function() {
    async.eachLimit(robotsData, numJobs, invokeEmscripten, function() {
      rewriteRobotsData();
      console.log('done');
    });
   });
});
