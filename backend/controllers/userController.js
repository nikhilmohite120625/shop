/**
 * User & Admin Dashboard Controller
 * Narayani Sarees, Tuljapur
 */
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const bcrypt = require('bcryptjs');
const { getMemoryStore, isMysqlConnected, query } = require('../config/db');

class UserController {
  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.user.id);
      return res.json({ success: true, user });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch profile', error: error.message });
    }
  }

  static async updateProfile(req, res) {
    try {
      const updated = await User.updateProfile(req.user.id, req.body);
      return res.json({ success: true, message: 'Profile updated successfully!', user: updated });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update profile', error: error.message });
    }
  }

  static async getAddresses(req, res) {
    try {
      const addresses = await User.getAddresses(req.user.id);
      return res.json({ success: true, addresses });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch addresses', error: error.message });
    }
  }

  static async addAddress(req, res) {
    try {
      const address = await User.addAddress(req.user.id, req.body);
      return res.status(201).json({ success: true, message: 'Address saved successfully!', address });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to add address', error: error.message });
    }
  }

  static async getDashboardAnalytics(req, res) {
    try {
      if (isMysqlConnected()) {
        const salesRes = await query('SELECT SUM(grand_total) as total_sales, COUNT(*) as total_orders FROM orders WHERE order_status != "Cancelled"');
        const todaySalesRes = await query('SELECT SUM(grand_total) as today_sales, COUNT(*) as today_orders FROM orders WHERE DATE(created_at) = CURDATE() AND order_status != "Cancelled"');
        const pendingRes = await query('SELECT COUNT(*) as pending_orders FROM orders WHERE order_status IN ("Pending", "Confirmed", "Packed", "Shipped")');
        const deliveredRes = await query('SELECT COUNT(*) as delivered_orders FROM orders WHERE order_status = "Delivered"');
        const custRes = await query('SELECT COUNT(*) as total_customers FROM users WHERE role = "customer"');
        const prodRes = await query('SELECT COUNT(*) as total_products, SUM(CASE WHEN stock_quantity <= 0 THEN 1 ELSE 0 END) as out_of_stock, SUM(CASE WHEN stock_quantity > 0 AND stock_quantity <= 5 THEN 1 ELSE 0 END) as low_stock FROM products WHERE is_active = TRUE');

        return res.json({
          success: true,
          stats: {
            totalSales: parseFloat(salesRes[0]?.total_sales || 0),
            todaySales: parseFloat(todaySalesRes[0]?.today_sales || 0),
            totalOrders: parseInt(salesRes[0]?.total_orders || 0),
            pendingOrders: parseInt(pendingRes[0]?.pending_orders || 0),
            deliveredOrders: parseInt(deliveredRes[0]?.delivered_orders || 0),
            totalCustomers: parseInt(custRes[0]?.total_customers || 0),
            totalProducts: parseInt(prodRes[0]?.total_products || 0),
            lowStockProducts: parseInt(prodRes[0]?.low_stock || 0),
            outOfStockProducts: parseInt(prodRes[0]?.out_of_stock || 0)
          }
        });
      }

      const mem = getMemoryStore();
      const validOrders = mem.orders.filter(o => o.order_status !== 'Cancelled');
      const totalSales = validOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayOrders = validOrders.filter(o => o.created_at && o.created_at.slice(0, 10) === todayStr);
      const todaySales = todayOrders.reduce((sum, o) => sum + (parseFloat(o.grand_total) || 0), 0);
      const pendingOrders = mem.orders.filter(o => ['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery'].includes(o.order_status)).length;
      const deliveredOrders = mem.orders.filter(o => o.order_status === 'Delivered').length;
      const totalCustomers = mem.users.filter(u => u.role === 'customer').length;
      const activeProducts = mem.products.filter(p => p.is_active !== false);
      const lowStockProducts = activeProducts.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
      const outOfStockProducts = activeProducts.filter(p => p.stock_quantity <= 0).length;

      return res.json({
        success: true,
        stats: {
          totalSales,
          todaySales,
          totalOrders: mem.orders.length,
          pendingOrders,
          deliveredOrders,
          totalCustomers,
          totalProducts: activeProducts.length,
          lowStockProducts,
          outOfStockProducts
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch analytics', error: error.message });
    }
  }

  static async getAllCustomers(req, res) {
    try {
      const customers = await User.getAllUsers();
      return res.json({ success: true, customers });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch customers', error: error.message });
    }
  }

  static async getAllAdmins(req, res) {
    try {
      const admins = await User.getAllAdmins();
      return res.json({ success: true, admins });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch admin accounts', error: error.message });
    }
  }

  static async createAdminAccount(req, res) {
    try {
      const { name, email, password, role_id = 3, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      }

      const hash = await bcrypt.hash(password, 10);
      const roleMap = { 1: 'Super Admin', 2: 'Manager', 3: 'Staff' };

      if (isMysqlConnected()) {
        const result = await query(
          'INSERT INTO admins (name, email, password_hash, role_id, phone, status) VALUES (?, ?, ?, ?, ?, "active")',
          [name, email, hash, role_id, phone || null]
        );
        return res.status(201).json({ success: true, message: 'Admin account created successfully!', id: result.insertId });
      }

      const mem = getMemoryStore();
      const newAdmin = {
        id: mem.admins.length + 1,
        name,
        email,
        password_hash: hash,
        role_id: Number(role_id),
        role: roleMap[role_id] || 'Staff',
        phone: phone || '',
        status: 'active',
        created_at: new Date().toISOString()
      };
      mem.admins.push(newAdmin);
      return res.status(201).json({ success: true, message: 'Admin account created successfully!', admin: newAdmin });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to create admin', error: error.message });
    }
  }

  static async changeAdminCredentials(req, res) {
    try {
      const { email, password, name, phone } = req.body;
      let password_hash = undefined;
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }
        password_hash = await bcrypt.hash(password, 10);
      }

      const updated = await User.updateAdminCredentials(req.user.id, { email, password_hash, name, phone });
      return res.json({
        success: true,
        message: 'Admin credentials updated successfully!',
        admin: {
          id: updated.id,
          name: updated.name,
          email: updated.email,
          role: updated.role
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update admin credentials', error: error.message });
    }
  }
}

module.exports = UserController;
