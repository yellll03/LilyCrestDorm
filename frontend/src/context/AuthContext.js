import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { api } from '../services/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    try {
      setIsLoading(true);
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      }
    } catch (error) {
      console.log('Auth check failed:', error);
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    const result = await loginWithEmail(email, password);
    return result.success;
  };

  const loginWithEmail = async (email, password) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, session_token } = response.data;
      
      await AsyncStorage.setItem('session_token', session_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      
      if (status === 403) {
        return { 
          success: false, 
          error: detail || 'Your account is not registered as an active tenant. Please contact the dormitory administrator.' 
        };
      } else if (status === 401) {
        return { 
          success: false, 
          error: detail || 'Invalid email or password. Please try again.' 
        };
      } else if (status === 429) {
        return { 
          success: false, 
          error: 'Too many failed attempts. Please try again later.' 
        };
      } else {
        return { 
          success: false, 
          error: 'Unable to sign in. Please check your connection and try again.' 
        };
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Firebase Google Sign-In
  const signInWithGoogle = async (idToken) => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/auth/google', { idToken });
      const { user: userData, session_token } = response.data;
      
      await AsyncStorage.setItem('session_token', session_token);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      
      if (status === 403) {
        return { 
          success: false, 
          error: detail || 'Access denied. Your account is not registered as an active tenant.' 
        };
      } else if (status === 401) {
        return { 
          success: false, 
          error: detail || 'Invalid authentication. Please try again.' 
        };
      } else {
        return { 
          success: false, 
          error: 'Unable to sign in with Google. Please try again.' 
        };
      }
    } finally {
      setIsLoading(false);
    }
  };

  const processSessionId = async (sessionId) => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/session', { session_id: sessionId });
      const { user: userData, session_token } = response.data;
      
      await AsyncStorage.setItem('session_token', session_token);
      setUser(userData);
      return true;
    } catch (error) {
      console.error('Process session error:', error);
      
      if (error.response?.status === 403) {
        const message = error.response?.data?.detail || 
          'Your account is not registered as an active tenant. Please contact the dormitory administrator.';
        Alert.alert('Access Denied', message);
      } else if (error.response?.status === 401) {
        Alert.alert('Authentication Failed', 'Invalid session. Please try logging in again.');
      } else {
        Alert.alert('Error', 'Unable to sign in. Please try again later.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = await AsyncStorage.getItem('session_token');
      if (token) {
        await api.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem('session_token');
      setUser(null);
    }
  };

  const updateUser = (data) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithEmail,
        logout,
        checkAuth,
        processSessionId,
        signInWithGoogle,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
