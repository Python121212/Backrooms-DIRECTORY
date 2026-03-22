import { db, auth } from './firebase.js';
import { ref, set } from "firebase/database";

const ADMIN_UID = "YOUR_ACTUAL_FIREBASE_UID"; // あなたのUID

export function initEditor() {
    const saveBtn = document.getElementById('btn-save-code');
    const textArea = document.getElementById('editor-textarea');

    if (!saveBtn || !textArea) return;

    // 保存ボタンを押した時の処理
    saveBtn.addEventListener('click', async () => {
        // 管理者チェック
        if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) {
            alert("管理者権限がありません。ディレクトリへの書き込みは拒否されました。");
            return;
        }

        const code = textArea.value;
        const levelId = "Level0"; // 現在編集中のレベル名

        try {
            // Firebaseのディレクトリ構造に直接書き込み
            await set(ref(db, `project_files/levels/${levelId}/content`), code);
            alert("DIRECTORYを更新しました。同期されたプレイヤー全員に反映されます。");
        } catch (error) {
            console.error("保存失敗:", error);
            alert("保存に失敗しました。");
        }
    });
}
