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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';
import AppHeader from '../../src/components/AppHeader';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const pollingRef = useRef(null);

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
    apiService.seedData().catch(() => {});
  }, []);

  useEffect(() => {
    pollingRef.current = setInterval(() => fetchDashboard(), 30000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
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

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E3A5F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppHeader />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />
        }
        showsVerticalScrollIndicator={false}
      >
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
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Location Card */}
        <TouchableOpacity style={styles.locationCard} onPress={openMap}>
          <View style={styles.locationIconContainer}>
            <Ionicons name="location" size={24} color="#1E3A5F" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.branchName}>LilyCrest Gil Puyat</Text>
            <Text style={styles.addressText}>
              #7 Gil Puyat Ave. cor Marconi St., Brgy Palanan, Makati City
            </Text>
          </View>
          <View style={styles.mapButton}>
            <Ionicons name="navigate" size={18} color="#F97316" />
          </View>
        </TouchableOpacity>

        {/* Tenancy Status Card */}
        <View style={styles.tenancyCard}>
          <View style={styles.tenancyHeader}>
            <Text style={styles.cardTitle}>Your Room</Text>
            <View style={styles.activeStatusBadge}>
              <View style={styles.activeStatusDot} />
              <Text style={styles.activeStatusText}>Active Tenant</Text>
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
                  <Text style={styles.roomInfoText}>{dashboardData?.room?.bed_type || 'N/A'}</Text>
                </View>
                <View style={styles.roomInfoItem}>
                  <Ionicons name="people-outline" size={16} color="#6B7280" />
                  <Text style={styles.roomInfoText}>{dashboardData?.room?.capacity || 0} pax</Text>
                </View>
                <View style={styles.roomInfoItem}>
                  <Ionicons name="layers-outline" size={16} color="#6B7280" />
                  <Text style={styles.roomInfoText}>Floor {dashboardData?.room?.floor || 1}</Text>
                </View>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>Monthly Rate</Text>
                <Text style={styles.priceValue}>₱{(dashboardData?.room?.price || 0).toLocaleString()}</Text>
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
                <Text style={styles.dateLabel}>Move-in</Text>
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

        {/* Quick Actions */}
        <View style={styles.quickActionsCard}>
          <Text style={styles.cardTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)/billing')}>
              <View style={[styles.actionIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="card" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>Pay Bills</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)/services')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="construct" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Request Service</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)/announcements')}>
              <View style={[styles.actionIcon, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="megaphone" size={24} color="#22C55E" />
              </View>
              <Text style={styles.actionText}>News</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionItem} onPress={() => router.push('/(tabs)/chatbot')}>
              <View style={[styles.actionIcon, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="chatbubbles" size={24} color="#F97316" />
              </View>
              <Text style={styles.actionText}>Get Help</Text>
            </TouchableOpacity>
          </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
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
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
    }),
  },
  searchContainerFocused: { borderColor: '#F97316' },
  searchInput: { flex: 1, paddingVertical: 14, paddingHorizontal: 12, fontSize: 16, color: '#1F2937' },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    }),
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  locationInfo: { flex: 1 },
  branchName: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 4 },
  addressText: { fontSize: 13, color: '#6B7280', lineHeight: 18 },
  mapButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  tenancyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    }),
  },
  tenancyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: '#1E3A5F' },
  activeStatusBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DCFCE7', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  activeStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  activeStatusText: { fontSize: 12, fontWeight: '600', color: '#22C55E' },
  tenancyContent: { flexDirection: 'row', marginBottom: 16 },
  roomImageContainer: { width: 110, height: 110, borderRadius: 12, overflow: 'hidden', marginRight: 14, position: 'relative' },
  roomImage: { width: '100%', height: '100%' },
  roomTypeBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(30, 58, 95, 0.9)', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  roomTypeText: { fontSize: 10, fontWeight: '600', color: '#FFFFFF' },
  roomDetails: { flex: 1, justifyContent: 'center' },
  roomNumber: { fontSize: 22, fontWeight: '700', color: '#1E3A5F', marginBottom: 8 },
  roomInfoGrid: { gap: 6 },
  roomInfoItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roomInfoText: { fontSize: 13, color: '#6B7280' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  priceLabel: { fontSize: 12, color: '#6B7280' },
  priceValue: { fontSize: 18, fontWeight: '700', color: '#F97316' },
  tenancyDates: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14 },
  dateItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateItemIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  dateDivider: { width: 1, height: 40, backgroundColor: '#E5E7EB', marginHorizontal: 12 },
  dateLabel: { fontSize: 11, color: '#9CA3AF' },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#1E3A5F' },
  amenitiesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    }),
  },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 10 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF7ED', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, gap: 6 },
  amenityText: { fontSize: 12, color: '#1E3A5F', fontWeight: '500' },
  quickActionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
      default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
    }),
  },
  actionsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
  actionItem: { alignItems: 'center', width: '23%' },
  actionIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionText: { fontSize: 11, color: '#4B5563', textAlign: 'center', fontWeight: '500' },
  bottomSpacer: { height: Platform.OS === 'ios' ? 120 : 100 },
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
      ios: { shadowColor: '#F97316', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 8 },
      web: { boxShadow: '0 4px 16px rgba(249, 115, 22, 0.4)' },
    }),
  },
});
