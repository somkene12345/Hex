import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

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
  const auth = getAuth(app);
  const db = getDatabase(app);
  
  export { auth, db };
