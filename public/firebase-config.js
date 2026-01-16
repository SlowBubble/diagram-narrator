import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAAG4cgpGXTDFdKxCwxpEiIm0xsjKDdy3I",
  authDomain: "diagram-flow.firebaseapp.com",
  projectId: "diagram-flow",
  storageBucket: "diagram-flow.firebasestorage.app",
  messagingSenderId: "701657640541",
  appId: "1:701657640541:web:fa9d373423f009c60627b4",
  measurementId: "G-RJZ7XPTE4Z"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };
