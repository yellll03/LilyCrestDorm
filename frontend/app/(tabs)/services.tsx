import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../../src/services/api';
import { format } from 'date-fns';

interface MaintenanceRequest {
  request_id: string;
  user_id: string;
  request_type: string;
  description: string;
  urgency: string;
  status: string;
  notes?: string;
  created_at: string;
  completed_at?: string;
}

type TabType = 'all' | 'pending' | 'completed';

export default function ServicesScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [newRequest, setNewRequest] = useState({
    request_type: '',
    description: '',
    urgency: 'normal',
  });
  const [submitting, setSubmitting] = useState(false);

  const requestTypes = [
    { label: 'Electrical', value: 'Electrical', icon: 'flash' },
    { label: 'Plumbing', value: 'Plumbing', icon: 'water' },
    { label: 'AC', value: 'AC', icon: 'snow' },
    { label: 'Door Lock', value: 'Door Lock', icon: 'key' },
    { label: 'Other', value: 'Other', icon: 'construct' },
  ];

  const fetchRequests = async () => {
    try {
      const response = await apiService.getMyMaintenance();
      setRequests(response.data);
    } catch (error) {
      console.error('Fetch maintenance error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, []);

  const handleSubmit = async () => {
    if (!newRequest.request_type || !newRequest.description) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.createMaintenance({
        user_id: '', // Will be set by backend
        request_type: newRequest.request_type,
        description: newRequest.description,
        urgency: newRequest.urgency,
      });
      setModalVisible(false);
      setNewRequest({ request_type: '', description: '', urgency: 'normal' });
      fetchRequests();
      Alert.alert('Success', 'Maintenance request submitted successfully');
    } catch (error) {
      console.error('Submit request error:', error);
      Alert.alert('Error', 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (activeTab === 'pending') return ['pending', 'in_progress'].includes(req.status);
    if (activeTab === 'completed') return req.status === 'completed';
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#F59E0B';
      case 'in_progress':
        return '#3B82F6';
      case 'completed':
        return '#22C55E';
      default:
        return '#6B7280';
    }
  };

  const getTypeIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type.toLowerCase()) {
      case 'electrical':
        return 'flash';
      case 'plumbing':
        return 'water';
      case 'ac':
        return 'snow';
      case 'door lock':
        return 'key';
      default:
        return 'construct';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.branchName}>Lilycrest Gil Puyat Branch</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationButton}
          onPress={() => router.push('/(tabs)/announcements')}
        >
          <Ionicons name="notifications-outline" size={24} color="#1E3A5F" />
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="construct" size={20} color="#FFFFFF" />
        <Text style={styles.submitButtonText}>Submit Maintenance Request</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['all', 'pending', 'completed'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Requests List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="construct-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No maintenance requests</Text>
          </View>
        ) : (
          <>
            {activeTab !== 'completed' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pending Requests</Text>
                {filteredRequests
                  .filter((r) => ['pending', 'in_progress'].includes(r.status))
                  .map((request) => (
                    <View key={request.request_id} style={styles.requestCard}>
                      <View style={[styles.requestIcon, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons
                          name={getTypeIcon(request.request_type)}
                          size={24}
                          color="#F59E0B"
                        />
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestType}>{request.request_type}</Text>
                        <View style={styles.statusBadge}>
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: getStatusColor(request.status) },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: getStatusColor(request.status) },
                            ]}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1).replace('_', ' ')}
                          </Text>
                        </View>
                        <Text style={styles.requestDate}>
                          Request Date: {format(new Date(request.created_at), 'MMM dd, yyyy')}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {activeTab !== 'pending' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Completed Requests</Text>
                {filteredRequests
                  .filter((r) => r.status === 'completed')
                  .map((request) => (
                    <View key={request.request_id} style={styles.requestCard}>
                      <View style={[styles.requestIcon, { backgroundColor: '#DCFCE7' }]}>
                        <Ionicons
                          name={getTypeIcon(request.request_type)}
                          size={24}
                          color="#22C55E"
                        />
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestType}>{request.request_type}</Text>
                        <View style={styles.statusBadge}>
                          <View
                            style={[styles.statusDot, { backgroundColor: '#22C55E' }]}
                          />
                          <Text style={[styles.statusText, { color: '#22C55E' }]}>
                            Completed
                          </Text>
                        </View>
                        {request.completed_at && (
                          <Text style={styles.requestDate}>
                            Completed Date:{' '}
                            {format(new Date(request.completed_at), 'MMM dd, yyyy')}
                          </Text>
                        )}
                        {request.notes && (
                          <Text style={styles.requestNote}>Note: {request.notes}</Text>
                        )}
                      </View>
                    </View>
                  ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* New Request Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Maintenance Request</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1E3A5F" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Request Type *</Text>
            <View style={styles.typeGrid}>
              {requestTypes.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeButton,
                    newRequest.request_type === type.value && styles.typeButtonActive,
                  ]}
                  onPress={() =>
                    setNewRequest({ ...newRequest, request_type: type.value })
                  }
                >
                  <Ionicons
                    name={type.icon as keyof typeof Ionicons.glyphMap}
                    size={20}
                    color={
                      newRequest.request_type === type.value ? '#FFFFFF' : '#1E3A5F'
                    }
                  />
                  <Text
                    style={[
                      styles.typeButtonText,
                      newRequest.request_type === type.value &&
                        styles.typeButtonTextActive,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe the issue..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={newRequest.description}
              onChangeText={(text) =>
                setNewRequest({ ...newRequest, description: text })
              }
            />

            <Text style={styles.inputLabel}>Urgency</Text>
            <View style={styles.urgencyRow}>
              {['low', 'normal', 'high'].map((urgency) => (
                <TouchableOpacity
                  key={urgency}
                  style={[
                    styles.urgencyButton,
                    newRequest.urgency === urgency && styles.urgencyButtonActive,
                  ]}
                  onPress={() => setNewRequest({ ...newRequest, urgency })}
                >
                  <Text
                    style={[
                      styles.urgencyText,
                      newRequest.urgency === urgency && styles.urgencyTextActive,
                    ]}
                  >
                    {urgency.charAt(0).toUpperCase() + urgency.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.submitModalButton}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitModalButtonText}>Submit Request</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  branchName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A5F',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  activeTab: {
    backgroundColor: '#1E3A5F',
  },
  tabText: {
    fontSize: 14,
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  requestCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  requestInfo: {
    flex: 1,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  requestDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  requestNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#1E3A5F',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  urgencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  urgencyButtonActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#1E3A5F',
  },
  urgencyText: {
    fontSize: 14,
    color: '#6B7280',
  },
  urgencyTextActive: {
    color: '#FFFFFF',
  },
  submitModalButton: {
    backgroundColor: '#F97316',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitModalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
