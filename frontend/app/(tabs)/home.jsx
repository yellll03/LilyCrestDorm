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
  TextInput,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const pollingRef = useRef(null);
  const timeRef = useRef(null);

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

  useEffect(() => {
    fetchDashboard();
    // Seed data on first load
    apiService.seedData().catch(() => {});
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

  const openMap = () => {
    const address = '#7 Gil Puyat Ave. cor Marconi St. Brgy Palanan, Makati City';
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(address)}`,
      android: `geo:0,0?q=${encodeURIComponent(address)}`,
      web: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
    });
    if (url) Linking.openURL(url);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      console.log('Searching for:', searchQuery);
    }
  };

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
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => router.push('/(tabs)/profile')}
            >
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
            </TouchableOpacity>
            <View style={styles.userInfo}>
              <Text style={styles.greeting}>{greeting},</Text>
              <Text style={styles.userName}>{user?.name || 'Tenant'}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="settings-outline" size={22} color="#1E3A5F" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchContainer, searchFocused && styles.searchContainerFocused]}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search information..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#1E3A5F" />
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
          <TouchableOpacity style={styles.locationSection} onPress={openMap}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={22} color="#1E3A5F" />
            </View>
            <View style={styles.locationInfo}>
              <Text style={styles.branchName}>Lilycrest Gil Puyat</Text>
              <Text style={styles.addressText}>
                #7 Gil Puyat Ave. cor Marconi St.{'\n'}Brgy Palanan, Makati City
              </Text>
            </View>
            <View style={styles.mapButton}>
              <Ionicons name="map-outline" size={18} color="#F97316" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Tenancy Status Card */}
        <View style={styles.tenancyCard}>
          <View style={styles.tenancyHeader}>
            <Text style={styles.cardTitle}>Tenancy Status</Text>
            <View style={styles.activeStatusBadge}>
              <View style={styles.activeStatusDot} />
              <Text style={styles.activeStatusText}>Active</Text>
            </View>
          </View>
          
          <View style={styles.tenancyContent}>
            <View style={styles.roomImageContainer}>
              <Image
                source={{ uri: dashboardData?.room?.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400' }}
                style={styles.roomImage}
              />
              <View style={styles.roomTypeBadge}>
                <Text style={styles.roomTypeText}>
                  {dashboardData?.room?.room_type || 'Standard'}
                </Text>
              </View>
            </View>
            
            <View style={styles.roomDetails}>
              <Text style={styles.roomNumber}>
                Room {dashboardData?.room?.room_number || '---'}
              </Text>
              <View style={styles.roomInfoGrid}>
                <View style={styles.roomInfoItem}>
                  <Ionicons name="bed-outline" size={16} color="#6B7280" />
                  <Text style={styles.roomInfoText}>
                    {dashboardData?.room?.bed_type || 'N/A'}
                  </Text>
                </View>
                <View style={styles.roomInfoItem}>
                  <Ionicons name="people-outline" size={16} color="#6B7280" />
                  <Text style={styles.roomInfoText}>
                    {dashboardData?.room?.capacity || 0} pax
                  </Text>
                </View>
                <View style={styles.roomInfoItem}>
                  <Ionicons name="layers-outline" size={16} color="#6B7280" />
                  <Text style={styles.roomInfoText}>
                    Floor {dashboardData?.room?.floor || 1}
                  </Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Monthly Rate</Text>
                <Text style={styles.priceValue}>
                  ₱{(dashboardData?.room?.price || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Tenancy Dates */}
          <View style={styles.tenancyDates}>
            <View style={styles.dateItem}>
              <View style={[styles.dateItemIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="enter-outline" size={18} color="#22C55E" />
              </View>
              <View>
                <Text style={styles.dateLabel}>Move-in Date</Text>
                <Text style={styles.dateValue}>
                  {dashboardData?.assignment?.move_in_date 
                    ? format(new Date(dashboardData.assignment.move_in_date), 'MMM dd, yyyy')
                    : 'Not assigned'}
                </Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <View style={[styles.dateItemIcon, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="exit-outline" size={18} color="#EF4444" />
              </View>
              <View>
                <Text style={styles.dateLabel}>Contract End</Text>
                <Text style={styles.dateValue}>
                  {dashboardData?.assignment?.move_out_date 
                    ? format(new Date(dashboardData.assignment.move_out_date), 'MMM dd, yyyy')
                    : 'Not assigned'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Room Amenities */}
        <View style={styles.amenitiesCard}>
          <Text style={styles.cardTitle}>Room Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {(dashboardData?.room?.amenities || ['WiFi', 'Air Conditioning', 'Shared Bathroom']).map((amenity, index) => (
              <View key={index} style={styles.amenityItem}>
                <Ionicons 
                  name={
                    amenity.toLowerCase().includes('wifi') ? 'wifi' :
                    amenity.toLowerCase().includes('air') ? 'snow' :
                    amenity.toLowerCase().includes('toilet') || amenity.toLowerCase().includes('bathroom') ? 'water' :
                    amenity.toLowerCase().includes('kitchen') ? 'restaurant' :
                    amenity.toLowerCase().includes('lounge') ? 'cafe' :
                    'checkmark-circle'
                  } 
                  size={18} 
                  color="#F97316" 
                />
                <Text style={styles.amenityText}>{amenity}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Important Updates */}
        <View style={styles.updatesCard}>
          <View style={styles.updatesHeader}>
            <Text style={styles.cardTitle}>Important Updates</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/announcements')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData?.latest_bill && dashboardData.latest_bill.status !== 'paid' && (
            <TouchableOpacity 
              style={styles.updateItem}
              onPress={() => router.push('/(tabs)/billing')}
            >
              <View style={[styles.updateIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="card" size={20} color="#D97706" />
              </View>
              <View style={styles.updateContent}>
                <Text style={styles.updateTitle}>Payment Due</Text>
                <Text style={styles.updateDescription}>
                  ₱{dashboardData.latest_bill.amount.toLocaleString()} due on {format(new Date(dashboardData.latest_bill.due_date), 'MMM dd')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {dashboardData?.active_maintenance_count > 0 && (
            <TouchableOpacity 
              style={styles.updateItem}
              onPress={() => router.push('/(tabs)/services')}
            >
              <View style={[styles.updateIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="construct" size={20} color="#2563EB" />
              </View>
              <View style={styles.updateContent}>
                <Text style={styles.updateTitle}>Active Service Request</Text>
                <Text style={styles.updateDescription}>
                  {dashboardData.active_maintenance_count} pending request(s)
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          <TouchableOpacity 
            style={styles.updateItem}
            onPress={() => router.push('/(tabs)/announcements')}
          >
            <View style={[styles.updateIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="megaphone" size={20} color="#16A34A" />
            </View>
            <View style={styles.updateContent}>
              <Text style={styles.updateTitle}>Latest Announcements</Text>
              <Text style={styles.updateDescription}>Check for important updates</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Spacer for tab bar */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Floating Chatbot Button */}
      <TouchableOpacity 
        style={styles.chatbotButton}
        onPress={() => router.push('/(tabs)/chatbot')}
      >
        <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
      </TouchableOpacity>
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
    marginBottom: 16,
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
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    ...Platform.select({
      web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  searchContainerFocused: {
    borderColor: '#F97316',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
    marginLeft: 8,
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
  mapButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tenancyCard: {
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
  tenancyHeader: {
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
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  activeStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  tenancyContent: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roomImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 14,
    position: 'relative',
  },
  roomImage: {
    width: '100%',
    height: '100%',
  },
  roomTypeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(30, 58, 95, 0.9)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  roomTypeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  roomDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  roomNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 8,
  },
  roomInfoGrid: {
    gap: 6,
  },
  roomInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roomInfoText: {
    fontSize: 13,
    color: '#6B7280',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  priceLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F97316',
  },
  tenancyDates: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
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
  amenitiesCard: {
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
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 10,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  amenityText: {
    fontSize: 12,
    color: '#1E3A5F',
    fontWeight: '500',
  },
  updatesCard: {
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
  updatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  seeAllText: {
    fontSize: 13,
    color: '#F97316',
    fontWeight: '600',
  },
  updateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  updateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  updateContent: {
    flex: 1,
  },
  updateTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  updateDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)',
      },
    }),
  },
});
