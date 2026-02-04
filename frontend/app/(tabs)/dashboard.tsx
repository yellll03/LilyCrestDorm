import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

interface DashboardData {
  user: any;
  assignment: any;
  room: any;
  latest_bill: any;
  active_maintenance_count: number;
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await apiService.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const seedData = async () => {
    try {
      await apiService.seedData();
      fetchDashboard();
    } catch (error) {
      console.log('Seed data error:', error);
    }
  };

  useEffect(() => {
    fetchDashboard();
    seedData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  const currentDate = new Date();
  const formattedDate = format(currentDate, 'EEE, MMM dd, yyyy');
  const formattedTime = format(currentDate, 'h:mm a');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name || 'User'}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color="#6B7280" />
              <Text style={styles.locationText}>
                {user?.address || '129 Gil Puyat Avenue, Makati City'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/announcements')}
          >
            <Ionicons name="notifications-outline" size={24} color="#1E3A5F" />
          </TouchableOpacity>
        </View>

        {/* Date Time Card */}
        <View style={styles.dateTimeCard}>
          <Ionicons name="calendar" size={20} color="#FFFFFF" />
          <View style={styles.dateTimeInfo}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            <Text style={styles.timeText}>{formattedTime} PST</Text>
          </View>
        </View>

        {/* Room Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.roomIconContainer}>
              <Ionicons name="bed" size={24} color="#F59E0B" />
            </View>
            <View style={styles.roomInfo}>
              <Text style={styles.roomNumber}>
                Room No. {dashboardData?.room?.room_number || '---'}
              </Text>
              <Text style={styles.roomDetail}>
                Room Type: {dashboardData?.room?.room_type || 'N/A'}
              </Text>
              <Text style={styles.roomDetail}>
                Bed Type: {dashboardData?.room?.bed_type || 'N/A'}
              </Text>
            </View>
          </View>
          
          {dashboardData?.assignment && (
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Move-in date</Text>
                <Text style={styles.dateValue}>
                  {format(new Date(dashboardData.assignment.move_in_date), 'MMM dd, yyyy')}
                </Text>
              </View>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Move-out date</Text>
                <Text style={styles.dateValue}>
                  {format(new Date(dashboardData.assignment.move_out_date), 'MMM dd, yyyy')}
                </Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Billing Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Billing & Payments</Text>
          <View style={styles.billingInfo}>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Next due date:</Text>
              <Text style={styles.billingValue}>
                {dashboardData?.latest_bill
                  ? format(new Date(dashboardData.latest_bill.due_date), 'MMM dd, yyyy')
                  : 'No pending bills'}
              </Text>
            </View>
            <View style={styles.billingRow}>
              <Text style={styles.billingLabel}>Amount:</Text>
              <Text style={styles.billingAmount}>
                {dashboardData?.latest_bill
                  ? `₱${dashboardData.latest_bill.amount.toLocaleString()}`
                  : '₱0'}
              </Text>
            </View>
            {dashboardData?.latest_bill && dashboardData.latest_bill.status !== 'paid' && (
              <View style={styles.billingStatusRow}>
                <View style={[
                  styles.billingStatusBadge,
                  { backgroundColor: new Date(dashboardData.latest_bill.due_date) < new Date() ? '#FEE2E2' : '#FEF3C7' }
                ]}>
                  <Text style={[
                    styles.billingStatusText,
                    { color: new Date(dashboardData.latest_bill.due_date) < new Date() ? '#EF4444' : '#F59E0B' }
                  ]}>
                    {new Date(dashboardData.latest_bill.due_date) < new Date() ? 'Overdue' : 'Pending'}
                  </Text>
                </View>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => router.push('/billing')}
          >
            <Text style={styles.viewDetailsText}>View Billing History</Text>
          </TouchableOpacity>
        </View>

        {/* Maintenance Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Maintenance</Text>
          <View style={styles.maintenanceContent}>
            {dashboardData?.active_maintenance_count === 0 ? (
              <Text style={styles.noRequestsText}>No Active Requests</Text>
            ) : (
              <Text style={styles.maintenanceCount}>
                {dashboardData?.active_maintenance_count} Active Request(s)
              </Text>
            )}
          </View>
          <TouchableOpacity 
            style={styles.viewDetailsButton}
            onPress={() => router.push('/(tabs)/services')}
          >
            <Text style={styles.viewDetailsText}>View Details</Text>
          </TouchableOpacity>
        </View>

        {/* Spacer for tab bar */}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    color: '#6B7280',
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
  dateTimeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  roomIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roomInfo: {
    flex: 1,
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  roomDetail: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  dateRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginBottom: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  dateValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E3A5F',
  },
  viewDetailsButton: {
    backgroundColor: '#F97316',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 12,
  },
  billingInfo: {
    marginBottom: 12,
  },
  billingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billingLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  billingValue: {
    fontSize: 14,
    color: '#1E3A5F',
  },
  billingAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F97316',
  },
  billingStatusRow: {
    marginTop: 8,
  },
  billingStatusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  billingStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  maintenanceContent: {
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  noRequestsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  maintenanceCount: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
});
