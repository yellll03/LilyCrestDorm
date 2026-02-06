require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

// Chat session storage (in production, use Redis)
const chatSessions = new Map();
const liveChatQueue = new Map(); // For live admin chats

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// MongoDB Connection
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'test_database';
let db;

// Firebase Admin SDK initialization
let firebaseApp;
try {
  const serviceAccount = require('./firebase-credentials.json');
  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

// Connect to MongoDB
async function connectToMongo() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Helper function to verify tenant in Firebase
async function verifyTenantInFirebase(email) {
  if (!firebaseApp) {
    console.log('Firebase not initialized, skipping verification');
    return null;
  }
  
  try {
    console.log(`Verifying email in Firebase Auth: ${email}`);
    const userRecord = await admin.auth().getUserByEmail(email);
    console.log(`User found in Firebase Auth: ${userRecord.uid}`);
    return {
      firebase_id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || null,
      phone: userRecord.phoneNumber || null,
      picture: userRecord.photoURL || null,
    };
  } catch (error) {
    console.log(`User not found in Firebase Auth: ${email}`);
    return null;
  }
}

// Helper function to verify Firebase ID token
async function verifyFirebaseIdToken(idToken) {
  if (!firebaseApp) {
    throw new Error('Firebase not initialized');
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error('Firebase ID token verification error:', error);
    throw error;
  }
}

// Authentication middleware
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const cookieToken = req.cookies?.session_token;
  
  let token = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (cookieToken) {
    token = cookieToken;
  }
  
  if (!token) {
    return res.status(401).json({ detail: 'Not authenticated' });
  }
  
  try {
    const session = await db.collection('user_sessions').findOne({ 
      session_token: token,
      expires_at: { $gt: new Date() }
    });
    
    if (!session) {
      return res.status(401).json({ detail: 'Invalid or expired session' });
    }
    
    const user = await db.collection('users').findOne({ user_id: session.user_id });
    if (!user) {
      return res.status(401).json({ detail: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ detail: 'Authentication error' });
  }
}

// ============== Health & Root Routes ==============
app.get('/api', (req, res) => {
  res.json({ message: 'Lilycrest Dormitory Management API - Node.js' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    backend: 'Node.js/Express',
    auth: 'Firebase-only'
  });
});

// ============== Auth Routes ==============

// Firebase Google Sign-In - Verify ID token and create session
app.post('/api/auth/google', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ detail: 'Firebase ID token is required' });
    }
    
    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseIdToken(idToken);
    } catch (error) {
      return res.status(401).json({ detail: 'Invalid Firebase ID token' });
    }
    
    const userEmail = decodedToken.email;
    const firebaseUid = decodedToken.uid;
    
    // Verify tenant exists in Firebase Auth (registered tenant check)
    const tenantData = await verifyTenantInFirebase(userEmail);
    
    if (!tenantData) {
      return res.status(403).json({ 
        detail: 'Access denied. Your account is not registered as an active tenant. Please contact the dormitory administrator.' 
      });
    }
    
    let userId = `user_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const sessionToken = `session_${uuidv4().replace(/-/g, '')}`;
    
    // Check if user exists in MongoDB
    const existingUser = await db.collection('users').findOne({ email: userEmail });
    
    if (existingUser) {
      userId = existingUser.user_id;
      await db.collection('users').updateOne(
        { user_id: userId },
        { $set: {
          name: decodedToken.name || existingUser.name,
          picture: decodedToken.picture || existingUser.picture,
          firebase_uid: firebaseUid,
          last_login: new Date()
        }}
      );
    } else {
      const newUser = {
        user_id: userId,
        email: userEmail,
        name: decodedToken.name || tenantData.name || userEmail.split('@')[0],
        picture: decodedToken.picture || tenantData.picture || null,
        phone: tenantData.phone || null,
        role: 'resident',
        firebase_uid: firebaseUid,
        created_at: new Date(),
        last_login: new Date()
      };
      await db.collection('users').insertOne(newUser);
    }
    
    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await db.collection('user_sessions').deleteMany({ user_id: userId });
    await db.collection('user_sessions').insertOne({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt,
      created_at: new Date()
    });
    
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    const user = await db.collection('users').findOne({ user_id: userId }, { projection: { _id: 0 } });
    console.log(`User ${userEmail} logged in via Firebase Google Auth`);
    res.json({ user, session_token: sessionToken });
    
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({ detail: 'Authentication service error' });
  }
});

// Email/Password Login via Firebase
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ detail: 'Email and password are required' });
    }
    
    // Verify user exists in Firebase Authentication
    const tenantData = await verifyTenantInFirebase(email);
    
    if (!tenantData) {
      return res.status(403).json({ 
        detail: 'Access denied. Your account is not registered as an active tenant. Please contact the dormitory administrator.' 
      });
    }
    
    // Verify password using Firebase Auth REST API
    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    
    if (firebaseApiKey) {
      try {
        await axios.post(
          `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
          { email, password, returnSecureToken: true }
        );
      } catch (firebaseError) {
        const errorMessage = firebaseError.response?.data?.error?.message || 'INVALID_CREDENTIALS';
        
        if (errorMessage.includes('INVALID_PASSWORD') || errorMessage.includes('INVALID_LOGIN_CREDENTIALS')) {
          return res.status(401).json({ detail: 'Invalid email or password' });
        } else if (errorMessage.includes('EMAIL_NOT_FOUND')) {
          return res.status(401).json({ detail: 'Invalid email or password' });
        } else if (errorMessage.includes('USER_DISABLED')) {
          return res.status(403).json({ detail: 'This account has been disabled' });
        } else if (errorMessage.includes('TOO_MANY_ATTEMPTS')) {
          return res.status(429).json({ detail: 'Too many failed attempts. Please try again later.' });
        } else {
          return res.status(401).json({ detail: 'Invalid email or password' });
        }
      }
    }
    
    // Create or update user
    let userId = `user_${uuidv4().replace(/-/g, '').substring(0, 12)}`;
    const sessionToken = `session_${uuidv4().replace(/-/g, '')}`;
    
    const existingUser = await db.collection('users').findOne({ email });
    
    if (existingUser) {
      userId = existingUser.user_id;
      await db.collection('users').updateOne(
        { user_id: userId },
        { $set: { 
          firebase_uid: tenantData.firebase_id,
          last_login: new Date()
        }}
      );
    } else {
      const newUser = {
        user_id: userId,
        email,
        name: tenantData.name || email.split('@')[0],
        phone: tenantData.phone || null,
        picture: tenantData.picture || null,
        role: 'resident',
        firebase_uid: tenantData.firebase_id,
        created_at: new Date(),
        last_login: new Date()
      };
      await db.collection('users').insertOne(newUser);
    }
    
    // Create session
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.collection('user_sessions').deleteMany({ user_id: userId });
    await db.collection('user_sessions').insertOne({
      user_id: userId,
      session_token: sessionToken,
      expires_at: expiresAt,
      created_at: new Date()
    });
    
    res.cookie('session_token', sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    const user = await db.collection('users').findOne({ user_id: userId }, { projection: { _id: 0 } });
    console.log(`User ${email} logged in via email/password`);
    res.json({ user, session_token: sessionToken });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ detail: 'Authentication service error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const { _id, ...user } = req.user;
  res.json(user);
});

