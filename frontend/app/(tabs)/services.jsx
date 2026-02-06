import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../../src/services/api';
import { format } from 'date-fns';

const REQUEST_TYPES = [
  { id: 'maintenance', label: 'Maintenance', icon: 'construct', color: '#F59E0B' },
  { id: 'plumbing', label: 'Plumbing', icon: 'water', color: '#3B82F6' },
  { id: 'electrical', label: 'Electrical', icon: 'flash', color: '#EF4444' },
  { id: 'aircon', label: 'Air Conditioning', icon: 'snow', color: '#06B6D4' },
  { id: 'cleaning', label: 'Cleaning', icon: 'sparkles', color: '#22C55E' },
  { id: 'pest', label: 'Pest Control', icon: 'bug', color: '#8B5CF6' },
  { id: 'furniture', label: 'Furniture', icon: 'bed', color: '#EC4899' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280' },
];

const URGENCY_LEVELS = [
  { id: 'low', label: 'Low', description: 'Can wait a few days', color: '#22C55E' },
  { id: 'normal', label: 'Normal', description: 'Within 1-2 days', color: '#F59E0B' },
  { id: 'high', label: 'Urgent', description: 'Needs immediate attention', color: '#EF4444' },
];

export default function ServicesScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('new');
  const pollingRef = useRef(null);

  const [selectedType, setSelectedType] = useState(null);
  const [selectedUrgency, setSelectedUrgency] = useState('normal');
  const [description, setDescription] = useState('');

  const fetchRequests = async () => {
    try {
      const response = await apiService.getMyMaintenance();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    pollingRef.current = setInterval(() => { fetchRequests(); }, 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, []);

  const handleSubmit = async () => {
    if (!selectedType) { Alert.alert('Error', 'Please select a service type'); return; }
    if (!description.trim()) { Alert.alert('Error', 'Please describe your concern'); return; }

    setSubmitting(true);
    try {
      await apiService.createMaintenance({ request_type: selectedType, description: description.trim(), urgency: selectedUrgency });
      Alert.alert('Request Submitted', 'Your service request has been submitted successfully.', [{ text: 'OK', onPress: () => { setShowModal(false); resetForm(); fetchRequests(); }}]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => { setSelectedType(null); setSelectedUrgency('normal'); setDescription(''); };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return { bg: '#DCFCE7', text: '#22C55E' };
      case 'in_progress': return { bg: '#DBEAFE', text: '#3B82F6' };
      case 'pending': return { bg: '#FEF3C7', text: '#F59E0B' };
      default: return { bg: '#F3F4F6', text: '#6B7280' };
    }
  };

  const getTypeInfo = (type) => REQUEST_TYPES.find(t => t.id === type) || REQUEST_TYPES[7];

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1E3A5F" /></View>;

  const pendingRequests = requests.filter(r => r.status !== 'completed');
  const completedRequests = requests.filter(r => r.status === 'completed');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Services & Inquiries</Text>
        <View style={styles.refreshIndicator}><Ionicons name="sync" size={18} color="#9CA3AF" /></View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.submitCard} onPress={() => setShowModal(true)}>
          <View style={styles.submitIcon}><Ionicons name="add-circle" size={32} color="#F97316" /></View>
          <View style={styles.submitContent}>
            <Text style={styles.submitTitle}>Submit New Inquiry</Text>
            <Text style={styles.submitDescription}>Report issues, request maintenance, or send concerns</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
        </TouchableOpacity>

        <View style={styles.quickServicesCard}>
          <Text style={styles.sectionTitle}>Quick Service Request</Text>
          <View style={styles.servicesGrid}>
            {REQUEST_TYPES.slice(0, 6).map((type) => (
              <TouchableOpacity key={type.id} style={styles.serviceItem} onPress={() => { setSelectedType(type.id); setShowModal(true); }}>
                <View style={[styles.serviceIcon, { backgroundColor: `${type.color}15` }]}>
                  <Ionicons name={type.icon} size={24} color={type.color} />
                </View>
                <Text style={styles.serviceLabel}>{type.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tab, activeTab === 'new' && styles.tabActive]} onPress={() => setActiveTab('new')}>
            <Ionicons name="time-outline" size={18} color={activeTab === 'new' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>Active ({pendingRequests.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, activeTab === 'history' && styles.tabActive]} onPress={() => setActiveTab('history')}>
            <Ionicons name="checkmark-circle-outline" size={18} color={activeTab === 'history' ? '#FFFFFF' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Completed ({completedRequests.length})</Text>
          </TouchableOpacity>
        </View>

        {(activeTab === 'new' ? pendingRequests : completedRequests).length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name={activeTab === 'new' ? 'checkmark-done-circle' : 'document-text-outline'} size={48} color={activeTab === 'new' ? '#22C55E' : '#9CA3AF'} /></View>
            <Text style={styles.emptyTitle}>{activeTab === 'new' ? 'No Active Requests' : 'No Completed Requests'}</Text>
            <Text style={styles.emptyText}>{activeTab === 'new' ? 'All your service requests have been resolved.' : 'Your completed requests will appear here.'}</Text>
          </View>
        ) : (activeTab === 'new' ? pendingRequests : completedRequests).map((request) => {
          const typeInfo = getTypeInfo(request.request_type);
          const statusColor = getStatusColor(request.status);
          return (
            <View key={request.request_id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={[styles.requestIcon, { backgroundColor: `${typeInfo.color}15` }]}>
                  <Ionicons name={typeInfo.icon} size={24} color={typeInfo.color} />
                </View>
                <View style={styles.requestInfo}>
                  <Text style={styles.requestType}>{typeInfo.label}</Text>
                  <Text style={styles.requestDate}>{format(new Date(request.created_at), 'MMM dd, yyyy • h:mm a')}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                  <Text style={[styles.statusText, { color: statusColor.text }]}>{request.status === 'in_progress' ? 'In Progress' : request.status.charAt(0).toUpperCase() + request.status.slice(1)}</Text>
                </View>
              </View>
              <Text style={styles.requestDescription} numberOfLines={2}>{request.description}</Text>
              {request.urgency === 'high' && <View style={styles.urgencyBadge}><Ionicons name="warning" size={14} color="#EF4444" /><Text style={styles.urgencyText}>Urgent</Text></View>}
            </View>
          );
        })}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      <TouchableOpacity style={styles.chatbotButton} onPress={() => router.push('/(tabs)/chatbot')}>
        <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal visible={showModal} animationType="slide" transparent={true} onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Submit Inquiry</Text>
                <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalSectionTitle}>Select Service Type</Text>
                <View style={styles.typeGrid}>
                  {REQUEST_TYPES.map((type) => (
                    <TouchableOpacity key={type.id} style={[styles.typeItem, selectedType === type.id && styles.typeItemSelected]} onPress={() => setSelectedType(type.id)}>
                      <View style={[styles.typeIcon, { backgroundColor: selectedType === type.id ? type.color : `${type.color}15` }]}>
                        <Ionicons name={type.icon} size={20} color={selectedType === type.id ? '#FFFFFF' : type.color} />
                      </View>
                      <Text style={[styles.typeLabel, selectedType === type.id && styles.typeLabelSelected]}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.modalSectionTitle}>Urgency Level</Text>
                <View style={styles.urgencyOptions}>
                  {URGENCY_LEVELS.map((level) => (
                    <TouchableOpacity key={level.id} style={[styles.urgencyOption, selectedUrgency === level.id && { borderColor: level.color, borderWidth: 2 }]} onPress={() => setSelectedUrgency(level.id)}>
                      <View style={[styles.urgencyDot, { backgroundColor: level.color }]} />
                      <View style={styles.urgencyContent}><Text style={styles.urgencyLabel}>{level.label}</Text><Text style={styles.urgencyDesc}>{level.description}</Text></View>
                      {selectedUrgency === level.id && <Ionicons name="checkmark-circle" size={22} color={level.color} />}
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.modalSectionTitle}>Describe Your Concern</Text>
                <TextInput style={styles.descriptionInput} placeholder="Please provide details..." placeholderTextColor="#9CA3AF" multiline numberOfLines={4} textAlignVertical="top" value={description} onChangeText={setDescription} />
                <TouchableOpacity style={[styles.submitButton, submitting && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <><Ionicons name="send" size={20} color="#FFFFFF" /><Text style={styles.submitButtonText}>Submit Request</Text></>}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E3A5F' },
  refreshIndicator: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  submitCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 2, borderColor: '#FFF7ED', borderStyle: 'dashed' },
  submitIcon: { marginRight: 14 },
  submitContent: { flex: 1 },
  submitTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 4 },
  submitDescription: { fontSize: 13, color: '#6B7280' },
  quickServicesCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 14 },
  servicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  serviceItem: { width: '30%', alignItems: 'center' },
  serviceIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  serviceLabel: { fontSize: 11, color: '#6B7280', textAlign: 'center' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4, marginBottom: 16 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: 10, gap: 6 },
  tabActive: { backgroundColor: '#1E3A5F' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#FFFFFF' },
  emptyState: { alignItems: 'center', paddingVertical: 48, backgroundColor: '#FFFFFF', borderRadius: 16 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A5F', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingHorizontal: 32 },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  requestIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  requestInfo: { flex: 1 },
  requestType: { fontSize: 15, fontWeight: '600', color: '#1E3A5F', marginBottom: 2 },
  requestDate: { fontSize: 12, color: '#6B7280' },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  requestDescription: { fontSize: 14, color: '#4B5563', lineHeight: 20 },
  urgencyBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 4 },
  urgencyText: { fontSize: 12, color: '#EF4444', fontWeight: '500' },
  bottomSpacer: { height: Platform.OS === 'ios' ? 120 : 100 },
  chatbotButton: { position: 'absolute', bottom: Platform.OS === 'ios' ? 110 : 90, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center', ...Platform.select({ ios: { shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 }, android: { elevation: 8 }, web: { boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)' } }) },
  modalContainer: { flex: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#1E3A5F' },
  modalSectionTitle: { fontSize: 14, fontWeight: '600', color: '#1E3A5F', marginBottom: 12, marginTop: 8 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  typeItem: { width: '23%', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#F9FAFB' },
  typeItemSelected: { backgroundColor: '#FFF7ED', borderWidth: 1, borderColor: '#F97316' },
  typeIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  typeLabel: { fontSize: 10, color: '#6B7280', textAlign: 'center' },
  typeLabelSelected: { color: '#F97316', fontWeight: '600' },
  urgencyOptions: { gap: 10, marginBottom: 16 },
  urgencyOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E5E7EB' },
  urgencyDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
  urgencyContent: { flex: 1 },
  urgencyLabel: { fontSize: 14, fontWeight: '600', color: '#1E3A5F' },
  urgencyDesc: { fontSize: 12, color: '#6B7280' },
  descriptionInput: { backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16, fontSize: 15, color: '#1F2937', minHeight: 120, marginBottom: 20 },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A5F', borderRadius: 12, paddingVertical: 16, gap: 8, marginBottom: 20 },
  submitButtonDisabled: { opacity: 0.7 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
