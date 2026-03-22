import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getDatabase } from "firebase/database";

// あなたが取得した Firebase 構成
const firebaseConfig = {
  apiKey: "AIzaSyAbBrQhttcoLYLQT6yYPIedlE7Fo9AJo2c",
  authDomain: "backrooms-directory.firebaseapp.com",
  projectId: "backrooms-directory",
  storageBucket: "backrooms-directory.firebasestorage.app",
  messagingSenderId: "994209059368",
  appId: "1:994209059368:web:8d6cbbb66ec9c27b821b1d",
  measurementId: "G-NRFQXKS2T6"
};

// Firebaseの初期化
const app = initializeApp(firebaseConfig);

// ゲーム全体で使い回す各機能のインスタンス
export const auth = getAuth(app);
export const db = getDatabase(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Googleログインを実行する関数
 * 成功するとユーザー情報を返し、失敗するとnullを返します。
 */
export const login = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    console.log("ログイン成功:", result.user.displayName);
    return result.user;
  } catch (error) {
    console.error("ログインエラー:", error.message);
    return null;
  }
};
