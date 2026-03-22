import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

let controls;
let moveForward = false, moveBackward = false, moveLeft = false, moveRight = false;
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();

// モバイル用変数
let touchStartX = 0, touchStartY = 0;
let isTouching = false;

export function initControls(camera, domElement) {
    controls = new PointerLockControls(camera, domElement);

    // PC: クリックで画面固定
    domElement.addEventListener('click', () => {
        if (!isTouching) controls.lock();
    });

    // キーボード操作
    const onKeyDown = (event) => {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': moveRight = true; break;
        }
    };
    const onKeyUp = (event) => {
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': moveRight = false; break;
        }
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // モバイル: タッチ操作
    domElement.addEventListener('touchstart', (e) => {
        isTouching = true;
        touchStartX = e.touches[0].pageX;
        touchStartY = e.touches[0].pageY;
    }, { passive: false });

    domElement.addEventListener('touchmove', (e) => {
        const touchX = e.touches[0].pageX;
        const touchY = e.touches[0].pageY;
        
        // 画面左側なら移動、右側なら視点
        if (touchStartX < window.innerWidth / 2) {
            moveForward = touchY < touchStartY - 10;
            moveBackward = touchY > touchStartY + 10;
            moveLeft = touchX < touchStartX - 10;
            moveRight = touchX > touchStartX + 10;
        } else {
            // 視点移動（簡易版）
            const deltaX = touchX - touchStartX;
            const deltaY = touchY - touchStartY;
            camera.rotation.y -= deltaX * 0.005;
            camera.rotation.x -= deltaY * 0.005;
        }
        touchStartX = touchX;
        touchStartY = touchY;
        e.preventDefault();
    }, { passive: false });

    domElement.addEventListener('touchend', () => {
        moveForward = moveBackward = moveLeft = moveRight = false;
        isTouching = false;
    });

    return controls;
}

export function updateControls(delta) {
    if (!controls) return;

    // 摩擦（速度の減衰）
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    direction.z = Number(moveForward) - Number(moveBackward);
    direction.x = Number(moveRight) - Number(moveLeft);
    direction.normalize();

    if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
    if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
}
