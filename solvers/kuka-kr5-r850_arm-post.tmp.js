Module["solverInfo"] = {"robotname":"kuka-kr5-r850","manipname":"arm","scene":"robots/kuka-kr5-r850.zae","basePath":"./solvers/kuka-kr5-r850_arm"};
Module.GetNumJoints = Module.cwrap('_GetNumJoints', 'int');

var _ComputeFk = Module.cwrap('_ComputeFk', 'array', ['array']);
Module.ComputeFk = function (jointAngleArray) {
    if (Module.GetNumJoints() != jointAngleArray.length) {
        console.warn('input array should have length ' + Module.GetNumJoints() + ', truncating input'),
        jointAngleArray = jointAngleArray.slice(0, Module.GetNumJoints())
    }
    var raw = _ComputeFk(jointAngleArray);
    var splitRaw = raw.split(',').map(parseFloat)
    var trans = splitRaw.slice(0, 3);
    var rot = splitRaw.slice(3, 3 + 9);

    return {
        raw: raw,
        trans: trans,
        rot: rot,
        matrix: [
            //rot[0], rot[1], rot[2], trans[0],
            //rot[3], rot[4], rot[5], trans[1],
            //rot[6], rot[7], rot[8], trans[2],
            //rot[0], rot[1], rot[2], 0.0,
            //rot[3], rot[4], rot[5], 0.0,
            //rot[6], rot[7], rot[8], 0.0,
            1.0, 0.0, 0.0, trans[0],
            0.0, 1.0, 0.0, trans[1],
            0.0, 0.0, 1.0, trans[2],
            //1.0, 0.0, 0.0, 0.0,
            //0.0, 1.0, 0.0, 0.0,
            //0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0
        ]
    }
};

if (ENVIRONMENT_IS_NODE) {
    module.exports = Module;
}
if (ENVIRONMENT_IS_WEB) {
    window.Module = Module;
}