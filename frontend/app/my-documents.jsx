import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const DOCUMENTS = [
  { id: 'contract', title: 'Lease Contract', description: 'Your rental agreement document', icon: 'document-text', color: '#3B82F6', category: 'Contract' },
  { id: 'valid_id', title: 'Valid ID', description: 'Your submitted identification', icon: 'card', color: '#22C55E', category: 'Identification' },
  { id: 'house_rules', title: 'House Rules', description: 'Dormitory rules and regulations', icon: 'home', color: '#F59E0B', category: 'Guidelines' },
  { id: 'curfew_policy', title: 'Curfew Policy', description: 'Entry and exit time guidelines', icon: 'time', color: '#9333EA', category: 'Policy' },
  { id: 'visitor_policy', title: 'Visitor Policy', description: 'Guest registration rules', icon: 'people', color: '#06B6D4', category: 'Policy' },
  { id: 'payment_terms', title: 'Payment Terms', description: 'Billing and payment policies', icon: 'cash', color: '#F97316', category: 'Billing' },
  { id: 'emergency_procedures', title: 'Emergency Procedures', description: 'Safety and emergency contacts', icon: 'alert-circle', color: '#EF4444', category: 'Emergency' },
];

export default function MyDocumentsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [downloading, setDownloading] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const generateDocumentContent = (docType) => {
    const today = new Date().toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
    const userName = user?.name || 'Tenant Name';
    const userEmail = user?.email || '';
    
    const documents = {
      contract: `
══════════════════════════════════════════
           LILYCREST DORMITORY
         LEASE CONTRACT AGREEMENT
══════════════════════════════════════════

Date Issued: ${today}

TENANT INFORMATION:
Name: ${userName}
Email: ${userEmail}

─────────────────────────────────────────
              TERMS AND CONDITIONS
─────────────────────────────────────────

1. RENTAL PERIOD
   The lease term begins from the move-in date and 
   continues month-to-month until terminated by 
   either party with 30 days written notice.

2. MONTHLY RENT
   Rent is due on the 5th of each month.
   Late payment incurs a penalty of PHP 50.00 per day.
   Grace period: 2 days (until the 7th)

3. SECURITY DEPOSIT
   Equivalent to one month's rent.
   Refundable upon move-out subject to room inspection.
   Deductions may apply for damages beyond normal wear.

4. UTILITIES
   • Water: Included in monthly rent
   • WiFi: Included (basic package)
   • Electricity: Billed separately based on consumption

5. HOUSE RULES
   Tenant agrees to follow all dormitory rules and 
   regulations as outlined in the House Rules document.

6. TERMINATION
   Either party may terminate with 30 days notice.
   Early termination may forfeit security deposit.

─────────────────────────────────────────
             PROPERTY MANAGEMENT
─────────────────────────────────────────

LilyCrest Properties Inc.
#7 Gil Puyat Ave. cor Marconi St.
Brgy Palanan, Makati City

Phone: +63 912 345 6789
Email: admin@lilycrest.ph

══════════════════════════════════════════
   This is an electronically generated document.
══════════════════════════════════════════
`,

      valid_id: `
══════════════════════════════════════════
           IDENTIFICATION RECORD
           LilyCrest Dormitory
══════════════════════════════════════════

TENANT INFORMATION:
─────────────────────────────────────────
Name: ${userName}
Email: ${userEmail}
Status: Active Tenant

ID VERIFICATION:
─────────────────────────────────────────
ID Type: Government-issued ID
Verification Status: Verified ✓
Verification Date: On file

NOTE:
─────────────────────────────────────────
For official copy of your submitted ID with 
photo, please visit the admin office with 
a valid request form.

The admin office is open:
Monday - Saturday: 8:00 AM - 5:00 PM

Contact: +63 912 345 6789

══════════════════════════════════════════
`,

      house_rules: `
══════════════════════════════════════════
           LILYCREST DORMITORY
            HOUSE RULES
══════════════════════════════════════════

1. QUIET HOURS (10:00 PM - 7:00 AM)
   • No loud music or disruptive noise
   • Keep TV/music at reasonable volumes
   • Respect neighbors who may be resting

2. VISITOR POLICY
   • Visitors allowed: 8:00 AM - 9:00 PM only
   • Must register at front desk with valid ID
   • No overnight guests allowed
   • Max 2 visitors per tenant at a time

3. CURFEW
   • Main gate closes at 11:00 PM
   • Late entry requires prior coordination
   • Emergency late fee: ₱100

4. CLEANLINESS
   • Keep your room clean and tidy
   • No food waste in rooms
   • Dispose garbage properly
   • Report pest sightings immediately

5. PROHIBITED ITEMS
   • No pets of any kind
   • No cooking appliances in rooms
   • No smoking inside the building
   • No illegal substances or weapons

6. COMMON AREAS
   • Kitchen hours: 6:00 AM - 10:00 PM
   • Clean up after using facilities
   • Label food items in refrigerator

7. PAYMENT
   • Due: 5th of each month
   • Grace period: 2 days
   • Late fee: ₱50/day

8. VIOLATIONS
   May result in warnings, fines, or 
   termination of tenancy.

══════════════════════════════════════════
`,

      curfew_policy: `
══════════════════════════════════════════
           LILYCREST DORMITORY
             CURFEW POLICY
══════════════════════════════════════════

EFFECTIVE CURFEW HOURS:
─────────────────────────────────────────
Main Gate Closing Time: 11:00 PM
Main Gate Opening Time: 5:00 AM

QUIET HOURS:
─────────────────────────────────────────
Start: 10:00 PM
End: 7:00 AM

LATE ENTRY PROCEDURES:
─────────────────────────────────────────
1. Coordinate with admin BEFORE 9:00 PM
   if you expect to arrive after 11:00 PM

2. Call the emergency hotline:
   +63 912 345 6790

3. Emergency late entry fee: ₱100
   (Waived for documented emergencies)

4. Security will verify your identity
   before allowing entry

REPEATED VIOLATIONS:
─────────────────────────────────────────
• 1st offense: Verbal warning
• 2nd offense: Written warning
• 3rd offense: ₱500 fine
• 4th offense: Review for tenancy termination

EXCEPTIONS:
─────────────────────────────────────────
• Medical emergencies (with documentation)
• Work requirements (with employer letter)
• Pre-approved overnight activities

══════════════════════════════════════════
`,

      visitor_policy: `
══════════════════════════════════════════
           LILYCREST DORMITORY
            VISITOR POLICY
══════════════════════════════════════════

VISITING HOURS:
─────────────────────────────────────────
Monday - Sunday: 8:00 AM - 9:00 PM

REGISTRATION REQUIREMENTS:
─────────────────────────────────────────
1. All visitors must register at front desk
2. Present valid government-issued ID
3. Tenant must be present to receive visitor
4. Sign in and sign out required

VISITOR LIMITS:
─────────────────────────────────────────
• Maximum 2 visitors per tenant at a time
• Visitors cannot stay overnight
• No visitors in rooms after 8:00 PM
  (Common areas only)

PROHIBITED:
─────────────────────────────────────────
• Overnight guests
• Unregistered visitors
• Visitors during quiet hours (10PM-7AM)
• Leaving visitors unattended

TENANT RESPONSIBILITIES:
─────────────────────────────────────────
• Tenant is responsible for visitor behavior
• Any damage caused by visitors will be 
  charged to the tenant
• Violations may result in visitor ban

SPECIAL OCCASIONS:
─────────────────────────────────────────
For events or gatherings, submit a request
to admin at least 3 days in advance.

══════════════════════════════════════════
`,

      payment_terms: `
══════════════════════════════════════════
           LILYCREST DORMITORY
            PAYMENT TERMS
══════════════════════════════════════════

MONTHLY RENT DUE DATE:
─────────────────────────────────────────
Due: 5th of each month
Grace Period: Until the 7th

LATE PAYMENT FEES:
─────────────────────────────────────────
• After grace period: ₱50/day
• Maximum late fee: ₱1,500/month

ACCEPTED PAYMENT METHODS:
─────────────────────────────────────────
1. BANK TRANSFER
   BDO: 1234-5678-9012
   BPI: 9876-5432-1098
   Account Name: LilyCrest Properties Inc.

2. GCASH / MAYA
   Number: 0912 345 6789
   Name: LilyCrest Properties

3. CASH (Admin Office)
   Mon-Sat: 8:00 AM - 5:00 PM

IMPORTANT:
─────────────────────────────────────────
• Always upload proof of payment in the app
• Keep transaction receipts
• Payments are verified within 24-48 hours

UTILITIES:
─────────────────────────────────────────
• Water: Included
• WiFi: Included
• Electricity: Separate billing
  (Sub-metered, billed monthly)

NON-PAYMENT CONSEQUENCES:
─────────────────────────────────────────
• 15 days overdue: Final notice
• 30 days overdue: Service restrictions
• 45 days overdue: Tenancy review

══════════════════════════════════════════
`,

      emergency_procedures: `
══════════════════════════════════════════
           LILYCREST DORMITORY
         EMERGENCY PROCEDURES
══════════════════════════════════════════

EMERGENCY CONTACTS:
─────────────────────────────────────────
Dorm Admin Office: +63 912 345 6789
Emergency Hotline: +63 912 345 6790
Building Security: Available 24/7

EMERGENCY SERVICES:
─────────────────────────────────────────
Police (Makati): 911 / (02) 8899-4083
Fire Department: 911 / (02) 8807-8850
Ambulance (Red Cross): (02) 8527-0000

NEAREST HOSPITALS:
─────────────────────────────────────────
• Makati Medical Center
  Phone: (02) 8888-8999
  Distance: ~2 km

• Ospital ng Makati
  Phone: (02) 8882-5802
  Distance: ~1.5 km

FIRE EMERGENCY:
─────────────────────────────────────────
1. Sound the alarm / Shout "FIRE!"
2. Do NOT use elevators
3. Use nearest fire exit
4. Meet at assembly point (parking lot)
5. Call Fire Department: 911

EARTHQUAKE:
─────────────────────────────────────────
1. DROP, COVER, and HOLD ON
2. Stay away from windows
3. After shaking: evacuate if damaged
4. Meet at assembly point

MEDICAL EMERGENCY:
─────────────────────────────────────────
1. Call security immediately
2. Do not move injured person
3. Admin will coordinate ambulance

FIRE EXTINGUISHER LOCATIONS:
─────────────────────────────────────────
• Each floor hallway
• Kitchen area
• Lobby

══════════════════════════════════════════
`,
    };
    
    return documents[docType] || `Document: ${docType}\nGenerated: ${today}\n\nContent not available.`;
  };

  const handlePreview = (doc) => {
    setPreviewDoc({ ...doc, content: generateDocumentContent(doc.id) });
    setShowPreview(true);
  };

  const handleDownload = async (doc) => {
    try {
      setDownloading(doc.id);
      const content = generateDocumentContent(doc.id);
      const fileName = `LilyCrest_${doc.title.replace(/\s+/g, '_')}.txt`;
      
      if (Platform.OS === 'web') {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        Alert.alert('Success', `${doc.title} downloaded successfully!`);
      } else {
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

  const styles = createStyles(colors, isDarkMode);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Ionicons name="folder-open" size={24} color="#1E3A5F" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Your Documents</Text>
            <Text style={styles.infoText}>Tap any document to preview, or download for offline access.</Text>
          </View>
        </View>

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
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.previewButton} onPress={() => handlePreview(doc)}>
                <Ionicons name="eye-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.downloadButton, downloading === doc.id && styles.downloadButtonDisabled]} 
                onPress={() => handleDownload(doc)}
                disabled={downloading === doc.id}
              >
                {downloading === doc.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="download-outline" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.helpCard}>
          <Ionicons name="help-circle" size={22} color="#F97316" />
          <Text style={styles.helpText}>Need a document not listed here? Contact the admin office or chat with Lily for assistance.</Text>
        </View>
      </ScrollView>

      {/* Document Preview Modal */}
      <Modal visible={showPreview} animationType="slide" onRequestClose={() => setShowPreview(false)}>
        <SafeAreaView style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>{previewDoc?.title}</Text>
            <TouchableOpacity style={styles.downloadBtnSmall} onPress={() => { setShowPreview(false); handleDownload(previewDoc); }}>
              <Ionicons name="download-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.previewContent}>
            <Text style={styles.previewText}>{previewDoc?.content}</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: isDarkMode ? 'rgba(30,58,95,0.3)' : '#EEF2FF', borderRadius: 16, padding: 16, marginBottom: 20, gap: 12 },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 4 },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  documentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: isDarkMode ? 1 : 0, borderColor: colors.border, ...Platform.select({ web: { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 } }) },
  documentIcon: { width: 52, height: 52, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  documentContent: { flex: 1 },
  documentTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 4 },
  documentDescription: { fontSize: 13, color: colors.textSecondary, marginBottom: 8 },
  categoryBadge: { backgroundColor: colors.inputBg, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, alignSelf: 'flex-start' },
  categoryText: { fontSize: 11, fontWeight: '500', color: colors.textMuted },
  actionButtons: { flexDirection: 'column', gap: 8 },
  previewButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: isDarkMode ? 'rgba(249,115,22,0.2)' : '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  downloadButton: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  downloadButtonDisabled: { backgroundColor: colors.textMuted },
  helpCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: isDarkMode ? 'rgba(249,115,22,0.1)' : '#FFF7ED', borderRadius: 12, padding: 14, marginTop: 8, gap: 10 },
  helpText: { flex: 1, fontSize: 13, color: isDarkMode ? '#FDBA74' : '#9A3412', lineHeight: 20 },
  // Preview Modal
  previewContainer: { flex: 1, backgroundColor: colors.background },
  previewHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  previewTitle: { fontSize: 17, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'center' },
  downloadBtnSmall: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  previewContent: { flex: 1, padding: 16 },
  previewText: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, color: colors.text, lineHeight: 20 },
});
