/**
 * Google Sign-In Configuration for Expo + Firebase
 * 
 * This implementation works on:
 * - Web: Using Firebase popup/redirect
 * - Android: Using expo-auth-session (custom dev client)
 * - iOS: Using expo-auth-session (future support)
 * 
 * IMPORTANT: Does NOT work with Expo Go (native sign-in requires custom dev client)
 */

import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
    getRedirectResult,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithPopup
} from 'firebase/auth';
import { Platform } from 'react-native';
import { auth, GOOGLE_ANDROID_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from './firebase';

// Essential for web redirect flow
WebBrowser.maybeCompleteAuthSession();

/**
 * Google Sign-In Hook
 * Handles platform-specific authentication flow
 * 
 * Usage:
 * const { signInWithGoogle, isLoading } = useGoogleSignIn();
 * await signInWithGoogle();
 */
export function useGoogleSignIn() {
  // Configure expo-auth-session for native platforms (Android/iOS)
  const [request, response, promptAsync] = Google.useAuthRequest({
    // Android Client ID (from Google Cloud Console)
    androidClientId: GOOGLE_ANDROID_CLIENT_ID,
    
    // iOS Client ID (optional - add when you support iOS)
    // iosClientId: 'YOUR_IOS_CLIENT_ID',
    
    // Web Client ID (required for Firebase Auth)
    webClientId: GOOGLE_WEB_CLIENT_ID,
    
    // Scopes needed for your app
    scopes: ['profile', 'email'],
    
    // Redirect URI (automatically handled by Expo)
    redirectUri: makeRedirectUri({
      scheme: 'frontend', // matches your app.json scheme
      useProxy: false, // Use false for custom dev client
    }),
  });

  /**
   * Sign in with Google
   * Automatically handles web vs native platforms
   * 
   * @returns {Promise<Object>} { success: boolean, user?: FirebaseUser, error?: string }
   */
  const signInWithGoogle = async () => {
    try {
      // ============================================
      // WEB PLATFORM - Use Firebase Popup/Redirect
      // ============================================
      if (Platform.OS === 'web') {
        return await signInWithGoogleWeb();
      }

      // ============================================
      // NATIVE PLATFORMS (Android/iOS)
      // ============================================
      return await signInWithGoogleNative();

    } catch (error) {
      console.error('Google Sign-In Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign in with Google',
      };
    }
  };

  /**
   * Web Platform: Firebase Popup Sign-In
   * Uses Firebase's built-in Google provider for web
   */
  const signInWithGoogleWeb = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add scopes if needed
      provider.addScope('profile');
      provider.addScope('email');

      // Use popup (recommended for most cases)
      // Alternative: signInWithRedirect(auth, provider) for some mobile browsers
      const result = await signInWithPopup(auth, provider);
      
      // Get the Google Access Token if needed
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken;

      console.log('Web sign-in successful:', result.user.email);

      return {
        success: true,
        user: result.user,
        accessToken,
      };

    } catch (error) {
      console.error('Web sign-in error:', error);

      // Handle specific Firebase errors
      if (error.code === 'auth/popup-closed-by-user') {
        return {
          success: false,
          error: 'Sign-in cancelled',
          cancelled: true,
        };
      } else if (error.code === 'auth/popup-blocked') {
        return {
          success: false,
          error: 'Popup was blocked by browser. Please allow popups for this site.',
        };
      }

      return {
        success: false,
        error: error.message || 'Web sign-in failed',
      };
    }
  };

  /**
   * Native Platform: Expo Auth Session + Firebase
   * Uses expo-auth-session to get Google token, then authenticates with Firebase
   */
  const signInWithGoogleNative = async () => {
    try {
      if (Constants.appOwnership === 'expo') {
        return {
          success: false,
          error: 'Google Sign-In requires a custom dev client. Expo Go is not supported.',
        };
      }

      // Check if request is ready
      if (!request) {
        return {
          success: false,
          error: 'Google Sign-In is not configured yet',
        };
      }

      // Trigger the authentication flow
      console.log('Starting native Google Sign-In...');
      const result = await promptAsync();

      // Handle the response
      if (result.type === 'cancel') {
        console.log('User cancelled sign-in');
        return {
          success: false,
          error: 'Sign-in cancelled',
          cancelled: true,
        };
      }

      if (result.type !== 'success') {
        console.log('Sign-in failed:', result.type);
        return {
          success: false,
          error: 'Sign-in failed. Please try again.',
        };
      }

      // Get the authentication response
      const { authentication } = result;

      if (!authentication?.idToken) {
        console.error('No ID token received');
        return {
          success: false,
          error: 'Authentication failed. No ID token received.',
        };
      }

      console.log('Google authentication successful, signing in to Firebase...');

      // Create Firebase credential from Google ID token
      const credential = GoogleAuthProvider.credential(
        authentication.idToken,
        authentication.accessToken
      );

      // Sign in to Firebase with the credential
      const userCredential = await signInWithCredential(auth, credential);

      console.log('Firebase sign-in successful:', userCredential.user.email);

      return {
        success: true,
        user: userCredential.user,
        idToken: authentication.idToken,
        accessToken: authentication.accessToken,
      };

    } catch (error) {
      console.error('Native sign-in error:', error);

      // Handle specific Firebase errors
      if (error.code === 'auth/account-exists-with-different-credential') {
        return {
          success: false,
          error: 'An account already exists with the same email address but different sign-in credentials.',
        };
      } else if (error.code === 'auth/invalid-credential') {
        return {
          success: false,
          error: 'Invalid credentials. Please try again.',
        };
      }

      return {
        success: false,
        error: error.message || 'Native sign-in failed',
      };
    }
  };

  /**
   * Check for redirect result on web
   * Call this when app loads to handle redirect-based sign-in
   */
  const checkRedirectResult = async () => {
    if (Platform.OS !== 'web') return null;

    try {
      const result = await getRedirectResult(auth);
      if (result) {
        console.log('Redirect sign-in successful:', result.user.email);
        return {
          success: true,
          user: result.user,
        };
      }
      return null;
    } catch (error) {
      console.error('Redirect result error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  return {
    signInWithGoogle,
    checkRedirectResult,
    isLoading: !request, // Loading until request is configured
    request,
  };
}

/**
 * Sign out from Google (both Firebase and cleanup)
 */
export async function signOutFromGoogle() {
  try {
    // Sign out from Firebase
    await auth.signOut();
    
    console.log('Signed out successfully');
    
    return { success: true };
  } catch (error) {
    console.error('Sign-Out Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to sign out',
    };
  }
}

/**
 * Get current Firebase user
 */
export function getCurrentUser() {
  return auth.currentUser;
}

/**
 * Check if user is signed in
 */
export function isSignedIn() {
  return auth.currentUser !== null;
}

// Export configuration for reference
export const GOOGLE_SIGN_IN_CONFIG = {
  androidClientId: GOOGLE_ANDROID_CLIENT_ID,
  webClientId: GOOGLE_WEB_CLIENT_ID,
  scopes: ['profile', 'email'],
  scheme: 'frontend',
};
