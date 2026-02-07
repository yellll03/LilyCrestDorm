// Firebase configuration for LilyCrest Tenant Portal
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBsMEkwGFKfxp_0pItM_g5FzzG8g9Sra1o",
  authDomain: "dormitorymanagement-caps-572cf.firebaseapp.com",
  projectId: "dormitorymanagement-caps-572cf",
  storageBucket: "dormitorymanagement-caps-572cf.firebasestorage.app",
  messagingSenderId: "784085654130",
  appId: "1:784085654130:web:2fc1e42f23f78d665300eb",
  measurementId: "G-F8P190WY99"
};

// OAuth Client IDs for Google Sign-In
export const GOOGLE_WEB_CLIENT_ID = "784085654130-ue5677aho518t6btjffc26j6sut1akfj.apps.googleusercontent.com";
export const GOOGLE_ANDROID_CLIENT_ID = "784085654130-g9a47ihab68i2o7r0dfpo1jp7p6att2a.apps.googleusercontent.com";

// Initialize Firebase (check if already initialized to prevent errors on hot reload)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

export { app, auth };
export default firebaseConfig;
