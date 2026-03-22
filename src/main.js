import * as THREE from 'three';
import { auth, login, db } from './firebase.js';
import { ref, onValue } from "firebase/database";
import { initControls, updateControls } from './controls.js';

// --- グローバル変数 ---
let scene, camera, renderer, clock;
let isGameStarted = false;
const ADMIN_UID = "YOUR_ACTUAL_FIREBASE_UID"; // 自分のUIDをここに入れる

// --- 1. 初期化 ---
function init() {
    // 3Dシーンとフォグ（霧）の設定
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);
    scene.fog = new THREE.Fog(0x050505, 0, 50);

    // カメラ設定（FPS視点）
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6;

    // レンダラー設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // 時間管理用の時計
    clock = new THREE.Clock();

    // イベントリスナー
    window.addEventListener('resize', onWindowResize);
    document.getElementById('btn-login').addEventListener('click', handleLogin);
    
    // 管理者用：@キー（またはEキー）でエディタ開閉
    document.addEventListener('keydown', (e) => {
        if (e.key === '@' || e.code === 'KeyE') toggleEditor();
    });
}

// --- 2. ログイン後の処理 ---
async function handleLogin() {
    const user = await login();
    if (user) {
        // UIの切り替え
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('player-name').textContent = user.displayName;
        
        // 操作系の初期化
        initControls(camera, renderer.domElement);
        
        // FirebaseからLevel0（最初のディレクトリ）を読み込む
        loadLevel("Level0");
        
        isGameStarted = true;
        console.log("DIRECTORYに接続しました。");
    }
}

// --- 3. ディレクトリ（レベルコード）の読み込み ---
function loadLevel(levelId) {
    const levelRef = ref(db, `project_files/levels/${levelId}/content`);
    
    onValue(levelRef, async (snapshot) => {
        const code = snapshot.val();
        if (code) {
            // エディタに最新コードを反映
            const editorTextarea = document.getElementById('editor-textarea');
            if (editorTextarea) editorTextarea.value = code;

            // 既存のオブジェクト（カメラ以外）を削除して再構築
            scene.children = scene.children.filter(c => c instanceof THREE.Camera || c instanceof THREE.Light);

            try {
                // コードをJavaScriptとして実行
                const blob = new Blob([code], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const module = await import(url);
                
                if (module.init) {
                    module.init(scene, THREE);
                }
            } catch (err) {
                console.error("ディレクトリの展開に失敗:", err);
            }
        }
    });
}

// --- 4. 管理者エディタの表示切替 ---
function toggleEditor() {
    if (auth.currentUser?.uid !== ADMIN_UID) return;

    const panel = document.getElementById('admin-panel');
    const isVisible = panel.style.display === 'flex';
    panel.style.display = isVisible ? 'none' : 'flex';
    
    // エディタ表示中は操作を無効化するなどの処理をここに追加可能
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
        updateControls(delta); // controls.js の移動処理を呼び出し
        
        renderer.render(scene, camera);
        
        // HUDの座標更新
        document.getElementById('coords').textContent = 
            `LOC: X=${camera.position.x.toFixed(2)}, Z=${camera.position.z.toFixed(2)}`;
    }
}

// 起動
init();
animate();
