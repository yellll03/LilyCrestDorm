import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface RuleSection {
  id: string;
  title: string;
  icon: string;
  rules: string[];
}

export default function DocumentsScreen() {
  const router = useRouter();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const houseRules: RuleSection[] = [
    {
      id: 'general',
      title: 'General Guidelines',
      icon: 'shield-checkmark',
      rules: [
        'Be considerate to others at all times',
        'No smoking inside the rooms and building premises',
        'Keep the place clean at all times',
        'Conserve water and energy',
        'Keep your RFID access card properly - do not lend it to others',
        'Take good care of appliances and furniture',
        'Pets are not allowed',
        'Bag your trash properly and bring to ground floor bins',
        'Settle monthly rental payments on time to avoid penalty',
        'Three warnings may result in contract termination and deposit forfeiture',
      ],
    },
    {
      id: 'visitors',
      title: 'Visitors Policy',
      icon: 'people',
      rules: [
        'Quadruple sharing rooms: No visitors in rooms/floors, ground floor only',
        'Double sharing rooms: No visitors in rooms/floors, ground floor only',
        'Private rooms: Visitors allowed but no overnight stays',
        'All visitors must be entertained in designated areas',
        'Visitor seating area provided at ground floor',
      ],
    },
    {
      id: 'premises',
      title: 'Common Areas',
      icon: 'business',
      rules: [
        'No smoking in common areas',
        'No alcoholic beverages',
        'No males in female floors and vice versa',
        'No solicitation',
        'Lost RFID card: ₱1,000 replacement fee',
        'Always lock main door and security door behind you',
        'Wear decent attire in common areas',
        'No storage in common areas',
      ],
    },
    {
      id: 'rooms',
      title: 'Room Rules',
      icon: 'bed',
      rules: [
        'Always keep rooms clean',
        'Make beds neatly, keep shared spaces organized',
        'Respect roommates and other residents',
        'Turn off lights when not in use',
        'Administration may inspect rooms for cleanliness',
        'Unplug electronic devices when leaving - no extension cords',
        'No food/drinks in quadruple rooms - use dining area',
        'No room transfers without management approval',
        'Rooms for residential use only - no business activities',
        'No flammable materials allowed',
        'No private gatherings or cooking inside rooms',
        'No permanent alterations or drilling holes',
        'No hanging clothes in windows',
      ],
    },
    {
      id: 'bathroom',
      title: 'Toilet & Bath',
      icon: 'water',
      rules: [
        'Clean up after using shower - remove fallen hair',
        'Be mindful of others while using facilities',
        'Close doors when in use',
        'Bring your own tissue paper',
        'Flush toilet and wipe seat after use',
        'Dispose sanitary products in trash can, not toilet',
        'Do not leave toiletries in shared stalls',
        'Report any leaks to management',
        'No washing/hanging clothes in common CR',
      ],
    },
    {
      id: 'kitchen',
      title: 'Kitchen & Dining',
      icon: 'restaurant',
      rules: [
        'Clean table after eating',
        'Wash dishes immediately - no food debris in sink',
        'Take care of shared electric appliances',
        'Label food items with your name in refrigerator',
        'Do not leave items to spoil - management may dispose',
        'Refrigerator defrost every other Saturday',
        'Close refrigerator properly after use',
        'Cooking not allowed - reheating in microwave OK',
      ],
    },
    {
      id: 'payments',
      title: 'Monthly Payments',
      icon: 'card',
      rules: [
        'Online or bank deposit only (BDO or BPI) - no cash',
        '1st warning: 1 day after due date + ₱50/day penalty',
        '2nd warning: 3 days after due date',
        'Eviction: After 2 warnings or 5 days overdue',
        'Security deposit forfeited if contract not fulfilled',
      ],
    },
    {
      id: 'rfid',
      title: 'RFID Card',
      icon: 'key',
      rules: [
        'All tenants issued an RFID card',
        'Must carry RFID when entering/exiting',
        'Do not transfer or share RFID with others',
        'RFID may be deactivated for delinquent payments',
        'Lost card: Report immediately - ₱1,000 replacement',
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const openPDF = async () => {
    const pdfUrl = 'https://customer-assets.emergentagent.com/job_dorm-connect-9/artifacts/1k9xpbti_ANNEX%20A%20LGP%20House%20Rules%2001.2026%20%281%29.pdf';
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
      } else {
        Alert.alert('Error', 'Cannot open PDF file');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open document');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>House Rules & Guidelines</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Download PDF Button */}
        <TouchableOpacity style={styles.downloadButton} onPress={openPDF}>
          <Ionicons name="document-text" size={24} color="#FFFFFF" />
          <Text style={styles.downloadButtonText}>Download Full PDF Document</Text>
          <Ionicons name="download" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Important Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="warning" size={24} color="#F59E0B" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Important Notice</Text>
            <Text style={styles.noticeText}>
              Three warnings may result in contract termination and forfeiture of security deposit.
              Please read and follow all rules carefully.
            </Text>
          </View>
        </View>

        {/* Rules Sections */}
        {houseRules.map((section) => (
          <View key={section.id} style={styles.sectionCard}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(section.id)}
              activeOpacity={0.7}
            >
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    name={section.icon as any}
                    size={20}
                    color="#1E3A5F"
                  />
                </View>
                <Text style={styles.sectionTitle}>{section.title}</Text>
              </View>
              <Ionicons
                name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#6B7280"
              />
            </TouchableOpacity>

            {expandedSection === section.id && (
              <View style={styles.sectionContent}>
                {section.rules.map((rule, index) => (
                  <View key={index} style={styles.ruleItem}>
                    <View style={styles.ruleBullet}>
                      <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                    </View>
                    <Text style={styles.ruleText}>{rule}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}

        {/* Contact Info */}
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>
            If you have questions about the house rules, please contact the administration office
            or submit a support ticket through the app.
          </Text>
          <TouchableOpacity
            style={styles.contactButton}
            onPress={() => router.push('/(tabs)/chatbot')}
          >
            <Text style={styles.contactButtonText}>Contact Support</Text>
          </TouchableOpacity>
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
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E3A5F',
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 10,
  },
  downloadButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  noticeContent: {
    flex: 1,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E3A5F',
  },
  sectionContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    gap: 10,
  },
  ruleBullet: {
    marginTop: 2,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  contactCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 12,
    padding: 20,
    marginTop: 8,
    alignItems: 'center',
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  contactText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  contactButton: {
    backgroundColor: '#F97316',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  contactButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: Platform.OS === 'ios' ? 100 : 80,
  },
});
