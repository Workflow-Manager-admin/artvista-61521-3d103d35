//
// Basic Firebase v9+ module setup for ArtVista frontend
//
// Provides access to Firebase App and Firestore DB for artworks, battles, and votes
//

// PUBLIC_INTERFACE
/**
 * firebase.js
 * Exposes Firebase App and Firestore DB instances.
 * For development: uses placeholder config if credentials are not set.
 * Firebase usage: import { db } from "./firebase";
 */

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// 
// --- FILL IN YOUR FIREBASE CONFIG HERE (add real values in prod)
//
const firebaseConfig = {
  apiKey: "FAKE_KEY_please_supply_YOURS",
  authDomain: "artvista-PLACEHOLDER.firebaseapp.com",
  projectId: "artvista-PLACEHOLDER",
  storageBucket: "artvista-PLACEHOLDER.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:placeholder"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { app, db };
