import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Image, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';

const validatePhone = (phone) => {
  if (!phone) return { valid: true, error: '' };
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  if (!/^[\d+]+$/.test(cleanPhone)) return { valid: false, error: 'Phone number can only contain numbers' };
  if (cleanPhone.length < 10) return { valid: false, error: 'Phone number must be at least 10 digits' };
  return { valid: true, error: '' };
};

const validateName = (name) => {
  if (!name.trim()) return { valid: false, error: 'Name is required' };
  if (name.trim().length < 2) return { valid: false, error: 'Name must be at least 2 characters' };
  return { valid: true, error: '' };
};

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' });
  const [errors, setErrors] = useState({ name: '', phone: '', address: '' });
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  useEffect(() => {
    if (isEditing) {
      const nameValidation = validateName(formData.name);
      const phoneValidation = validatePhone(formData.phone);
      setErrors({ name: nameValidation.error, phone: phoneValidation.error, address: '' });
    }
  }, [formData, isEditing]);

  const handleLogout = () => setLogoutModalVisible(true);

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/');
  };

  const handleSave = async () => {
    const nameValidation = validateName(formData.name);
    const phoneValidation = validatePhone(formData.phone);
    if (!nameValidation.valid || !phoneValidation.valid) { Alert.alert('Validation Error', 'Please fix the errors before saving'); return; }
    setIsLoading(true);
    try {
      const response = await apiService.updateProfile(formData);
      updateUser(response.data);
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) { Alert.alert('Permission Required', 'Please allow access to your photo library'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      try {
        setIsLoading(true);
        const response = await apiService.updateProfile({ picture: base64Image });
        updateUser(response.data);
        Alert.alert('Success', 'Profile picture updated');
      } catch (error) {
        Alert.alert('Error', 'Failed to update profile picture');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Edit Profile', onPress: () => setIsEditing(true), color: '#1E3A5F' },
    { icon: 'receipt-outline', label: 'Billing History', onPress: () => router.push({ pathname: '/(tabs)/billing', params: { from: 'profile' } }), color: '#1E3A5F' },
    { icon: 'document-text-outline', label: 'House Rules', onPress: () => router.push('/documents'), color: '#1E3A5F' },
    { icon: 'settings-outline', label: 'Settings', onPress: () => router.push('/settings'), color: '#1E3A5F' },
    { icon: 'chatbubbles-outline', label: 'Help & Support', onPress: () => router.push('/(tabs)/chatbot'), color: '#1E3A5F' },
    { icon: 'information-circle-outline', label: 'About', onPress: () => router.push('/about'), color: '#1E3A5F' },
  ];

  const isFormValid = !errors.name && !errors.phone && formData.name.trim().length > 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><Text style={styles.headerTitle}>Profile</Text></View>

        <View style={styles.profileCard}>
          <TouchableOpacity style={styles.avatarContainer} onPress={pickImage}>
            {user?.picture ? <Image source={{ uri: user.picture }} style={styles.avatar} /> : <View style={styles.avatarPlaceholder}><Ionicons name="person" size={40} color="#9CA3AF" /></View>}
            <View style={styles.editAvatarButton}><Ionicons name="camera" size={14} color="#FFFFFF" /></View>
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || ''}</Text>
          <View style={styles.statusContainer}><View style={styles.statusBadge}><View style={styles.statusDot} /><Text style={styles.statusText}>Active Tenant</Text></View></View>
        </View>

        {isEditing ? (
          <View style={styles.editForm}>
            <View style={styles.formHeader}><Text style={styles.sectionTitle}>Edit Profile</Text><TouchableOpacity onPress={() => { setIsEditing(false); setFormData({ name: user?.name || '', phone: user?.phone || '', address: user?.address || '' }); }}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity></View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput style={[styles.input, errors.name ? styles.inputError : null]} value={formData.name} onChangeText={(text) => setFormData({ ...formData, name: text })} placeholder="Enter your full name" placeholderTextColor="#9CA3AF" />
              {errors.name ? <View style={styles.errorContainer}><Ionicons name="alert-circle" size={14} color="#EF4444" /><Text style={styles.errorText}>{errors.name}</Text></View> : null}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput style={[styles.input, errors.phone ? styles.inputError : null]} value={formData.phone} onChangeText={(text) => setFormData({ ...formData, phone: text })} placeholder="Enter your phone" placeholderTextColor="#9CA3AF" keyboardType="numeric" />
              {errors.phone ? <View style={styles.errorContainer}><Ionicons name="alert-circle" size={14} color="#EF4444" /><Text style={styles.errorText}>{errors.phone}</Text></View> : null}
            </View>
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Address</Text>
              <TextInput style={[styles.input, styles.textArea]} value={formData.address} onChangeText={(text) => setFormData({ ...formData, address: text })} placeholder="Enter your address (optional)" placeholderTextColor="#9CA3AF" multiline numberOfLines={3} />
            </View>
            <TouchableOpacity style={[styles.saveButton, !isFormValid && styles.saveButtonDisabled]} onPress={handleSave} disabled={isLoading || !isFormValid}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="checkmark" size={20} color="#FFFFFF" /><Text style={styles.saveButtonText}>Save Changes</Text></>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.menuSection}>
            {menuItems.map((item, index) => (
              <TouchableOpacity key={index} style={[styles.menuItem, index === menuItems.length - 1 && styles.menuItemLast]} onPress={item.onPress} activeOpacity={0.7}>
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, { backgroundColor: `${item.color}10` }]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {!isEditing && <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}><Ionicons name="log-out-outline" size={20} color="#EF4444" /><Text style={styles.logoutText}>Sign Out</Text></TouchableOpacity>}
        {!isEditing && <Text style={styles.versionText}>Version 1.0.0</Text>}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <Modal visible={logoutModalVisible} transparent={true} animationType="fade" onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}><Ionicons name="log-out-outline" size={32} color="#EF4444" /></View>
            <Text style={styles.modalTitle}>Sign Out?</Text>
            <Text style={styles.modalMessage}>Are you sure you want to sign out?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setLogoutModalVisible(false)}><Text style={styles.modalCancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmButton} onPress={confirmLogout}><Text style={styles.modalConfirmText}>Sign Out</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 16 },
  header: { paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#1E3A5F' },
  profileCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 20, borderRadius: 20, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: '#E5E7EB' },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#E5E7EB' },
  editAvatarButton: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  userName: { fontSize: 20, fontWeight: '600', color: '#1E3A5F', marginBottom: 4 },
  userEmail: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  statusContainer: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  statusText: { fontSize: 13, fontWeight: '500', color: '#166534' },
  menuSection: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuItemLast: { borderBottomWidth: 0 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuIconContainer: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  menuItemText: { fontSize: 15, color: '#374151', fontWeight: '500' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginTop: 20, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, borderColor: '#FEE2E2', backgroundColor: '#FEF2F2', gap: 8 },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  versionText: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginTop: 16 },
  editForm: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A5F' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1F2937', backgroundColor: '#FAFAFA' },
  inputError: { borderColor: '#EF4444', backgroundColor: '#FEF2F2' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  errorContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  errorText: { fontSize: 12, color: '#EF4444' },
  saveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A5F', paddingVertical: 14, borderRadius: 12, marginTop: 8, gap: 8 },
  saveButtonDisabled: { backgroundColor: '#94A3B8' },
  saveButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  bottomSpacer: { height: Platform.OS === 'ios' ? 100 : 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center' },
  modalIconContainer: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  modalCancelButton: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  modalConfirmButton: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#EF4444', alignItems: 'center' },
  modalConfirmText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
});
