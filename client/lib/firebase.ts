import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

export interface User {
  id: string;
  email: string;
}

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Check if critical keys are present
export const isLocalMode = !firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId;

let app: any = null;
let auth: any = null;
let db: any = null;
let storage: any = null;

if (!isLocalMode) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    // Fallback to local mode if init fails
    // isLocalMode = true; // Cannot reassign const, but services will be null
  }
} else {
  console.warn("Running in LOCAL MODE (No Firebase keys found). Cloud features disabled.");
}

export { auth, db, storage };
