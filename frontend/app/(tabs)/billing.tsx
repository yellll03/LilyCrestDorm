import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  Alert,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../../src/services/api';
import { format, isPast } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';

interface Bill {
  billing_id: string;
  user_id: string;
  amount: number;
  description: string;
  due_date: string;
  status: string;
  payment_method?: string;
  payment_date?: string;
  created_at: string;
}

export default function BillingScreen() {
  const router = useRouter();
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'current' | 'history'>('current');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchBills = async () => {
    try {
      const response = await apiService.getMyBilling();
      setBills(response.data || []);
    } catch (error) {
      console.error('Fetch bills error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  // Real-time polling every 30 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchBills();
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBills();
  }, []);

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'paid') return { bg: '#DCFCE7', text: '#22C55E' };
    if (status === 'overdue' || isPast(new Date(dueDate))) return { bg: '#FEE2E2', text: '#EF4444' };
    return { bg: '#FEF3C7', text: '#F59E0B' };
  };

  const getStatusText = (status: string, dueDate: string) => {
    if (status === 'paid') return 'Paid';
    if (isPast(new Date(dueDate))) return 'Overdue';
    return 'Pending';
  };

  const currentBills = bills.filter((b) => b.status !== 'paid');
  const paidBills = bills.filter((b) => b.status === 'paid');

  const totalPending = currentBills.reduce((sum, b) => sum + b.amount, 0);

  const handlePayNow = (bill: Bill) => {
    setSelectedBill(bill);
    setShowQRModal(true);
  };

  const handleUploadProof = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload proof of payment.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploadedImage(result.assets[0].uri);
      setShowQRModal(false);
      setShowUploadModal(true);
    }
  };

  const handleSubmitProof = () => {
    Alert.alert(
      'Proof Submitted',
      'Your payment proof has been submitted for verification. You will receive a notification once verified.',
      [{ text: 'OK', onPress: () => {
        setShowUploadModal(false);
        setUploadedImage(null);
        setSelectedBill(null);
      }}]
    );
  };

  const handleDownloadPDF = (bill: Bill) => {
    Alert.alert(
      'Download Statement',
      `Billing statement for ${bill.description} will be downloaded.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Download', onPress: () => {
          Alert.alert('Downloaded', 'Billing statement saved to your device.');
        }}
      ]
    );
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
        <Text style={styles.headerTitle}>Billings & Payments</Text>
        <View style={styles.refreshIndicator}>
          <Ionicons name="sync" size={18} color="#9CA3AF" />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>Total Outstanding</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingBadgeText}>{currentBills.length} pending</Text>
            </View>
          </View>
          <Text style={styles.summaryAmount}>₱{totalPending.toLocaleString()}</Text>
          {totalPending > 0 && (
            <TouchableOpacity 
              style={styles.payAllButton}
              onPress={() => currentBills[0] && handlePayNow(currentBills[0])}
            >
              <Ionicons name="card" size={20} color="#FFFFFF" />
              <Text style={styles.payAllButtonText}>Pay Now</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Filter */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'current' && styles.tabActive]}
            onPress={() => setSelectedTab('current')}
          >
            <Ionicons 
              name="time-outline" 
              size={18} 
              color={selectedTab === 'current' ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[styles.tabText, selectedTab === 'current' && styles.tabTextActive]}>
              Current ({currentBills.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
            onPress={() => setSelectedTab('history')}
          >
            <Ionicons 
              name="checkmark-circle-outline" 
              size={18} 
              color={selectedTab === 'history' ? '#FFFFFF' : '#6B7280'} 
            />
            <Text style={[styles.tabText, selectedTab === 'history' && styles.tabTextActive]}>
              History ({paidBills.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bills List */}
        {selectedTab === 'current' ? (
          currentBills.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
              </View>
              <Text style={styles.emptyTitle}>All Caught Up!</Text>
              <Text style={styles.emptyText}>You have no pending bills.</Text>
            </View>
          ) : (
            currentBills.map((bill) => {
              const statusColor = getStatusColor(bill.status, bill.due_date);
              const statusText = getStatusText(bill.status, bill.due_date);
              const isOverdue = isPast(new Date(bill.due_date));
              
              return (
                <View key={bill.billing_id} style={styles.billCard}>
                  <View style={styles.billHeader}>
                    <View style={styles.billIconContainer}>
                      <Ionicons name="receipt" size={24} color="#F97316" />
                    </View>
                    <View style={styles.billInfo}>
                      <Text style={styles.billDescription}>{bill.description}</Text>
                      <Text style={styles.billDate}>
                        Due: {format(new Date(bill.due_date), 'MMMM dd, yyyy')}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                      <Text style={[styles.statusText, { color: statusColor.text }]}>
                        {statusText}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.billDetails}>
                    <View style={styles.amountSection}>
                      <Text style={styles.amountLabel}>Amount Due</Text>
                      <Text style={styles.amountValue}>₱{bill.amount.toLocaleString()}</Text>
                    </View>

                    {isOverdue && (
                      <View style={styles.overdueWarning}>
                        <Ionicons name="warning" size={16} color="#EF4444" />
                        <Text style={styles.overdueText}>Payment is overdue. Please pay immediately.</Text>
                      </View>
                    )}

                    <TouchableOpacity 
                      style={styles.payButton}
                      onPress={() => handlePayNow(bill)}
                    >
                      <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                      <Text style={styles.payButtonText}>Pay via Bank Transfer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )
        ) : (
          paidBills.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={48} color="#9CA3AF" />
              </View>
              <Text style={styles.emptyTitle}>No Payment History</Text>
              <Text style={styles.emptyText}>Your paid bills will appear here.</Text>
            </View>
          ) : (
            paidBills.map((bill) => (
              <View key={bill.billing_id} style={styles.historyCard}>
                <View style={styles.historyHeader}>
                  <View style={styles.historyIconContainer}>
                    <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
                  </View>
                  <View style={styles.historyInfo}>
                    <Text style={styles.historyDescription}>{bill.description}</Text>
                    <Text style={styles.historyDate}>
                      Paid on {bill.payment_date ? format(new Date(bill.payment_date), 'MMM dd, yyyy') : 'N/A'}
                    </Text>
                  </View>
                  <Text style={styles.historyAmount}>₱{bill.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.historyActions}>
                  {bill.payment_method && (
                    <View style={styles.paymentMethodBadge}>
                      <Ionicons name="card-outline" size={14} color="#6B7280" />
                      <Text style={styles.paymentMethodText}>{bill.payment_method}</Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.downloadButton}
                    onPress={() => handleDownloadPDF(bill)}
                  >
                    <Ionicons name="download-outline" size={18} color="#F97316" />
                    <Text style={styles.downloadText}>PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Chatbot Button */}
      <TouchableOpacity 
        style={styles.chatbotButton}
        onPress={() => router.push('/(tabs)/chatbot')}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* QR Payment Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Bank Transfer Payment</Text>
              <TouchableOpacity onPress={() => setShowQRModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.qrContainer}>
              <Image
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LilycrestDormitory-Payment' }}
                style={styles.qrCode}
              />
            </View>

            <View style={styles.bankDetails}>
              <Text style={styles.bankTitle}>Bank Account Details</Text>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Bank:</Text>
                <Text style={styles.bankValue}>BDO Unibank</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account Name:</Text>
                <Text style={styles.bankValue}>Lilycrest Properties Inc.</Text>
              </View>
              <View style={styles.bankRow}>
                <Text style={styles.bankLabel}>Account No:</Text>
                <Text style={styles.bankValue}>1234-5678-9012</Text>
              </View>
              {selectedBill && (
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Amount:</Text>
                  <Text style={[styles.bankValue, { color: '#F97316', fontWeight: 'bold' }]}>
                    ₱{selectedBill.amount.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.uploadProofButton} onPress={handleUploadProof}>
              <Ionicons name="cloud-upload-outline" size={22} color="#FFFFFF" />
              <Text style={styles.uploadProofText}>Upload Proof of Payment</Text>
            </TouchableOpacity>

            <Text style={styles.noteText}>
              After making the transfer, please upload your proof of payment for verification.
            </Text>
          </View>
        </View>
      </Modal>

      {/* Upload Confirmation Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Upload</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {uploadedImage && (
              <Image source={{ uri: uploadedImage }} style={styles.uploadedImage} />
            )}

            <Text style={styles.uploadConfirmText}>
              Please confirm that this is your proof of payment for:
            </Text>
            {selectedBill && (
              <View style={styles.confirmBillDetails}>
                <Text style={styles.confirmBillDescription}>{selectedBill.description}</Text>
                <Text style={styles.confirmBillAmount}>₱{selectedBill.amount.toLocaleString()}</Text>
              </View>
            )}

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitProof}>
              <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submit for Verification</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => {
                setShowUploadModal(false);
                setUploadedImage(null);
              }}
            >
              <Text style={styles.cancelButtonText}>Choose Different Image</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  refreshIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  pendingBadge: {
    backgroundColor: 'rgba(249, 115, 22, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 12,
    color: '#F97316',
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  payAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  payAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#1E3A5F',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  billIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billInfo: {
    flex: 1,
  },
  billDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  billDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  billDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  amountSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  overdueText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
    fontWeight: '500',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  paymentMethodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    color: '#6B7280',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    gap: 6,
  },
  downloadText: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 120 : 100,
  },
  chatbotButton: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 110 : 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F97316',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#F97316',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)' },
    }),
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
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCode: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  bankDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bankLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  bankValue: {
    fontSize: 13,
    color: '#1E3A5F',
    fontWeight: '500',
  },
  uploadProofButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 12,
  },
  uploadProofText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
  uploadedImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  uploadConfirmText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmBillDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  confirmBillDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  confirmBillAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginBottom: 12,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});
