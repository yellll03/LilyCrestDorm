import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { format } from 'date-fns';
import axios from 'axios';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://dormitory-mgmt-test.preview.emergentagent.com';

export default function ChatbotScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [faqs, setFaqs] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      type: 'bot', 
      content: "Hi! I'm Lily, your virtual assistant po! 😊 I can help you with questions about billing, house rules, maintenance, and more. How can I assist you today?" 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [ticketModalVisible, setTicketModalVisible] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'general' });
  const [submitting, setSubmitting] = useState(false);

  const quickQuestions = [
    "What are the payment methods?",
    "What time is curfew?",
    "How do I submit maintenance request?",
    "What's included in my rent?",
  ];

  const fetchData = async () => {
    try {
      setIsLoading(true);
      try { const faqsRes = await apiService.getFAQs(); setFaqs(faqsRes.data || []); } catch (e) { setFaqs([]); }
      try { const ticketsRes = await apiService.getMyTickets(); setTickets(ticketsRes.data || []); } catch (e) { setTickets([]); }
    } catch (error) { 
      console.error('Fetch data error:', error); 
    } finally { 
      setIsLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const sendToAI = async (message) => {
    try {
      const response = await axios.post(`${BACKEND_URL}:8002/api/chatbot/message`, {
        message,
        session_id: sessionId
      }, { timeout: 30000 });
      return response.data.response;
    } catch (error) {
      console.error('AI chat error:', error);
      // Fallback to FAQ search
      const matchingFAQ = faqs.find((faq) => 
        faq.question.toLowerCase().includes(message.toLowerCase()) || 
        message.toLowerCase().includes(faq.question.toLowerCase().split(' ').slice(0, 3).join(' '))
      );
      if (matchingFAQ) {
        return matchingFAQ.answer;
      }
      return "I'm having trouble connecting right now po. Please try again in a moment, or contact the admin office at +63 912 345 6789 for immediate assistance.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    const userMessage = { id: Date.now().toString(), type: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);
    
    // Add typing indicator
    const typingId = `typing_${Date.now()}`;
    setMessages(prev => [...prev, { id: typingId, type: 'typing', content: '' }]);
    
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    
    try {
      const aiResponse = await sendToAI(userMessage.content);
      
      // Remove typing indicator and add response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, { id: (Date.now() + 1).toString(), type: 'bot', content: aiResponse }];
      });
    } catch (error) {
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== typingId);
        return [...filtered, { 
          id: (Date.now() + 1).toString(), 
          type: 'bot', 
          content: "Sorry, I encountered an error. Please try again or contact admin support." 
        }];
      });
    } finally {
      setIsSending(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputText(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleEscalate = () => {
    setTicketModalVisible(true);
    setNewTicket({ ...newTicket, message: messages.map(m => `[${m.type}]: ${m.content}`).join('\n') });
  };

  const handleSubmitTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) { 
      Alert.alert('Error', 'Please fill in all required fields'); 
      return; 
    }
    setSubmitting(true);
    try {
      await apiService.createTicket(newTicket);
      setTicketModalVisible(false);
      setNewTicket({ subject: '', message: '', category: 'general' });
      fetchData();
      Alert.alert('Success', 'Your support ticket has been submitted. An admin will respond soon.');
    } catch (error) { 
      Alert.alert('Error', 'Failed to submit ticket'); 
    } finally { 
      setSubmitting(false); 
    }
  };

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
          <View style={styles.botAvatar}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Lily AI Assistant</Text>
            <View style={styles.onlineStatus}>
              <View style={styles.onlineDot} />
              <Text style={styles.headerSubtitle}>Online • Powered by AI</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.activeTab]} onPress={() => setActiveTab('chat')}>
          <Ionicons name="chatbubble-ellipses" size={18} color={activeTab === 'chat' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'chat' && styles.activeTabText]}>AI Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'tickets' && styles.activeTab]} onPress={() => setActiveTab('tickets')}>
          <Ionicons name="ticket" size={18} color={activeTab === 'tickets' ? '#FFFFFF' : '#6B7280'} />
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.activeTabText]}>Support Tickets</Text>
          {tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {activeTab === 'chat' ? (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer} keyboardVerticalOffset={100}>
          <ScrollView 
            ref={scrollViewRef} 
            style={styles.messagesContainer} 
            contentContainerStyle={styles.messagesContent} 
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              message.type === 'typing' ? (
                <View key={message.id} style={[styles.messageBubble, styles.botBubble]}>
                  <View style={styles.botIcon}><Ionicons name="sparkles" size={14} color="#F97316" /></View>
                  <View style={styles.typingIndicator}>
                    <View style={[styles.typingDot, styles.typingDot1]} />
                    <View style={[styles.typingDot, styles.typingDot2]} />
                    <View style={[styles.typingDot, styles.typingDot3]} />
                  </View>
                </View>
              ) : (
                <View key={message.id} style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.botBubble]}>
                  {message.type !== 'user' && <View style={styles.botIcon}><Ionicons name="sparkles" size={14} color="#F97316" /></View>}
                  <Text style={[styles.messageText, message.type === 'user' && styles.userMessageText]}>{message.content}</Text>
                </View>
              )
            ))}
            
            {/* Quick Questions */}
            {messages.length <= 2 && (
              <View style={styles.quickQuestionsContainer}>
                <Text style={styles.quickQuestionsTitle}>Quick Questions:</Text>
                <View style={styles.quickQuestionsGrid}>
                  {quickQuestions.map((question, index) => (
                    <TouchableOpacity 
                      key={index} 
                      style={styles.quickQuestionChip}
                      onPress={() => handleQuickQuestion(question)}
                    >
                      <Text style={styles.quickQuestionText}>{question}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Escalate Option */}
            <TouchableOpacity style={styles.escalateButton} onPress={handleEscalate}>
              <Ionicons name="headset" size={18} color="#FFFFFF" />
              <Text style={styles.escalateText}>Need human support? Create a ticket</Text>
            </TouchableOpacity>
            
            <View style={styles.bottomSpacer} />
          </ScrollView>
          
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Ask me anything about the dormitory..." 
              placeholderTextColor="#9CA3AF" 
              value={inputText} 
              onChangeText={setInputText} 
              onSubmitEditing={handleSendMessage}
              editable={!isSending}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, isSending && styles.sendButtonDisabled]} 
              onPress={handleSendMessage}
              disabled={isSending || !inputText.trim()}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      ) : (
        <View style={styles.ticketsContainer}>
          <TouchableOpacity style={styles.newTicketButton} onPress={() => setTicketModalVisible(true)}>
            <Ionicons name="add-circle" size={20} color="#FFFFFF" />
            <Text style={styles.newTicketButtonText}>Create New Ticket</Text>
          </TouchableOpacity>
          <ScrollView style={styles.ticketsList} contentContainerStyle={styles.ticketsListContent} showsVerticalScrollIndicator={false}>
            {tickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="ticket-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>No support tickets yet</Text>
              </View>
            ) : tickets.map((ticket) => (
              <View key={ticket.ticket_id} style={styles.ticketCard}>
                <View style={styles.ticketHeader}>
                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                      {ticket.status.replace('_', ' ').toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.ticketMessage} numberOfLines={2}>{ticket.message}</Text>
                <Text style={styles.ticketDate}>{format(new Date(ticket.created_at), 'MMM dd, yyyy')}</Text>
              </View>
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        </View>
      )}

      {/* Create Ticket Modal */}
      <Modal visible={ticketModalVisible} animationType="slide" transparent={true} onRequestClose={() => setTicketModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Contact Human Support</Text>
              <TouchableOpacity onPress={() => setTicketModalVisible(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>Subject *</Text>
            <TextInput 
              style={styles.modalInput} 
              placeholder="Brief description of your concern" 
              placeholderTextColor="#9CA3AF" 
              value={newTicket.subject} 
              onChangeText={(text) => setNewTicket({ ...newTicket, subject: text })} 
            />
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {['general', 'billing', 'maintenance', 'complaint'].map((cat) => (
                <TouchableOpacity 
                  key={cat} 
                  style={[styles.categoryChip, newTicket.category === cat && styles.categoryChipActive]} 
                  onPress={() => setNewTicket({ ...newTicket, category: cat })}
                >
                  <Text style={[styles.categoryText, newTicket.category === cat && styles.categoryTextActive]}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.inputLabel}>Message *</Text>
            <TextInput 
              style={[styles.modalInput, styles.textArea]} 
              placeholder="Describe your issue in detail..." 
              placeholderTextColor="#9CA3AF" 
              multiline 
              numberOfLines={5} 
              value={newTicket.message} 
              onChangeText={(text) => setNewTicket({ ...newTicket, message: text })} 
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitTicket} disabled={submitting}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Submit to Admin</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#1E3A5F' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  tabs: { flexDirection: 'row', backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, gap: 6, backgroundColor: '#F3F4F6' },
  activeTab: { backgroundColor: '#1E3A5F' },
  tabText: { fontSize: 14, color: '#6B7280' },
  activeTabText: { color: '#FFFFFF', fontWeight: '500' },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, minWidth: 20, height: 20, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 6 },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '600' },
  chatContainer: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12 },
  userBubble: { backgroundColor: '#1E3A5F', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 10, ...Platform.select({ web: { boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } }) },
  botIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  messageText: { fontSize: 15, color: '#1F2937', lineHeight: 22, flex: 1 },
  userMessageText: { color: '#FFFFFF' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  typingDot1: { opacity: 0.4 },
  typingDot2: { opacity: 0.6 },
  typingDot3: { opacity: 0.8 },
  quickQuestionsContainer: { marginTop: 8, marginBottom: 16 },
  quickQuestionsTitle: { fontSize: 13, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
  quickQuestionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickQuestionChip: { backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  quickQuestionText: { fontSize: 13, color: '#374151' },
  escalateButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F97316', borderRadius: 12, padding: 14, marginTop: 16, gap: 8 },
  escalateText: { color: '#FFFFFF', fontSize: 14, fontWeight: '500' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: '#1F2937', maxHeight: 100 },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1E3A5F', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#94A3B8' },
  ticketsContainer: { flex: 1, padding: 16 },
  newTicketButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A5F', paddingVertical: 14, borderRadius: 12, gap: 8, marginBottom: 16 },
  newTicketButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  ticketsList: { flex: 1 },
  ticketsListContent: { gap: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, color: '#9CA3AF', marginTop: 12 },
  ticketCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, ...Platform.select({ web: { boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 } }) },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ticketSubject: { fontSize: 16, fontWeight: '600', color: '#1E3A5F', flex: 1, marginRight: 8 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  ticketMessage: { fontSize: 14, color: '#6B7280', marginBottom: 8 },
  ticketDate: { fontSize: 12, color: '#9CA3AF' },
  bottomSpacer: { height: Platform.OS === 'ios' ? 100 : 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600', color: '#1E3A5F' },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
  modalInput: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#1F2937', backgroundColor: '#F9FAFB' },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  categoryScroll: { marginBottom: 8 },
  categoryChip: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#F3F4F6', marginRight: 8 },
  categoryChipActive: { backgroundColor: '#1E3A5F' },
  categoryText: { fontSize: 14, color: '#6B7280' },
  categoryTextActive: { color: '#FFFFFF' },
  submitButton: { backgroundColor: '#F97316', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  submitButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
