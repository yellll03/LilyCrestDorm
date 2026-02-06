import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DocumentsScreen() {
  const router = useRouter();

  const documents = [
    { title: 'House Rules', icon: 'home', color: '#3B82F6', description: 'General dormitory guidelines' },
    { title: 'Curfew Policy', icon: 'time', color: '#F59E0B', description: 'Entry and exit times' },
    { title: 'Visitor Policy', icon: 'people', color: '#22C55E', description: 'Guest registration rules' },
    { title: 'Payment Terms', icon: 'card', color: '#9333EA', description: 'Billing and payment policies' },
    { title: 'Emergency Procedures', icon: 'alert-circle', color: '#EF4444', description: 'Safety and emergency contacts' },
    { title: 'Contract Agreement', icon: 'document-text', color: '#6B7280', description: 'Tenancy agreement terms' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1E3A5F" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>House Rules & Documents</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>Please read and understand all dormitory rules. Contact the admin if you have questions.</Text>
        </View>

        {documents.map((doc, index) => (
          <TouchableOpacity key={index} style={styles.documentCard}>
            <View style={[styles.documentIcon, { backgroundColor: `${doc.color}15` }]}>
              <Ionicons name={doc.icon} size={24} color={doc.color} />
            </View>
            <View style={styles.documentContent}>
              <Text style={styles.documentTitle}>{doc.title}</Text>
              <Text style={styles.documentDescription}>{doc.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A5F', flex: 1, textAlign: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  infoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderRadius: 12, padding: 16, marginBottom: 16, gap: 12 },
  infoText: { flex: 1, fontSize: 14, color: '#1E40AF', lineHeight: 20 },
  documentCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, ...Platform.select({ web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } }) },
  documentIcon: { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  documentContent: { flex: 1 },
  documentTitle: { fontSize: 15, fontWeight: '600', color: '#1E3A5F', marginBottom: 4 },
  documentDescription: { fontSize: 13, color: '#6B7280' },
});
