/**
 * Coupon Controller
 * Narayani Sarees, Tuljapur
 */
const Coupon = require('../models/Coupon');

class CouponController {
  static async validateCoupon(req, res) {
    try {
      const { code, subtotal } = req.body;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Please enter a coupon code.' });
      }

      const result = await Coupon.validate(code, subtotal || 0);
      if (!result.valid) {
        return res.status(400).json({ success: false, message: result.message });
      }

      return res.json({ success: true, ...result });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Coupon validation failed', error: error.message });
    }
  }

  static async getAllCoupons(req, res) {
    try {
      const coupons = await Coupon.getAll();
      return res.json({ success: true, coupons });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch coupons', error: error.message });
    }
  }

  static async createCoupon(req, res) {
    try {
      const { code, discount_value } = req.body;
      if (!code || !discount_value) {
        return res.status(400).json({ success: false, message: 'Coupon code and discount value are required.' });
      }

      const coupon = await Coupon.create(req.body);
      return res.status(201).json({ success: true, message: 'Coupon created successfully!', coupon });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to create coupon', error: error.message });
    }
  }

  static async deleteCoupon(req, res) {
    try {
      const { id } = req.params;
      await Coupon.delete(id);
      return res.json({ success: true, message: 'Coupon deleted.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete coupon', error: error.message });
    }
  }
}

module.exports = CouponController;
