import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="document-text" size={40} color="#1E3A5F" />
          </View>
        </View>

        <Text style={styles.lastUpdated}>Last updated: January 1, 2026</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.sectionText}>
            By accessing and using the Lilycrest Dormitory mobile application, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using this application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Tenant Eligibility</Text>
          <Text style={styles.sectionText}>
            This application is exclusively for registered tenants of Lilycrest Dormitory. Only users who have been approved and registered by the dormitory administration may access the full features of this application.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. House Rules & Regulations</Text>
          <Text style={styles.sectionText}>
            As a tenant, you agree to abide by all Lilycrest Dormitory house rules, including but not limited to:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Quiet hours from 10:00 PM to 7:00 AM</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>No smoking inside the premises</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>No pets allowed</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Visitors must register at the front desk</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>No overnight visitors without prior approval</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Payment Terms</Text>
          <Text style={styles.sectionText}>
            Rent is due on the 1st of each month. Late payments may incur additional charges as follows:
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>1-7 days late: 5% late fee</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>8-14 days late: 10% late fee</Text>
            </View>
            <View style={styles.bulletItem}>
              <View style={styles.bullet} />
              <Text style={styles.bulletText}>Over 14 days: May result in eviction notice</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Maintenance Requests</Text>
          <Text style={styles.sectionText}>
            Tenants may submit maintenance requests through the application. Normal requests will be addressed within 24-48 hours. Emergency requests (e.g., water leaks, electrical issues) will be prioritized and addressed immediately.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Termination</Text>
          <Text style={styles.sectionText}>
            Tenants must provide at least 30 days written notice before moving out. Failure to provide proper notice may result in forfeiture of the security deposit. The dormitory reserves the right to terminate tenancy for violations of house rules.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Limitation of Liability</Text>
          <Text style={styles.sectionText}>
            Lilycrest Dormitory shall not be liable for any loss or damage to personal property. Tenants are encouraged to obtain personal property insurance. The dormitory is not responsible for service interruptions beyond our control.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Changes to Terms</Text>
          <Text style={styles.sectionText}>
            Lilycrest Dormitory reserves the right to modify these terms at any time. Tenants will be notified of any significant changes through the application or via email.
          </Text>
        </View>

        <View style={styles.agreementBox}>
          <Ionicons name="checkbox" size={24} color="#22C55E" />
          <Text style={styles.agreementText}>
            By using this app, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
    marginBottom: 10,
  },
  sectionText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  bulletList: {
    marginTop: 10,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F97316',
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 22,
  },
  agreementBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  agreementText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});
