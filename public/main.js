var Module = {
    onRuntimeInitialized: function() {
        $('#root').append('<pre>' + JSON.stringify(Module['solverInfo'], null, 2) + '</pre>');
        $('#root').append('<pre>' + 'getNumJoints = ' + Module.getNumJoints() + '</pre>');
    }
};
