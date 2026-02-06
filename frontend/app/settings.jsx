import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SettingsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [biometrics, setBiometrics] = useState(false);

  const handleToggle = (setting, value) => {
    switch(setting) {
      case 'notifications': setNotifications(value); break;
      case 'darkMode': setDarkMode(value); Alert.alert('Coming Soon', 'Dark mode will be available in a future update.'); setDarkMode(false); break;
      case 'biometrics': setBiometrics(value); break;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}><Ionicons name="notifications" size={20} color="#3B82F6" /></View>
              <View><Text style={styles.settingLabel}>Push Notifications</Text><Text style={styles.settingDescription}>Receive important updates</Text></View>
            </View>
            <Switch value={notifications} onValueChange={(value) => handleToggle('notifications', value)} trackColor={{ false: '#E5E7EB', true: '#3B82F6' }} thumbColor="#FFFFFF" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3E8FF' }]}><Ionicons name="moon" size={20} color="#9333EA" /></View>
              <View><Text style={styles.settingLabel}>Dark Mode</Text><Text style={styles.settingDescription}>Coming soon</Text></View>
            </View>
            <Switch value={darkMode} onValueChange={(value) => handleToggle('darkMode', value)} trackColor={{ false: '#E5E7EB', true: '#9333EA' }} thumbColor="#FFFFFF" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#DCFCE7' }]}><Ionicons name="finger-print" size={20} color="#22C55E" /></View>
              <View><Text style={styles.settingLabel}>Biometric Login</Text><Text style={styles.settingDescription}>Use fingerprint or Face ID</Text></View>
            </View>
            <Switch value={biometrics} onValueChange={(value) => handleToggle('biometrics', value)} trackColor={{ false: '#E5E7EB', true: '#22C55E' }} thumbColor="#FFFFFF" />
          </View>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}><Ionicons name="lock-closed" size={20} color="#EF4444" /></View>
              <View><Text style={styles.settingLabel}>Change Password</Text><Text style={styles.settingDescription}>Update your password</Text></View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/privacy-policy')}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}><Ionicons name="shield-checkmark" size={20} color="#6B7280" /></View>
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/terms-of-service')}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconContainer, { backgroundColor: '#F3F4F6' }]}><Ionicons name="document-text" size={20} color="#6B7280" /></View>
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A5F' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 16, overflow: 'hidden' },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  settingLabel: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  settingDescription: { fontSize: 12, color: '#9CA3AF', marginTop: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
});
