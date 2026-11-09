/**
 * Wishlist Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore } = require('../config/db');

class Wishlist {
  static async getWishlist(userId) {
    if (isMysqlConnected() && userId) {
      let wishRows = await query('SELECT id FROM wishlists WHERE user_id = ?', [userId]);
      if (!wishRows || wishRows.length === 0) {
        const res = await query('INSERT INTO wishlists (user_id) VALUES (?)', [userId]);
        wishRows = [{ id: res.insertId }];
      }
      const wishlistId = wishRows[0].id;

      const items = await query(`
        SELECT wi.id as wishlist_item_id, p.*,
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as image
        FROM wishlist_items wi
        JOIN products p ON wi.product_id = p.id
        WHERE wi.wishlist_id = ? AND p.is_active = TRUE
      `, [wishlistId]);

      return items.map(p => ({
        ...p,
        images: p.image ? [p.image] : []
      }));
    }

    const mem = getMemoryStore();
    const key = `user_${userId}`;
    if (!mem.wishlists[key]) mem.wishlists[key] = [];

    return mem.wishlists[key].map(productId => {
      const p = mem.products.find(prod => prod.id === Number(productId));
      return p ? { ...p } : null;
    }).filter(Boolean);
  }

  static async addItem(userId, productId) {
    if (isMysqlConnected() && userId) {
      let wish = await query('SELECT id FROM wishlists WHERE user_id = ?', [userId]);
      let wishlistId;
      if (!wish || wish.length === 0) {
        const res = await query('INSERT INTO wishlists (user_id) VALUES (?)', [userId]);
        wishlistId = res.insertId;
      } else {
        wishlistId = wish[0].id;
      }

      await query('INSERT IGNORE INTO wishlist_items (wishlist_id, product_id) VALUES (?, ?)', [wishlistId, productId]);
      return this.getWishlist(userId);
    }

    const mem = getMemoryStore();
    const key = `user_${userId}`;
    if (!mem.wishlists[key]) mem.wishlists[key] = [];
    if (!mem.wishlists[key].includes(Number(productId))) {
      mem.wishlists[key].push(Number(productId));
    }
    return this.getWishlist(userId);
  }

  static async removeItem(userId, productId) {
    if (isMysqlConnected() && userId) {
      const wish = await query('SELECT id FROM wishlists WHERE user_id = ?', [userId]);
      if (wish && wish.length > 0) {
        await query('DELETE FROM wishlist_items WHERE wishlist_id = ? AND product_id = ?', [wish[0].id, productId]);
      }
      return this.getWishlist(userId);
    }

    const mem = getMemoryStore();
    const key = `user_${userId}`;
    if (mem.wishlists[key]) {
      mem.wishlists[key] = mem.wishlists[key].filter(id => id !== Number(productId));
    }
    return this.getWishlist(userId);
  }
}

module.exports = Wishlist;
