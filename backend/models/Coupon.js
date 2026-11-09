/**
 * Coupon Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore } = require('../config/db');

class Coupon {
  static async validate(code, subtotal) {
    const formattedCode = String(code || '').trim().toUpperCase();
    const sub = parseFloat(subtotal || 0);

    let coupon = null;
    if (isMysqlConnected()) {
      const rows = await query('SELECT * FROM coupons WHERE code = ? AND is_active = TRUE', [formattedCode]);
      if (rows && rows.length > 0) coupon = rows[0];
    } else {
      const mem = getMemoryStore();
      coupon = mem.coupons.find(c => c.code.toUpperCase() === formattedCode && c.is_active);
    }

    if (!coupon) {
      return { valid: false, message: 'Invalid or expired coupon code.' };
    }

    // Expiry check
    const now = new Date();
    if (coupon.expiry_date && new Date(coupon.expiry_date) < now) {
      return { valid: false, message: 'This coupon has expired.' };
    }

    // Minimum order amount
    if (coupon.min_order_amount && sub < parseFloat(coupon.min_order_amount)) {
      return {
        valid: false,
        message: `Minimum order amount of ₹${coupon.min_order_amount} required to use this coupon.`
      };
    }

    // Usage limit
    if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) {
      return { valid: false, message: 'Coupon usage limit has been reached.' };
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (sub * parseFloat(coupon.discount_value)) / 100;
      if (coupon.max_discount_amount && discountAmount > parseFloat(coupon.max_discount_amount)) {
        discountAmount = parseFloat(coupon.max_discount_amount);
      }
    } else {
      discountAmount = parseFloat(coupon.discount_value);
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, sub);

    return {
      valid: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: Math.round(discountAmount * 100) / 100
      },
      message: `Coupon "${coupon.code}" applied successfully! You saved ₹${Math.round(discountAmount)}.`
    };
  }

  static async getAll() {
    if (isMysqlConnected()) {
      return query('SELECT * FROM coupons ORDER BY id DESC');
    }
    const mem = getMemoryStore();
    return mem.coupons;
  }

  static async create(data) {
    const { code, description, discount_type = 'percentage', discount_value, min_order_amount = 0, max_discount_amount = null, start_date, expiry_date, usage_limit = 1000 } = data;
    const upperCode = code.trim().toUpperCase();

    if (isMysqlConnected()) {
      const res = await query(`
        INSERT INTO coupons (code, description, discount_type, discount_value, min_order_amount, max_discount_amount, start_date, expiry_date, usage_limit, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `, [upperCode, description, discount_type, discount_value, min_order_amount, max_discount_amount, start_date || new Date().toISOString().slice(0, 10), expiry_date || '2030-12-31', usage_limit]);
      return { id: res.insertId, ...data, code: upperCode };
    }

    const mem = getMemoryStore();
    const newC = {
      id: mem.coupons.length + 1,
      code: upperCode,
      description,
      discount_type,
      discount_value: parseFloat(discount_value),
      min_order_amount: parseFloat(min_order_amount || 0),
      max_discount_amount: max_discount_amount ? parseFloat(max_discount_amount) : null,
      start_date: start_date || new Date().toISOString().slice(0, 10),
      expiry_date: expiry_date || '2030-12-31',
      usage_limit: parseInt(usage_limit) || 1000,
      times_used: 0,
      is_active: true
    };
    mem.coupons.push(newC);
    return newC;
  }

  static async delete(id) {
    if (isMysqlConnected()) {
      await query('DELETE FROM coupons WHERE id = ?', [id]);
      return true;
    }
    const mem = getMemoryStore();
    mem.coupons = mem.coupons.filter(c => c.id !== Number(id));
    return true;
  }
}

module.exports = Coupon;
