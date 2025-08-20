import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Firebase 설정 - 환경 변수에서 로드
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDfUEfy03I3J5SMNUMhiT7TYdj6U3xRojo",
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "auto-trading-app-53d4d.firebaseapp.com",
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "auto-trading-app-53d4d",
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "auto-trading-app-53d4d.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "204528585884",
  appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:204528585884:web:e62f7336748230d5f9f159",
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "G-7ZZLEWR3G1"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firestore 데이터베이스 초기화
export const db = getFirestore(app);

// Firebase Auth 초기화
export const auth = getAuth(app);

// Firebase Analytics 초기화
export const analytics = getAnalytics(app);

export default app;
