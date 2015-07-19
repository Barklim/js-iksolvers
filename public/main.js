zip.workerScriptsPath = '/public/vendor/zip/WebContent/';

var Module = {
    onRuntimeInitialized: function() {


        var ForwardKin = function() {
            //$('#root').append('<pre>' + JSON.stringify(Module['solverInfo'], null, 2) + '</pre>');
            //$('#root').append('<pre>' + 'getNumJoints = ' +  + '</pre>');
            this.numJoints = Module.getNumJoints();
            for (var i = 0; i < this.numJoints; i++) {
                this['j' + i] = 0.0
            }

            var container;

            var camera, scene, renderer;
            var particleLight;
            var dae;

            var kinematics;

            var _loadCollada = function(url, scale) {
                scale = scale || 1.0;

                var loader = new THREE.ColladaLoader();
                loader.options.convertUpAxis = true;
                loader.load( url, function ( collada ) {

                    dae = collada.scene;

                    dae.traverse( function ( child ) {

                        if ( child instanceof THREE.Mesh ) {

                            child.geometry.computeFaceNormals();
                            child.material.shading = THREE.FlatShading;

                        }

                    } );

                    dae.scale.x = dae.scale.y = dae.scale.z = 5.0;
                    dae.updateMatrix();

                    kinematics = collada.kinematics;

                    init();
                    animate();

                } );
            };

            var sceneURL = '/' + Module.solverInfo.scene;
            var colladaExtension = sceneURL.split('.').pop();

            if (colladaExtension == 'dae' ) {
                _loadCollada(sceneURL);
            }
            else if (colladaExtension == 'zae') {
                zip.createReader(new zip.HttpReader(sceneURL), function (zipReader) {
                    zipReader.getEntries(function (entries) {

                        var hasLoadedCollada = false;

                        if (entries.length) {
                            entries.forEach(function (entry) {
                                if (!hasLoadedCollada && entry.filename.split('.').pop() == 'dae') {
                                    entry.getData(new zip.BlobWriter('text/plain'), function (data) {
                                        zipReader.close();
                                        _loadCollada(URL.createObjectURL(data));
                                        hasLoadedCollada = true;
                                    });
                                }
                            });
                        }
                    });
                }, function () {
                    console.warn('Drawable: problem loading ' + zaeUrl);
                });
            }

            function init() {

                container = document.createElement( 'div' );
                document.body.appendChild( container );

                camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
                camera.position.set( 2, 2, 3 );

                scene = new THREE.Scene();

                // Grid

                var size = 14, step = 1;

                var geometry = new THREE.Geometry();
                var material = new THREE.LineBasicMaterial( { color: 0x303030 } );

                for ( var i = - size; i <= size; i += step ) {

                    geometry.vertices.push( new THREE.Vector3( - size, - 0.04, i ) );
                    geometry.vertices.push( new THREE.Vector3(   size, - 0.04, i ) );

                    geometry.vertices.push( new THREE.Vector3( i, - 0.04, - size ) );
                    geometry.vertices.push( new THREE.Vector3( i, - 0.04,   size ) );

                }

                var line = new THREE.Line( geometry, material, THREE.LinePieces );
                scene.add( line );

                // Add the COLLADA

                scene.add( dae );

                particleLight = new THREE.Mesh( new THREE.SphereGeometry( 4, 8, 8 ), new THREE.MeshBasicMaterial( { color: 0xffffff } ) );
                scene.add( particleLight );

                // Lights

                var directionalLight = new THREE.HemisphereLight( 0xffeeee, 0x111122 );
                directionalLight.position.x = Math.random() - 0.5;
                directionalLight.position.y = Math.random() - 0.5;
                directionalLight.position.z = Math.random() - 0.5;
                directionalLight.position.normalize();
                scene.add( directionalLight );

                var pointLight = new THREE.PointLight( 0xffffff, 0.5 );
                particleLight.add( pointLight );

                renderer = new THREE.WebGLRenderer();
                renderer.setPixelRatio( window.devicePixelRatio );
                renderer.setSize( window.innerWidth, window.innerHeight );
                container.appendChild( renderer.domElement );


                //

                window.addEventListener( 'resize', onWindowResize, false );

            }

            function onWindowResize() {

                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();

                renderer.setSize( window.innerWidth, window.innerHeight );

            }

            //

            function animate() {

                requestAnimationFrame( animate );

                render();

            }

            function render() {

                var timer = Date.now() * 0.0001;

                camera.position.x = Math.cos( timer ) * 17;
                camera.position.y = 10;
                camera.position.z = Math.sin( timer ) * 17;

                camera.lookAt( scene.position );

                particleLight.position.x = Math.sin( timer * 4 ) * 3009;
                particleLight.position.y = Math.cos( timer * 5 ) * 4000;
                particleLight.position.z = Math.cos( timer * 4 ) * 3009;

                renderer.render( scene, camera );

            }

        }

        var fk = new ForwardKin();
        var gui = new dat.GUI();
        for (var i = 0; i < fk.numJoints; i++) {
            gui.add(fk, 'j' + i)
        }



    }
};
