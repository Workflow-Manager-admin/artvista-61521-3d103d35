import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// PUBLIC_INTERFACE
/**
 * Firebase configuration and core exports for ArtVista.
 * Replace the below config with project-specific keys if needed.
 */
const firebaseConfig = {
  apiKey: "AIzaSyD-example-key-should-be-replaced",
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
