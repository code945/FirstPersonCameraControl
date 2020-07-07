/*
 * @Author: hongxu.lin
 * @Date: 2020-07-06 15:11:50
 * @LastEditTime: 2020-07-07 15:13:31
 */

import * as THREE from "three";
export class FirstPersonCameraControl {
    constructor(camera, domElement, rayCastObjects) {
        this.camera = camera;
        this.domElement = domElement;
        this._isEnabled = false;
        // internal params for move forward/right
        this._rayCastObjects = rayCastObjects;
        this._rayOriginOffset = new THREE.Vector3(0, -1, 0);
        this._camerLocalDirection = new THREE.Vector3();
        this._tmpVector = new THREE.Vector3();
        this._rayCaster = new THREE.Raycaster();
        this._fallingTime = 0;
        // internal params for mouse move rotation
        this._euler = new THREE.Euler(0, 0, 0, "YZX");
        this._prevMouseX = 0;
        this._prevMouseY = 0;
        // public settings
        this.applyGravity = true;
        this.applyCollision = true;
        this.positionEasing = true;
        this.lookflag = 1;
        this.lookSpeed = 0.008;
        this.moveSpeed = 0.02;
        this.playerHeight = 1.4;
        this.g = 9.8;
        // event bindings
        this.bindmousedown = this.onMouseDown.bind(this);
        this.bindmouseup = this.onMouseUp.bind(this);
        this.bindmousemove = this.onMouseMove.bind(this);
        this.bindonKeyDown = this.onKeyDown.bind(this);
        this.bindonKeyUp = this.onKeyUp.bind(this);
    }

    /**
     * @param  {Object} colliders set objects for collision detection
     */
    set colliders(colliders) {
        this._rayCastObjects = colliders;
    }

    /**
     * @param {boolean} isEnabled set if this camera control is enabled
     */
    set enabled(isEnabled) {
        if (this._isEnabled != isEnabled) {
            this._isEnabled = isEnabled;
            this._euler.setFromQuaternion(this.camera.quaternion);
            if (isEnabled) this.addEvents();
            else this.removeEvents();
        }
    }

    /**
     * @description: getter if current camera control is enabled.
     */
    get enabled() {
        return this._isEnabled;
    }

    addEvents() {
        this.domElement.addEventListener(
            "mousedown",
            this.bindmousedown,
            false
        );
        this.domElement.addEventListener("mouseup", this.bindmouseup, false);
        document.body.addEventListener("keydown", this.bindonKeyDown, false);
        document.body.addEventListener("keyup", this.bindonKeyUp, false);
    }

    removeEvents() {
        this.domElement.removeEventListener("mousedown", this.bindmousedown);
        this.domElement.removeEventListener("mouseup", this.bindmouseup);
        document.body.removeEventListener("keydown", this.bindonKeyDown);
        document.body.removeEventListener("keyup", this.bindonKeyUp);
    }

    onMouseDown(event) {
        this.domElement.addEventListener(
            "mousemove",
            this.bindmousemove,
            false
        );
        this._prevMouseX = event.screenX;
        this._prevMouseY = event.screenY;
    }

    onMouseMove(event) {
        let movementX = this._prevMouseX ? event.screenX - this._prevMouseX : 0;
        let movementY = this._prevMouseY ? event.screenY - this._prevMouseY : 0;
        // euler旋转顺序 y z x
        // euler.x~y轴旋转
        // euler.y~z轴旋转
        this._euler.y -= movementX * this.lookSpeed;
        this._euler.x -= movementY * this.lookflag * this.lookSpeed;
        this.camera.quaternion.setFromEuler(this._euler);
        this._prevMouseX = event.screenX;
        this._prevMouseY = event.screenY;
    }

    onMouseUp(event) {
        this.domElement.removeEventListener("mousemove", this.bindmousemove);
    }

