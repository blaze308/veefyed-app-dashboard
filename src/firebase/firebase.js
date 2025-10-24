// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBy8z8uVn__DpfKpx56k4yVAXyBsCIBBKU",
  authDomain: "veefyed-app.firebaseapp.com",
  projectId: "veefyed-app",
  storageBucket: "veefyed-app.firebasestorage.app",
  messagingSenderId: "1033527293281",
  appId: "1:1033527293281:web:b3750817dd19a9d24d8120",
  measurementId: "G-WFXKJZQ26L",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
