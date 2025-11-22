import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAezDFtc6lU3INI90R74UqssAP-jHUzwac",
  authDomain: "just-3-seconds.firebaseapp.com",
  projectId: "just-3-seconds",
  storageBucket: "just-3-seconds.firebasestorage.app",
  messagingSenderId: "814827890480",
  appId: "1:814827890480:web:0d9fdbf8be0163716e0af5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
