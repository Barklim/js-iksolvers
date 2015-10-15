Module.GetNumJoints = Module.cwrap('_GetNumJoints', 'int');

var _ComputeFk = Module.cwrap('_ComputeFk', 'string', ['number', 'number']);
Module.ComputeFk = function (jointAngleArray) {
    if (Module.GetNumJoints() != jointAngleArray.length) {
        console.warn('input array should have length ' + Module.GetNumJoints() + ', truncating input'),
            jointAngleArray = jointAngleArray.slice(0, Module.GetNumJoints())
    }


// Create example data to test float_multiply_array
    var data = new Float32Array(jointAngleArray);
    console.log('js',data)

// Get data byte size, allocate memory on Emscripten heap, and get pointer
    var nDataBytes = data.length * data.BYTES_PER_ELEMENT;
    var dataPtr = Module._malloc(nDataBytes);

// Copy data to Emscripten heap (directly accessed from Module.HEAPU8)
    var dataHeap = new Uint8Array(Module.HEAPU8.buffer, dataPtr, nDataBytes);
    dataHeap.set(new Uint8Array(data.buffer));

// Call function and get result
    var raw = eval(_ComputeFk(dataHeap.byteOffset, data.length));

    //var result = new Float32Array(dataHeap.buffer, dataHeap.byteOffset, data.length);

// Free memory
    Module._free(dataHeap.byteOffset);


    //console.log('js', jointAngleArray)
    //var raw = eval(_ComputeFk(jointAngleArray));
    //var splitRaw = raw.split(',').map(parseFloat)
    //var trans = splitRaw.slice(0, 3);
    //var rot = splitRaw.slice(3, 3 + 9);

    return {
        raw: raw,
        //trans: trans,
        //rot: rot,
        //matrix: [
        //    //rot[0], rot[1], rot[2], trans[0],
        //    //rot[3], rot[4], rot[5], trans[1],
        //    //rot[6], rot[7], rot[8], trans[2],
        //    //rot[0], rot[1], rot[2], 0.0,
        //    //rot[3], rot[4], rot[5], 0.0,
        //    //rot[6], rot[7], rot[8], 0.0,
        //    1.0, 0.0, 0.0, trans[0],
        //    0.0, 1.0, 0.0, trans[1],
        //    0.0, 0.0, 1.0, trans[2],
        //    //1.0, 0.0, 0.0, 0.0,
        //    //0.0, 1.0, 0.0, 0.0,
        //    //0.0, 0.0, 1.0, 0.0,
        //    0.0, 0.0, 0.0, 1.0
        //]
    }
};

if (ENVIRONMENT_IS_NODE) {
    module.exports = Module;
}
if (ENVIRONMENT_IS_WEB) {
    window.Module = Module;
}