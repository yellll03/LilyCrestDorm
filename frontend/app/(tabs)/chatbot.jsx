import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService, api } from '../../src/services/api';
import { useAuth } from '../../src/context/AuthContext';

export default function ChatbotScreen() {
  const { user } = useAuth();
  const scrollViewRef = useRef(null);
  const [sessionId] = useState(() => `${user?.user_id || 'guest'}_${Date.now()}`);
  const [messages, setMessages] = useState([
    { 
      id: '1', 
      type: 'bot', 
      content: "Hi! I'm Lily, your LilyCrest assistant po! 😊 I can help you with billing, house rules, maintenance requests, and more. How can I assist you today?" 
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [liveChatActive, setLiveChatActive] = useState(false);
  const [liveChatStatus, setLiveChatStatus] = useState(null);
  const [adminName, setAdminName] = useState(null);
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const pollingRef = useRef(null);

  const quickQuestions = [
    "What are the payment methods?",
    "What time is curfew?",
    "How to submit maintenance request?",
    "What's included in my rent?",
  ];

  // Poll for live chat updates when active
  useEffect(() => {
    if (liveChatActive) {
      pollingRef.current = setInterval(async () => {
        try {
          const response = await api.get(`/chatbot/live-status/${sessionId}`);
          if (response.data.active) {
            setAdminName(response.data.admin_name);
            // Add new messages
            if (response.data.messages?.length > 0) {
              const newMessages = response.data.messages.filter(
                m => !messages.find(existing => existing.timestamp === m.timestamp)
              );
              if (newMessages.length > 0) {
                setMessages(prev => [...prev, ...newMessages.map(m => ({
                  id: `${Date.now()}_${Math.random()}`,
                  type: m.sender === 'admin' ? 'admin' : m.sender === 'system' ? 'system' : 'user',
                  content: m.content,
                  adminName: m.admin_name,
                  timestamp: m.timestamp
                }))]);
              }
            }
          } else if (response.data.in_queue) {
            setLiveChatStatus(`Position ${response.data.position} in queue`);
          }
        } catch (error) {
          console.error('Poll error:', error);
        }
      }, 3000);
      
      return () => {
        if (pollingRef.current) clearInterval(pollingRef.current);
      };
    }
  }, [liveChatActive, sessionId]);

  const sendMessage = async () => {
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
      const response = await api.post('/chatbot/message', {
        message: userMessage.content,
        session_id: sessionId
      });
      
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== typingId));
      
      if (response.data.live_chat_active) {
        // Message went to live chat
        setLiveChatActive(true);
        setAdminName(response.data.admin_name);
      } else if (response.data.response) {
        // AI response
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          type: 'bot',
          content: response.data.response
        }]);
        
        // Check if AI suggests admin
        if (response.data.needs_admin) {
          setShowAdminPrompt(true);
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

  const requestAdminChat = async () => {
    setShowAdminPrompt(false);
    setIsSending(true);
    
    try {
      const response = await api.post('/chatbot/request-admin', {
        session_id: sessionId,
        reason: 'Tenant requested admin assistance'
      });
      
      if (response.data.queued) {
        setLiveChatActive(true);
        setLiveChatStatus(response.data.message);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          content: response.data.message
        }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect with admin. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const endLiveChat = async () => {
    try {
      await api.post('/chatbot/close-live-chat', { session_id: sessionId });
      setLiveChatActive(false);
      setAdminName(null);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: 'Live chat ended. You can continue chatting with Lily.'
      }]);
    } catch (error) {
      console.error('End chat error:', error);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputText(question);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.botAvatar, liveChatActive && styles.adminAvatar]}>
            <Ionicons name={liveChatActive ? "person" : "sparkles"} size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.headerTitle}>
              {liveChatActive && adminName ? adminName : 'Lily AI Assistant'}
            </Text>
            <View style={styles.onlineStatus}>
              <View style={[styles.onlineDot, liveChatActive && { backgroundColor: '#3B82F6' }]} />
              <Text style={styles.headerSubtitle}>
                {liveChatActive 
                  ? (adminName ? 'Admin Online' : liveChatStatus || 'Connecting...')
                  : 'Online • Powered by Gemini AI'}
              </Text>
            </View>
          </View>
        </View>
        {liveChatActive && (
          <TouchableOpacity style={styles.endChatButton} onPress={endLiveChat}>
            <Ionicons name="close" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Chat Messages */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.chatContainer} keyboardVerticalOffset={90}>
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
            ) : message.type === 'system' ? (
              <View key={message.id} style={styles.systemMessage}>
                <Text style={styles.systemText}>{message.content}</Text>
              </View>
            ) : message.type === 'admin' ? (
              <View key={message.id} style={[styles.messageBubble, styles.adminBubble]}>
                <View style={styles.adminIcon}><Ionicons name="person" size={14} color="#FFFFFF" /></View>
                <View style={styles.adminMessageContent}>
                  {message.adminName && <Text style={styles.adminNameText}>{message.adminName}</Text>}
                  <Text style={styles.adminMessageText}>{message.content}</Text>
                </View>
              </View>
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
          
          {/* Quick Questions (only show at start) */}
          {messages.length <= 2 && !liveChatActive && (
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

          {/* Chat with Admin Button */}
          {!liveChatActive && (
            <TouchableOpacity style={styles.adminButton} onPress={requestAdminChat}>
              <Ionicons name="headset" size={20} color="#FFFFFF" />
              <Text style={styles.adminButtonText}>Chat with Admin</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
        
        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput 
            style={styles.input} 
            placeholder={liveChatActive ? "Reply to admin..." : "Ask me anything..."} 
            placeholderTextColor="#9CA3AF" 
            value={inputText} 
            onChangeText={setInputText} 
            onSubmitEditing={sendMessage}
            editable={!isSending}
            multiline
            maxLength={500}
          />
          <TouchableOpacity 
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]} 
            onPress={sendMessage}
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

      {/* Admin Prompt Modal */}
      <Modal visible={showAdminPrompt} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.promptCard}>
            <View style={styles.promptIcon}>
              <Ionicons name="headset" size={32} color="#1E3A5F" />
            </View>
            <Text style={styles.promptTitle}>Need More Help?</Text>
            <Text style={styles.promptText}>
              It looks like your concern might need human assistance. Would you like to chat with an admin?
            </Text>
            <View style={styles.promptButtons}>
              <TouchableOpacity style={styles.promptButtonSecondary} onPress={() => setShowAdminPrompt(false)}>
                <Text style={styles.promptButtonTextSecondary}>No, Thanks</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.promptButtonPrimary} onPress={requestAdminChat}>
                <Text style={styles.promptButtonTextPrimary}>Chat with Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1E3A5F' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  adminAvatar: { backgroundColor: '#3B82F6' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#FFFFFF' },
  onlineStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.8)' },
  endChatButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(239,68,68,0.2)', justifyContent: 'center', alignItems: 'center' },
  chatContainer: { flex: 1 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16 },
  messageBubble: { maxWidth: '85%', padding: 14, borderRadius: 18, marginBottom: 12 },
  userBubble: { backgroundColor: '#1E3A5F', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  botBubble: { backgroundColor: '#FFFFFF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 10, ...Platform.select({ web: { boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }, default: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 } }) },
  adminBubble: { backgroundColor: '#EFF6FF', alignSelf: 'flex-start', borderBottomLeftRadius: 4, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderColor: '#DBEAFE' },
  botIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  adminIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  adminMessageContent: { flex: 1 },
  adminNameText: { fontSize: 12, fontWeight: '600', color: '#3B82F6', marginBottom: 4 },
  adminMessageText: { fontSize: 15, color: '#1E3A5F', lineHeight: 22 },
  messageText: { fontSize: 15, color: '#1F2937', lineHeight: 22, flex: 1 },
  userMessageText: { color: '#FFFFFF' },
  systemMessage: { alignSelf: 'center', backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginVertical: 12 },
  systemText: { fontSize: 13, color: '#6B7280', textAlign: 'center' },
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
  adminButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1E3A5F', borderRadius: 12, padding: 14, marginTop: 16, gap: 8 },
  adminButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E5E7EB', gap: 12 },
  input: { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15, color: '#1F2937', maxHeight: 100 },
  sendButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#F97316', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#94A3B8' },
  bottomSpacer: { height: Platform.OS === 'ios' ? 100 : 80 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  promptCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 320, alignItems: 'center' },
  promptIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  promptTitle: { fontSize: 20, fontWeight: '600', color: '#1E3A5F', marginBottom: 8 },
  promptText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  promptButtons: { flexDirection: 'row', gap: 12, width: '100%' },
  promptButtonSecondary: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center' },
  promptButtonTextSecondary: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  promptButtonPrimary: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: '#1E3A5F', alignItems: 'center' },
  promptButtonTextPrimary: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
