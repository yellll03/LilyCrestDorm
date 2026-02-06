import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const DOCUMENTS = [
  { id: 'contract', title: 'Lease Contract', description: 'Your rental agreement document', icon: 'document-text', color: '#3B82F6', category: 'Contract' },
  { id: 'id_copy', title: 'Valid ID Copy', description: 'Your submitted identification', icon: 'card', color: '#22C55E', category: 'Identification' },
  { id: 'house_rules', title: 'House Rules', description: 'Dormitory rules and regulations', icon: 'home', color: '#F59E0B', category: 'Guidelines' },
  { id: 'emergency_contact', title: 'Emergency Contacts', description: 'Important contact numbers', icon: 'call', color: '#EF4444', category: 'Emergency' },
  { id: 'move_in_checklist', title: 'Move-in Checklist', description: 'Inventory and checklist form', icon: 'checkbox', color: '#9333EA', category: 'Forms' },
  { id: 'payment_history', title: 'Payment History', description: 'All your payment records', icon: 'receipt', color: '#06B6D4', category: 'Billing' },
];

export default function MyDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(null);

  const generatePDFContent = (docType) => {
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    
    switch(docType) {
      case 'contract':
        return `
LILYCREST DORMITORY
LEASE CONTRACT AGREEMENT

Date: ${today}
Tenant: ${user?.name || 'Tenant Name'}
Email: ${user?.email || ''}

--- TERMS AND CONDITIONS ---

1. RENTAL PERIOD
The lease term begins from the move-in date and continues month-to-month until terminated by either party with 30 days written notice.

2. MONTHLY RENT
Rent is due on the 5th of each month. Late payment incurs a penalty of PHP 50.00 per day.

3. SECURITY DEPOSIT
Equivalent to one month's rent, refundable upon move-out subject to inspection.

4. HOUSE RULES
Tenant agrees to follow all dormitory rules and regulations.

5. UTILITIES
Water and basic WiFi included. Electricity charged separately based on consumption.

--- PROPERTY MANAGEMENT ---
LilyCrest Properties Inc.
#7 Gil Puyat Ave. cor Marconi St.
Brgy Palanan, Makati City
Phone: +63 912 345 6789
Email: admin@lilycrest.ph

This document is electronically generated.
`;
      case 'id_copy':
        return `
IDENTIFICATION RECORD
LilyCrest Dormitory

Tenant Information:
Name: ${user?.name || 'Tenant Name'}
Email: ${user?.email || ''}
Status: Active Tenant

ID Type: Government-issued ID
Verification Date: On file with admin office

For official copy of your submitted ID, please visit the admin office.
`;
      case 'house_rules':
        return `
LILYCREST DORMITORY
HOUSE RULES AND REGULATIONS

1. QUIET HOURS
- 10:00 PM to 7:00 AM daily
- No loud music or disturbances

2. VISITOR POLICY
- Visitors allowed 8:00 AM to 9:00 PM only
- Must register at the front desk
- No overnight guests

3. CURFEW
- Main gate closes at 11:00 PM
- Late entry requires coordination with admin

4. CLEANLINESS
- Keep your room clean and tidy
- No food waste in rooms
- Dispose garbage properly

5. PROHIBITED ITEMS
- No pets allowed
- No cooking appliances in rooms
- No smoking inside the building

6. COMMON AREAS
- Clean up after use
- Respect shared spaces
- Report damages immediately

7. PAYMENT
- Rent due every 5th of the month
- Grace period: 2 days
- Late fee: PHP 50.00/day

Violations may result in warnings or termination of tenancy.
`;
      case 'emergency_contact':
        return `
EMERGENCY CONTACTS
LilyCrest Dormitory

DORMITORY CONTACTS:
Admin Office: +63 912 345 6789
Emergency Hotline: +63 912 345 6790
Email: emergency@lilycrest.ph

EMERGENCY SERVICES:
Police (Makati): 911 / (02) 8899-4083
Fire Department: 911 / (02) 8807-8850
Ambulance (Red Cross): (02) 8527-0000

NEAREST HOSPITALS:
- Makati Medical Center: (02) 8888-8999
- Ospital ng Makati: (02) 8882-5802

Building Security: Available 24/7
Maintenance: Submit via app or call admin office
`;
      default:
        return `
DOCUMENT
LilyCrest Dormitory

Tenant: ${user?.name || 'Tenant Name'}
Generated: ${today}

For detailed information, please visit the admin office.
`;
    }
  };

  const handleDownload = async (doc) => {
    try {
      setDownloading(doc.id);
      
      // Generate content
      const content = generatePDFContent(doc.id);
      const fileName = `LilyCrest_${doc.title.replace(/\s+/g, '_')}.txt`;
      
      if (Platform.OS === 'web') {
        // Web download
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', `${doc.title} downloaded successfully!`);
      } else {
        // Mobile download using expo-file-system
        const fileUri = FileSystem.documentDirectory + fileName;
        await FileSystem.writeAsStringAsync(fileUri, content);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri);
        } else {
          Alert.alert('Success', `${doc.title} saved to your device.`);
        }
      }
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert('Error', 'Failed to download document. Please try again.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="folder-open" size={24} color="#1E3A5F" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Documents</Text>
            <Text style={styles.infoText}>Access and download your important tenant documents. For official copies with signatures, please visit the admin office.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Available Documents</Text>
        
        {DOCUMENTS.map((doc) => (
          <View key={doc.id} style={styles.documentCard}>
            <View style={[styles.documentIcon, { backgroundColor: `${doc.color}15` }]}>
              <Ionicons name={doc.icon} size={26} color={doc.color} />
            </View>
            <View style={styles.documentContent}>
              <Text style={styles.documentTitle}>{doc.title}</Text>
              <Text style={styles.documentDescription}>{doc.description}</Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{doc.category}</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.downloadButton, downloading === doc.id && styles.downloadButtonDisabled]} 
              onPress={() => handleDownload(doc)}
              disabled={downloading === doc.id}
            >
              {downloading === doc.id ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadText}>Download</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ))}

        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={22} color="#F97316" />
          <Text style={styles.helpText}>
            Need a document not listed here? Contact the admin office or submit a request through the Help & Support section.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A5F' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#EEF2FF', borderRadius: 16, padding: 16, marginBottom: 20, gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 4 },
  infoText: { fontSize: 13, color: '#4B5563', lineHeight: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', marginBottom: 14 },
  documentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 } }) },
  documentIcon: { width: 56, height: 56, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  documentContent: { flex: 1 },
  documentTitle: { fontSize: 15, fontWeight: '600', color: '#1E3A5F', marginBottom: 4 },
  documentDescription: { fontSize: 13, color: '#6B7280', marginBottom: 8 },
  categoryBadge: { backgroundColor: '#F3F4F6', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
  categoryText: { fontSize: 11, fontWeight: '500', color: '#6B7280' },
  downloadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E3A5F', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, gap: 6 },
  downloadButtonDisabled: { backgroundColor: '#94A3B8' },
  downloadText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  helpCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#FFF7ED', borderRadius: 12, padding: 14, marginTop: 8, gap: 10 },
  helpText: { flex: 1, fontSize: 13, color: '#9A3412', lineHeight: 20 },
});
