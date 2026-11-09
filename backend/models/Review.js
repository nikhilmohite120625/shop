/**
 * Review Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore } = require('../config/db');

class Review {
  static async getProductReviews(productId) {
    if (isMysqlConnected()) {
      return query(`
        SELECT r.*, u.profile_image
        FROM reviews r
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.product_id = ? AND r.status = 'approved'
        ORDER BY r.id DESC
      `, [productId]);
    }

    const mem = getMemoryStore();
    return mem.reviews.filter(r => r.product_id === Number(productId) && r.status === 'approved');
  }

  static async addReview({ product_id, user_id, user_name, rating, title, comment, image_url }) {
    // Check if verified purchase
    let isVerifiedPurchase = false;
    if (isMysqlConnected()) {
      const orderCheck = await query(`
        SELECT oi.id FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE o.user_id = ? AND oi.product_id = ? AND o.order_status IN ('Delivered', 'Confirmed', 'Shipped')
      `, [user_id, product_id]);
      isVerifiedPurchase = orderCheck && orderCheck.length > 0;

      const result = await query(`
        INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment, image_url, is_verified_purchase, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')
      `, [product_id, user_id, user_name, rating, title, comment, image_url, isVerifiedPurchase]);

      // Update product rating and reviews count
      const avgRes = await query('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE product_id = ? AND status = "approved"', [product_id]);
      if (avgRes && avgRes.length > 0) {
        await query('UPDATE products SET rating = ?, total_reviews = ? WHERE id = ?', [parseFloat(avgRes[0].avg_rating).toFixed(2), avgRes[0].count, product_id]);
      }

      return { id: result.insertId, product_id, user_id, user_name, rating, title, comment, is_verified_purchase: isVerifiedPurchase };
    }

    const mem = getMemoryStore();
    // Check if order exists for user
    const hasOrdered = mem.orders.some(o => o.user_id === Number(user_id) && mem.order_items.some(i => i.order_id === o.id && i.product_id === Number(product_id)));

    const newRev = {
      id: mem.reviews.length + 1,
      product_id: Number(product_id),
      user_id: Number(user_id),
      user_name,
      rating: parseInt(rating),
      title: title || '',
      comment,
      image_url: image_url || null,
      is_verified_purchase: hasOrdered,
      status: 'approved',
      created_at: new Date().toISOString()
    };
    mem.reviews.unshift(newRev);

    // Update product rating
    const product = mem.products.find(p => p.id === Number(product_id));
    if (product) {
      const prodRevs = mem.reviews.filter(r => r.product_id === product.id && r.status === 'approved');
      const sum = prodRevs.reduce((acc, r) => acc + r.rating, 0);
      product.rating = Math.round((sum / prodRevs.length) * 10) / 10;
      product.total_reviews = prodRevs.length;
    }

    return newRev;
  }

  static async getAllReviews() {
    if (isMysqlConnected()) {
      return query(`
        SELECT r.*, p.name as product_name, p.sku as product_sku
        FROM reviews r
        JOIN products p ON r.product_id = p.id
        ORDER BY r.id DESC
      `);
    }

    const mem = getMemoryStore();
    return mem.reviews.map(r => {
      const p = mem.products.find(prod => prod.id === r.product_id);
      return {
        ...r,
        product_name: p ? p.name : 'Saree Item',
        product_sku: p ? p.sku : ''
      };
    });
  }

  static async updateStatus(id, status) {
    if (isMysqlConnected()) {
      await query('UPDATE reviews SET status = ? WHERE id = ?', [status, id]);
      return true;
    }
    const mem = getMemoryStore();
    const r = mem.reviews.find(rev => rev.id === Number(id));
    if (r) {
      r.status = status;
      return true;
    }
    return false;
  }
}

module.exports = Review;
