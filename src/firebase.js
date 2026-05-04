import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // Ajout de cette ligne

const firebaseConfig = {
  apiKey: "AIzaSyDbs920iWKV2w18QyGZYdYU4yWEpTurd44",
  authDomain: "mon-budget-app-5cf97.firebaseapp.com",
  projectId: "mon-budget-app-5cf97",
  storageBucket: "mon-budget-app-5cf97.firebasestorage.app",
  messagingSenderId: "842290924565",
  appId: "1:842290924565:web:6246099ea8798ea7c0d21c"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);

// Initialisation de Firestore (La base de données) et EXPORT
export const db = getFirestore(app);