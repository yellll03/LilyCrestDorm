// Firebase configuration for LilyCrest Tenant Portal
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBsMEkwGFKfxp_0pItM_g5FzzG8g9Sra1o",
  authDomain: "dormitorymanagement-caps-572cf.firebaseapp.com",
  projectId: "dormitorymanagement-caps-572cf",
  storageBucket: "dormitorymanagement-caps-572cf.firebasestorage.app",
  messagingSenderId: "784085654130",
  appId: "1:784085654130:web:2fc1e42f23f78d665300eb",
  measurementId: "G-F8P190WY99"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
export default firebaseConfig;
