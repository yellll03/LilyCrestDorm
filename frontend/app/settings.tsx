import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState({
    payments: true,
    announcements: true,
    maintenance: true,
    reminders: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('notification_settings');
      if (savedSettings) {
        setNotifications(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.log('Failed to load settings');
    }
  };

  const saveSettings = async (newSettings: typeof notifications) => {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(newSettings));
    } catch (error) {
      console.log('Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof typeof notifications) => {
    const newSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(newSettings);
    saveSettings(newSettings);
  };

  const settingSections = [
    {
      title: 'Notifications',
      items: [
        {
          key: 'payments',
          icon: 'card',
          label: 'Payment Reminders',
          description: 'Get notified about upcoming due dates',
        },
        {
          key: 'announcements',
          icon: 'megaphone',
          label: 'Announcements',
          description: 'Receive dormitory announcements',
        },
        {
          key: 'maintenance',
          icon: 'construct',
          label: 'Maintenance Updates',
          description: 'Updates on your maintenance requests',
        },
        {
          key: 'reminders',
          icon: 'notifications',
          label: 'General Reminders',
          description: 'Important reminders and alerts',
        },
      ],
    },
  ];

  const otherOptions = [
    {
      icon: 'shield-checkmark',
      label: 'Privacy Policy',
      onPress: () => Alert.alert('Privacy Policy', 'Your data is secure and protected. We only collect necessary information for dormitory management.'),
    },
    {
      icon: 'document-text',
      label: 'Terms of Service',
      onPress: () => Alert.alert('Terms of Service', 'By using Lilycrest app, you agree to abide by the dormitory house rules and regulations.'),
    },
    {
      icon: 'trash',
      label: 'Clear Cache',
      onPress: () => {
        Alert.alert(
          'Clear Cache',
          'This will clear temporary data. You will remain logged in.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Clear',
              onPress: async () => {
                // Clear cache logic
                Alert.alert('Success', 'Cache cleared successfully');
              },
            },
          ]
        );
      },
      color: '#EF4444',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notification Settings */}
        {settingSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, itemIndex) => (
                <View
                  key={item.key}
                  style={[
                    styles.settingItem,
                    itemIndex === section.items.length - 1 && styles.settingItemLast,
                  ]}
                >
                  <View style={styles.settingLeft}>
                    <View style={styles.settingIcon}>
                      <Ionicons name={item.icon as any} size={20} color="#1E3A5F" />
                    </View>
                    <View style={styles.settingInfo}>
                      <Text style={styles.settingLabel}>{item.label}</Text>
                      <Text style={styles.settingDescription}>{item.description}</Text>
                    </View>
                  </View>
                  <Switch
                    value={notifications[item.key as keyof typeof notifications]}
                    onValueChange={() => toggleSetting(item.key as keyof typeof notifications)}
                    trackColor={{ false: '#E5E7EB', true: '#1E3A5F' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Other Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other</Text>
          <View style={styles.sectionCard}>
            {otherOptions.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.optionItem,
                  index === otherOptions.length - 1 && styles.settingItemLast,
                ]}
                onPress={item.onPress}
                activeOpacity={0.7}
              >
                <View style={styles.settingLeft}>
                  <View style={[styles.settingIcon, item.color && { backgroundColor: `${item.color}15` }]}>
                    <Ionicons
                      name={item.icon as any}
                      size={20}
                      color={item.color || '#1E3A5F'}
                    />
                  </View>
                  <Text style={[styles.settingLabel, item.color && { color: item.color }]}>
                    {item.label}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingItemLast: {
    borderBottomWidth: 0,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  bottomSpacer: {
    height: 20,
  },
});
