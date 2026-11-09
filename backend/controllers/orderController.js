/**
 * Order Controller
 * Narayani Sarees, Tuljapur
 */
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Coupon = require('../models/Coupon');
const Product = require('../models/Product');
const EmailService = require('../services/emailService');
const PaymentService = require('../services/paymentService');
const WhatsAppService = require('../services/whatsappService');
const SheetsService = require('../services/sheetsService');
const { generateInvoicePDF } = require('../utils/invoice');
const { calculateDeliveryCharge } = require('../utils/helper');
const { getMemoryStore, isMysqlConnected, query } = require('../config/db');

class OrderController {
  static async calculateDelivery(req, res) {
    try {
      const { pincode, subtotal = 0 } = req.query;
      let zones = [];
      if (isMysqlConnected()) {
        zones = await query('SELECT * FROM delivery_zones WHERE is_active = TRUE');
      } else {
        zones = getMemoryStore().delivery_zones || [];
      }

      const result = calculateDeliveryCharge(pincode, parseFloat(subtotal), zones);
      return res.json({ success: true, delivery: result });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Delivery calculation error', error: error.message });
    }
  }

  static async createRazorpayOrder(req, res) {
    try {
      const userId = req.user ? req.user.id : (req.body.user_id ? Number(req.body.user_id) : null);
      const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'guest_default';
      const { coupon_code, shipping_pincode = '413601', items: directItems } = req.body;

      // 1. Fetch Cart Items Server-Side (Do NOT trust client-submitted amount)
      let orderItems = directItems;
      if (!orderItems || orderItems.length === 0) {
        const cart = await Cart.getCart(userId, sessionId);
        if (!cart.items || cart.items.length === 0) {
          return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
        }
        orderItems = cart.items;
      }

      // 2. Calculate Subtotal from Database/Catalog Prices
      const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.price || item.unit_price) * item.quantity), 0);

      // 3. Secure Coupon Calculation
      let discountAmount = 0;
      if (coupon_code) {
        const couponResult = await Coupon.validate(coupon_code, subtotal);
        if (couponResult.valid) {
          discountAmount = couponResult.coupon.discount_amount;
        }
      }

      // 4. Secure Delivery Calculation
      let zones = isMysqlConnected() ? await query('SELECT * FROM delivery_zones WHERE is_active = TRUE') : (getMemoryStore().delivery_zones || []);
      const deliveryInfo = calculateDeliveryCharge(shipping_pincode, subtotal - discountAmount, zones);
      const deliveryCharge = deliveryInfo.charge;

      // 5. Total in INR
      const grandTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);

      // 6. Create Razorpay Order with conversion to paise
      const orderReceipt = `rcpt_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const rzpOrder = await PaymentService.createRazorpayOrder(grandTotal, orderReceipt, {
        customer_pincode: shipping_pincode,
        user_id: userId ? String(userId) : 'guest'
      });

      return res.json({
        success: true,
        order_id: rzpOrder.order_id,
        amount: rzpOrder.amount, // in paise
        currency: rzpOrder.currency || 'INR',
        key_id: rzpOrder.key_id,
        calculated_total_inr: grandTotal
      });
    } catch (error) {
      console.error('[RAZORPAY INITIATE ERROR]:', error);
      return res.status(500).json({ success: false, message: 'Failed to initiate Razorpay checkout', error: error.message });
    }
  }

  static async createOrder(req, res) {
    try {
      const userId = req.user ? req.user.id : (req.body.user_id ? Number(req.body.user_id) : null);
      const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'guest_default';
      const {
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
        coupon_code,
        payment_method = 'COD',
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        items: directItems,
        notes
      } = req.body;

      // Fetch items either from request body or cart (authenticated DB or guest session)
      let orderItems = directItems;
      if (!orderItems || orderItems.length === 0) {
        const cart = await Cart.getCart(userId, sessionId);
        if (!cart.items || cart.items.length === 0) {
          return res.status(400).json({ success: false, message: 'Your shopping cart is empty.' });
        }
        orderItems = cart.items;
      }

      // Calculate Subtotal securely
      const subtotal = orderItems.reduce((sum, item) => sum + (parseFloat(item.price || item.unit_price) * item.quantity), 0);

      // Validate Coupon
      let discountAmount = 0;
      if (coupon_code) {
        const couponResult = await Coupon.validate(coupon_code, subtotal);
        if (couponResult.valid) {
          discountAmount = couponResult.coupon.discount_amount;
        }
      }

      // Calculate Delivery
      let zones = isMysqlConnected() ? await query('SELECT * FROM delivery_zones WHERE is_active = TRUE') : (getMemoryStore().delivery_zones || []);
      const deliveryInfo = calculateDeliveryCharge(shipping_pincode, subtotal - discountAmount, zones);
      const deliveryCharge = deliveryInfo.charge;

      const grandTotal = Math.max(0, subtotal - discountAmount + deliveryCharge);

      // Handle Razorpay Verification
      let paymentStatus = 'pending';
      if (payment_method === 'RAZORPAY') {
        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
          return res.status(400).json({
            success: false,
            message: 'Incomplete Razorpay payment details. Missing payment ID, order ID, or signature.'
          });
        }

        // Prevent Duplicate Order Creation
        if (isMysqlConnected()) {
          const existing = await query('SELECT id, order_number FROM orders WHERE razorpay_payment_id = ?', [razorpay_payment_id]);
          if (existing && existing.length > 0) {
            return res.status(400).json({
              success: false,
              message: `This payment has already been processed for Order #${existing[0].order_number}.`
            });
          }
        } else {
          const mem = getMemoryStore();
          const existing = mem.orders.find(o => o.razorpay_payment_id === razorpay_payment_id);
          if (existing) {
            return res.status(400).json({
              success: false,
              message: `This payment has already been processed for Order #${existing.order_number}.`
            });
          }
        }

        // Verify Razorpay HMAC Signature Server-Side
        const isValid = PaymentService.verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);
        if (!isValid) {
          console.warn(`[PAYMENT REJECTED]: Invalid signature for payment ${razorpay_payment_id}, order ${razorpay_order_id}`);
          return res.status(400).json({
            success: false,
            message: 'Razorpay payment signature verification failed. Payment was not authenticated.'
          });
        }

        paymentStatus = 'paid';
      }

      // Create Order with atomic stock reduction
      const order = await Order.createOrder({
        user_id: userId,
        customer_name,
        customer_email,
        customer_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
        subtotal,
        discount_amount: discountAmount,
        delivery_charge: deliveryCharge,
        grand_total: grandTotal,
        coupon_code: discountAmount > 0 ? coupon_code : null,
        payment_method,
        payment_status: paymentStatus,
        razorpay_order_id: razorpay_order_id || null,
        razorpay_payment_id: razorpay_payment_id || null,
        razorpay_signature: razorpay_signature || null,
        notes
      }, orderItems);

      // Clear Customer Cart only after successful order creation
      await Cart.clearCart(userId, sessionId);

      // Dispatches: Seller notification email, customer confirmation, WhatsApp integration, Google Sheets
      EmailService.notifyNewOrder(order, order.items).catch(e => console.warn('Email dispatch error:', e.message));
      WhatsAppService.sendAutomatedOrderNotification(order, order.items).catch(e => console.warn('WhatsApp notice error:', e.message));
      SheetsService.logOrder(order, order.items).catch(e => console.warn('Sheets sync error:', e.message));

      return res.status(201).json({
        success: true,
        message: 'Your saree order has been placed successfully!',
        order
      });
    } catch (error) {
      console.error('createOrder error:', error);
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async handleRazorpayWebhook(req, res) {
    try {
      const signature = req.headers['x-razorpay-signature'];
      const rawBody = req.rawBody || JSON.stringify(req.body);

      const isValid = PaymentService.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }

      const event = req.body.event;
      console.log(`[RAZORPAY WEBHOOK EVENT]: ${event}`);

      if (event === 'payment.captured' || event === 'order.paid') {
        const paymentEntity = req.body.payload?.payment?.entity;
        if (paymentEntity && paymentEntity.order_id) {
          console.log(`[RAZORPAY WEBHOOK]: Verified payment ID ${paymentEntity.id} for order ${paymentEntity.order_id}`);
        }
      }

      return res.json({ status: 'ok' });
    } catch (err) {
      console.error('[RAZORPAY WEBHOOK ERROR]:', err);
      return res.status(500).json({ status: 'error', message: err.message });
    }
  }

  static async getUserOrders(req, res) {
    try {
      const userId = req.user.id;
      const orders = await Order.getUserOrders(userId);
      return res.json({ success: true, orders });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch your orders', error: error.message });
    }
  }

  static async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      // Check ownership if not admin
      if (req.user && !['admin', 'Super Admin', 'Manager', 'Staff'].includes(req.user.role)) {
        if (order.user_id !== req.user.id && order.customer_email !== req.user.email) {
          return res.status(403).json({ success: false, message: 'Access denied to this order.' });
        }
      }

      return res.json({ success: true, order });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch order details', error: error.message });
    }
  }

  static async trackOrder(req, res) {
    try {
      const { orderNumber } = req.params;
      const order = await Order.findById(orderNumber);
      if (!order) {
        return res.status(404).json({ success: false, message: 'No order found with this tracking number.' });
      }

      return res.json({
        success: true,
        order: {
          order_number: order.order_number,
          order_status: order.order_status,
          customer_name: order.customer_name,
          shipping_city: order.shipping_city,
          created_at: order.created_at,
          history: order.history || []
        }
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Tracking lookup failed', error: error.message });
    }
  }

  static async downloadInvoice(req, res) {
    try {
      const { id } = req.params;
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice_${order.order_number}.pdf`);

      generateInvoicePDF(order, order.items || [], res);
    } catch (error) {
      console.error('Invoice error:', error);
      return res.status(500).json({ success: false, message: 'Failed to generate invoice PDF', error: error.message });
    }
  }

  static async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      const changedBy = req.user ? `${req.user.name} (${req.user.role})` : 'Admin';

      const updated = await Order.updateStatus(id, status, notes, changedBy);

      // Trigger status notification email
      EmailService.notifyOrderStatus(updated, status).catch(e => console.warn('Status email notice:', e.message));

      return res.json({
        success: true,
        message: `Order status successfully updated to ${status}!`,
        order: updated
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async getAllOrdersAdmin(req, res) {
    try {
      const { status, search, page = 1, limit = 20 } = req.query;
      const result = await Order.getAllOrders({ status, search, page, limit });
      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch admin orders', error: error.message });
    }
  }
}

module.exports = OrderController;
