import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiService } from '../src/services/api';
import { format, isPast, isToday, addDays } from 'date-fns';

interface Billing {
  billing_id: string;
  user_id: string;
  amount: number;
  due_date: string;
  status: string;
  payment_date?: string;
  description: string;
  created_at: string;
}

export default function BillingHistoryScreen() {
  const router = useRouter();
  const [bills, setBills] = useState<Billing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');

  const fetchBills = async () => {
    try {
      const response = await apiService.getMyBilling();
      setBills(response.data || []);
    } catch (error) {
      console.error('Fetch billing error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchBills();
  }, []);

  const filteredBills = bills.filter((bill) => {
    if (filter === 'pending') return bill.status === 'pending';
    if (filter === 'paid') return bill.status === 'paid';
    return true;
  });

  const getStatusInfo = (bill: Billing) => {
    const dueDate = new Date(bill.due_date);
    const isOverdue = isPast(dueDate) && bill.status === 'pending';
    const isDueToday = isToday(dueDate) && bill.status === 'pending';
    const isDueSoon = !isPast(dueDate) && isPast(addDays(new Date(), -3)) && bill.status === 'pending';

    if (bill.status === 'paid') {
      return { color: '#22C55E', bg: '#DCFCE7', text: 'Paid', icon: 'checkmark-circle' };
    }
    if (isOverdue) {
      return { color: '#EF4444', bg: '#FEE2E2', text: 'Overdue', icon: 'alert-circle' };
    }
    if (isDueToday) {
      return { color: '#F59E0B', bg: '#FEF3C7', text: 'Due Today', icon: 'time' };
    }
    return { color: '#3B82F6', bg: '#DBEAFE', text: 'Pending', icon: 'time-outline' };
  };

  const totalPending = bills
    .filter((b) => b.status === 'pending')
    .reduce((sum, b) => sum + b.amount, 0);

  const totalPaid = bills
    .filter((b) => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Billing History</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, styles.pendingCard]}>
            <Text style={styles.summaryLabel}>Pending</Text>
            <Text style={styles.summaryAmount}>₱{totalPending.toLocaleString()}</Text>
          </View>
          <View style={[styles.summaryCard, styles.paidCard]}>
            <Text style={styles.summaryLabel}>Total Paid</Text>
            <Text style={[styles.summaryAmount, styles.paidAmount]}>₱{totalPaid.toLocaleString()}</Text>
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(['all', 'pending', 'paid'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Bills List */}
        {filteredBills.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>No billing records found</Text>
          </View>
        ) : (
          filteredBills.map((bill) => {
            const statusInfo = getStatusInfo(bill);
            return (
              <View key={bill.billing_id} style={styles.billCard}>
                <View style={styles.billHeader}>
                  <View style={styles.billInfo}>
                    <Text style={styles.billDescription}>{bill.description}</Text>
                    <Text style={styles.billDate}>
                      Due: {format(new Date(bill.due_date), 'MMM dd, yyyy')}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                    <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
                    <Text style={[styles.statusText, { color: statusInfo.color }]}>
                      {statusInfo.text}
                    </Text>
                  </View>
                </View>
                <View style={styles.billFooter}>
                  <Text style={styles.billAmount}>₱{bill.amount.toLocaleString()}</Text>
                  {bill.payment_date && (
                    <Text style={styles.paymentDate}>
                      Paid on {format(new Date(bill.payment_date), 'MMM dd, yyyy')}
                    </Text>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* Payment Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={20} color="#3B82F6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Payment Methods</Text>
            <Text style={styles.infoText}>
              • Bank Transfer (BDO or BPI){"\n"}
              • Online Payment{"\n"}
              • Grace period: 2 days after due date{"\n"}
              • Late fee: ₱50 per day
            </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  pendingCard: {
    backgroundColor: '#FEF3C7',
  },
  paidCard: {
    backgroundColor: '#DCFCE7',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F59E0B',
  },
  paidAmount: {
    color: '#22C55E',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterTabActive: {
    backgroundColor: '#1E3A5F',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
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
  billCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  billAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A5F',
  },
  paymentDate: {
    fontSize: 12,
    color: '#22C55E',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 20,
  },
});
