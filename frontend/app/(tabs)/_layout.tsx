import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform } from 'react-native';

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
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons 
                  name={focused ? "construct" : "construct-outline"} 
                  size={22} 
                  color={focused ? '#F97316' : '#6B7280'} 
                />
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Services
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="announcements"
        options={{
          title: 'Announcements',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons 
                  name={focused ? "megaphone" : "megaphone-outline"} 
                  size={22} 
                  color={focused ? '#F97316' : '#6B7280'} 
                />
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                News
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerTabItem}>
              <View style={styles.centerButton}>
                <Ionicons name="home" size={26} color="#FFFFFF" />
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="billing"
        options={{
          title: 'Billings',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons 
                  name={focused ? "card" : "card-outline"} 
                  size={22} 
                  color={focused ? '#F97316' : '#6B7280'} 
                />
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Billings
              </Text>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.tabItem}>
              <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                <Ionicons 
                  name={focused ? "person" : "person-outline"} 
                  size={22} 
                  color={focused ? '#F97316' : '#6B7280'} 
                />
              </View>
              <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>
                Profile
              </Text>
            </View>
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
    height: Platform.OS === 'ios' ? 88 : 68,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
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
  iconWrapperActive: {
    backgroundColor: '#FFF7ED',
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
  centerTabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -32,
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#1E3A5F',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 8px 20px rgba(30, 58, 95, 0.35)',
      },
    }),
  },
});