app.post('/api/auth/logout', authMiddleware, async (req, res) => {
  try {
    await db.collection('user_sessions').deleteMany({ user_id: req.user.user_id });
    res.clearCookie('session_token');
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ detail: 'Logout failed' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ detail: 'Email is required' });
    }
    
    const tenantData = await verifyTenantInFirebase(email);
    if (!tenantData) {
      return res.json({ message: 'If your email is registered, you will receive a password reset link.' });
    }
    
    const firebaseApiKey = process.env.FIREBASE_API_KEY;
    if (firebaseApiKey) {
      await axios.post(
        `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseApiKey}`,
        { requestType: 'PASSWORD_RESET', email }
      );
    }
    
    res.json({ message: 'If your email is registered, you will receive a password reset link.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.json({ message: 'If your email is registered, you will receive a password reset link.' });
  }
});

// ============== User Routes ==============
app.get('/api/users/me', authMiddleware, (req, res) => {
  const { _id, ...user } = req.user;
  res.json(user);
});

app.put('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const updates = req.body;
    const allowedFields = ['name', 'phone', 'address', 'picture'];
    const updateData = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }
    
    await db.collection('users').updateOne(
      { user_id: req.user.user_id },
      { $set: updateData }
    );
    
    const updatedUser = await db.collection('users').findOne(
      { user_id: req.user.user_id },
      { projection: { _id: 0 } }
    );
    
    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ detail: 'Failed to update user' });
  }
});

// ============== Dashboard Routes ==============
app.get('/api/dashboard/me', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    
    const assignment = await db.collection('room_assignments').findOne(
      { user_id: userId, status: 'active' }
    );
    
    let room = null;
    if (assignment) {
      room = await db.collection('rooms').findOne({ room_id: assignment.room_id });
    }
    
    const latestBill = await db.collection('billing').findOne(
      { user_id: userId },
      { sort: { due_date: -1 } }
    );
    
    const activeMaintenanceCount = await db.collection('maintenance_requests').countDocuments({
      user_id: userId,
      status: { $in: ['pending', 'in_progress'] }
    });
    
    res.json({
      user: { ...req.user, _id: undefined },
      assignment,
      room,
      latest_bill: latestBill,
      active_maintenance_count: activeMaintenanceCount
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ detail: 'Failed to fetch dashboard data' });
  }
});

