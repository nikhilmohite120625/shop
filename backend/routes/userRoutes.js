/**
 * User & Admin Dashboard Routes
 * Narayani Sarees, Tuljapur
 */
const express = require('express');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin, requireSuperAdmin } = require('../middleware/admin');

// Customer Profile & Address Book
router.get('/profile', authenticate, UserController.getProfile);
router.put('/profile', authenticate, UserController.updateProfile);
router.get('/addresses', authenticate, UserController.getAddresses);
router.post('/addresses', authenticate, UserController.addAddress);

// Admin Analytics & Staff Management
router.get('/admin/analytics', authenticate, requireAdmin, UserController.getDashboardAnalytics);
router.get('/admin/customers', authenticate, requireAdmin, UserController.getAllCustomers);
router.get('/admin/staff', authenticate, requireSuperAdmin, UserController.getAllAdmins);
router.post('/admin/staff', authenticate, requireSuperAdmin, UserController.createAdminAccount);
router.put('/admin/change-credentials', authenticate, requireAdmin, UserController.changeAdminCredentials);

module.exports = router;
