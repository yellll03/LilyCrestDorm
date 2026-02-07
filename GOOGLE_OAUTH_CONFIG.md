# Google OAuth Client IDs Configuration

This document explains the Google OAuth client IDs configured for the LilyCrest Dormitory Management System.

## OAuth Client IDs

### 1. Android Client ID
```
784085654130-g9a47ihab68i2o7r0dfpo1jp7p6att2a.apps.googleusercontent.com
```
- **Purpose**: Used for native Android app authentication
- **Package Name**: `host.exp.exponent`
- **Configured in**: 
  - `frontend/google-services.json`
  - `frontend/src/config/firebase.js` (exported as `GOOGLE_ANDROID_CLIENT_ID`)
  - `backend/.env` (as `GOOGLE_ANDROID_CLIENT_ID`)

### 2. Web Client ID
```
784085654130-ue5677aho518t6btjffc26j6sut1akfj.apps.googleusercontent.com
```
- **Purpose**: Used for Firebase Authentication and Google Sign-In
- **Required for**: OAuth 2.0 authentication flow
- **Configured in**: 
  - `frontend/src/config/firebase.js` (exported as `GOOGLE_WEB_CLIENT_ID`)
  - `frontend/src/config/googleSignIn.js` (used in GoogleSignin.configure)
  - `backend/.env` (as `GOOGLE_WEB_CLIENT_ID`)

## Firebase Project Details

- **Project ID**: dormitorymanagement-caps-572cf
- **Project Number**: 784085654130
- **Storage Bucket**: dormitorymanagement-caps-572cf.firebasestorage.app

## Configuration Files

### Frontend Configuration

1. **firebase.js** (`frontend/src/config/firebase.js`)
   - Contains Firebase SDK configuration
   - Exports OAuth client IDs as constants
   - Initializes Firebase App and Auth

2. **googleSignIn.js** (`frontend/src/config/googleSignIn.js`)
   - Configures `@react-native-google-signin/google-signin`
   - Provides helper functions for Google Sign-In flow
   - Automatically initialized in root `_layout.jsx`

3. **google-services.json** (`frontend/google-services.json`)
   - Android-specific Firebase configuration
   - Contains API keys and OAuth client configurations
   - **Important**: This file is ignored by git for security

4. **app.json** (`frontend/app.json`)
   - References `google-services.json`
   - Contains Android package configuration

### Backend Configuration

**backend/.env**
```env
# Google OAuth Client IDs
GOOGLE_WEB_CLIENT_ID=784085654130-ue5677aho518t6btjffc26j6sut1akfj.apps.googleusercontent.com
GOOGLE_ANDROID_CLIENT_ID=784085654130-g9a47ihab68i2o7r0dfpo1jp7p6att2a.apps.googleusercontent.com
```

## Usage

### In Frontend (React Native)

```javascript
import { signInWithGoogle } from '../src/config/googleSignIn';
import { useAuth } from '../src/context/AuthContext';

// In your component
const { signInWithGoogle: authSignInWithGoogle } = useAuth();

const handleGoogleSignIn = async () => {
  // Step 1: Get Google ID token
  const googleResult = await signInWithGoogle();
  
  if (googleResult.success) {
    // Step 2: Authenticate with backend using ID token
    const authResult = await authSignInWithGoogle(googleResult.idToken);
    
    if (authResult.success) {
      // User is authenticated
      console.log('Sign-in successful!');
    } else {
      // Handle authentication error
      console.error(authResult.error);
    }
  } else {
    // Handle Google Sign-In error
    console.error(googleResult.error);
  }
};
```

### In Backend (Node.js/Express)

The backend verifies the Google ID token using Firebase Admin SDK:

```javascript
// backend/server.js
// Token verification happens in /auth/google endpoint
// The ID token is verified using Firebase Admin SDK
// Then checked against MongoDB for tenant authorization
```

## Security Notes

1. **google-services.json** is added to `.gitignore` - never commit this file
2. Web Client ID is exposed in frontend code (this is normal and safe)
3. Backend validates all ID tokens server-side
4. Only registered tenants can access the system (enforced server-side)

## Testing Google Sign-In

### Prerequisites
- Android device or emulator with Google Play Services
- Google account for testing
- The test account must be registered as a tenant in the database

### Steps
1. Open the app
2. Tap "Sign in with Google" button
3. Select your Google account
4. Grant necessary permissions
5. App will receive ID token and authenticate with backend
6. If account is registered as tenant, you'll be logged in

## Troubleshooting

### "Google Play Services not available"
- Ensure emulator has Google Play Services installed
- Use an emulator with Google APIs

### "Sign-in failed"
- Check internet connection
- Verify OAuth client IDs are correct
- Ensure google-services.json is in frontend directory
- Check backend logs for authentication errors

### "Access denied"
- User's email must be registered in MongoDB as active tenant
- Check database: `db.users.find({ email: "user@example.com" })`
- Ensure user role is "tenant" and status is "active"

## Related Files

- Frontend: `src/config/firebase.js`, `src/config/googleSignIn.js`
- Backend: `.env`, `server.js` (auth endpoints)
- Root: `app/_layout.jsx` (initialization)
- Context: `src/context/AuthContext.js` (authentication state)
