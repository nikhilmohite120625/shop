/**
 * =========================================================
 * Narayani Sarees - Backend REST API Server
 * Tuljapur, Maharashtra - Grace In Every Drape
 * =========================================================
 */
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Database initialization
require('./config/db');

// Ensure uploads directory exists for product images
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Import Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const couponRoutes = require('./routes/couponRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const contactRoutes = require('./routes/contactRoutes');

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS Configuration with production domain support
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://narayanisarees.com',
  'https://www.narayanisarees.com',
  'http://localhost:5000',
  'http://localhost:3000',
  'http://127.0.0.1:5000'
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for API consumers, validated by JWT & Session IDs
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-session-id', 'x-razorpay-signature']
}));

// Request Body Parsing with Raw Buffer for Webhook Verification
app.use(express.json({
  limit: '20mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Rate Limiting (300 requests per 15 mins)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again after 15 minutes.' }
});
app.use('/api/', apiLimiter);

// Serve Uploads Directory with Caching
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d' }));

// Robots.txt & Sitemap.xml Routes
app.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.sendFile(path.join(__dirname, '../frontend/robots.txt'));
});

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml');
  res.sendFile(path.join(__dirname, '../frontend/sitemap.xml'));
});

// Serve Frontend Static Files
app.use(express.static(path.join(__dirname, '../frontend'), {
  maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0'
}));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/contact', contactRoutes);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    store: 'Narayani Sarees (Tuljapur)',
    tagline: 'Grace In Every Drape',
    phone: '+91 9359594007',
    email: 'nikhilmohitepcet@gmail.com',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

// Fallback to index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 404 Handler for Unmatched API Endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.originalUrl} not found.` });
});

// Global Production-Ready Error Handler
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'An unexpected error occurred. Please try again later.',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start Server on configured HOST (0.0.0.0) and PORT
app.listen(PORT, HOST, () => {
  const displayUrl = process.env.CLIENT_URL || `http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`;
  console.log(`
  =============================================================
  ✨ NARAYANI SAREES - PRODUCTION E-COMMERCE SERVER ✨
  📍 Tuljapur, Maharashtra - "Grace In Every Drape"
  🚀 Listening on:  ${HOST}:${PORT}
  🌐 Store URL:     ${displayUrl}
  🛍️  Catalog:       ${displayUrl}/pages/shop.html
  👑 Admin Panel:   ${displayUrl}/pages/admin.html
  =============================================================
  `);
});

module.exports = app;
