# Custom Dev Client Setup for Google Sign-In + Firebase

## 🎯 Why Custom Dev Client?

**Expo Go does NOT support Google Sign-In** because:
- Google Sign-In requires native Android/iOS modules
- Expo Go only includes a limited set of pre-built native modules
- `expo-auth-session` needs custom URL schemes and deep linking

**Custom Dev Client** is a custom-built version of your app that:
- Includes ALL native modules your app needs
- Supports deep linking and custom schemes
- Works like Expo Go but for YOUR specific app

---

## 📋 Prerequisites

✅ Your project already has:
- `expo-auth-session` installed
- Firebase configuration
- Google OAuth Client IDs configured

✅ You need:
- Android Studio OR an Android device with USB debugging
- JDK 17 or higher
- Node.js 18+

---

## 🚀 Step-by-Step Setup

### Step 1: Install expo-dev-client

```bash
cd frontend
npx expo install expo-dev-client
```

**Why?** This package:
- Provides the development UI overlay (like Expo Go)
- Handles the dev menu and reload functionality
- Manages deep links during development

### Step 2: Update app.json

Add `expo-dev-client` to plugins:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-dev-client",
      [
        "expo-splash-screen",
        {
          "image": "./assets/images/splash-icon.png",
          "imageWidth": 200,
          "resizeMode": "contain",
          "backgroundColor": "#000"
        }
      ]
    ]
  }
}
```

**Why?** Config plugins:
- Configure native Android/iOS settings at build time
- `expo-dev-client` plugin sets up the dev client infrastructure
- Must be listed BEFORE prebuild/build

### Step 3: Generate Native Projects

```bash
npx expo prebuild --clean
```

**Why?** This command:
- Generates `android/` and `ios/` directories
- Applies all config plugins
- Creates native code from your app.json
- `--clean` removes old native folders first (recommended)

**What happens:**
- ✅ Creates `android/app/build.gradle` with your package name
- ✅ Configures `google-services.json`
- ✅ Sets up deep linking scheme (`frontend://`)
- ✅ Configures permissions

### Step 4: Get SHA-1 Fingerprint (REQUIRED for Google Sign-In)

Google Sign-In **will NOT work** without registering your app's SHA-1 fingerprint in Firebase Console.

#### For Debug Build (Development)

```bash
cd android
./gradlew signingReport
```

**Windows:**
```bash
cd android
gradlew.bat signingReport
```

Look for output like:
```
Variant: debug
Config: debug
Store: C:\Users\YourName\.android\debug.keystore
Alias: androiddebugkey
MD5: XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX
SHA1: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78  ← THIS ONE
SHA-256: XX:XX:...
```

**Copy the SHA1 fingerprint** (the one under "Variant: debug")

#### Add to Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: `dormitorymanagement-caps-572cf`
3. Click gear icon → Project Settings
4. Scroll to "Your apps" section
5. Find your Android app (`host.exp.exponent`)
6. Click "Add fingerprint"
7. Paste the SHA-1 fingerprint
8. Click Save

**Why SHA-1 is required:**
- Google verifies your app's identity using SHA-1
- Prevents unauthorized apps from using your OAuth Client ID
- Without it, you'll get "DEVELOPER_ERROR" or "Sign-in failed"

### Step 5: Build the Development Client

#### Option A: Using Android Studio (Recommended for debugging)

```bash
# Open Android Studio
# File → Open → Select: frontend/android/
# Wait for Gradle sync
# Click "Run" button (green triangle)
# Select your device/emulator
```

#### Option B: Using Command Line

```bash
cd frontend
npx expo run:android
```

**Why this command?**
- Compiles your custom development client
- Installs APK on connected device/emulator
- Starts Metro bundler automatically
- Hot reload works like Expo Go

**Build time:** First build takes 5-10 minutes (downloads dependencies)

**What's created:**
- Custom APK with your app name
- Includes `expo-auth-session` native module
- Has your custom scheme (`frontend://`)
- Includes Google Play Services

