/**
 * Order Routes
 * Narayani Sarees, Tuljapur
 */
const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const { validateCheckout } = require('../middleware/validation');

// Public / Customer Delivery Calculator & Tracking
router.get('/calculate-delivery', OrderController.calculateDelivery);
router.get('/track/:orderNumber', OrderController.trackOrder);

// Customer Checkout & Orders
router.post('/razorpay-initiate', optionalAuth, OrderController.createRazorpayOrder);
router.post('/razorpay-webhook', OrderController.handleRazorpayWebhook);
router.post('/', optionalAuth, validateCheckout, OrderController.createOrder);
router.get('/my-orders', authenticate, OrderController.getUserOrders);
router.get('/:id', optionalAuth, OrderController.getOrderById);
router.get('/:id/invoice', OrderController.downloadInvoice);

// Admin Order Management
router.get('/admin/all', authenticate, requireAdmin, OrderController.getAllOrdersAdmin);
router.put('/:id/status', authenticate, requireAdmin, OrderController.updateOrderStatus);

module.exports = router;
