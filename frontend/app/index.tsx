import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading, checkAuth } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const init = async () => {
      await checkAuth();
      setChecking(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (!checking && !isLoading && user) {
      router.replace('/(tabs)/dashboard');
    }
  }, [checking, isLoading, user]);

  if (checking || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.gradient}>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={styles.title}>Looking for your just-right space in the city?</Text>
            <Text style={styles.subtitle}>
              Lilycrest dormitory has a co-living setup that fits your lifestyle and budget. Swipe to see your options and find your perfect fit.
            </Text>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.loginButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.loginButtonText}>Login</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signupButton}
              onPress={() => router.push('/login')}
            >
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: width,
    height: height,
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    paddingHorizontal: 24,
  },
  textContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#E0E0E0',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  loginButton: {
    flex: 1,
    backgroundColor: '#1E3A5F',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  signupButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  signupButtonText: {
    color: '#1E3A5F',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
});
