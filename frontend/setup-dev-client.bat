@echo off
REM Custom Dev Client Setup Script for Windows
REM Run this from the frontend directory

echo ==========================================
echo Custom Dev Client Setup for Google Sign-In
echo ==========================================
echo.

REM Step 1: Install expo-dev-client
echo Step 1: Installing expo-dev-client...
call npx expo install expo-dev-client

REM Step 2: Clean and prebuild
echo.
echo Step 2: Generating native projects...
call npx expo prebuild --clean

REM Step 3: Get SHA-1 fingerprint
echo.
echo Step 3: Getting SHA-1 fingerprint...
echo Running: cd android ^&^& gradlew.bat signingReport
echo.
cd android
if exist "gradlew.bat" (
  call gradlew.bat signingReport | findstr "SHA1:"
) else (
  echo ERROR: gradlew.bat not found. Run 'npx expo prebuild' first.
  exit /b 1
)
cd ..

echo.
echo ==========================================
echo WARNING: Copy the SHA-1 fingerprint above
echo    and add it to Firebase Console:
echo.
echo    1. Go to: https://console.firebase.google.com
echo    2. Select: dormitorymanagement-caps-572cf
echo    3. Settings -^> Your apps -^> Android app
echo    4. Click 'Add fingerprint'
echo    5. Paste the SHA-1
echo    6. Save
echo ==========================================
echo.
pause

REM Step 4: Build the dev client
echo.
echo Step 4: Building custom dev client...
echo This will take 5-10 minutes on first build...
call npx expo run:android

echo.
echo ==========================================
echo Custom Dev Client Built Successfully!
echo ==========================================
echo.
echo To run your app daily:
echo   npx expo start --dev-client
echo.
echo To rebuild after config changes:
echo   npx expo prebuild --clean
echo   npx expo run:android
echo.
echo ==========================================
pause
