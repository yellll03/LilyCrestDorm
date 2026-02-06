import React, { useRef, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform, Animated } from 'react-native';

// Animated Tab Icon Component
function AnimatedTabIcon({ focused, iconName, focusedIconName, label, color }) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const bgAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.05 : 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(bgAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [focused]);

  const bgColor = bgAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', '#FFF7ED'],
  });

  return (
    <View style={styles.tabItem}>
      <Animated.View style={[
        styles.iconWrapper,
        { backgroundColor: bgColor, transform: [{ scale: scaleAnim }] }
      ]}>
        <Ionicons 
          name={focused ? focusedIconName : iconName} 
          size={22} 
          color={focused ? '#F97316' : '#6B7280'} 
        />
      </Animated.View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
        {label}
      </Text>
    </View>
  );
}

// Home Tab Icon with animation only when focused
function HomeTabIcon({ focused }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const elevateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1.1 : 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(elevateAnim, {
        toValue: focused ? -8 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={styles.homeTabItem}>
      <Animated.View style={[
        styles.homeButton,
        focused && styles.homeButtonActive,
        { transform: [{ scale: scaleAnim }, { translateY: elevateAnim }] }
      ]}>
        <Ionicons 
          name="home" 
          size={24} 
          color="#FFFFFF" 
        />
      </Animated.View>
      <Text style={[styles.homeLabel, focused && styles.homeLabelActive]}>
        Home
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName="construct-outline"
              focusedIconName="construct"
              label="Services"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'News',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName="megaphone-outline"
              focusedIconName="megaphone"
              label="News"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <HomeTabIcon focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billings',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName="card-outline"
              focusedIconName="card"
              label="Billings"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <AnimatedTabIcon
              focused={focused}
              iconName="person-outline"
              focusedIconName="person"
              label="Profile"
            />
          ),
        }}
      />
      {/* Hidden tabs - accessible via navigation but not shown in tab bar */}
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chatbot"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#FFFFFF',
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingHorizontal: 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A5F',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
      web: {
        boxShadow: '0 -8px 24px rgba(30, 58, 95, 0.08)',
      },
    }),
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  iconWrapper: {
    width: 44,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  tabLabelActive: {
    color: '#F97316',
    fontWeight: '600',
  },
  homeTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  homeButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6B7280',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  homeButtonActive: {
    backgroundColor: '#1E3A5F',
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A5F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(30, 58, 95, 0.35)',
      },
    }),
  },
  homeLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: '#9CA3AF',
    marginTop: 2,
  },
  homeLabelActive: {
    color: '#F97316',
    fontWeight: '600',
  },
});
