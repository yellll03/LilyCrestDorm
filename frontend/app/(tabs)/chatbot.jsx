import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { format } from 'date-fns';

const CATEGORIES = [
  { id: 'billing', label: 'Billing & Payment', icon: 'card-outline', color: '#3B82F6' },
  { id: 'maintenance', label: 'Maintenance', icon: 'construct-outline', color: '#F59E0B' },
  { id: 'rules', label: 'House Rules', icon: 'document-text-outline', color: '#22C55E' },
  { id: 'documents', label: 'Documents', icon: 'folder-outline', color: '#9333EA' },
  { id: 'general', label: 'General Inquiry', icon: 'help-circle-outline', color: '#6B7280' },
];

const QUICK_QUESTIONS = [
  'What are the payment methods?',
  'When is rent due?',
  'How to submit maintenance request?',
  'What time is curfew?',
  'Can I have visitors?',
  'How to download my contract?',
];

export default function ChatbotScreen() {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const scrollViewRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [sessionId] = useState(() => `${user?.user_id || 'guest'}_${Date.now()}`);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [enquiries, setEnquiries] = useState([]);
  const [isLoadingEnquiries, setIsLoadingEnquiries] = useState(false);
  
  // Live Support state
  const [liveChatActive, setLiveChatActive] = useState(false);
  const [liveChatStatus, setLiveChatStatus] = useState(null);
  const [adminName, setAdminName] = useState(null);
  const [liveMessages, setLiveMessages] = useState([]);
  const pollingRef = useRef(null);

  useEffect(() => {
    if (activeTab === 'enquiries') {
      fetchEnquiries();
    }
  }, [activeTab]);

  // Poll for live chat updates
  useEffect(() => {
    if (liveChatActive && activeTab === 'support') {
      pollingRef.current = setInterval(async () => {
        try {
          const response = await api.get(`/chatbot/live-status/${sessionId}`);
          if (response.data.active) {
            setAdminName(response.data.admin_name);
            if (response.data.messages?.length > 0) {
              setLiveMessages(response.data.messages);
            }
          } else if (response.data.in_queue) {
            setLiveChatStatus(`Position ${response.data.position} in queue`);
          }
        } catch (error) {
          console.error('Poll error:', error);
        }
      }, 3000);
      
      return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
    }
  }, [liveChatActive, activeTab, sessionId]);

  const fetchEnquiries = async () => {
    setIsLoadingEnquiries(true);
    try {
      const response = await api.get('/chatbot/history');
      setEnquiries(response.data || []);
    } catch (error) {
      console.error('Fetch enquiries error:', error);
    } finally {
      setIsLoadingEnquiries(false);
    }
  };

  const sendAIMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    const userMessage = { id: Date.now().toString(), type: 'user', content: inputText };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsSending(true);
    
    const typingId = `typing_${Date.now()}`;
    setMessages(prev => [...prev, { id: typingId, type: 'typing', content: '' }]);
    
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    
    try {
      const response = await api.post('/chatbot/message', {
        message: userMessage.content,
        session_id: sessionId,
        category: selectedCategory
      });
      
      setMessages(prev => prev.filter(m => m.id !== typingId));
      
      if (response.data.response) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.data.response
        }]);
        
        if (response.data.needs_admin) {
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            type: 'suggestion',
            content: 'This seems like a complex issue. Would you like to chat with an admin?'
          }]);
        }
      }
    } catch (error) {
      console.error('Send error:', error);
      setMessages(prev => prev.filter(m => m.id !== typingId));
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I'm having trouble connecting po. Please try again or contact admin at +63 912 345 6789."
      }]);
    } finally {
      setIsSending(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const requestLiveSupport = async () => {
    setIsSending(true);
    try {
      const response = await api.post('/chatbot/request-admin', {
        session_id: sessionId,
        reason: selectedCategory || 'General inquiry'
      });
      
      if (response.data.queued) {
        setLiveChatActive(true);
        setLiveChatStatus(response.data.message);
        setActiveTab('support');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect with admin. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const sendLiveMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    const message = inputText;
    setInputText('');
    setIsSending(true);
    
    try {
      await api.post('/chatbot/message', {
        message,
        session_id: sessionId
      });
      setLiveMessages(prev => [...prev, {
        sender: 'tenant',
        content: message,
        timestamp: new Date().toISOString()
      }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const endLiveChat = async () => {
    try {
      await api.post('/chatbot/close-live-chat', { session_id: sessionId });
      setLiveChatActive(false);
      setAdminName(null);
      setLiveMessages([]);
      setActiveTab('chat');
      Alert.alert('Chat Ended', 'Your live support session has ended.');
    } catch (error) {
      console.error('End chat error:', error);
    }
  };

  const selectCategory = (category) => {
    setSelectedCategory(category.id);
    setMessages([{
      id: Date.now().toString(),
      type: 'bot',
      content: `Great! You selected ${category.label}. How can I help you with this po?`
    }]);
  };

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  const styles = createStyles(colors, isDarkMode);

  const renderChatTab = () => (
    <View style={styles.tabContent}>
      <ScrollView 
        ref={scrollViewRef} 
        style={styles.messagesContainer} 
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Message */}
        {messages.length === 0 && (
          <View style={styles.welcomeSection}>
            <View style={styles.welcomeHeader}>
              <Text style={styles.welcomeTitle}>Hi,</Text>
              <Text style={styles.welcomeSubtitle}>I am Lily, your AI Assistant.</Text>
              <Text style={styles.welcomeDesc}>I can help you with billing, maintenance, house rules, and more.</Text>
            </View>
            
            {/* Category Buttons */}
            <View style={styles.categoriesContainer}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity 
                  key={category.id} 
                  style={[styles.categoryButton, selectedCategory === category.id && styles.categoryButtonActive]}
                  onPress={() => selectCategory(category)}
                >
                  <Ionicons name={category.icon} size={20} color={category.color} />
                  <Text style={styles.categoryLabel}>{category.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {/* Quick Questions */}
            <View style={styles.quickSection}>
              <Text style={styles.quickTitle}>You may want to ask:</Text>
              {QUICK_QUESTIONS.map((question, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.quickQuestionButton}
                  onPress={() => handleQuickQuestion(question)}
                >
                  <Text style={styles.quickQuestionText}>{question}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        {/* Chat Messages */}
        {messages.map((message) => (
          message.type === 'typing' ? (
            <View key={message.id} style={[styles.messageBubble, styles.botBubble]}>
              <View style={styles.typingIndicator}>
                <View style={[styles.typingDot, { opacity: 0.4 }]} />
                <View style={[styles.typingDot, { opacity: 0.6 }]} />
                <View style={[styles.typingDot, { opacity: 0.8 }]} />
              </View>
            </View>
          ) : message.type === 'suggestion' ? (
            <TouchableOpacity key={message.id} style={styles.suggestionBubble} onPress={requestLiveSupport}>
              <Ionicons name="headset-outline" size={20} color="#F97316" />
              <Text style={styles.suggestionText}>{message.content}</Text>
              <Ionicons name="chevron-forward" size={20} color="#F97316" />
            </TouchableOpacity>
          ) : (
            <View key={message.id} style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.botBubble]}>
              {message.type === 'bot' && (
                <View style={styles.botIcon}><Ionicons name="sparkles" size={14} color="#F97316" /></View>
              )}
              <Text style={[styles.messageText, message.type === 'user' && styles.userMessageText]}>
                {message.content}
              </Text>
            </View>
          )
        ))}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput 
          style={styles.input} 
          placeholder="Type your concern here..." 
          placeholderTextColor={colors.textMuted}
          value={inputText} 
          onChangeText={setInputText}
          onSubmitEditing={sendAIMessage}
          editable={!isSending}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]} 
          onPress={sendAIMessage}
          disabled={isSending || !inputText.trim()}
        >
          {isSending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={20} color="#FFFFFF" />}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSupportTab = () => (
    <View style={styles.tabContent}>
      {!liveChatActive ? (
        <View style={styles.supportIntro}>
          <View style={styles.supportIcon}>
            <Ionicons name="headset" size={48} color="#1E3A5F" />
          </View>
          <Text style={styles.supportTitle}>Live Support</Text>
          <Text style={styles.supportDesc}>Connect with our admin team for immediate assistance with complex issues.</Text>
          <TouchableOpacity style={styles.connectButton} onPress={requestLiveSupport} disabled={isSending}>
            {isSending ? <ActivityIndicator color="#FFFFFF" /> : (
              <><Ionicons name="chatbubbles" size={20} color="#FFFFFF" /><Text style={styles.connectButtonText}>Start Live Chat</Text></>
            )}
          </TouchableOpacity>
          <Text style={styles.supportNote}>Available Mon-Sat, 8AM-8PM</Text>
        </View>
      ) : (
        <>
          <View style={styles.liveChatHeader}>
            <View style={styles.adminInfo}>
              <View style={styles.adminAvatar}><Ionicons name="person" size={24} color="#FFFFFF" /></View>
              <View>
                <Text style={styles.adminName}>{adminName || 'Admin'}</Text>
                <Text style={styles.adminStatus}>{adminName ? 'Online' : liveChatStatus || 'Connecting...'}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.endChatBtn} onPress={endLiveChat}>
              <Text style={styles.endChatText}>End Chat</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.liveMessagesContainer} contentContainerStyle={styles.liveMessagesContent}>
            {liveMessages.map((msg, index) => (
              <View key={index} style={[styles.liveMessageBubble, msg.sender === 'tenant' ? styles.tenantBubble : msg.sender === 'admin' ? styles.adminBubble : styles.systemBubble]}>
                <Text style={[styles.liveMessageText, msg.sender === 'tenant' && styles.tenantMessageText]}>{msg.content}</Text>
              </View>
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="Reply to admin..." placeholderTextColor={colors.textMuted} value={inputText} onChangeText={setInputText} onSubmitEditing={sendLiveMessage} multiline />
            <TouchableOpacity style={[styles.sendButton, (!inputText.trim() || isSending) && styles.sendButtonDisabled]} onPress={sendLiveMessage} disabled={isSending || !inputText.trim()}>
              {isSending ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="send" size={20} color="#FFFFFF" />}
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  const renderEnquiriesTab = () => (
    <View style={styles.tabContent}>
      {isLoadingEnquiries ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : enquiries.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyText}>No enquiries yet</Text>
          <Text style={styles.emptySubtext}>Your chat history will appear here</Text>
        </View>
      ) : (
        <ScrollView style={styles.enquiriesList} contentContainerStyle={styles.enquiriesContent}>
          {enquiries.map((enquiry, index) => (
            <View key={index} style={styles.enquiryCard}>
              <View style={styles.enquiryHeader}>
                <Text style={styles.enquiryQuestion} numberOfLines={2}>{enquiry.message}</Text>
                <Text style={styles.enquiryDate}>{format(new Date(enquiry.created_at), 'MMM dd, h:mm a')}</Text>
              </View>
              <Text style={styles.enquiryResponse} numberOfLines={3}>{enquiry.response}</Text>
            </View>
          ))}
          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.headerBg }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.lilyAvatar}>
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </View>
          <Text style={styles.headerTitle}>Chat with LilyCrest</Text>
        </View>
      </View>
      
      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.surface }]}>
        <TouchableOpacity style={[styles.tab, activeTab === 'chat' && styles.tabActive]} onPress={() => setActiveTab('chat')}>
          <Text style={[styles.tabText, activeTab === 'chat' && styles.tabTextActive]}>Chat</Text>
          {activeTab === 'chat' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'support' && styles.tabActive]} onPress={() => setActiveTab('support')}>
          <Text style={[styles.tabText, activeTab === 'support' && styles.tabTextActive]}>Live Support</Text>
          {activeTab === 'support' && <View style={styles.tabIndicator} />}
          {liveChatActive && <View style={styles.liveDot} />}
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'enquiries' && styles.tabActive]} onPress={() => setActiveTab('enquiries')}>
          <Text style={[styles.tabText, activeTab === 'enquiries' && styles.tabTextActive]}>My Enquiries</Text>
          {activeTab === 'enquiries' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>
      
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.content, { backgroundColor: colors.background }]} keyboardVerticalOffset={0}>
        {activeTab === 'chat' && renderChatTab()}
        {activeTab === 'support' && renderSupportTab()}
        {activeTab === 'enquiries' && renderEnquiriesTab()}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors, isDarkMode) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lilyAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center', position: 'relative' },
  tabActive: {},
  tabText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  tabTextActive: { color: '#F97316', fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, left: '25%', right: '25%', height: 3, backgroundColor: '#F97316', borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  liveDot: { position: 'absolute', top: 8, right: '20%', width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  content: { flex: 1 },
  tabContent: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  welcomeSection: { marginBottom: 20 },
  welcomeHeader: { backgroundColor: isDarkMode ? 'rgba(249,115,22,0.1)' : '#FFF7ED', borderRadius: 16, padding: 20, marginBottom: 20 },
  welcomeTitle: { fontSize: 24, fontWeight: '700', color: '#F97316' },
  welcomeSubtitle: { fontSize: 20, fontWeight: '600', color: '#F97316', marginBottom: 8 },
  welcomeDesc: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  categoriesContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  categoryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 25, borderWidth: 1, borderColor: colors.border, gap: 8 },
  categoryButtonActive: { borderColor: '#F97316', backgroundColor: isDarkMode ? 'rgba(249,115,22,0.1)' : '#FFF7ED' },
  categoryLabel: { fontSize: 13, color: colors.text, fontWeight: '500' },
  quickSection: { marginTop: 8 },
  quickTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 12 },
  quickQuestionButton: { backgroundColor: colors.surface, paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  quickQuestionText: { fontSize: 14, color: colors.textSecondary },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12 },
  userBubble: { backgroundColor: colors.accent, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: colors.surface, alignSelf: 'flex-start', borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderColor: colors.border },
  botIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: isDarkMode ? 'rgba(249,115,22,0.2)' : '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  messageText: { fontSize: 15, color: colors.text, lineHeight: 22, flex: 1 },
  userMessageText: { color: '#FFFFFF' },
  suggestionBubble: { flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? 'rgba(249,115,22,0.1)' : '#FFF7ED', padding: 14, borderRadius: 12, marginBottom: 12, gap: 10, borderWidth: 1, borderColor: '#F97316' },
  suggestionText: { flex: 1, fontSize: 14, color: '#F97316', fontWeight: '500' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 },
  typingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, gap: 12 },
  input: { flex: 1, backgroundColor: colors.inputBg, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: colors.text, maxHeight: 100 },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: colors.textMuted },
  bottomSpacer: { height: Platform.OS === 'ios' ? 20 : 10 },
  // Live Support
  supportIntro: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  supportIcon: { width: 100, height: 100, borderRadius: 50, backgroundColor: isDarkMode ? 'rgba(30,58,95,0.3)' : '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  supportTitle: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 12 },
  supportDesc: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  connectButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent, paddingVertical: 16, paddingHorizontal: 32, borderRadius: 12, gap: 10 },
  connectButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  supportNote: { fontSize: 13, color: colors.textMuted, marginTop: 16 },
  liveChatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  adminInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adminAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  adminName: { fontSize: 16, fontWeight: '600', color: colors.text },
  adminStatus: { fontSize: 12, color: '#22C55E' },
  endChatBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#FEE2E2' },
  endChatText: { fontSize: 14, fontWeight: '500', color: '#EF4444' },
  liveMessagesContainer: { flex: 1 },
  liveMessagesContent: { padding: 16 },
  liveMessageBubble: { maxWidth: '85%', padding: 12, borderRadius: 16, marginBottom: 10 },
  tenantBubble: { backgroundColor: colors.accent, alignSelf: 'flex-end' },
  adminBubble: { backgroundColor: isDarkMode ? 'rgba(59,130,246,0.2)' : '#EFF6FF', alignSelf: 'flex-start', borderWidth: 1, borderColor: '#DBEAFE' },
  systemBubble: { backgroundColor: colors.inputBg, alignSelf: 'center' },
  liveMessageText: { fontSize: 14, color: colors.text },
  tenantMessageText: { color: '#FFFFFF' },
  // Enquiries
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 16 },
  emptySubtext: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  enquiriesList: { flex: 1 },
  enquiriesContent: { padding: 16 },
  enquiryCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  enquiryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  enquiryQuestion: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, marginRight: 8 },
  enquiryDate: { fontSize: 12, color: colors.textMuted },
  enquiryResponse: { fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
});
