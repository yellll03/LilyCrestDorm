# Google Sign-In Implementation Guide

## 📱 Overview

This is a complete, production-ready Google Sign-In implementation for Expo + Firebase that works on:

- ✅ **Web**: Using Firebase popup/redirect authentication
- ✅ **Android**: Using `expo-auth-session` with custom dev client
- ✅ **iOS**: Using `expo-auth-session` (requires iOS Client ID configuration)

⚠️ **IMPORTANT**: This does NOT work with Expo Go. You must use a custom development build.

## 🏗️ Architecture

```
User clicks "Sign in with Google"
    ↓
┌─────────────────────────────────────┐
│  Platform Detection (Platform.OS)   │
└─────────────────────────────────────┘
         ↓                    ↓
    [WEB]                [NATIVE]
         ↓                    ↓
  Firebase Popup      expo-auth-session
  signInWithPopup     Google.useAuthRequest
         ↓                    ↓
  Firebase Auth       Get ID Token
  (automatic)                 ↓
         ↓            signInWithCredential
         ↓                    ↓
         └──────────┬─────────┘
                    ↓
         Get Firebase ID Token
                    ↓
         Send to Backend API
                    ↓
         Backend validates token
                    ↓
         Return session token
                    ↓
              Success! 🎉
```

## 📦 Files Structure

```
frontend/
├── src/
│   ├── config/
│   │   ├── firebase.js              # Firebase config + OAuth Client IDs
│   │   └── googleSignIn.js          # Google Sign-In hook (MAIN FILE)
│   ├── context/
│   │   └── AuthContext.js           # Auth state management
│   └── components/
│       └── GoogleSignInButton.js    # Ready-to-use button component
└── app/
    └── _layout.jsx                  # Root layout (no init needed)
```

## 🚀 Quick Start

### 1. Use the Pre-built Component

```jsx
import GoogleSignInButton from '../src/components/GoogleSignInButton';

function LoginScreen() {
  return (
    <View>
      <GoogleSignInButton
        onSuccess={(user) => {
          console.log('Signed in:', user.email);
          // Navigate to home screen
        }}
        onError={(error) => {
          console.error('Sign-in failed:', error);
        }}
      />
    </View>
  );
}
```

### 2. Or Use the Hook Directly

```jsx
import { useGoogleSignIn } from '../src/config/googleSignIn';
import { useAuth } from '../src/context/AuthContext';

function CustomLoginButton() {
  const { signInWithGoogle, isLoading } = useGoogleSignIn();
  const { signInWithGoogle: backendSignIn } = useAuth();

  const handlePress = async () => {
    // Step 1: Sign in with Google
    const result = await signInWithGoogle();
    
    if (result.success) {
      // Step 2: Get Firebase ID token
      const idToken = await result.user.getIdToken();
      
      // Step 3: Authenticate with backend
      const backendResult = await backendSignIn(idToken);
      
      if (backendResult.success) {
        console.log('Fully authenticated!');
      }
    }
  };

  return (
    <Button 
      title="Sign in with Google" 
      onPress={handlePress}
      disabled={isLoading}
    />
  );
}
```

## 🔧 Configuration

### Required OAuth Client IDs

Your `firebase.js` already exports:

```javascript
export const GOOGLE_WEB_CLIENT_ID = "784085654130-ue5677aho518t6btjffc26j6sut1akfj.apps.googleusercontent.com";
export const GOOGLE_ANDROID_CLIENT_ID = "784085654130-g9a47ihab68i2o7r0dfpo1jp7p6att2a.apps.googleusercontent.com";
```

### App Configuration

Your `app.json` should have:

```json
{
  "expo": {
    "scheme": "frontend",
    "android": {
      "googleServicesFile": "./google-services.json",
      "config": {
        "googleSignIn": {
          "apiKey": "AIzaSyBGoiw8OkTUZ3MO1vZJffyAIefu-aEAo-U"
        }
      }
    }
  }
}
```

## 🛠️ Building Custom Dev Client

### Why Custom Dev Client?

Expo Go **cannot** perform native Google Sign-In. You need a custom development build that includes native modules.

### Build for Android

```bash
# Install EAS CLI if you haven't
npm install -g eas-cli

# Login to Expo
eas login

# Configure your project
eas build:configure

# Build development client for Android
eas build --profile development --platform android

# Install the built APK on your device
# Download from Expo dashboard and install

# Run your app
npx expo start --dev-client
```

### Or Build Locally

```bash
# Generate native directories
npx expo prebuild

# Build with Android Studio or
npx expo run:android
```

## 🌐 Platform-Specific Behavior

### Web (Platform.OS === 'web')

- Uses Firebase's native `signInWithPopup()`
- Opens Google OAuth in popup window
- Automatically handles Firebase authentication
- Fallback to `signInWithRedirect()` for mobile browsers