### Step 6: Run Your App

After build completes, the app auto-launches. If not:

```bash
# Make sure Metro is running
npx expo start --dev-client

# The app on your device will connect automatically
```

**Why `--dev-client`?**
- Tells Metro to connect to your custom dev client (not Expo Go)
- Shows available dev clients on the network
- Enables fast refresh

---

## 🔧 Configuration Verification

### Check app.json (Already Done)

```json
{
  "expo": {
    "scheme": "frontend",  // ← Required for deep linking
    "android": {
      "package": "host.exp.exponent",  // ← Your package name
      "googleServicesFile": "./google-services.json",  // ← Firebase config
      "config": {
        "googleSignIn": {
          "apiKey": "AIzaSyBGoiw8OkTUZ3MO1vZJffyAIefu-aEAo-U"
        },
        "googleMaps": {
          "apiKey": "AIzaSyBnOAv1sLnBLmW9y4EP6xRhGScT_0CpTOE"
        }
      }
    }
  }
}
```

### Check google-services.json (Already Done)

```json
{
  "project_info": {
    "project_id": "dormitorymanagement-caps-572cf"
  },
  "client": [{
    "client_info": {
      "package_name": "host.exp.exponent"  // ← Must match app.json
    },
    "oauth_client": [{
      "client_id": "784085654130-ue5677aho518t6btjffc26j6sut1akfj.apps.googleusercontent.com"
    }]
  }]
}
```

---

## 🧪 Testing Google Sign-In

### 1. Launch the app from custom dev client

```bash
npx expo start --dev-client
```

### 2. Test the flow

1. Tap "Sign in with Google"
2. Browser opens with Google OAuth screen
3. Select your Google account
4. Grants permissions
5. **Returns to app via deep link** (`frontend://`)
6. App receives authentication token
7. Calls `signInWithCredential()`
8. Firebase authenticates user
9. Backend validates token
10. Success! 🎉

### 3. Check logs

```bash
# In Metro terminal, you'll see:
Starting native Google Sign-In...
Google authentication successful, signing in to Firebase...
Firebase sign-in successful: user@example.com
Backend authentication successful
```

---

## 🐛 Troubleshooting

### "DEVELOPER_ERROR" or "Sign-in failed"

**Cause:** SHA-1 fingerprint not registered in Firebase

**Fix:**
```bash
cd android
./gradlew signingReport
# Copy SHA-1
# Add to Firebase Console → Project Settings → Android App
```

### "No activity found to handle Intent"

**Cause:** Deep linking not configured

**Fix:**
```bash
# Rebuild with clean
npx expo prebuild --clean
npx expo run:android
```

### "Module not found: expo-auth-session"

**Cause:** Module not linked in native code

**Fix:**
```bash
# Reinstall and rebuild
npm install
npx expo prebuild --clean
npx expo run:android
```

### "Unable to resolve module @react-native-google-signin"

**Cause:** Old implementation conflicting

**Fix:** You're now using `expo-auth-session`, not `@react-native-google-signin`. Remove it if installed:
```bash
npm uninstall @react-native-google-signin/google-signin
npx expo prebuild --clean
npx expo run:android
```

### App crashes on launch

**Cause:** google-services.json mismatch

**Fix:**
```bash
# Ensure google-services.json is in frontend/
# Check package name matches app.json
npx expo prebuild --clean
npx expo run:android
```

### Browser doesn't return to app

**Cause:** Deep link scheme not working

**Fix:**
1. Check `app.json` has `"scheme": "frontend"`
2. Rebuild: `npx expo prebuild --clean && npx expo run:android`
3. Test deep link manually: `adb shell am start -a android.intent.action.VIEW -d "frontend://"`

---

## 📱 Device Setup

### Android Emulator

1. Open Android Studio
2. Tools → Device Manager
3. Create Virtual Device
4. Choose device (e.g., Pixel 6)
5. Select system image (API 33 or higher recommended)
6. **Important:** Choose image with Google Play Services
7. Start emulator

