Module.getNumJoints = Module.cwrap('_Z12GetNumJointsv', 'int');

if (ENVIRONMENT_IS_NODE) {
    module.exports = Module;
}
if (ENVIRONMENT_IS_WEB) {
    window.Module = Module;
}