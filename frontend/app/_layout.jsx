import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="login" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="change-password" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth-callback" />
          <Stack.Screen name="documents" options={{ presentation: 'modal' }} />
          <Stack.Screen name="my-documents" />
          <Stack.Screen name="house-rules" />
          <Stack.Screen name="billing-history" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="about" />
          <Stack.Screen name="privacy-policy" />
          <Stack.Screen name="terms-of-service" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
