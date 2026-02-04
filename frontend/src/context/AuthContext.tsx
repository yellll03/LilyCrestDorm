import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { api } from '../services/api';

interface User {
  user_id: string;
  email: string;
  name: string;
  picture?: string;
  phone?: string;
  address?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  processSessionId: (sessionId: string) => Promise<boolean>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
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

  const login = async (email: string, password: string): Promise<boolean> => {
    const result = await loginWithEmail(email, password);
    return result.success;
  };

  const loginWithEmail = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, session_token } = response.data;
      
      await AsyncStorage.setItem('session_token', session_token);
      setUser(userData);
      
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error cases
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

  const processSessionId = async (sessionId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      const response = await api.post('/auth/session', { session_id: sessionId });
      const { user: userData, session_token } = response.data;
      
      await AsyncStorage.setItem('session_token', session_token);
      setUser(userData);
      return true;
    } catch (error: any) {
      console.error('Process session error:', error);
      
      // Handle specific error cases
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

  const updateUser = (data: Partial<User>) => {
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
