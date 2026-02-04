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
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { apiService } from '../../src/services/api';

const { width } = Dimensions.get('window');

interface Room {
  room_id: string;
  room_number: string;
  room_type: string;
  bed_type: string;
  capacity: number;
  floor: number;
  status: string;
  price: number;
  regular_price?: number;
  short_term_price?: number;
  short_term_regular?: number;
  discount?: number;
  lease_type?: string;
  amenities: string[];
  description?: string;
  images: string[];
}

interface Announcement {
  announcement_id: string;
  title: string;
  priority: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const roomImages = [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800',
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
  ];

  const fetchData = async () => {
    try {
      const [roomsResponse, announcementsResponse] = await Promise.all([
        apiService.getRooms(),
        apiService.getAnnouncements(),
      ]);
      setRooms(roomsResponse.data);
      setAnnouncements(announcementsResponse.data);
      // Count high priority announcements as "unread"
      const highPriority = announcementsResponse.data.filter((a: Announcement) => a.priority === 'high');
      setUnreadCount(highPriority.length);
    } catch (error) {
      console.error('Fetch data error:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Real-time polling every 30 seconds
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      fetchData();
    }, 30000); // Poll every 30 seconds

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Auto-rotate carousel
  useEffect(() => {
    const carouselTimer = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % roomImages.length);
    }, 5000);

