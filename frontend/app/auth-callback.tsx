import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import * as Linking from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();
  const { processSessionId } = useAuth();
  const hasProcessed = useRef(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleAuth = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        // Get the current URL to extract session_id from fragment
        const url = await Linking.getInitialURL();
        let sessionId = null;

        if (url) {
          // Extract session_id from URL fragment
          const hashIndex = url.indexOf('#');
          if (hashIndex !== -1) {
            const fragment = url.substring(hashIndex + 1);
            const params = new URLSearchParams(fragment);
            sessionId = params.get('session_id');
          }
        }

        // Also check URL params
        if (!sessionId && params.session_id) {
          sessionId = params.session_id as string;
        }

        if (sessionId) {
          const success = await processSessionId(sessionId);
          if (success) {
            router.replace('/(tabs)/dashboard');
          } else {
            router.replace('/login');
          }
        } else {
          router.replace('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/login');
      }
    };

    handleAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E3A5F" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: '#4B5563',
  },
});