// ============== Room Routes ==============
app.get('/api/rooms', async (req, res) => {
  try {
    const rooms = await db.collection('rooms').find({}).toArray();
    res.json(rooms.map(r => ({ ...r, _id: undefined })));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch rooms' });
  }
});

app.get('/api/rooms/:roomId', async (req, res) => {
  try {
    const room = await db.collection('rooms').findOne({ room_id: req.params.roomId });
    if (!room) {
      return res.status(404).json({ detail: 'Room not found' });
    }
    res.json({ ...room, _id: undefined });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch room' });
  }
});

// ============== Billing Routes ==============
app.get('/api/billing/me', authMiddleware, async (req, res) => {
  try {
    const bills = await db.collection('billing')
      .find({ user_id: req.user.user_id })
      .sort({ due_date: -1 })
      .toArray();
    res.json(bills.map(b => ({ ...b, _id: undefined })));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch billing' });
  }
});

app.post('/api/billing', authMiddleware, async (req, res) => {
  try {
    const { amount, description, billing_type, due_date } = req.body;
    
    const newBill = {
      billing_id: `bill_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
      user_id: req.user.user_id,
      amount,
      description,
      billing_type: billing_type || 'rent',
      due_date: new Date(due_date),
      status: 'pending',
      payment_method: null,
      payment_date: null,
      created_at: new Date()
    };
    
    await db.collection('billing').insertOne(newBill);
    res.status(201).json({ ...newBill, _id: undefined });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to create bill' });
  }
});

// ============== Maintenance Routes ==============
app.get('/api/maintenance/me', authMiddleware, async (req, res) => {
  try {
    const requests = await db.collection('maintenance_requests')
      .find({ user_id: req.user.user_id })
      .sort({ created_at: -1 })
      .toArray();
    res.json(requests.map(r => ({ ...r, _id: undefined })));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch maintenance requests' });
  }
});

app.post('/api/maintenance', authMiddleware, async (req, res) => {
  try {
    const { request_type, description, urgency } = req.body;
    
    const newRequest = {
      request_id: `maint_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
      user_id: req.user.user_id,
      request_type,
      description,
      urgency: urgency || 'normal',
      status: 'pending',
      assigned_to: null,
      notes: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection('maintenance_requests').insertOne(newRequest);
    res.status(201).json({ ...newRequest, _id: undefined });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to create maintenance request' });
  }
});

// ============== Announcements Routes ==============
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await db.collection('announcements')
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .toArray();
    res.json(announcements.map(a => ({ ...a, _id: undefined })));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch announcements' });
  }
});

// ============== FAQ Routes ==============
app.get('/api/faqs', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const faqs = await db.collection('faqs').find(query).toArray();
    res.json(faqs.map(f => ({ ...f, _id: undefined })));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch FAQs' });
  }
});

// ============== Ticket Routes ==============
app.get('/api/tickets/me', authMiddleware, async (req, res) => {
  try {
    const tickets = await db.collection('tickets')
      .find({ user_id: req.user.user_id })
      .sort({ created_at: -1 })
      .toArray();
    res.json(tickets.map(t => ({ ...t, _id: undefined })));
  } catch (error) {
    res.status(500).json({ detail: 'Failed to fetch tickets' });
  }
});

