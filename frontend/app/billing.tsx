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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../src/services/api';
import { format, formatDistanceToNow, isPast, isFuture, addDays } from 'date-fns';

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
  const [selectedTab, setSelectedTab] = useState<'all' | 'pending' | 'paid'>('all');
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

  const filteredBills = bills.filter((bill) => {
    if (selectedTab === 'pending') return bill.status !== 'paid';
    if (selectedTab === 'paid') return bill.status === 'paid';
    return true;
  });

  const totalPending = bills
    .filter((b) => b.status !== 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalPaid = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

  const handlePayNow = (bill: Bill) => {
    Alert.alert(
      'Payment Options',
      `Amount: ₱${bill.amount.toLocaleString()}\n\nSelect your payment method:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'GCash', 
          onPress: () => Alert.alert('GCash Payment', 'Please send to: 0917 1000087\nAccount Name: Lilycrest Dormitory\n\nInclude your Room # in the message.')
        },
        { 
          text: 'Bank Transfer', 
          onPress: () => Alert.alert('Bank Transfer', 'BDO Account\nAccount #: 1234-5678-9012\nAccount Name: Lilycrest Properties Inc.\n\nSend proof of payment to the admin.')
        },
        { 
          text: 'Pay at Front Desk', 
          onPress: () => Alert.alert('Front Desk Payment', 'Please visit the front desk during office hours:\nMon-Sat: 8AM - 8PM\nSun: 9AM - 5PM')
        },
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing & Payments</Text>
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
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.pendingCard]}>
            <Ionicons name="time-outline" size={24} color="#F59E0B" />
            <Text style={styles.summaryAmount}>₱{totalPending.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Pending</Text>
          </View>
          <View style={[styles.summaryCard, styles.paidCard]}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#22C55E" />
            <Text style={[styles.summaryAmount, { color: '#22C55E' }]}>₱{totalPaid.toLocaleString()}</Text>
            <Text style={styles.summaryLabel}>Total Paid</Text>
          </View>
        </View>

        {/* Payment Reminder */}
        {totalPending > 0 && (
          <View style={styles.reminderCard}>
            <View style={styles.reminderIcon}>
              <Ionicons name="notifications" size={20} color="#F97316" />
            </View>
            <View style={styles.reminderContent}>
              <Text style={styles.reminderTitle}>Payment Reminder</Text>
              <Text style={styles.reminderText}>
                You have ₱{totalPending.toLocaleString()} in pending payments. Pay on or before the due date to avoid late fees.
              </Text>
            </View>
          </View>
        )}

        {/* Tab Filter */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
            onPress={() => setSelectedTab('all')}
          >
            <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
              All ({bills.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'pending' && styles.tabActive]}
            onPress={() => setSelectedTab('pending')}
          >
            <Text style={[styles.tabText, selectedTab === 'pending' && styles.tabTextActive]}>
              Pending ({bills.filter((b) => b.status !== 'paid').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'paid' && styles.tabActive]}
            onPress={() => setSelectedTab('paid')}
          >
            <Text style={[styles.tabText, selectedTab === 'paid' && styles.tabTextActive]}>
              Paid ({bills.filter((b) => b.status === 'paid').length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No bills found</Text>
            <Text style={styles.emptySubtext}>
              {selectedTab === 'pending' 
                ? "You're all caught up!" 
                : selectedTab === 'paid'
                ? 'No payment history yet'
                : 'No billing records'}
            </Text>
          </View>
        ) : (
          filteredBills.map((bill) => {
            const statusColor = getStatusColor(bill.status, bill.due_date);
            const statusText = getStatusText(bill.status, bill.due_date);
            const isOverdue = bill.status !== 'paid' && isPast(new Date(bill.due_date));
            
            return (
              <View key={bill.billing_id} style={styles.billCard}>
                <View style={styles.billHeader}>
                  <View style={styles.billIconContainer}>
                    <Ionicons 
                      name={bill.status === 'paid' ? 'checkmark-circle' : 'receipt'} 
                      size={24} 
                      color={statusColor.text} 
                    />
                  </View>
                  <View style={styles.billInfo}>
                    <Text style={styles.billDescription}>{bill.description}</Text>
                    <Text style={styles.billDate}>
                      Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {statusText}
                    </Text>
                  </View>
                </View>

                <View style={styles.billDetails}>
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>Amount</Text>
                    <Text style={styles.amountValue}>₱{bill.amount.toLocaleString()}</Text>
                  </View>
                  
                  {bill.status === 'paid' && bill.payment_date && (
                    <View style={styles.paymentInfo}>
                      <Ionicons name="checkmark" size={14} color="#22C55E" />
                      <Text style={styles.paymentInfoText}>
                        Paid on {format(new Date(bill.payment_date), 'MMM dd, yyyy')}
                        {bill.payment_method && ` via ${bill.payment_method}`}
                      </Text>
                    </View>
                  )}

                  {isOverdue && (
                    <View style={styles.overdueWarning}>
                      <Ionicons name="warning" size={14} color="#EF4444" />
                      <Text style={styles.overdueText}>
                        Overdue by {formatDistanceToNow(new Date(bill.due_date))}
                      </Text>
                    </View>
                  )}
                </View>

                {bill.status !== 'paid' && (
                  <TouchableOpacity 
                    style={styles.payButton}
                    onPress={() => handlePayNow(bill)}
                  >
                    <Ionicons name="card" size={18} color="#FFFFFF" />
                    <Text style={styles.payButtonText}>Pay Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        {/* Payment Methods Info */}
        <View style={styles.paymentMethodsCard}>
          <Text style={styles.paymentMethodsTitle}>Accepted Payment Methods</Text>
          <View style={styles.methodsGrid}>
            <View style={styles.methodItem}>
              <View style={[styles.methodIcon, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="phone-portrait" size={20} color="#0284C7" />
              </View>
              <Text style={styles.methodName}>GCash</Text>
            </View>
            <View style={styles.methodItem}>
              <View style={[styles.methodIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="business" size={20} color="#D97706" />
              </View>
              <Text style={styles.methodName}>Bank Transfer</Text>
            </View>
            <View style={styles.methodItem}>
              <View style={[styles.methodIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="cash" size={20} color="#22C55E" />
              </View>
              <Text style={styles.methodName}>Cash</Text>
            </View>
            <View style={styles.methodItem}>
              <View style={[styles.methodIcon, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="card" size={20} color="#9333EA" />
              </View>
              <Text style={styles.methodName}>Credit Card</Text>
            </View>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  refreshIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
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
  pendingCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  paidCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#22C55E',
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  reminderCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reminderContent: {
    flex: 1,
  },
  reminderTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  reminderText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
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
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#1E3A5F',
  },
  tabText: {
    fontSize: 13,
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
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptySubtext: {
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
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billInfo: {
    flex: 1,
  },
  billDescription: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  billDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  billDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  amountValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  paymentInfoText: {
    fontSize: 12,
    color: '#22C55E',
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  overdueText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F97316',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  paymentMethodsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  paymentMethodsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  methodsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodItem: {
    alignItems: 'center',
  },
  methodIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  methodName: {
    fontSize: 11,
    color: '#6B7280',
  },
  bottomSpacer: {
    height: 40,
  },
});