    return () => clearInterval(carouselTimer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.room_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      room.room_type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedRoomType || room.room_type === selectedRoomType;
    return matchesSearch && matchesType;
  });

  const roomTypes = [...new Set(rooms.map((r) => r.room_type))];

  const navigateToAnnouncements = () => {
    router.push('/(tabs)/announcements');
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
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1E3A5F']} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/logo-icon.png')}
              style={styles.logoIcon}
              resizeMode="contain"
            />
            <Text style={styles.logoText}>Lilycrest</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton} onPress={navigateToAnnouncements}>
            <Ionicons name="notifications-outline" size={24} color="#1E3A5F" />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Greeting */}
        <Text style={styles.greeting}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'User'}!
        </Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rooms..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options" size={20} color="#1E3A5F" />
          </TouchableOpacity>
        </View>

        {/* Image Carousel */}
        <View style={styles.carouselContainer}>
          <Image
            source={{ uri: roomImages[currentImageIndex] }}
            style={styles.carouselImage}
            resizeMode="cover"
          />
          <View style={styles.carouselOverlay}>
            <Text style={styles.carouselTitle}>Lilycrest Gil Puyat</Text>
            <Text style={styles.carouselSubtitle}>#7 Gil Puyat Ave. cor Marconi St.</Text>
            <Text style={styles.carouselSubtitle}>Brgy Palanan, Makati City</Text>
          </View>
          <View style={styles.carouselDots}>
            {roomImages.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dot,
                  currentImageIndex === index && styles.activeDot,
                ]}
                onPress={() => setCurrentImageIndex(index)}
              />
            ))}
          </View>
        </View>

        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <View style={styles.promoIcon}>
            <Ionicons name="pricetag" size={24} color="#F97316" />
          </View>
          <View style={styles.promoContent}>
            <Text style={styles.promoTitle}>🎉 DISCOUNTED Monthly Rates!</Text>
            <Text style={styles.promoText}>Up to 20% OFF on select room types</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#F97316" />
        </View>

        {/* Room Type Filter */}
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterChip,
                !selectedRoomType && styles.filterChipActive,
              ]}
              onPress={() => setSelectedRoomType(null)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  !selectedRoomType && styles.filterChipTextActive,
                ]}
              >
                All Rooms
              </Text>
            </TouchableOpacity>
            {roomTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterChip,
                  selectedRoomType === type && styles.filterChipActive,
                ]}
                onPress={() => setSelectedRoomType(type)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    selectedRoomType === type && styles.filterChipTextActive,
                  ]}
                >
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Room View Section */}
        <View style={styles.roomSection}>
          <View style={styles.roomSectionHeader}>
            <Text style={styles.sectionTitle}>Available Rooms</Text>
            <View style={styles.refreshIndicator}>
              <Ionicons name="sync" size={14} color="#9CA3AF" />
              <Text style={styles.refreshText}>Auto-refresh</Text>
            </View>
          </View>

          {filteredRooms.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="bed-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No rooms found</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.roomsScrollContent}
            >
              {filteredRooms.map((room) => (
                <View key={room.room_id} style={styles.roomCard}>
                  {/* Discount Badge */}
                  {room.discount && room.discount > 0 && (
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountText}>{room.discount}% OFF</Text>
                    </View>
                  )}
                  
                  <Image
                    source={{
                      uri: room.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=400',
                    }}
                    style={styles.roomImage}
                    resizeMode="cover"
                  />
                  <View style={styles.roomCardContent}>
                    <Text style={styles.roomType}>{room.room_type}</Text>
                    <Text style={styles.roomBedType}>{room.bed_type} • {room.capacity} pax</Text>
                    
                    {/* Price Section */}
                    <View style={styles.priceSection}>
                      <View style={styles.priceRow}>
                        <Text style={styles.roomPrice}>₱{room.price.toLocaleString()}</Text>
                        <Text style={styles.roomPriceUnit}>/pax/mo</Text>
                      </View>
                      {room.regular_price && room.regular_price > room.price && (
                        <Text style={styles.regularPrice}>
                          Regular: ₱{room.regular_price.toLocaleString()}
                        </Text>
                      )}
                    </View>

                    {/* Lease Type */}
                    {room.lease_type && (
                      <View style={styles.leaseTypeBadge}>
                        <Ionicons name="calendar-outline" size={12} color="#1E3A5F" />
                        <Text style={styles.leaseTypeText}>{room.lease_type}</Text>
                      </View>
                    )}

                    {/* Status */}
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: room.status === 'available' ? '#DCFCE7' : '#FEF3C7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          {
                            color: room.status === 'available' ? '#22C55E' : '#F59E0B',
                          },
                        ]}
                      >
                        {room.status.charAt(0).toUpperCase() + room.status.slice(1)}
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.viewDetailsButton}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Amenities Section */}
        <View style={styles.amenitiesSection}>
          <Text style={styles.sectionTitle}>All Rooms Include</Text>
          <View style={styles.amenitiesGrid}>
            <View style={styles.amenityItem}>
              <View style={styles.amenityIcon}>
                <Ionicons name="wifi" size={20} color="#F97316" />
              </View>
              <Text style={styles.amenityText}>Free WiFi</Text>
            </View>
            <View style={styles.amenityItem}>
              <View style={styles.amenityIcon}>
                <Ionicons name="snow" size={20} color="#F97316" />
              </View>
              <Text style={styles.amenityText}>Air Conditioning</Text>
            </View>
            <View style={styles.amenityItem}>
              <View style={styles.amenityIcon}>
                <Ionicons name="bed" size={20} color="#F97316" />
              </View>
              <Text style={styles.amenityText}>Double Deck Beds</Text>
            </View>
            <View style={styles.amenityItem}>
              <View style={styles.amenityIcon}>
                <Ionicons name="water" size={20} color="#F97316" />
              </View>
              <Text style={styles.amenityText}>Water Heater</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E3A5F',
  },
  notificationButton: {
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
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A5F',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 8,
  },
  carouselContainer: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  carouselImage: {
    width: '100%',
    height: 180,
  },
  carouselOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(30, 58, 95, 0.8)',
  },
  carouselTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  carouselSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
  carouselDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    top: 12,
    left: 0,
    right: 0,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  activeDot: {
    backgroundColor: '#F97316',
    width: 24,
  },
  promoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  promoIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  promoText: {
    fontSize: 12,
    color: '#F97316',
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#1E3A5F',
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  roomSection: {
    marginBottom: 16,
  },
  roomSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  refreshIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  refreshText: {
    fontSize: 12,
    color: '#9CA3AF',
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
  roomsScrollContent: {
    paddingHorizontal: 16,
    gap: 16,
  },
  roomCard: {
    width: width * 0.7,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
      },
    }),
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#F97316',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    zIndex: 10,
  },
  discountText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomImage: {
    width: '100%',
    height: 140,
  },
  roomCardContent: {
    padding: 14,
  },
  roomType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 2,
  },
  roomBedType: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 10,
  },
  priceSection: {
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  roomPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F97316',
  },
  roomPriceUnit: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 2,
  },
  regularPrice: {
    fontSize: 12,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  leaseTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  leaseTypeText: {
    fontSize: 11,
    color: '#1E3A5F',
    fontWeight: '500',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  viewDetailsButton: {
    backgroundColor: '#1E3A5F',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  amenitiesSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 12,
  },
  amenityItem: {
    width: (width - 56) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  amenityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amenityText: {
    fontSize: 13,
    color: '#4B5563',
    fontWeight: '500',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
});
