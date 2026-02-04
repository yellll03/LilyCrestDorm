import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AboutScreen() {
  const router = useRouter();

  const features = [
    { icon: 'home', label: 'Room Management', color: '#3B82F6' },
    { icon: 'card', label: 'Billing & Payments', color: '#22C55E' },
    { icon: 'construct', label: 'Maintenance Requests', color: '#F59E0B' },
    { icon: 'megaphone', label: 'Announcements', color: '#EF4444' },
    { icon: 'chatbubbles', label: 'Support Chat', color: '#8B5CF6' },
    { icon: 'document-text', label: 'House Rules', color: '#06B6D4' },
  ];

  const branches = [
    {
      name: 'Gil Puyat Branch',
      address: '129 Gil Puyat Avenue, Makati City',
      since: '2024',
    },
    {
      name: 'Guadalupe Branch',
      address: 'Guadalupe, Makati City',
      since: '2016',
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Logo & App Info */}
        <View style={styles.appInfoCard}>
          <Image
            source={require('../assets/images/logo-main.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.appName}>Lilycrest Dormitory</Text>
          <Text style={styles.appTagline}>Your Home Away From Home</Text>
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>Version 1.0.0</Text>
          </View>
        </View>

        {/* About Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Us</Text>
          <View style={styles.card}>
            <Text style={styles.description}>
              Lilycrest offers premium dormitory accommodations designed for students and young professionals. 
              With strategic locations in Makati City, we provide easy access to business districts, 
              educational institutions, and transportation hubs.
            </Text>
            <Text style={styles.description}>
              Our facilities are equipped with modern amenities to ensure a comfortable and productive living experience.
            </Text>
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Features</Text>
          <View style={styles.featuresGrid}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: `${feature.color}15` }]}>
                  <Ionicons name={feature.icon as any} size={24} color={feature.color} />
                </View>
                <Text style={styles.featureLabel}>{feature.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Branches */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Our Branches</Text>
          {branches.map((branch, index) => (
            <View key={index} style={styles.branchCard}>
              <View style={styles.branchIcon}>
                <Ionicons name="location" size={24} color="#1E3A5F" />
              </View>
              <View style={styles.branchInfo}>
                <Text style={styles.branchName}>{branch.name}</Text>
                <Text style={styles.branchAddress}>{branch.address}</Text>
                <Text style={styles.branchSince}>Operating since {branch.since}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Contact */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.contactItem}>
              <Ionicons name="mail" size={20} color="#1E3A5F" />
              <Text style={styles.contactText}>support@lilycrest.com</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem}>
              <Ionicons name="call" size={20} color="#1E3A5F" />
              <Text style={styles.contactText}>(02) 8123-4567</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.contactItem}>
              <Ionicons name="globe" size={20} color="#1E3A5F" />
              <Text style={styles.contactText}>www.lilycrest.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © 2024 Lilycrest Dormitory Management System{"\n"}
          All rights reserved.
        </Text>

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
  appInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  logo: {
    width: 120,
    height: 80,
    marginBottom: 16,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  versionBadge: {
    backgroundColor: '#EBF5FF',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  versionText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E3A5F',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  description: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
    marginBottom: 12,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  branchCard: {
    flexDirection: 'row',
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
  branchIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  branchInfo: {
    flex: 1,
  },
  branchName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 4,
  },
  branchAddress: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  branchSince: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '500',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#374151',
  },
  copyright: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 20,
  },
});
