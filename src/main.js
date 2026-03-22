import * as THREE from 'three';
import { auth, login, db } from './firebase.js';
import { ref, onValue } from "firebase/database";
// ※ controls.js は後ほど作成し、ここでインポートします
// import { initControls, updateControls } from './controls.js';

let scene, camera, renderer;
let isGameStarted = false;

// 1. 初期化関数
function init() {
    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505); // 暗闇
    scene.fog = new THREE.Fog(0x050505, 0, 50);

    // カメラの設定
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.y = 1.6; // 人の目の高さ

    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('game-container').appendChild(renderer.domElement);

    // ウィンドウリサイズ対応
    window.addEventListener('resize', onWindowResize);

    // ログインボタンのイベント
    document.getElementById('btn-login').addEventListener('click', handleLogin);
}

// 2. ログイン処理
async function handleLogin() {
    const user = await login();
    if (user) {
        document.getElementById('login-overlay').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        document.getElementById('player-name').textContent = user.displayName;
        
        isGameStarted = true;
        
        // FirebaseからLevel0のコードを取得して世界を生成
        loadLevel("Level0");
        
        // ※ ここでコントロール（移動）を有効化する予定
        // initControls(camera, renderer.domElement);
    }
}

// 3. ディレクトリ（Levelコード）の動的ロード
function loadLevel(levelId) {
    const levelRef = ref(db, `project_files/levels/${levelId}/content`);
    
    onValue(levelRef, async (snapshot) => {
        const code = snapshot.val();
        if (code) {
            console.log(`${levelId} をディレクトリから読み込み中...`);
            
            // 既存のオブジェクトを削除（リロード用）
            scene.children = scene.children.filter(child => child.type === 'PerspectiveCamera');

            try {
                // 文字列としてのJavaScriptを実行可能なモジュールに変換
                const blob = new Blob([code], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const module = await import(url);
                
                // Level0.js 内の init 関数を呼び出す
                if (module.init) {
                    module.init(scene, THREE);
                }
            } catch (err) {
                console.error("レベルの実行に失敗しました:", err);
            }
        }
    });
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// 4. ループ処理
function animate() {
    requestAnimationFrame(animate);
    
    if (isGameStarted) {
        // ※ ここで移動の更新を行う予定
        // updateControls();
        renderer.render(scene, camera);
        
        // 座標をHUDに表示
        document.getElementById('coords').textContent = 
            `LOC: X=${camera.position.x.toFixed(2)}, Z=${camera.position.z.toFixed(2)}`;
    }
}

init();
animate();