    onKeyDown(event) {
        switch (event.keyCode) {
            case 38: // up
                this.rotateY(-1);
                break;
            case 87: // w
                this._camerLocalDirection.z = 1;
                break;

            case 37: // left
                this.rotateX(-1);
                break;
            case 65: // a
                this._camerLocalDirection.x = -1;
                break;

            case 40: // down
                this.rotateY(1);
                break;
            case 83: // s
                this._camerLocalDirection.z = -1;
                break;

            case 39: // right
                this.rotateX(1);
                break;
            case 68: // d
                this._camerLocalDirection.x = 1;

                break;
        }
    }

    onKeyUp(event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                this._camerLocalDirection.z = 0;
                break;

            case 37: // left
            case 65: // a
                this._camerLocalDirection.x = 0;
                break;

            case 40: // down
            case 83: // s
                this._camerLocalDirection.z = 0;
                break;

            case 39: // right
            case 68: // d
                this._camerLocalDirection.x = 0;
                break;
        }
    }

    /**
     * @description: rotate camera by left/right
     * @param {Number} value
     * @return: null
     */
    rotateX(value) {
        this._euler.y -= value * this.lookSpeed;
        this.camera.quaternion.setFromEuler(this._euler);
    }

    /**
     * @description: rotate camera by up/down
     * @param  {Number} value
     * @return: null
     */
    rotateY(value) {
        this._euler.x -= value * this.lookflag * 0.5 * this.lookSpeed;
        this.camera.quaternion.setFromEuler(this._euler);
    }

    /**
     * @description: update current calcuate each frame.
     */
    update() {
        //gravity test
        this.gravityTest();
        //collision test
        this.collisionTest();
    }

    gravityTest() {
        if (this.applyGravity && this._rayCastObjects) {
            let isFalling = true;
            this._fallingTime += 0.01;
            this._tmpVector.set(0, -1, 0);
            const intersect = this.hitTest();
            if (intersect) {
                const newPosition = intersect.point.add(
                    new THREE.Vector3(0, this.playerHeight, 0)
                );
                if (this.positionEasing) {
                    if (
                        newPosition.y >= this.camera.position.y ||
                        newPosition.y - this.camera.position.y < 0.2
                    ) {
                        //上下楼梯时逐步上升 以免明显顿挫感

                        this.camera.position.y +=
                            (newPosition.y - this.camera.position.y) * 0.08;
                        this._fallingTime = 0;
                        isFalling = false;
                        return;
                    }
                } else if (intersect.distance < this.playerHeight) {
                    this.camera.position.y = newPosition.y;
                    this._fallingTime = 0;
                    isFalling = false;
                }
            }

            if (isFalling) {
                this.camera.position.y -=
                    this.g * Math.pow(this._fallingTime, 2);
            }
        }
    }

    collisionTest() {
        if (this._camerLocalDirection.x !== 0) this.collisionTestX();
        if (this._camerLocalDirection.z !== 0) this.collisionTestZ();
    }

    collisionTestX() {
        this._tmpVector.setFromMatrixColumn(this.camera.matrix, 0);
        this._tmpVector.multiplyScalar(this._camerLocalDirection.x);
        if (this.applyCollision) {
            const intersect = this.hitTest();
            if (intersect && intersect.distance < 0.3) {
                return;
            }
        }

        this.camera.position.addScaledVector(this._tmpVector, this.moveSpeed);
    }

    collisionTestZ() {
        this._tmpVector.setFromMatrixColumn(this.camera.matrix, 0);
        this._tmpVector.crossVectors(this.camera.up, this._tmpVector);
        this._tmpVector.multiplyScalar(this._camerLocalDirection.z);
        if (this.applyCollision) {
            const intersect = this.hitTest();
            if (intersect && intersect.distance < 0.3) {
                return;
            }
        }

        this.camera.position.addScaledVector(this._tmpVector, this.moveSpeed);
    }

    hitTest() {
        let result = null;
        const origin = this.camera.position.clone().add(this._rayOriginOffset);
        this._rayCaster.ray.origin = origin;
        this._rayCaster.ray.direction = this._tmpVector;
        const intersect = this._rayCaster.intersectObject(
            this._rayCastObjects,
            true
        );
        if (intersect && intersect.length > 0) {
            result = intersect[0];
        }
        return result;
    }
}
