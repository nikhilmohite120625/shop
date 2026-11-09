/**
 * Cart Controller
 * Narayani Sarees, Tuljapur
 */
const Cart = require('../models/Cart');

class CartController {
  static async getCart(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'guest_default';
      const cart = await Cart.getCart(userId, sessionId);
      return res.json({ success: true, cart });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch cart', error: error.message });
    }
  }

  static async addToCart(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'guest_default';
      const { product_id, quantity = 1 } = req.body;

      if (!product_id) {
        return res.status(400).json({ success: false, message: 'Product ID is required.' });
      }

      const cart = await Cart.addItem(userId, sessionId, product_id, parseInt(quantity));
      return res.json({ success: true, message: 'Added to your saree cart!', cart });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async updateQuantity(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const sessionId = req.headers['x-session-id'] || req.body.sessionId || 'guest_default';
      const { product_id, quantity } = req.body;

      if (!product_id || quantity === undefined) {
        return res.status(400).json({ success: false, message: 'Product ID and quantity are required.' });
      }

      const cart = await Cart.updateQuantity(userId, sessionId, product_id, parseInt(quantity));
      return res.json({ success: true, message: 'Cart updated', cart });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }

  static async removeItem(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'guest_default';
      const { id } = req.params;

      const cart = await Cart.removeItem(userId, sessionId, id);
      return res.json({ success: true, message: 'Item removed from cart', cart });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async clearCart(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      const sessionId = req.headers['x-session-id'] || req.query.sessionId || 'guest_default';

      await Cart.clearCart(userId, sessionId);
      return res.json({ success: true, message: 'Cart cleared' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = CartController;
