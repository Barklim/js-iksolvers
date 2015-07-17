var solvers = require('./index');

var solverName = 'asdsasa'
var maxdiff = 0.0;
var maxdiffk;
var maxdiffresulti;
var maxdiffresultj;

var mindiff = 1000.0;
var mindiffk;
var mindiffresulti;
var mindiffresultj;

solvers.solverIds.forEach(function (solverId) {
    console.log('solverId', solverId)
    var solver = solvers.getSolver(solverId);

    var numJoints = solver.ccall('_Z12GetNumJointsv', 'int');

    var tries = 3000;

    var makeArray = function(len) {
        var r = [];
        for (var i = 0; i < len; i++) {
            r.push(0.01);
        }
        return r;
    };

    var results = [];

    for (var i = 0; i < tries; i++) {

        try {
            var j = makeArray(numJoints);
            var ret = solver.ccall('_Z16ComputeFkWrapperPKd', 'string', ['array'], [j]);
            var newret = ret.split(',').map(parseFloat);
            results.push({
                result: newret,
                raw: ret,
                i: i
            });

        } catch (e) {
            console.log(e.stack);
        }
    }


    for (var i = 0; i < results.length - 1; i++) {
        var resulti = results[i];
        for (var j = i + 1; j < results.length; j++) {
            var resultj = results[j];
            for (var k = 0; k < resulti.result.length; k++) {
                var diff = Math.abs(resulti.result[k] - resultj.result[k]);

                if (diff > maxdiff) {
                    solverName = solverId
                    maxdiff = diff;
                    maxdiffk = k;
                    maxdiffresulti = resulti;
                    maxdiffresultj = resultj;
                }

                if (diff < mindiff) {
                    mindiff = diff;
                    mindiffk = k;
                    mindiffresulti = resulti;
                    mindiffresultj = resultj;
                }
            }
        }
    }

})
console.log('solverName', solverName);
console.log('maxdiff', maxdiff);
console.log('maxdiffk', maxdiffk);
console.log('maxdiffresulti', maxdiffresulti);
console.log('maxdiffresultj', maxdiffresultj);

//console.log('mindiff', mindiff);
//console.log('mindiffk', mindiffk);
//console.log('mindiffresulti', mindiffresulti);
//console.log('mindiffresultj', mindiffresultj);
