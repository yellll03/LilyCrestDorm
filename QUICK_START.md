# 🚀 Quick Start: Custom Dev Client for Google Sign-In

## One-Time Setup (5 commands)

### 1️⃣ Install expo-dev-client
```bash
cd frontend
npx expo install expo-dev-client
```

### 2️⃣ Generate native projects
```bash
npx expo prebuild --clean
```
⏱️ Takes ~2 minutes

### 3️⃣ Get SHA-1 fingerprint
```bash
cd android
gradlew.bat signingReport
```
**Windows:** Use `gradlew.bat`  
**Mac/Linux:** Use `./gradlew`

Look for output like:
```
SHA1: 12:34:56:78:90:AB:CD:EF:12:34:56:78:90:AB:CD:EF:12:34:56:78
```

### 4️⃣ Add SHA-1 to Firebase
1. Go to https://console.firebase.google.com
2. Select: **dormitorymanagement-caps-572cf**
3. Click ⚙️ → Project Settings
4. Scroll to "Your apps" → Android app
5. Click "Add fingerprint"
6. Paste SHA-1
7. Save

### 5️⃣ Build custom dev client
```bash
cd ..
npx expo run:android
```
⏱️ First build takes 5-10 minutes

---

## ✅ Done! Your custom dev client is now installed on your device/emulator

---

## Daily Development

```bash
npx expo start --dev-client
```

That's it! Your app will connect automatically.

- ✨ Hot reload works
- 🔄 Fast refresh enabled
- 🎯 Google Sign-In works

---

## When to Rebuild

Rebuild **only** after:
- Installing new native packages (`npx expo install package`)
- Changing `app.json` native configs
- Changing `google-services.json`

```bash
npx expo prebuild --clean
npx expo run:android
```

---

## Verify Google Sign-In Works

1. Launch app on device/emulator
2. Tap "Sign in with Google"
3. Browser opens → Select account
4. Returns to app
5. ✅ User authenticated

Check Metro logs for:
```
Starting native Google Sign-In...
Google authentication successful, signing in to Firebase...
Firebase sign-in successful: user@example.com
```

---

## Troubleshooting

### ❌ "DEVELOPER_ERROR"
**Fix:** Add SHA-1 to Firebase Console (Step 4 above)

### ❌ "No activity found to handle Intent"
**Fix:** Rebuild with `npx expo prebuild --clean && npx expo run:android`

### ❌ "Module not found: expo-auth-session"
**Fix:** `npx expo install expo-auth-session && npx expo prebuild --clean && npx expo run:android`

### ❌ App crashes on launch
**Fix:** Verify `google-services.json` package name matches `app.json`

---

## Key Differences: Expo Go vs Custom Dev Client

| | Expo Go | Custom Dev Client |
|---|---|---|
| **Google Sign-In** | ❌ No | ✅ Yes |
| **Native Modules** | Limited | All |
| **Build Required** | No | Yes (once) |
| **File Changes** | Fast refresh | Fast refresh |
| **Config Changes** | N/A | Requires rebuild |

---

## Scripts (Optional - for convenience)

### Windows
```bash
cd frontend
setup-dev-client.bat
```

### Mac/Linux
```bash
cd frontend
chmod +x setup-dev-client.sh
./setup-dev-client.sh
```

---

## 📚 Full Guide

See **[CUSTOM_DEV_CLIENT_GUIDE.md](../CUSTOM_DEV_CLIENT_GUIDE.md)** for detailed explanations.

---

**Your Google Sign-In implementation is already correct!**
You just need to build the custom dev client. 🎯
