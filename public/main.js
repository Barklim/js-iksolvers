zip.workerScriptsPath = '/public/vendor/zip/WebContent/';

var Module = {
    onRuntimeInitialized: function () {
        var _realStart = function () {
            var gui = new dat.GUI();

            var Solver = function () {

                var self = this;

                var container;

                var camera, scene, renderer;
                var particleLight;
                var controls;
                var dae;
                var axes;

                this.kinematics = null;

                var _loadCollada = function (url, scale) {
                    scale = scale || 5.0;

                    var loader = new THREE.ColladaLoader();
                    loader.options.convertUpAxis = true;
                    loader.load(url, function (collada) {

                        dae = collada.scene;

                        dae.traverse(function (child) {

                            if (child instanceof THREE.Mesh) {

                                child.geometry.computeFaceNormals();
                                child.material.shading = THREE.FlatShading;

                            }

                        });

                        dae.scale.x = dae.scale.y = dae.scale.z = scale;
                        dae.updateMatrix();

                        kinematics = collada.kinematics;
                        var jointPositions = kinematics.joints.map(function (_, index) {
                            return kinematics.getJointValue(index)
                        });
                        kinematics.joints.forEach(function (joint, i) {
                            var jointKey = joint.sid;
                            self[jointKey] = joint.zeroPosition;
                            self[jointKey + 'Controller'] = gui.add(self, jointKey, joint.limits.min, joint.limits.max).listen();
                            self[jointKey + 'Controller'].onChange(function (value) {
                                jointPositions[i] = value;
                                kinematics.setJointValue(i, value);
                                var fk = Module.ComputeFk(jointPositions)
                                //console.log(fk.raw)
                                //axes.matrix.set.apply(axes.matrix, fk.matrix);
                                //axes.matrix.decompose(axes.position, axes.quaternion, axes.scale);
                            });
                        });

                        init();
                        animate();

                        var currJointIndex = 0;
                        var sweeper = setInterval(function () {
                            var joint = kinematics.joints[currJointIndex];
                            var jointKey = joint.sid;

                            //var bigger = joint.limits.max >= joint.limits.min ? joint.limits.max : joint.limits.min
                            //var smaller = joint.limits.max <= joint.limits.min ? joint.limits.max : joint.limits.min
                            //var step = (bigger - smaller) / 500.0
                            var step = 1.0;
                            if (self[jointKey] + step > joint.limits.max) {
                                self[jointKey] = joint.zeroPosition
                                self[jointKey + 'Controller'].setValue(self[jointKey])
                                if (currJointIndex == kinematics.joints.length - 1) {
                                    clearInterval(sweeper)
                                    console.log('done')
                                    //currJointIndex = 0
                                } else {
                                    currJointIndex++;
                                }
                                joint = kinematics.joints[currJointIndex]
                                jointKey = joint.sid
                                self[jointKey] = joint.limits.min;
                            } else {
                                self[jointKey] += step;
                                self[jointKey + 'Controller'].setValue(self[jointKey])
                            }
                        }, 20)

                    });
                };

                var sceneURL = '/' + Module.solverInfo.scene;
                var colladaExtension = sceneURL.split('.').pop();

                if (colladaExtension == 'dae') {
                    _loadCollada(sceneURL);
                } else if (colladaExtension == 'zae') {
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
                        console.warn('Problem loading ' + zaeUrl);
                    });
                }

                function init() {

                    container = document.createElement('div');
                    document.body.appendChild(container);

                    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
                    camera.position.set(17, 10, 17);

                    scene = new THREE.Scene();

                    // Grid

                    var size = 14, step = 1;

                    var geometry = new THREE.Geometry();
                    var material = new THREE.LineBasicMaterial({color: 0x303030});

                    for (var i = -size; i <= size; i += step) {

                        geometry.vertices.push(new THREE.Vector3(-size, -0.04, i));
                        geometry.vertices.push(new THREE.Vector3(size, -0.04, i));

                        geometry.vertices.push(new THREE.Vector3(i, -0.04, -size));
                        geometry.vertices.push(new THREE.Vector3(i, -0.04, size));

                    }

                    var line = new THREE.Line(geometry, material, THREE.LinePieces);
                    scene.add(line);

                    // Add the COLLADA

                    scene.add(dae);

                    particleLight = new THREE.Mesh(new THREE.SphereGeometry(4, 8, 8), new THREE.MeshBasicMaterial({color: 0xffffff}));
                    scene.add(particleLight);

                    axes = new THREE.AxisHelper(5);
                    scene.add(axes)

                    // Lights

                    var directionalLight = new THREE.HemisphereLight(0xffeeee, 0x111122);
                    directionalLight.position.x = Math.random() - 0.5;
                    directionalLight.position.y = Math.random() - 0.5;
                    directionalLight.position.z = Math.random() - 0.5;
                    directionalLight.position.normalize();
                    scene.add(directionalLight);

                    var pointLight = new THREE.PointLight(0xffffff, 0.5);
                    particleLight.add(pointLight);

                    renderer = new THREE.WebGLRenderer();
                    renderer.setPixelRatio(window.devicePixelRatio);
                    renderer.setSize(window.innerWidth, window.innerHeight);
                    container.appendChild(renderer.domElement);

                    camera.lookAt(scene.position);
                    controls = new THREE.TrackballControls(camera, renderer.domElement);

                    controls.rotateSpeed = 1.0;
                    controls.zoomSpeed = 1.2;
                    controls.panSpeed = 0.8;

                    controls.noZoom = false;
                    controls.noPan = false;

                    controls.staticMoving = true;
                    controls.dynamicDampingFactor = 0.3;

                    //controls.keys = [ 65, 83, 68 ];

                    controls.addEventListener('change', render);


                    window.addEventListener('resize', onWindowResize, false);

                }

                function onWindowResize() {

                    camera.aspect = window.innerWidth / window.innerHeight;
                    camera.updateProjectionMatrix();

                    renderer.setSize(window.innerWidth, window.innerHeight);
                    controls.handleResize();

                }

                //

                function animate() {

                    requestAnimationFrame(animate);
                    controls.update();
                    render();

                }

                function render() {

                    var timer = Date.now() * 0.0001;

                    //camera.position.x = Math.cos(timer) * 17;
                    //camera.position.y = 10;
                    //camera.position.z = Math.sin(timer) * 17;

                    //camera.lookAt(scene.position);

                    particleLight.position.x = Math.sin(timer * 4) * 3009;
                    particleLight.position.y = Math.cos(timer * 5) * 4000;
                    particleLight.position.z = Math.cos(timer * 4) * 3009;

                    renderer.render(scene, camera);

                }

            };

            var s = new Solver();
        }

        var fuck = setInterval(function () {
            if (window.Module) {
                console.log('here it is')
                clearInterval(fuck)
                _realStart()
            } else {
                console.log('where is my solver')
            }
        }, 500)
    }
};
