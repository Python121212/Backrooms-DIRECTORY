import * as THREE from 'three';
import { login, auth, db } from './firebase.js';
import { ref, get } from "firebase/database";
import { initControls, updateControls } from './controls.js';
import { initPlayerSync } from './player.js'; // 100人同期用

// --- 構成設定 ---
const ADMIN_UID = "X6QCzADDeRetYZE9vXEDGYDK3r43"; // あなたのUID
let scene, camera, renderer, clock;
let isGameStarted = false;
let syncPosition = null;

// --- 1. 初期化 ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.7, 5);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // ログインボタンのイベント
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }

    animate();
}

// --- 2. ログイン処理 ---
async function handleLogin() {
    const user = await login();
    if (user) {
        console.log("Logged in as:", user.displayName);
        document.getElementById('ui-overlay').style.display = 'none';
        
        // コントロール（移動）の有効化
        initControls(camera, renderer.domElement);
        
        // ★100人同期の開始
        syncPosition = initPlayerSync(scene, camera);
        
        // FirebaseからLevel 0を読み込む
        loadLevelFromDirectory("Level0");
        
        isGameStarted = true;
    }
}

// --- 3. ディレクトリ（Firebase）からレベルを読み込む ---
async function loadLevelFromDirectory(levelName) {
    const levelRef = ref(db, `project_files/levels/${levelName}/content`);
    try {
        const snapshot = await get(levelRef);
        if (snapshot.exists()) {
            const code = snapshot.val();
            // 取得したコードを実行してステージを生成
            const runLevel = new Function('scene', 'THREE', code);
            runLevel(scene, THREE);
            console.log(`${levelName} loaded successfully.`);
        } else {
            console.error("Level data not found in Firebase.");
        }
    } catch (error) {
        console.error("Error loading level:", error);
    }
}

// --- 4. ループ処理 ---
function animate() {
    requestAnimationFrame(animate);
    
    if (isGameStarted) {
        const delta = clock.getDelta();
        updateControls(delta);
        
        // ★自分の位置をFirebaseへ送信
        if (syncPosition) syncPosition();
        
        renderer.render(scene, camera);
        
        // 管理者ならHUDを表示（オプション）
        if (auth.currentUser?.uid === ADMIN_UID) {
            updateAdminHUD();
        }
    }
}

function updateAdminHUD() {
    // 座標などを表示する処理（必要なら追加）
}

// 起動
init();

// 画面リサイズ対応
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
