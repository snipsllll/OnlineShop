// Import the functions you need from the SDKs you need
import {initializeApp} from "firebase/app";
import {getAnalytics} from "firebase/analytics";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
  apiKey: "AIzaSyCcTt4efYSNi4wI5KMqV6eYGXOo_vhtmSA",
  authDomain: "onlineshop-2c297.firebaseapp.com",
  projectId: "onlineshop-2c297",
  storageBucket: "onlineshop-2c297.firebasestorage.app",
  messagingSenderId: "669717134153",
  appId: "1:669717134153:web:5e4ca5259401a50418f898",
  measurementId: "G-J1BSVLTRX8"
};

export const firebaseConfig2 = {
  apiKey: "AIzaSyC3jYlrKApK8q-S70yjAyyeuCEoE8FXUTQ",
  authDomain: "testshop-d6691.firebaseapp.com",
  projectId: "testshop-d6691",
  storageBucket: "testshop-d6691.firebasestorage.app",
  messagingSenderId: "632302980168",
  appId: "1:632302980168:web:4e6d3b32519702ba06dc7d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
