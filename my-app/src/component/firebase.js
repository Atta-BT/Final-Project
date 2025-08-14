import { initializeApp, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDv-GeF0aXNbuUqmdikBXx6JEFolvCOEl0",
  authDomain: "smart-drying-rack-92826.firebaseapp.com",
  databaseURL: "https://smart-drying-rack-92826-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-drying-rack-92826",
  storageBucket: "smart-drying-rack-92826.appspot.com",
  messagingSenderId: "765496152466",
  appId: "1:765496152466:web:42b29ae1b490979cba314b",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const rtdb = getDatabase(app);
export default app;
