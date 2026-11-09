/**
 * Narayani Sarees - Database Configuration & Resilient Pool
 * Tuljapur, Maharashtra
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { sampleCategories, sampleProducts, sampleCoupons, sampleDeliveryZones, sampleFestivalOffers } = require('../../database/init_db');

let pool = null;
let isMysqlConnected = false;

// Dynamically read Admin configuration from environment
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@narayanisarees.com').toLowerCase();
const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123';
const adminName = process.env.ADMIN_NAME || 'Nikhil Mohite (Super Admin)';
const adminHash = bcrypt.hashSync(adminPass, 10);

// In-memory / JSON-backed data engine for development resilience
let memoryStore = {
  categories: [...sampleCategories],
  products: JSON.parse(JSON.stringify(sampleProducts)),
  users: [
    {
      id: 1,
      name: 'Pooja Patil',
      email: 'customer@gmail.com',
      phone: '9876543210',
      password_hash: '$2a$10$wE97wRk5525lCjK5.iY00u0Wn7JkCqUu27wVbV/H5Zg5xOq9c1qxe', // Customer@123
      role: 'customer',
      is_verified: true,
      created_at: new Date().toISOString()
    }
  ],
  admins: [
    {
      id: 1,
      name: adminName,
      email: adminEmail,
      password_hash: adminHash,
      role_id: 1,
      role: 'Super Admin',
      phone: process.env.STORE_PHONE || '+919359594007',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      name: 'Store Manager',
      email: 'manager@narayanisarees.com',
      password_hash: '$2a$10$wE97wRk5525lCjK5.iY00u0Wn7JkCqUu27wVbV/H5Zg5xOq9c1qxe', // Manager@123
      role_id: 2,
      role: 'Manager',
      phone: '+919359594008',
      status: 'active',
      created_at: new Date().toISOString()
    },
    {
      id: 3,
      name: 'Operations Staff',
      email: 'staff@narayanisarees.com',
      password_hash: '$2a$10$wE97wRk5525lCjK5.iY00u0Wn7JkCqUu27wVbV/H5Zg5xOq9c1qxe', // Staff@123
      role_id: 3,
      role: 'Staff',
      phone: '+919359594009',
      status: 'active',
      created_at: new Date().toISOString()
    }
  ],
  roles: [
    { id: 1, name: 'Super Admin', description: 'Full unrestricted store access', permissions: ['*'] },
    { id: 2, name: 'Manager', description: 'Product, Inventory, and Order management', permissions: ['products.*', 'orders.*', 'inventory.*', 'coupons.*', 'reviews.*'] },
    { id: 3, name: 'Staff', description: 'Order processing and customer support', permissions: ['orders.read', 'orders.update', 'returns.read', 'returns.update'] }
  ],
  carts: {},
  wishlists: {},
  addresses: [
    {
      id: 1,
      user_id: 1,
      full_name: 'Pooja Patil',
      phone: '9876543210',
      alternate_phone: '',
      address_line: 'Plot 14, Shanti Nagar, Near Bhavani Temple',
      landmark: 'Tulja Bhavani Temple Road',
      city: 'Tuljapur',
      state: 'Maharashtra',
      pincode: '413601',
      address_type: 'home',
      is_default: true,
      created_at: new Date().toISOString()
    }
  ],
  orders: [],
  order_items: [],
  order_status_history: [],
  payments: [],
  reviews: [
    {
      id: 1,
      product_id: 1,
      user_id: 1,
      user_name: 'Pooja Patil',
      rating: 5,
      title: 'Magnificent Royal Paithani!',
      comment: 'The mor-bangadi pallu work is breathtaking! Bought it for my brother\'s wedding in Tuljapur. Received so many compliments!',
      is_verified_purchase: true,
      status: 'approved',
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      product_id: 2,
      user_id: 1,
      user_name: 'Pooja Patil',
      rating: 5,
      title: 'Pure Silk & Authentic Weave',
      comment: 'High quality silk, true to images. Excellent packaging and fast delivery to Solapur.',
      is_verified_purchase: true,
      status: 'approved',
      created_at: new Date().toISOString()
    }
  ],
  coupons: [...sampleCoupons],
  coupon_usage: [],
  returns: [],
  exchanges: [],
  delivery_zones: [...sampleDeliveryZones],
  contact_messages: [],
  festival_offers: [...sampleFestivalOffers]
};

async function initPool() {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'saree_shop',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 2500,
      multipleStatements: true
    });

    const conn = await pool.getConnection();
    console.log('MySQL Connection established with database:', process.env.DB_NAME || 'saree_shop');
    conn.release();
    isMysqlConnected = true;
  } catch (error) {
    console.warn('[DB NOTICE] MySQL is currently unreachable (' + error.message + '). Operating with live resilient data store engine.');
    isMysqlConnected = false;
  }
}

initPool();

module.exports = {
  getPool: () => pool,
  isMysqlConnected: () => isMysqlConnected,
  getMemoryStore: () => memoryStore,
  query: async (sql, params = []) => {
    if (isMysqlConnected && pool) {
      try {
        const [results] = await pool.query(sql, params);
        return results;
      } catch (err) {
        console.error('MySQL Query Error:', err);
        throw err;
      }
    }
    return null;
  }
};
