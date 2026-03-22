import * as THREE from 'three';
import { auth, login, db } from './firebase.js';
import { ref, onValue } from "firebase/database";
import { initControls, updateControls } from './controls.js';
import { initEditor } from './editor.js';

// --- グローバル変数 ---
let scene, camera, renderer, clock;
let isGameStarted = false;

// あなたのUID（後で書き換えてください）
const ADMIN_UID = "YOUR_ACTUAL_FIREBASE_UID"; 

// --- 1. 初期化 ---
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 0, 50);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // 重い場合は2までに制限
    document.getElementById('game-container').appendChild(renderer.domElement);

    clock = new THREE.Clock();

    // イベント
    window.addEventListener('resize', onWindowResize);
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    
    // PC/モバイル共通：エディタ表示用の隠しコマンド（画面端を3回タップ等に変更も可能）
    document.addEventListener('keydown', (e) => {
        if (e.key === '@' || e.code === 'KeyE') toggleEditor();
    });
}

// --- 2. ログイン処理 ---
async function handleLogin() {
    const user = await login();
    if (user) {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('player-name').textContent = user.displayName;
        
        // 各種システムの起動
        initControls(camera, renderer.domElement);
        initEditor(); // エディタ機能を有効化
        
        loadLevelFromDirectory("Level0");
        
        isGameStarted = true;
        console.log("DIRECTORYへの接続が承認されました。");
    }
}

// --- 3. Firebaseからレベルを読み込む ---
function loadLevelFromDirectory(levelId) {
    const levelRef = ref(db, `project_files/levels/${levelId}/content`);
    
    onValue(levelRef, async (snapshot) => {
        const code = snapshot.val();
        if (code) {
            // エディタのテキストエリアを更新
            const editorTextarea = document.getElementById('editor-textarea');
            if (editorTextarea) editorTextarea.value = code;

            // カメラとライト以外の古い世界を消去
            scene.children = scene.children.filter(c => 
                c instanceof THREE.Camera || c instanceof THREE.Light
            );

            try {
                // 文字列コードをブラウザで実行可能な形式に変換
                const blob = new Blob([code], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const module = await import(url);
                
                if (module.init) {
                    module.init(scene, THREE);
                }
            } catch (err) {
                console.error("DIRECTORYコードの展開エラー:", err);
            }
        }
    });
}

// --- 4. 管理者用パネルの表示 ---
function toggleEditor() {
    if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) return;

    const panel = document.getElementById('admin-panel');
    const isVisible = panel.style.display === 'flex';
    panel.style.display = isVisible ? 'none' : 'flex';
}

// --- 5. ループとリサイズ ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (isGameStarted) {
        const delta = clock.getDelta();
        
        // 移動処理 (controls.js)
        updateControls(delta);
        
        renderer.render(scene, camera);
        
        // 座標HUD更新
        document.getElementById('coords').textContent = 
            `LOC: X=${camera.position.x.toFixed(1)}, Z=${camera.position.z.toFixed(1)}`;
    }
}

init();
animate();
