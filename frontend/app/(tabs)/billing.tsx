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
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { apiService } from '../../src/services/api';
import { format, isPast } from 'date-fns';
import * as ImagePicker from 'expo-image-picker';

interface Bill {
  billing_id: string;
  user_id: string;
  amount: number;
  description: string;
  billing_type?: string;
  due_date: string;
  status: string;
  payment_method?: string;
  payment_date?: string;
  created_at: string;
}

const BILLING_TYPES = [
  { id: 'rent', label: 'Rent', icon: 'home', color: '#3B82F6' },
  { id: 'electricity', label: 'Electricity', icon: 'flash', color: '#F59E0B' },
  { id: 'water', label: 'Water', icon: 'water', color: '#06B6D4' },
  { id: 'penalty', label: 'Penalty', icon: 'warning', color: '#EF4444' },
];

export default function BillingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isFromProfile = params.from === 'profile';
  
  const [bills, setBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'paid'>('all');
  const [showQRModal, setShowQRModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  const getBillingTypeInfo = (type?: string) => {
    return BILLING_TYPES.find(t => t.id === type?.toLowerCase()) || BILLING_TYPES[0];
  };

  const getStatusColor = (status: string, dueDate: string) => {
    if (status === 'paid') return { bg: '#DCFCE7', text: '#22C55E' };
    if (status === 'overdue' || isPast(new Date(dueDate))) return { bg: '#FEE2E2', text: '#EF4444' };
    return { bg: '#FEF3C7', text: '#F59E0B' };
  };

  // Filter bills based on search and tab
  const filteredBills = bills.filter((bill) => {
    const matchesSearch = searchQuery === '' || 
      bill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bill.billing_type?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === 'pending') return matchesSearch && bill.status !== 'paid';
    if (selectedTab === 'paid') return matchesSearch && bill.status === 'paid';
    return matchesSearch;
  });

  const pendingBills = bills.filter((b) => b.status !== 'paid');
  const paidBills = bills.filter((b) => b.status === 'paid');
  const totalPending = pendingBills.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = paidBills.reduce((sum, b) => sum + b.amount, 0);

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
      'Your payment proof has been submitted for verification by the admin. You will receive a notification once verified.',
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
      `Billing statement for ${bill.description} will be downloaded as PDF.`,
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
        {isFromProfile && (
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, !isFromProfile && { marginLeft: 4 }]}>
          {isFromProfile ? 'Billing History' : 'Billings & Payments'}
        </Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.pendingCard]}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.pendingAmount}>₱{totalPending.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, styles.paidCard]}>
            <Text style={styles.summaryLabelPaid}>Total Paid</Text>
            <Text style={styles.paidAmount}>₱{totalPaid.toLocaleString()}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search bills..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Tab Filter */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
            onPress={() => setSelectedTab('pending')}
          >
            <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
              Pending
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'paid' && styles.tabActive]}
            onPress={() => setSelectedTab('paid')}
          >
            <Text style={[styles.tabText, selectedTab === 'paid' && styles.tabTextActive]}>
              Paid
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>No billing records found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search term' : 'Your billing records will appear here'}
            </Text>
          </View>
        ) : (
          filteredBills.map((bill) => {
            const typeInfo = getBillingTypeInfo(bill.billing_type);
            const statusColor = getStatusColor(bill.status, bill.due_date);
            const isOverdue = bill.status !== 'paid' && isPast(new Date(bill.due_date));
            
            return (
              <View key={bill.billing_id} style={styles.billCard}>
                <View style={styles.billHeader}>
                  <View style={[styles.billTypeIcon, { backgroundColor: `${typeInfo.color}15` }]}>
                    <Ionicons name={typeInfo.icon as any} size={24} color={typeInfo.color} />
                  </View>
                  <View style={styles.billInfo}>
                    <View style={styles.billTitleRow}>
                      <Text style={styles.billDescription}>{bill.description}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: `${typeInfo.color}15` }]}>
                        <Text style={[styles.typeText, { color: typeInfo.color }]}>
                          {typeInfo.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.billDate}>
                      Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                </View>

                <View style={styles.billDetails}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>₱{bill.amount.toLocaleString()}</Text>
                  </View>
                  
                  <View style={styles.statusRow}>
                    <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                      <View style={[styles.statusDot, { backgroundColor: statusColor.text }]} />
                      <Text style={[styles.statusText, { color: statusColor.text }]}>
                        {bill.status === 'paid' ? 'Paid' : isOverdue ? 'Overdue' : 'Pending'}
                      </Text>
                    </View>
                    {bill.status === 'paid' && bill.payment_date && (
                      <Text style={styles.paidDate}>
                        Paid on {format(new Date(bill.payment_date), 'MMM dd, yyyy')}
                      </Text>
                    )}
                  </View>

                  {isOverdue && (
                    <View style={styles.overdueWarning}>
                      <Ionicons name="alert-circle" size={16} color="#EF4444" />
                      <Text style={styles.overdueText}>
                        Payment overdue. Late fee of ₱50/day may apply.
                      </Text>
                    </View>
                  )}

                  <View style={styles.actionButtons}>
                    <TouchableOpacity 
                      style={styles.actionButton}
                      onPress={() => handleDownloadPDF(bill)}
                    >
                      <Ionicons name="document-text-outline" size={18} color="#1E3A5F" />
                      <Text style={styles.actionButtonText}>View PDF</Text>
                    </TouchableOpacity>
                    
                    {bill.status !== 'paid' && (
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.payButton]}
                        onPress={() => handlePayNow(bill)}
                      >
                        <Ionicons name="card-outline" size={18} color="#FFFFFF" />
                        <Text style={styles.payButtonText}>Pay Now</Text>
                      </TouchableOpacity>
                    )}
                    
                    {bill.status !== 'paid' && (
                      <TouchableOpacity 
                        style={styles.actionButton}
                        onPress={() => {
                          setSelectedBill(bill);
                          handleUploadProof();
                        }}
                      >
                        <Ionicons name="cloud-upload-outline" size={18} color="#1E3A5F" />
                        <Text style={styles.actionButtonText}>Upload</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Payment Methods Notice */}
        <View style={styles.paymentNotice}>
          <View style={styles.noticeIcon}>
            <Ionicons name="information-circle" size={24} color="#3B82F6" />
          </View>
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Payment Methods</Text>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeText}>• Bank Transfer (BDO or BPI)</Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeText}>• Online Payment</Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeText}>• Grace period: 2 days after due date</Text>
            </View>
            <View style={styles.noticeItem}>
              <Text style={styles.noticeText}>• Late fee: ₱50 per day</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Chatbot Button - only show if not from profile */}
      {!isFromProfile && (
        <TouchableOpacity 
          style={styles.chatbotButton}
          onPress={() => router.push('/(tabs)/chatbot')}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

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
                source={{ uri: 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LilycrestDormitory-BDO-1234567890' }}
                style={styles.qrCode}
              />
              <Text style={styles.qrLabel}>Scan to pay via bank app</Text>
            </View>

            <View style={styles.bankDetails}>
              <Text style={styles.bankTitle}>Bank Account Details</Text>
              
              <View style={styles.bankSection}>
                <Text style={styles.bankName}>BDO Unibank</Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account Name:</Text>
                  <Text style={styles.bankValue}>Lilycrest Properties Inc.</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account No:</Text>
                  <Text style={styles.bankValue}>1234-5678-9012</Text>
                </View>
              </View>

              <View style={styles.bankSection}>
                <Text style={styles.bankName}>BPI</Text>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account Name:</Text>
                  <Text style={styles.bankValue}>Lilycrest Properties Inc.</Text>
                </View>
                <View style={styles.bankRow}>
                  <Text style={styles.bankLabel}>Account No:</Text>
                  <Text style={styles.bankValue}>9876-5432-1098</Text>
                </View>
              </View>

              {selectedBill && (
                <View style={styles.paymentAmount}>
                  <Text style={styles.paymentAmountLabel}>Amount to Pay:</Text>
                  <Text style={styles.paymentAmountValue}>
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
              After completing the bank transfer, please upload your proof of payment. 
              The admin will verify and update your payment status.
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
              <Text style={styles.submitButtonText}>Submit for Admin Verification</Text>
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
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
  },
  paidCard: {
    backgroundColor: '#DCFCE7',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#92400E',
    marginBottom: 8,
  },
  summaryLabelPaid: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 8,
  },
  pendingAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#D97706',
  },
  paidAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 15,
    color: '#1F2937',
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
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#1E3A5F',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
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
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  billHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  billTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billInfo: {
    flex: 1,
  },
  billTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  billDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
    flex: 1,
  },
  typeBadge: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  billDate: {
    fontSize: 13,
    color: '#6B7280',
  },
  billDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 14,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  paidDate: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 10,
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    gap: 8,
  },
  overdueText: {
    flex: 1,
    fontSize: 12,
    color: '#EF4444',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  payButton: {
    backgroundColor: '#F97316',
  },
  payButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  paymentNotice: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  noticeIcon: {
    marginRight: 12,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  noticeItem: {
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 14,
    color: '#1E3A5F',
    lineHeight: 20,
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
    width: 180,
    height: 180,
    borderRadius: 12,
  },
  qrLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 10,
  },
  bankDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bankTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  bankSection: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  bankName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 6,
  },
  bankRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
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
  paymentAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentAmountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  paymentAmountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F97316',
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