### Android (Platform.OS === 'android')

- Uses `expo-auth-session` with `Google.useAuthRequest()`
- Opens Google OAuth in Android browser
- Returns to app with deep link
- Manually calls `signInWithCredential()` with ID token

### iOS (Platform.OS === 'ios')

- Same as Android
- Requires iOS Client ID (not configured yet)
- Add to `Google.useAuthRequest({ iosClientId: 'YOUR_IOS_CLIENT_ID' })`

## 🔐 Backend Integration

Your backend receives the Firebase ID token and validates it:

```javascript
// POST /auth/google
{
  "idToken": "eyJhbGciOiJSUzI1NiIsImtpZCI6..." 
}

// Backend verifies with Firebase Admin SDK
const decodedToken = await admin.auth().verifyIdToken(idToken);

// Check if user is registered tenant in MongoDB
const user = await db.collection('users').findOne({
  email: decodedToken.email,
  role: 'tenant',
  status: 'active'
});

// Return session token
return { user, session_token: '...' };
```

## 🐛 Troubleshooting

### "Google Sign-In is not configured yet"

- Hook is still initializing
- Wait for `isLoading` to become `false`

### Sign-in works on web but not Android

- Ensure you're using a custom dev client, NOT Expo Go
- Check Android Client ID in Google Cloud Console
- Verify SHA-1 fingerprint is added in Firebase Console

### "Popup blocked" on web

- Browser blocked the popup
- User needs to allow popups for your site
- Or use `signInWithRedirect()` instead

### Backend returns 403 "Access denied"

- User's email is not registered in MongoDB
- Check user role is "tenant" and status is "active"
- Add test users to database

### "No ID token received"

- OAuth flow was interrupted
- Check Google Cloud Console configuration
- Verify Web Client ID is correct

## 📱 Testing

### Test on Web

```bash
cd frontend
npm run web
# Opens http://localhost:8081
# Click "Sign in with Google"
# Should open Google OAuth popup
```

### Test on Android

```bash
# With custom dev client installed
npx expo start --dev-client

# Scan QR code with dev client app
# Click "Sign in with Google"
# Should open browser for OAuth
# Return to app after auth
```

## 🎯 Key Features

✅ **Cross-platform**: Single implementation for web and native
✅ **Clear return shape**: Consistent success/error payloads
✅ **Error handling**: Comprehensive error messages
✅ **Loading states**: Built-in loading indicators
✅ **Cancellation**: Handles user cancellation gracefully
✅ **Platform checks**: Automatic web vs native detection
✅ **Firebase integration**: Seamless Firebase Auth
✅ **Backend ready**: Easy integration with your API

## 📚 API Reference

### `useGoogleSignIn()`

Hook that provides Google Sign-In functionality.

**Returns:**
```javascript
{
  signInWithGoogle: () => Promise<SignInResult>,
  checkRedirectResult: () => Promise<SignInResult | null>,
  isLoading: boolean,
  request: GoogleAuthRequest | null
}
```

**SignInResult:**
```javascript
{
  success: boolean,
  user?: FirebaseUser,
  idToken?: string,
  accessToken?: string,
  error?: string,
  cancelled?: boolean
}
```

### `signOutFromGoogle()`

Signs out from Firebase.

```javascript
import { signOutFromGoogle } from '../config/googleSignIn';

const result = await signOutFromGoogle();
```

### `getCurrentUser()`

Gets current Firebase user.

```javascript
import { getCurrentUser } from '../config/googleSignIn';

const user = getCurrentUser(); // FirebaseUser | null
```

### `isSignedIn()`

Checks if user is signed in.

```javascript
import { isSignedIn } from '../config/googleSignIn';

if (isSignedIn()) {
  console.log('User is signed in');
}
```

## 🔗 Related Documentation

- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Firebase Auth Web](https://firebase.google.com/docs/auth/web/google-signin)
- [Google Identity](https://developers.google.com/identity)
- [Expo Dev Client](https://docs.expo.dev/develop/development-builds/introduction/)

## ⚡ Performance Tips

1. **Preload the hook**: Use `useGoogleSignIn()` at component mount to prepare the request
2. **Cache credentials**: Firebase automatically caches the user session
3. **Minimize re-renders**: Hook is designed to minimize unnecessary re-renders
4. **Web optimization**: Firebase popup is faster than redirect for most cases

## 🎨 Customization

Customize the button style by passing a `style` prop:

```jsx
<GoogleSignInButton
  style={{
    backgroundColor: '#4285F4',
    borderRadius: 12,
    paddingVertical: 16,
  }}
/>
```

Or create your own button using the hook directly for full control.

---

**Need help?** Check the console logs - they're comprehensive and will guide you through any issues! 🚀
