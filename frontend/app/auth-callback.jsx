import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { processSessionId } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const sessionId = params.session_id;
        if (sessionId) {
          const success = await processSessionId(sessionId);
          if (success) {
            router.replace('/(tabs)/home');
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
    handleCallback();
  }, [params.session_id]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#1E3A5F" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' },
  text: { marginTop: 16, fontSize: 16, color: '#6B7280' },
});
