import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PUBLIC_INTERFACE
/**
 * Firebase configuration and core exports for ArtVista.
 * Replace the below config with project-specific keys if needed.
 */
/*
 * To enable Firebase Authentication and Firestore for user-specific art collections:
 * 1. Go to https://console.firebase.google.com/ and create a project, enable Authentication (Email/Password and Google) and Firestore.
 * 2. Replace the fields below with your Firebase project’s web config. 
 *    Do NOT leave as default! This placeholder will block login/signup.
 */
const firebaseConfig = {
  apiKey: "AIzaSyD-example-key-should-be-replaced",  // TODO: Replace with your project's config
  authDomain: "artvista-login.firebaseapp.com",
  projectId: "artvista-login",
  storageBucket: "artvista-login.appspot.com",
  messagingSenderId: "50123456789",
  appId: "1:50123456789:web:abcdef1234567"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore };
