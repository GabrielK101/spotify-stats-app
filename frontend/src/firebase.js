import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAtddX7PRI_I5yKUeTp1JBRVSdOmL6qQAM",
    authDomain: "skilful-elixir-451913-p4.firebaseapp.com",
    projectId: "skilful-elixir-451913-p4",
    storageBucket: "skilful-elixir-451913-p4.firebasestorage.app",
    messagingSenderId: "307571896068",
    appId: "1:307571896068:web:630ba05b5e9648b5036a51"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
