import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('darkMode');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'true');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newValue = !isDarkMode;
      setIsDarkMode(newValue);
      await AsyncStorage.setItem('darkMode', newValue.toString());
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const colors = isDarkMode ? {
    // Dark theme
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    border: '#334155',
    primary: '#F97316',
    primaryLight: '#FDBA74',
    accent: '#1E3A5F',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    cardBg: '#1E293B',
    inputBg: '#334155',
    headerBg: '#0F172A',
  } : {
    // Light theme
    background: '#F5F5F5',
    surface: '#FFFFFF',
    surfaceSecondary: '#F8FAFC',
    text: '#1E3A5F',
    textSecondary: '#4B5563',
    textMuted: '#9CA3AF',
    border: '#E5E7EB',
    primary: '#F97316',
    primaryLight: '#FFF7ED',
    accent: '#1E3A5F',
    success: '#22C55E',
    error: '#EF4444',
    warning: '#F59E0B',
    cardBg: '#FFFFFF',
    inputBg: '#F3F4F6',
    headerBg: '#1E3A5F',
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
