import * as THREE from "three";
import { OrbitControls } from "./lib/controls/OrbitControls";
import "./index.less";

import { GLTFLoader } from "./lib/loaders/GLTFLoader.js";
import { RGBELoader } from "./lib//loaders/RGBELoader.js";

import { FirstPersonCameraControl } from "./firstPersonCameraControl";

const scene = new THREE.Scene();
let building = null;
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: document.getElementById("renderCanvas"),
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

new RGBELoader()
    .setDataType(THREE.UnsignedByteType)
    .setPath("assets/textures/")
    .load("autumn_park_1k.hdr", function (texture) {
        var pmremGenerator = new THREE.PMREMGenerator(renderer);
        pmremGenerator.compileEquirectangularShader();

        var envMap = pmremGenerator.fromEquirectangular(texture).texture;

        //scene.background = envMap;
        scene.environment = envMap;

        texture.dispose();
        pmremGenerator.dispose();

        // model
        var loader = new GLTFLoader().setPath("assets/models/");
        loader.load("scene.gltf", function (gltf) {
            scene.add(gltf.scene);
            firstperson.colliders = gltf.scene;
        });
    });

const camera = new THREE.PerspectiveCamera(
    65,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.set(15, 3, 0);
camera.lookAt(new THREE.Vector3(0, 0, 0));
// controls
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enabled = false;

const firstperson = new FirstPersonCameraControl(camera, renderer.domElement);
firstperson.enabled = true;

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

const animate = function () {
    requestAnimationFrame(animate);
    //controls.update();
    firstperson.update();
    renderer.render(scene, camera);
};

animate();
