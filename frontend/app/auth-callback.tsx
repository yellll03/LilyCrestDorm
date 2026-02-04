import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import * as Linking from 'expo-linking';

export default function AuthCallback() {
  const router = useRouter();
  const { processSessionId } = useAuth();
  const hasProcessed = useRef(false);
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Processing...');

  useEffect(() => {
    const handleAuth = async () => {
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      try {
        setStatus('Extracting session...');
        
        // Get session_id from URL params first (most reliable for web)
        let sessionId = params.session_id as string;
        
        // If not in params, try to get from URL fragment (for mobile)
        if (!sessionId) {
          const url = await Linking.getInitialURL();
          console.log('Auth callback URL:', url);
          
          if (url) {
            // Check URL fragment (after #)
            const hashIndex = url.indexOf('#');
            if (hashIndex !== -1) {
              const fragment = url.substring(hashIndex + 1);
              const fragmentParams = new URLSearchParams(fragment);
              sessionId = fragmentParams.get('session_id') || '';
            }
            
            // Also check query params (after ?)
            if (!sessionId) {
              const queryIndex = url.indexOf('?');
              if (queryIndex !== -1) {
                const query = url.substring(queryIndex + 1);
                const queryParams = new URLSearchParams(query);
                sessionId = queryParams.get('session_id') || '';
              }
            }
          }
        }

        console.log('Session ID found:', sessionId ? 'Yes' : 'No');

        if (sessionId) {
          setStatus('Signing in...');
          const success = await processSessionId(sessionId);
          if (success) {
            setStatus('Success! Redirecting...');
            router.replace('/(tabs)/dashboard');
          } else {
            setStatus('Sign in failed');
            setTimeout(() => router.replace('/login'), 2000);
          }
        } else {
          setStatus('No session found');
          console.log('No session_id found, redirecting to login');
          setTimeout(() => router.replace('/login'), 1500);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('Error occurred');
        setTimeout(() => router.replace('/login'), 2000);
      }
    };

    // Small delay to ensure URL params are loaded
    setTimeout(handleAuth, 500);
  }, [params.session_id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E3A5F" />
      <Text style={styles.text}>{status}</Text>
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
