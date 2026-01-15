import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage"; // <--- ADD THIS

const firebaseConfig = {
  apiKey: "AIzaSyDbrHDxmGtbNSWb0AEHFJngRQqUG0iODOo",
  authDomain: "janseva-app-bb31b.firebaseapp.com",
  projectId: "janseva-app-bb31b",
  storageBucket: "janseva-app-bb31b.firebasestorage.app",
  messagingSenderId: "1054263491837",
  appId: "1:1054263491837:web:f1065f28c0dc861e5ed294",
  measurementId: "G-SH7N111FLM"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app); // <--- EXPORT THIS

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      console.error("Login Error:", error);
      throw error;
    });
};