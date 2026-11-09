/**
 * Wishlist Controller
 * Narayani Sarees, Tuljapur
 */
const Wishlist = require('../models/Wishlist');
const Cart = require('../models/Cart');

class WishlistController {
  static async getWishlist(req, res) {
    try {
      const userId = req.user.id;
      const wishlist = await Wishlist.getWishlist(userId);
      return res.json({ success: true, wishlist });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch wishlist', error: error.message });
    }
  }

  static async addToWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { product_id } = req.body;
      if (!product_id) {
        return res.status(400).json({ success: false, message: 'Product ID is required.' });
      }
      const wishlist = await Wishlist.addItem(userId, product_id);
      return res.json({ success: true, message: 'Added to your wishlist!', wishlist });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async removeFromWishlist(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const wishlist = await Wishlist.removeItem(userId, id);
      return res.json({ success: true, message: 'Removed from wishlist', wishlist });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  static async moveToCart(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      await Cart.addItem(userId, null, id, 1);
      const wishlist = await Wishlist.removeItem(userId, id);
      return res.json({ success: true, message: 'Moved to cart successfully!', wishlist });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = WishlistController;
