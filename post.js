Module.getNumJoints = Module.cwrap('_GetNumJoints', 'int');

var _ComputeFk = Module.cwrap('_ComputeFk', 'string', ['array']);
Module.computeFK = function (jointAngleArray) {
    if (Module.getNumJoints() != jointAngleArray.length) {
        console.warn('input array should have length ' + Module.getNumJoints() + ', truncating input'),
        jointAngleArray = jointAngleArray.slice(0, jointAngleArray.length)
    }
    var raw = _ComputeFk(jointAngleArray).split(',').map(parseFloat);
    var trans = raw.slice(0, 3);
    var rot = raw.slice(3, 3 + 9);

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