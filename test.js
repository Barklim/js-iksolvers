var solvers = require('./index');

var solverName = 'asdsasa';
var maxdiff = 0.0;
var maxdiffk;
var maxdiffresulti;
var maxdiffresultj;

var mindiff = 1000.0;
var mindiffk;
var mindiffresulti;
var mindiffresultj;

solvers.solverIds.forEach(function(solverId) {
    console.log('solverId', solverId);
    var solver = solvers.getSolver(solverId);

    var numJoints = solver.getNumJoints();

    var tries = 3000;

    var makeArray = function(len) {
        var r = [];
        for (var i = 0; i < len; i++) {
            //r.push(0.0);
            r.push(0.0);
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


    for (var i = 2; i < results.length - 1; i++) {
        var resulti = results[i];
        for (var j = i + 1; j < results.length; j++) {
            var resultj = results[j];

            if (resulti.result.length !== resultj.result.length) {
                throw new Error('Shitfuck your things are the wrong sizes');
            }

            for (var k = 0; k < 3; k++) {
                var bigger = resulti.result[k] > resultj.result[k] ? resulti.result[k] : resultj.result[k];
                var smaller = resulti.result[k] < resultj.result[k] ? resulti.result[k] : resultj.result[k];

                if (bigger == smaller) {
                    return;
                }

                var diff = Math.abs(bigger) - Math.abs(smaller);

                if (diff > maxdiff) {
                    solverName = solverId;
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

});
console.log('solverName', solverName);
console.log('maxdiff', maxdiff);
console.log('maxdiffk', maxdiffk);
//console.log('maxdiffresulti', maxdiffresulti);
//console.log('maxdiffresultj', maxdiffresultj);

//console.log('mindiff', mindiff);
//console.log('mindiffk', mindiffk);
//console.log('mindiffresulti', mindiffresulti);
//console.log('mindiffresultj', mindiffresultj);
//
//var trans = [10, 20, 30]
//var rot = [1, 2, 3, 4, 5, 6, 7, 8, 9]
//var both = trans.concat(rot)
//for(var i = 0; i < 3 + 9 - 2; ++i) {
//    console.log(both[i])
//}
//console.log(both[3 + 9 - 1])