### Physical Device

1. Enable Developer Options:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging
3. Connect via USB
4. Authorize computer on device
5. Verify connection: `adb devices`

---

## 🔄 Development Workflow

### Daily Development

```bash
# Keep Metro running in one terminal
npx expo start --dev-client

# App on device/emulator will auto-reload on file changes
# Press 'r' to reload manually
# Press 'j' to open debugger
```

### After Changing Native Dependencies

```bash
# When you install new native modules (expo install package-name)
npx expo prebuild --clean
npx expo run:android
```

### After Changing app.json

```bash
# When you modify native configs in app.json
npx expo prebuild --clean
npx expo run:android
```

---

## 🎯 What Changed vs Expo Go

| Feature | Expo Go | Custom Dev Client |
|---------|---------|-------------------|
| **Native Modules** | Pre-built only | ALL your modules |
| **Google Sign-In** | ❌ Not supported | ✅ Fully works |
| **Deep Linking** | Limited | ✅ Full support |
| **Custom Schemes** | ❌ Can't use | ✅ `frontend://` |
| **Build Time** | Instant | 5-10 min first time |
| **File Changes** | Fast refresh | Fast refresh |
| **Native Changes** | ❌ Need rebuild | Need rebuild |

---

## 📦 Build for Production Later

When ready to deploy:

```bash
# EAS Build (Recommended)
npm install -g eas-cli
eas build --platform android --profile production

# Or local production build
cd android
./gradlew assembleRelease
# APK at: android/app/build/outputs/apk/release/app-release.apk
```

**Note:** Production builds need a release keystore and SHA-1 (different from debug)

---

## ✅ Quick Command Reference

```bash
# Initial setup
npx expo install expo-dev-client
npx expo prebuild --clean
cd android && ./gradlew signingReport  # Get SHA-1
npx expo run:android

# Daily development
npx expo start --dev-client

# After native changes
npx expo prebuild --clean
npx expo run:android

# Check connected devices
adb devices

# View logs
npx expo start --dev-client
# Then press 'shift + m' for more options
```

---

## 🎉 Success Criteria

You'll know it's working when:

✅ Custom dev client app installs on device
✅ Metro connects automatically
✅ "Sign in with Google" button works
✅ Browser opens with Google OAuth
✅ Returns to app after selecting account
✅ Console shows: "Firebase sign-in successful"
✅ User is authenticated
✅ Hot reload works like Expo Go

---

## 🚨 Common Mistakes to Avoid

❌ **Don't** run `expo start` without `--dev-client` flag
❌ **Don't** try to use Expo Go after building custom client
❌ **Don't** forget to add SHA-1 to Firebase Console
❌ **Don't** modify native code directly in `android/` folder (use app.json)
❌ **Don't** commit `android/` and `ios/` folders to git (they're generated)

✅ **Do** run `prebuild --clean` after config changes
✅ **Do** use `--dev-client` flag when starting Metro
✅ **Do** add SHA-1 fingerprint to Firebase
✅ **Do** test on both emulator and physical device

---

## 📚 What You Already Have

Your implementation is already correct:
- ✅ Using `expo-auth-session/providers/google` (not deprecated)
- ✅ Using `signInWithCredential` for Firebase
- ✅ Using Web Client ID
- ✅ Platform-aware (Platform.OS checks)
- ✅ Proper error handling

You just need to **build and run the custom dev client**!

---

## 🎯 Next Steps

1. **Install expo-dev-client**: `npx expo install expo-dev-client`
2. **Add to plugins in app.json**
3. **Prebuild**: `npx expo prebuild --clean`
4. **Get SHA-1**: `cd android && ./gradlew signingReport`
5. **Add SHA-1 to Firebase Console**
6. **Build**: `npx expo run:android`
7. **Test**: Tap "Sign in with Google" in your app

That's it! Your Google Sign-In will work perfectly. 🚀