app.post('/api/tickets', authMiddleware, async (req, res) => {
  try {
    const { subject, message, category } = req.body;
    
    const newTicket = {
      ticket_id: `ticket_${uuidv4().replace(/-/g, '').substring(0, 12)}`,
      user_id: req.user.user_id,
      subject,
      message,
      category: category || 'General',
      status: 'open',
      responses: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    
    await db.collection('tickets').insertOne(newTicket);
    res.status(201).json({ ...newTicket, _id: undefined });
  } catch (error) {
    res.status(500).json({ detail: 'Failed to create ticket' });
  }
});

// ============== Seed Data Route ==============
app.post('/api/seed', async (req, res) => {
  try {
    // Seed Rooms
    const sampleRooms = [
      {
        room_id: 'room_quad_001',
        room_number: 'Q101',
        room_type: 'Quadruple Sharing',
        bed_type: 'Double Deck Bed',
        capacity: 4,
        floor: 1,
        status: 'available',
        price: 5400.0,
        regular_price: 6000.0,
        discount: 10,
        amenities: ['WiFi', 'Air Conditioning', 'Lounge Area', 'Shared Toilet & Shower'],
        images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800'],
        created_at: new Date()
      },
      {
        room_id: 'room_double_001',
        room_number: 'D101',
        room_type: 'Double Sharing',
        bed_type: 'Double Deck Bed',
        capacity: 2,
        floor: 1,
        status: 'available',
        price: 7200.0,
        regular_price: 9000.0,
        discount: 20,
        amenities: ['WiFi', 'Air Conditioning', 'Lounge Area', 'Shared Toilet & Shower'],
        images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
        created_at: new Date()
      },
      {
        room_id: 'room_private_001',
        room_number: 'P301',
        room_type: 'Private',
        bed_type: 'Double Bed',
        capacity: 2,
        floor: 3,
        status: 'available',
        price: 13500.0,
        regular_price: 15000.0,
        discount: 10,
        amenities: ['WiFi', 'Air Conditioning', 'Private Toilet & Shower', 'Kitchenette'],
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
        created_at: new Date()
      }
    ];
    
    await db.collection('rooms').deleteMany({});
    await db.collection('rooms').insertMany(sampleRooms);
    
    // Seed Announcements
    const sampleAnnouncements = [
      {
        announcement_id: 'ann_001',
        title: 'Welcome to Lilycrest Gil Puyat!',
        content: 'We\'re excited to have you as part of our community at #7 Gil Puyat Ave. cor Marconi St. Brgy Palanan, Makati City. Contact us at 0917 1000087.',
        author_id: 'admin',
        priority: 'high',
        category: 'General',
        is_active: true,
        created_at: new Date()
      },
      {
        announcement_id: 'ann_002',
        title: '🎉 DISCOUNTED Monthly Rates Available!',
        content: 'Avail our discounted monthly rates! Quadruple Sharing: 10% OFF. Double Sharing: 20% OFF. Private Room: 10% OFF.',
        author_id: 'admin',
        priority: 'high',
        category: 'Promo',
        is_active: true,
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        announcement_id: 'ann_003',
        title: 'Monthly Rent Payment Reminder',
        content: 'Please remember that monthly rent is due on the 1st of each month. Grace period: 2 days. Late fee: ₱50/day.',
        author_id: 'admin',
        priority: 'normal',
        category: 'Billing',
        is_active: true,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
    
    await db.collection('announcements').deleteMany({});
    await db.collection('announcements').insertMany(sampleAnnouncements);
    
    // Seed FAQs
    const sampleFaqs = [
      { faq_id: 'faq_001', question: 'What are the payment methods accepted?', answer: 'We accept Bank Transfer (BDO or BPI), Online Payment, and Cash at the front desk.', category: 'Billing' },
      { faq_id: 'faq_002', question: 'What is included in the monthly rent?', answer: 'Monthly rent includes WiFi, air conditioning usage, water, and access to common areas.', category: 'Billing' },
      { faq_id: 'faq_003', question: 'What are the quiet hours?', answer: 'Quiet hours are from 10:00 PM to 7:00 AM.', category: 'House Rules' },
      { faq_id: 'faq_004', question: 'How do I submit a maintenance request?', answer: 'Use the Services tab in the app or visit the front desk.', category: 'Maintenance' }
    ];
    
    await db.collection('faqs').deleteMany({});
    await db.collection('faqs').insertMany(sampleFaqs);
    
    // Seed billing for existing users
    const existingUser = await db.collection('users').findOne({});
    if (existingUser) {
      const sampleBilling = [
        {
          billing_id: 'bill_001',
          user_id: existingUser.user_id,
          amount: 5400.0,
          description: 'Monthly Rent - February 2026',
          billing_type: 'rent',
          due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          status: 'pending',
          created_at: new Date()
        },
        {
          billing_id: 'bill_002',
          user_id: existingUser.user_id,
          amount: 850.0,
          description: 'Electricity Bill - January 2026',
          billing_type: 'electricity',
          due_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          status: 'pending',
          created_at: new Date()
        },
        {
          billing_id: 'bill_003',
          user_id: existingUser.user_id,
          amount: 450.0,
          description: 'Water Bill - January 2026',
          billing_type: 'water',
          due_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
          status: 'pending',
          created_at: new Date()
        },
        {
          billing_id: 'bill_004',
          user_id: existingUser.user_id,
          amount: 5400.0,
          description: 'Monthly Rent - January 2026',
          billing_type: 'rent',
          due_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          status: 'paid',
          payment_method: 'Bank Transfer - BDO',
          payment_date: new Date(Date.now() - 32 * 24 * 60 * 60 * 1000),
          created_at: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
        }
      ];
      
      await db.collection('billing').deleteMany({});
      await db.collection('billing').insertMany(sampleBilling);
    }
    
    res.json({ message: 'Seed data created successfully' });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ detail: 'Failed to seed data' });
  }
});

// Start server
async function startServer() {
  await connectToMongo();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log('Backend: Node.js/Express');
    console.log('Auth: Firebase-only (Google + Email/Password)');
  });
}

startServer().catch(console.error);
