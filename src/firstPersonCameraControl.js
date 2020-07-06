import * as THREE from "three";
export class FirstPersonCameraControl {
    constructor(camera, domElement, rayCastObjects) {
        this.camera = camera;
        this.domElement = domElement;
        this._rayCastObjects = rayCastObjects;

        this._isEnabled = false;
        this.applyGravity = true;
        this.applyCollision = true;
        this.lookSpeed = 0.01;
        this.moveSpeed = 0.02;
        this.playerHeight = 1.4;
        this._rayOriginOffset = new THREE.Vector3(
            0,
            0.4 - this.playerHeight,
            0
        );
        this.baseGroundHeight = 0;
        this.initFallingVelocity = 0;
        this.g = 9.8;

        this.lookflag = 1;

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;

        this.moveDirection = new THREE.Vector3();
        this.euler = new THREE.Euler(0, 0, 0, "YZX");
        this.tmpVector = new THREE.Vector3();
        this.rayCaster = new THREE.Raycaster();
        this.fallingTime = 0;
        this.prevX = 0;
        this.prevY = 0;

        this.bindmousedown = this.mousedown.bind(this);
        this.bindmouseup = this.mouseup.bind(this);
        this.bindmousemove = this.mousemove.bind(this);
        this.bindonKeyDown = this.onKeyDown.bind(this);
        this.bindonKeyUp = this.onKeyUp.bind(this);
    }

    set colliders(colliders) {
        this._rayCastObjects = colliders;
    }

    set enabled(isEnabled) {
        this._isEnabled = isEnabled;
        if (isEnabled) {
            this.addEvents();
            this.euler.setFromQuaternion(this.camera.quaternion);
        } else {
            this.removeEvents();
        }
    }

    get enabled() {
        return this._isEnabled;
    }

    onMoveForward(distance) {
        this.tmpVector.setFromMatrixColumn(this.camera.matrix, 0);
        this.tmpVector.crossVectors(this.camera.up, this.tmpVector);
        this.camera.position.addScaledVector(this.tmpVector, distance);
    }

    onMoveRight(distance) {
        this.tmpVector.setFromMatrixColumn(this.camera.matrix, 0);
        this.camera.position.addScaledVector(this.tmpVector, distance);
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

    mousedown(event) {
        this.domElement.addEventListener(
            "mousemove",
            this.bindmousemove,
            false
        );
        this.prevX = event.screenX;
        this.prevY = event.screenY;
    }

    mousemove(event) {
        var movementX = this.prevX ? event.screenX - this.prevX : 0;
        var movementY = this.prevY ? event.screenY - this.prevY : 0;
        // euler旋转顺序 y z x
        // euler.x~y轴旋转
        // euler.y~z轴旋转
        this.euler.y -= movementX * this.lookSpeed;
        this.euler.x -= movementY * this.lookflag * 0.5 * this.lookSpeed;
        this.camera.quaternion.setFromEuler(this.euler);
        this.prevX = event.screenX;
        this.prevY = event.screenY;
    }

    mouseup(event) {
        this.domElement.removeEventListener("mousemove", this.bindmousemove);
    }

    rotateX(value) {
        this.euler.z -= value * this.lookSpeed;
        this.camera.quaternion.setFromEuler(this.euler);
    }

    rotateY(value) {
        this.euler.x -= value * this.lookflag * 0.5 * this.lookSpeed;
        this.camera.quaternion.setFromEuler(this.euler);
    }

    onKeyDown(event) {
        switch (event.keyCode) {
            case 38: // up
                this.rotateY(-1);
                break;
            case 87: // w
                this.moveForward = true;
                break;

            case 37: // left
                this.rotateX(-1);
                break;
            case 65: // a
                this.moveLeft = true;
                break;

            case 40: // down
                this.rotateY(1);
                break;
            case 83: // s
                this.moveBackward = true;
                break;

            case 39: // right
                this.rotateX(1);
                break;
            case 68: // d
                this.moveRight = true;
                break;
        }
    }

    onKeyUp(event) {
        switch (event.keyCode) {
            case 38: // up
            case 87: // w
                this.moveForward = false;
                break;

            case 37: // left
            case 65: // a
                this.moveLeft = false;
                break;

            case 40: // down
            case 83: // s
                this.moveBackward = false;
                break;

            case 39: // right
            case 68: // d
                this.moveRight = false;
                break;
        }
    }

    update(delta) {
        this.moveDirection.z =
            Number(this.moveForward) - Number(this.moveBackward);
        this.moveDirection.x = Number(this.moveRight) - Number(this.moveLeft);
        this.moveDirection.normalize();
        //重力测试
        this.gravityTest();
        //碰撞测试
        this.collisionTest();
    }

    gravityTest() {
        if (this.applyGravity && this._rayCastObjects) {
            let isFalling = true;
            this.fallingTime += 0.01;
            this.tmpVector.set(0, -1, 0);
            const intersect = this.hitTest();
            if (intersect) {
                const newPosition = intersect.point.add(
                    new THREE.Vector3(0, this.playerHeight, 0)
                );
                if (
                    newPosition.y >= this.camera.position.y ||
                    newPosition.y - this.camera.position.y < 0.2
                ) {
                    //上下楼梯时逐步上升 以免明显顿挫感

                    this.camera.position.y +=
                        (newPosition.y - this.camera.position.y) * 0.08;
                    this.fallingTime = 0;
                    isFalling = false;
                    return;
                }
            }

            if (isFalling) {
                //重力下落
                if (this.g == 0)
                    this.camera.position.y -= this.initFallingVelocity * 200;
                else
                    this.camera.position.y -=
                        this.initFallingVelocity * this.fallingTime +
                        this.g * Math.pow(this.fallingTime, 2);
            }
        }
    }

    collisionTest() {
        if (this.applyCollision) {
            if (this.moveDirection.x !== 0) this.collisionTestX();
            if (this.moveDirection.z !== 0) this.collisionTestZ();
        }
    }

    collisionTestX() {
        this.tmpVector.setFromMatrixColumn(this.camera.matrix, 0);
        this.tmpVector.multiplyScalar(this.moveDirection.x);
        const intersect = this.hitTest();
        if (intersect && intersect.distance < 0.3) {
            return;
        }

        this.onMoveRight(this.moveDirection.x * this.moveSpeed);
    }

    collisionTestZ() {
        this.tmpVector.setFromMatrixColumn(this.camera.matrix, 0);
        this.tmpVector.crossVectors(this.camera.up, this.tmpVector);
        this.tmpVector.multiplyScalar(this.moveDirection.z);
        const intersect = this.hitTest();
        if (intersect && intersect.distance < 0.3) {
            return;
        }
        this.onMoveForward(this.moveDirection.z * this.moveSpeed);
    }

    hitTest() {
        let result = null;
        const origin = this.camera.position.clone().add(this._rayOriginOffset);
        this.rayCaster.ray.origin = origin;
        this.rayCaster.ray.direction = this.tmpVector;
        const intersect = this.rayCaster.intersectObject(
            this._rayCastObjects,
            true
        );
        if (intersect && intersect.length > 0) {
            result = intersect[0];
        }
        return result;
    }
}
