// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Your web app's Firebase configuration
// TODO: Replace with your actual config object
const firebaseConfig = {
    apiKey: "AIzaSyDjMk4VMAwXoq56RN3MJOzogd8y93VISmU",
    authDomain: "charting-app-b4ed8.firebaseapp.com",
    projectId: "charting-app-b4ed8",
    storageBucket: "charting-app-b4ed8.appspot.com",
    messagingSenderId: "907875035214",
    appId: "1:907875035214:web:d5e636bf846010f952fb1f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
