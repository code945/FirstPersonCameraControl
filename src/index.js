/*
 * @Author: hongxu.lin
 * @Date: 2020-07-06 14:30:24
 * @LastEditTime: 2020-07-07 15:15:17
 */

import * as THREE from "three";
import { OrbitControls } from "./lib/controls/OrbitControls";
import "./index.less";
import { GUI } from "./lib/dat.gui.module.js";
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
    0.01,
    100
);
camera.position.set(10, 3, 1.5);
camera.lookAt(new THREE.Vector3(0, 0, 0));
// controls
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enabled = true;

const firstperson = new FirstPersonCameraControl(camera, renderer.domElement);
firstperson.enabled = false;

let settings = {
    firstPerson: false,
    gravity: false,
    collision: false,
    positionEasing: false,
};

var gui = new GUI();
gui.domElement.parentElement.style.zIndex = 1000;
gui.add(settings, "firstPerson", false).onChange(onSettingsChange);
gui.add(settings, "gravity", false).onChange(onSettingsChange);
gui.add(settings, "collision", false).onChange(onSettingsChange);
gui.add(settings, "positionEasing", true).onChange(onSettingsChange);
function onSettingsChange(newValue) {
    if (settings.firstPerson) {
        firstperson.enabled = true;
        firstperson.applyGravity = settings.gravity;
        firstperson.applyCollision = settings.collision;
        firstperson.positionEasing = settings.positionEasing;
        orbit.enabled = false;
    } else {
        firstperson.enabled = false;
        var ray = new THREE.Ray();
        ray.origin.setFromMatrixPosition(camera.matrixWorld);
        ray.direction
            .set(0, 0, 1)
            .unproject(camera)
            .sub(ray.origin)
            .normalize();
        orbit.target = ray.at(2);
        orbit.enabled = true;
    }
}

window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
}

const animate = function () {
    requestAnimationFrame(animate);
    if (orbit.enabled) orbit.update();
    if (firstperson.enabled) firstperson.update();
    renderer.render(scene, camera);
};

animate();
