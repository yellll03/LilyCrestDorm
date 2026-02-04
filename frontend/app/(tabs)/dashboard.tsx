import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timeRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDashboard = async () => {
    try {
      const [dashboardResponse, announcementsResponse] = await Promise.all([
        apiService.getDashboard(),
        apiService.getAnnouncements(),
      ]);
      setDashboardData(dashboardResponse.data);
      // Count high priority announcements as unread
      const highPriority = announcementsResponse.data.filter((a: any) => a.priority === 'high');
      setUnreadCount(highPriority.length);
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

  // Real-time polling every 30 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchDashboard();
    }, 30000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Real-time clock update every second
  useEffect(() => {
    timeRef.current = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      if (timeRef.current) {
        clearInterval(timeRef.current);
      }
    };
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

  const formattedDate = format(currentTime, 'EEEE, MMMM dd, yyyy');
  const formattedTime = format(currentTime, 'h:mm:ss a');
  const greeting = currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header with User Avatar */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              {user?.picture ? (
                <Image source={{ uri: user.picture }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{user?.name || 'User'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(tabs)/announcements')}
          >
            <Ionicons name="notifications-outline" size={24} color="#1E3A5F" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Date Time & Location Card */}
        <View style={styles.dateLocationCard}>
          <View style={styles.dateTimeSection}>
            <View style={styles.dateIconContainer}>
              <Ionicons name="calendar" size={22} color="#F97316" />
            </View>
            <View style={styles.dateTimeInfo}>
              <Text style={styles.dateText}>{formattedDate}</Text>
              <Text style={styles.timeText}>{formattedTime}</Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.locationSection}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={22} color="#1E3A5F" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.branchName}>Lilycrest Gil Puyat</Text>
              <Text style={styles.addressText}>
                #7 Gil Puyat Ave. cor Marconi St.{'\n'}Brgy Palanan, Makati City
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Room Card */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>My Room</Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>
          <View style={styles.roomContent}>
            <View style={styles.roomImageContainer}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400' }}
                style={styles.roomImage}
              />
            </View>
            <View style={styles.roomDetails}>
              <Text style={styles.roomNumber}>
                Room {dashboardData?.room?.room_number || '---'}
              </Text>
              <View style={styles.roomInfoRow}>
                <Ionicons name="bed-outline" size={14} color="#6B7280" />
                <Text style={styles.roomInfoText}>
                  {dashboardData?.room?.room_type || 'N/A'}
                </Text>
              </View>
              <View style={styles.roomInfoRow}>
                <Ionicons name="people-outline" size={14} color="#6B7280" />
                <Text style={styles.roomInfoText}>
                  {dashboardData?.room?.capacity || 0} pax capacity
                </Text>
              </View>
              <View style={styles.roomInfoRow}>
                <Ionicons name="pricetag-outline" size={14} color="#6B7280" />
                <Text style={styles.roomPriceText}>
                  ₱{(dashboardData?.room?.price || 0).toLocaleString()}/mo
                </Text>
              </View>
            </View>
          </View>
          
          {dashboardData?.assignment && (
            <View style={styles.dateRow}>
              <View style={styles.dateItem}>
                <View style={styles.dateItemIcon}>
                  <Ionicons name="enter-outline" size={16} color="#22C55E" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>Move-in</Text>
                  <Text style={styles.dateValue}>
                    {format(new Date(dashboardData.assignment.move_in_date), 'MMM dd, yyyy')}
                  </Text>
                </View>
              </View>
              <View style={styles.dateDivider} />
              <View style={styles.dateItem}>
                <View style={styles.dateItemIcon}>
                  <Ionicons name="exit-outline" size={16} color="#EF4444" />
                </View>
                <View>
                  <Text style={styles.dateLabel}>Move-out</Text>
                  <Text style={styles.dateValue}>
                    {format(new Date(dashboardData.assignment.move_out_date), 'MMM dd, yyyy')}
                  </Text>
                </View>
              </View>
            </View>
          )}
          
          <TouchableOpacity style={styles.viewButton}>
            <Text style={styles.viewButtonText}>View Room Details</Text>
            <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/billing')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="card" size={22} color="#2563EB" />
            </View>
            <Text style={styles.quickActionLabel}>Billing</Text>
            {dashboardData?.latest_bill && dashboardData.latest_bill.status !== 'paid' && (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>1</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/services')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="construct" size={22} color="#D97706" />
            </View>
            <Text style={styles.quickActionLabel}>Services</Text>
            {dashboardData?.active_maintenance_count > 0 && (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>{dashboardData.active_maintenance_count}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/announcements')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="megaphone" size={22} color="#16A34A" />
            </View>
            <Text style={styles.quickActionLabel}>News</Text>
            {unreadCount > 0 && (
              <View style={styles.quickActionBadge}>
                <Text style={styles.quickActionBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.quickAction}
            onPress={() => router.push('/(tabs)/chatbot')}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="chatbubbles" size={22} color="#9333EA" />
            </View>
            <Text style={styles.quickActionLabel}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Billing Summary Card */}
        {dashboardData?.latest_bill && dashboardData.latest_bill.status !== 'paid' && (
          <TouchableOpacity 
            style={styles.billingSummaryCard}
            onPress={() => router.push('/billing')}
          >
            <View style={styles.billingSummaryIcon}>
              <Ionicons name="receipt" size={24} color="#F97316" />
            </View>
            <View style={styles.billingSummaryContent}>
              <Text style={styles.billingSummaryTitle}>Payment Due</Text>
              <Text style={styles.billingSummaryAmount}>
                ₱{dashboardData.latest_bill.amount.toLocaleString()}
              </Text>
              <Text style={styles.billingSummaryDue}>
                Due: {format(new Date(dashboardData.latest_bill.due_date), 'MMM dd, yyyy')}
              </Text>
            </View>
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
          </TouchableOpacity>
        )}

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
    alignItems: 'center',
    marginBottom: 20,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#F97316',
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1E3A5F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F97316',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfo: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: '#6B7280',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      },
    }),
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dateLocationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  dateTimeSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  dateTimeInfo: {
    flex: 1,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  timeText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  locationSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  addressText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  roomContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roomImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  roomDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  roomInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  roomInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  roomPriceText: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 14,
    marginBottom: 14,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateItemIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  dateLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  viewButton: {
    flexDirection: 'row',
    backgroundColor: '#1E3A5F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: { boxShadow: '0 2px 6px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      },
    }),
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6B7280',
  },
  quickActionBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  quickActionBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  billingSummaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  billingSummaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  billingSummaryContent: {
    flex: 1,
  },
  billingSummaryTitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  billingSummaryAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  billingSummaryDue: {
    fontSize: 12,
    color: '#F97316',
  },
  billingStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  billingStatusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
});
