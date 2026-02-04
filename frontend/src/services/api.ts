import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'https://dorm-auth-staging.preview.emergentagent.com';

export const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('session_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('session_token');
    }
    return Promise.reject(error);
  }
);

// API functions
export const apiService = {
  // Dashboard
  getDashboard: () => api.get('/dashboard/me'),
  
  // Rooms
  getRooms: (params?: { status?: string; room_type?: string }) => 
    api.get('/rooms', { params }),
  getRoom: (roomId: string) => api.get(`/rooms/${roomId}`),
  
  // Assignments
  getMyAssignment: () => api.get('/assignments/me'),
  
  // Billing
  getMyBilling: () => api.get('/billing/me'),
  getLatestBilling: () => api.get('/billing/me/latest'),
  updateBilling: (billingId: string, data: any) => 
    api.put(`/billing/${billingId}`, data),
  
  // Maintenance
  getMyMaintenance: (status?: string) => 
    api.get('/maintenance/me', { params: { status } }),
  createMaintenance: (data: any) => api.post('/maintenance', data),
  updateMaintenance: (requestId: string, data: any) => 
    api.put(`/maintenance/${requestId}`, data),
  
  // Announcements
  getAnnouncements: () => api.get('/announcements'),
  
  // User Profile
  getProfile: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  
  // FAQs (Chatbot)
  getFAQs: (category?: string) => api.get('/faqs', { params: { category } }),
  getFAQCategories: () => api.get('/faqs/categories'),
  
  // Support Tickets
  getMyTickets: (status?: string) => api.get('/tickets/me', { params: { status } }),
  getTicket: (ticketId: string) => api.get(`/tickets/${ticketId}`),
  createTicket: (data: any) => api.post('/tickets', data),
  respondToTicket: (ticketId: string, data: any) => 
    api.post(`/tickets/${ticketId}/respond`, data),
  updateTicketStatus: (ticketId: string, status: string) => 
    api.put(`/tickets/${ticketId}/status`, { status }),
  
  // Seed data
  seedData: () => api.post('/seed'),
};
