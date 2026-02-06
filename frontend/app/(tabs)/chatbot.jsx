import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { format } from 'date-fns';

export default function ChatbotScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState([{ id: '1', type: 'bot', content: "Hi! I'm Lily, your virtual assistant. How can I help you today?" }]);
  const [inputText, setInputText] = useState('');
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'general', priority: 'normal' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetailVisible, setTicketDetailVisible] = useState(false);
  const [replyText, setReplyText] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      try { const faqsRes = await apiService.getFAQs(); setFaqs(faqsRes.data || []); } catch (e) { setFaqs([]); }
      try { const categoriesRes = await apiService.getFAQCategories(); setCategories(categoriesRes.data || []); } catch (e) { setCategories([]); }
      try { const ticketsRes = await apiService.getMyTickets(); setTickets(ticketsRes.data || []); } catch (e) { setTickets([]); }
    } catch (error) { console.error('Fetch data error:', error); } finally { setIsLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleFAQSelect = (faq) => {
    const userMessage = { id: Date.now().toString(), type: 'user', content: faq.question };
    const botMessage = { id: (Date.now() + 1).toString(), type: 'faq', content: faq.answer, question: faq.question };
    setMessages([...messages, userMessage, botMessage]);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const userMessage = { id: Date.now().toString(), type: 'user', content: inputText };
    const matchingFAQ = faqs.find((faq) => faq.question.toLowerCase().includes(inputText.toLowerCase()) || inputText.toLowerCase().includes(faq.question.toLowerCase().split(' ').slice(0, 3).join(' ')));
    let botMessage;
    if (matchingFAQ) { botMessage = { id: (Date.now() + 1).toString(), type: 'faq', content: matchingFAQ.answer, question: matchingFAQ.question }; }
    else { botMessage = { id: (Date.now() + 1).toString(), type: 'bot', content: "I couldn't find an answer. Would you like to submit a support ticket?" }; }
    setMessages([...messages, userMessage, botMessage]);
    setInputText('');
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) { Alert.alert('Error', 'Please fill in all required fields'); return; }
    setSubmitting(true);
    try {
      await apiService.createTicket(newTicket);
      setTicketModalVisible(false);
      setNewTicket({ subject: '', message: '', category: 'general', priority: 'normal' });
      fetchData();
      Alert.alert('Success', 'Your support ticket has been submitted.');
    } catch (error) { Alert.alert('Error', 'Failed to submit ticket'); } finally { setSubmitting(false); }
  };

  const handleReplyToTicket = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    try {
      await apiService.respondToTicket(selectedTicket.ticket_id, { message: replyText });
      setReplyText('');
      const updatedTicket = await apiService.getTicket(selectedTicket.ticket_id);
      setSelectedTicket(updatedTicket.data);
      fetchData();
    } catch (error) { Alert.alert('Error', 'Failed to send reply'); }
  };

  const filteredFAQs = selectedCategory ? faqs.filter((faq) => faq.category === selectedCategory) : faqs;
  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#F59E0B';
      case 'in_progress': return '#3B82F6';
      case 'resolved': return '#22C55E';
      case 'closed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  if (isLoading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#1E3A5F" /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botAvatar}><Ionicons name="chatbubbles" size={24} color="#FFFFFF" /></View>
          <View><Text style={styles.headerTitle}>Lily Assistant</Text><Text style={styles.headerSubtitle}>Always here to help</Text></View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.activeTab]} onPress={() => setActiveTab('chat')}>
          <Ionicons name="chatbubble-ellipses" size={18} color={activeTab === 'chat' ? '#1E3A5F' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>FAQ Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'tickets' && styles.activeTab]} onPress={() => setActiveTab('tickets')}>
          <Ionicons name="ticket" size={18} color={activeTab === 'tickets' ? '#1E3A5F' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>Support Tickets</Text>
          {tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length}</Text></View>}
        </TouchableOpacity>
      </View>

      {activeTab === 'chat' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer} keyboardVerticalOffset={100}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={styles.categoryContainer}>
            <TouchableOpacity style={[styles.categoryChip, !selectedCategory && styles.categoryChipActive]} onPress={() => setSelectedCategory(null)}><Text style={[styles.categoryText, !selectedCategory && styles.categoryTextActive]}>All</Text></TouchableOpacity>
            {categories.map((category) => (
              <TouchableOpacity key={category} style={[styles.categoryChip, selectedCategory === category && styles.categoryChipActive]} onPress={() => setSelectedCategory(category)}>
                <Text style={[styles.categoryText, selectedCategory === category && styles.categoryTextActive]}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <ScrollView ref={scrollViewRef} style={styles.messagesContainer} contentContainerStyle={styles.messagesContent} showsVerticalScrollIndicator={false}>
            {messages.map((message) => (
              <View key={message.id} style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.botBubble]}>
                {message.type !== 'user' && <View style={styles.botIcon}><Ionicons name="sparkles" size={14} color="#F59E0B" /></View>}
                <Text style={[styles.messageText, message.type === 'user' && styles.userMessageText]}>{message.content}</Text>
              </View>
            ))}
            <View style={styles.faqContainer}>
              <Text style={styles.faqTitle}>Frequently Asked Questions: ({filteredFAQs.length})</Text>
              {filteredFAQs.length === 0 ? <Text style={styles.noFaqText}>Loading FAQs...</Text> : filteredFAQs.slice(0, 8).map((faq) => (
                <TouchableOpacity key={faq.faq_id} style={styles.faqItem} onPress={() => handleFAQSelect(faq)}>
                  <Ionicons name="help-circle-outline" size={18} color="#1E3A5F" /><Text style={styles.faqQuestion}>{faq.question}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.supportCTA} onPress={() => setTicketModalVisible(true)}>
              <Ionicons name="headset" size={20} color="#FFFFFF" /><Text style={styles.supportCTAText}>Can't find your answer? Contact Support</Text>
            </TouchableOpacity>
            <View style={styles.bottomSpacer} />
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Type your question..." placeholderTextColor="#9CA3AF" value={inputText} onChangeText={setInputText} onSubmitEditing={handleSendMessage} />
            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}><Ionicons name="send" size={20} color="#FFFFFF" /></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.ticketsContainer}>
          <TouchableOpacity style={styles.newTicketButton} onPress={() => setTicketModalVisible(true)}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" /><Text style={styles.newTicketButtonText}>Create New Ticket</Text>
          </TouchableOpacity>
          <ScrollView style={styles.ticketsList} contentContainerStyle={styles.ticketsListContent} showsVerticalScrollIndicator={false}>
            {tickets.length === 0 ? <View style={styles.emptyState}><Ionicons name="ticket-outline" size={48} color="#D1D5DB" /><Text style={styles.emptyText}>No support tickets yet</Text></View> : tickets.map((ticket) => (
              <TouchableOpacity key={ticket.ticket_id} style={styles.ticketCard} onPress={() => { setSelectedTicket(ticket); setTicketDetailVisible(true); }}>
                <View style={styles.ticketHeader}><Text style={styles.ticketSubject}>{ticket.subject}</Text><View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.status)}20` }]}><Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>{ticket.status.replace('_', ' ').toUpperCase()}</Text></View></View>
                <Text style={styles.ticketMessage} numberOfLines={2}>{ticket.message}</Text>
                <View style={styles.ticketFooter}><Text style={styles.ticketDate}>{format(new Date(ticket.created_at), 'MMM dd, yyyy')}</Text>{ticket.responses.length > 0 && <View style={styles.replyBadge}><Ionicons name="chatbubble" size={12} color="#1E3A5F" /><Text style={styles.replyCount}>{ticket.responses.length}</Text></View>}</View>
              </TouchableOpacity>
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      )}

      <Modal visible={ticketModalVisible} animationType="slide" transparent={true} onRequestClose={() => setTicketModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>New Support Ticket</Text><TouchableOpacity onPress={() => setTicketModalVisible(false)}><Ionicons name="close" size={24} color="#1E3A5F" /></TouchableOpacity></View>
            <Text style={styles.inputLabel}>Subject *</Text>
            <TextInput style={styles.modalInput} placeholder="Brief description" placeholderTextColor="#9CA3AF" value={newTicket.subject} onChangeText={(text) => setNewTicket({ ...newTicket, subject: text })} />
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categorySelectScroll}>
              {['general', 'billing', 'maintenance', 'complaint', 'other'].map((cat) => (
                <TouchableOpacity key={cat} style={[styles.categorySelectChip, newTicket.category === cat && styles.categorySelectChipActive]} onPress={() => setNewTicket({ ...newTicket, category: cat })}>
                  <Text style={[styles.categorySelectText, newTicket.category === cat && styles.categorySelectTextActive]}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput style={[styles.modalInput, styles.textArea]} placeholder="Describe your issue in detail..." placeholderTextColor="#9CA3AF" multiline numberOfLines={5} value={newTicket.message} onChangeText={(text) => setNewTicket({ ...newTicket, message: text })} />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTicket} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Submit Ticket</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={ticketDetailVisible} animationType="slide" transparent={true} onRequestClose={() => setTicketDetailVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.ticketDetailModal]}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>Ticket Details</Text><TouchableOpacity onPress={() => setTicketDetailVisible(false)}><Ionicons name="close" size={24} color="#1E3A5F" /></TouchableOpacity></View>
            {selectedTicket && (
              <ScrollView style={styles.ticketDetailScroll} showsVerticalScrollIndicator={false}>
                <View style={styles.ticketDetailHeader}><Text style={styles.ticketDetailSubject}>{selectedTicket.subject}</Text><View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(selectedTicket.status)}20` }]}><Text style={[styles.statusText, { color: getStatusColor(selectedTicket.status) }]}>{selectedTicket.status.replace('_', ' ').toUpperCase()}</Text></View></View>
                <View style={styles.ticketDetailMessage}><Text style={styles.ticketDetailLabel}>Your Message:</Text><Text style={styles.ticketDetailText}>{selectedTicket.message}</Text><Text style={styles.ticketDetailDate}>{format(new Date(selectedTicket.created_at), 'MMM dd, yyyy h:mm a')}</Text></View>
                {selectedTicket.responses.length > 0 && <View style={styles.responsesSection}><Text style={styles.responsesTitle}>Responses:</Text>{selectedTicket.responses.map((response, index) => (
                  <View key={index} style={styles.responseItem}><View style={styles.responseHeader}><Text style={styles.responderName}>{response.responder_name}</Text><Text style={styles.responseDate}>{format(new Date(response.created_at), 'MMM dd, h:mm a')}</Text></View><Text style={styles.responseText}>{response.message}</Text></View>
                ))}</View>}
                {selectedTicket.status !== 'closed' && <View style={styles.replySection}><TextInput style={styles.replyInput} placeholder="Type your reply..." placeholderTextColor="#9CA3AF" value={replyText} onChangeText={setReplyText} multiline /><TouchableOpacity style={styles.replyButton} onPress={handleReplyToTicket}><Text style={styles.replyButtonText}>Send Reply</Text></TouchableOpacity></View>}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1E3A5F' },
  headerSubtitle: { fontSize: 12, color: '#22C55E' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#EBF5FF' },
  tabText: { fontSize: 14, color: '#6B7280' },
  activeTabText: { color: '#1E3A5F', fontWeight: '500' },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  chatContainer: { flex: 1 },
  categoryScroll: { maxHeight: 50, backgroundColor: '#FFFFFF' },
  categoryContainer: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  categoryChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#F3F4F6', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#1E3A5F' },
  categoryText: { fontSize: 13, color: '#6B7280' },
  categoryTextActive: { color: '#FFFFFF' },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 12 },
  userBubble: { backgroundColor: '#1E3A5F', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  botIcon: { marginTop: 2 },
  messageText: { fontSize: 14, color: '#1F2937', lineHeight: 20, flex: 1 },
  userMessageText: { color: '#FFFFFF' },
  faqContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginTop: 12 },
  faqTitle: { fontSize: 14, fontWeight: '600', color: '#1E3A5F', marginBottom: 12 },
  noFaqText: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', paddingVertical: 16 },
  faqItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 10 },
  faqQuestion: { flex: 1, fontSize: 14, color: '#374151' },
  supportCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316', borderRadius: 12, padding: 16, marginTop: 16, gap: 8 },
  supportCTAText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1F2937' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  ticketsContainer: { flex: 1, padding: 16 },
  newTicketButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A5F', paddingVertical: 14, borderRadius: 8, gap: 8, marginBottom: 16 },
  newTicketButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  ticketsList: { flex: 1 },
  ticketsListContent: { gap: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
  ticketCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ticketSubject: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', flex: 1, marginRight: 8 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  ticketMessage: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  ticketFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketDate: { fontSize: 12, color: '#9CA3AF' },
  replyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  replyCount: { fontSize: 12, color: '#1E3A5F', fontWeight: '500' },
  bottomSpacer: { height: Platform.OS === 'ios' ? 100 : 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '80%' },
  ticketDetailModal: { maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#1E3A5F' },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#1F2937' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  categorySelectScroll: { marginBottom: 8 },
  categorySelectChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  categorySelectChipActive: { backgroundColor: '#1E3A5F' },
  categorySelectText: { fontSize: 14, color: '#6B7280' },
  categorySelectTextActive: { color: '#FFFFFF' },
  submitButton: { backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  ticketDetailScroll: { flex: 1 },
  ticketDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  ticketDetailSubject: { fontSize: 18, fontWeight: '600', color: '#1E3A5F', flex: 1, marginRight: 12 },
  ticketDetailMessage: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 16, marginBottom: 16 },
  ticketDetailLabel: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  ticketDetailText: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
  ticketDetailDate: { fontSize: 12, color: '#9CA3AF', marginTop: 12 },
  responsesSection: { marginBottom: 16 },
  responsesTitle: { fontSize: 14, fontWeight: '600', color: '#1E3A5F', marginBottom: 12 },
  responseItem: { backgroundColor: '#EBF5FF', borderRadius: 12, padding: 12, marginBottom: 8 },
  responseHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  responderName: { fontSize: 13, fontWeight: '600', color: '#1E3A5F' },
  responseDate: { fontSize: 11, color: '#6B7280' },
  responseText: { fontSize: 14, color: '#374151', lineHeight: 20 },
  replySection: { marginTop: 8 },
  replyInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 12, fontSize: 14, color: '#1F2937', minHeight: 80, textAlignVertical: 'top' },
  replyButton: { backgroundColor: '#1E3A5F', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  replyButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
});
