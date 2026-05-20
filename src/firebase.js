// firebase.js — Initialize Firebase app, Auth, and Firestore
// Replace the firebaseConfig values with your own from the Firebase Console:
// Project Settings → General → Your apps → SDK setup and configuration

import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdr7JWbTUiRuwhVpEvP5gYN0R_qUhf3Uc",
  authDomain: "fir-react-auth-15b1f.firebaseapp.com",
  projectId: "fir-react-auth-15b1f",
  storageBucket: "fir-react-auth-15b1f.firebasestorage.app",
  messagingSenderId: "1043004124524",
  appId: "1:1043004124524:web:2cff2cfbe6359155ded749",
  measurementId: "G-GMB68BCLNG"
};

const app = initializeApp(firebaseConfig);

export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

