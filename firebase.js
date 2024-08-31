const { initializeApp } = require("firebase/app");
const { getAuth } = require("firebase/auth");
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
} = require("firebase/firestore");

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

// const firebaseConfig = {
//   apiKey: "AIzaSyD1omzSHOT-rxkeiYLEHGaqO-w32fkycts",
//   authDomain: "harmonized-fc1f7.firebaseapp.com",
//   projectId: "harmonized-fc1f7",
//   storageBucket: "harmonized-fc1f7.appspot.com",
//   messagingSenderId: "222170288924",
//   appId: "1:222170288924:web:5a99c3fb703e8214f520d9",
//   measurementId: "G-KVVJ4J420B",
// };

const firebaseConfig = {
  apiKey: "AIzaSyAv__FVK6IWDIwAmQOCb1tzlB_mNrYmtzA",
  authDomain: "harmonized-570d4.firebaseapp.com",
  projectId: "harmonized-570d4",
  storageBucket: "harmonized-570d4.appspot.com",
  messagingSenderId: "355074629130",
  appId: "1:355074629130:web:d7fdc59aa96b5da7b349f3",
  measurementId: "G-LQ058ZNY8M",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

module.exports = {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  where,
};
