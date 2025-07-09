import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyAr2fQRkxcOOJwf8GlkdRoxy_gllbIsvWo",
    authDomain: "hex-chat-6c5b5.firebaseapp.com",
    projectId: "hex-chat-6c5b5",
    storageBucket: "hex-chat-6c5b5.firebasestorage.app",
    messagingSenderId: "190364803633",
    appId: "1:190364803633:web:6b563ecd16ca1dbcb7ab10",
    measurementId: "G-FXV030LMQF"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
