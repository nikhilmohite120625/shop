/**
 * Cart Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore } = require('../config/db');
const Product = require('./Product');

class Cart {
  static async getCart(userId, sessionId) {
    if (isMysqlConnected() && userId) {
      let cartRows = await query('SELECT * FROM carts WHERE user_id = ?', [userId]);
      if (!cartRows || cartRows.length === 0) {
        const res = await query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
        cartRows = [{ id: res.insertId, user_id: userId }];
      }
      const cartId = cartRows[0].id;

      const items = await query(`
        SELECT ci.id, ci.cart_id, ci.product_id, ci.quantity, ci.price_at_addition,
               p.name, p.slug, p.sku, p.fabric, p.color, p.price, p.original_price, p.stock_quantity,
               (SELECT image_url FROM product_images WHERE product_id = p.id ORDER BY display_order ASC LIMIT 1) as image
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.cart_id = ?
      `, [cartId]);

      const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
      return { cartId, items, subtotal };
    }

    const mem = getMemoryStore();
    const key = userId ? `user_${userId}` : (sessionId || 'guest');
    if (!mem.carts[key]) {
      mem.carts[key] = [];
    }

    const items = mem.carts[key].map(item => {
      const p = mem.products.find(prod => prod.id === item.productId);
      return {
        id: item.id || `${item.productId}`,
        product_id: item.productId,
        quantity: item.quantity,
        name: p ? p.name : 'Saree Item',
        slug: p ? p.slug : '',
        sku: p ? p.sku : '',
        fabric: p ? p.fabric : '',
        color: p ? p.color : '',
        price: p ? p.price : 0,
        original_price: p ? p.original_price : 0,
        stock_quantity: p ? p.stock_quantity : 0,
        image: p && p.images && p.images.length > 0 ? p.images[0] : ''
      };
    });

    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    return { cartId: key, items, subtotal };
  }

  static async addItem(userId, sessionId, productId, quantity = 1) {
    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (product.stock_quantity <= 0) throw new Error('Product is currently out of stock');
    if (quantity > product.stock_quantity) throw new Error(`Only ${product.stock_quantity} items available in stock`);

    if (isMysqlConnected() && userId) {
      let cart = await query('SELECT id FROM carts WHERE user_id = ?', [userId]);
      let cartId;
      if (!cart || cart.length === 0) {
        const res = await query('INSERT INTO carts (user_id) VALUES (?)', [userId]);
        cartId = res.insertId;
      } else {
        cartId = cart[0].id;
      }

      const existing = await query('SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartId, productId]);
      if (existing && existing.length > 0) {
        const newQty = existing[0].quantity + quantity;
        if (newQty > product.stock_quantity) throw new Error(`Cannot add more than ${product.stock_quantity} items available in stock`);
        await query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
      } else {
        await query('INSERT INTO cart_items (cart_id, product_id, quantity, price_at_addition) VALUES (?, ?, ?, ?)', [cartId, productId, quantity, product.price]);
      }
      return this.getCart(userId, sessionId);
    }

    const mem = getMemoryStore();
    const key = userId ? `user_${userId}` : (sessionId || 'guest');
    if (!mem.carts[key]) mem.carts[key] = [];

    const existing = mem.carts[key].find(i => i.productId === Number(productId));
    if (existing) {
      const newQty = existing.quantity + Number(quantity);
      if (newQty > product.stock_quantity) throw new Error(`Cannot add more than ${product.stock_quantity} items available in stock`);
      existing.quantity = newQty;
    } else {
      mem.carts[key].push({
        id: `ci_${Date.now()}`,
        productId: Number(productId),
        quantity: Number(quantity)
      });
    }

    return this.getCart(userId, sessionId);
  }

  static async updateQuantity(userId, sessionId, productId, quantity) {
    const qty = parseInt(quantity);
    if (qty <= 0) {
      return this.removeItem(userId, sessionId, productId);
    }

    const product = await Product.findById(productId);
    if (!product) throw new Error('Product not found');
    if (qty > product.stock_quantity) {
      throw new Error(`Only ${product.stock_quantity} units available in stock`);
    }

    if (isMysqlConnected() && userId) {
      const cart = await query('SELECT id FROM carts WHERE user_id = ?', [userId]);
      if (cart && cart.length > 0) {
        await query('UPDATE cart_items SET quantity = ? WHERE cart_id = ? AND product_id = ?', [qty, cart[0].id, productId]);
      }
      return this.getCart(userId, sessionId);
    }

    const mem = getMemoryStore();
    const key = userId ? `user_${userId}` : (sessionId || 'guest');
    if (mem.carts[key]) {
      const item = mem.carts[key].find(i => i.productId === Number(productId));
      if (item) item.quantity = qty;
    }
    return this.getCart(userId, sessionId);
  }

  static async removeItem(userId, sessionId, productId) {
    if (isMysqlConnected() && userId) {
      const cart = await query('SELECT id FROM carts WHERE user_id = ?', [userId]);
      if (cart && cart.length > 0) {
        await query('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?', [cart[0].id, productId]);
      }
      return this.getCart(userId, sessionId);
    }

    const mem = getMemoryStore();
    const key = userId ? `user_${userId}` : (sessionId || 'guest');
    if (mem.carts[key]) {
      mem.carts[key] = mem.carts[key].filter(i => i.productId !== Number(productId));
    }
    return this.getCart(userId, sessionId);
  }

  static async clearCart(userId, sessionId) {
    if (isMysqlConnected() && userId) {
      const cart = await query('SELECT id FROM carts WHERE user_id = ?', [userId]);
      if (cart && cart.length > 0) {
        await query('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].id]);
      }
      return true;
    }

    const mem = getMemoryStore();
    const key = userId ? `user_${userId}` : (sessionId || 'guest');
    mem.carts[key] = [];
    return true;
  }

  static async mergeGuestCart(userId, sessionId) {
    if (!userId || !sessionId || sessionId === 'guest_default') return;
    try {
      const guestCart = await this.getCart(null, sessionId);
      if (guestCart && guestCart.items && guestCart.items.length > 0) {
        for (const item of guestCart.items) {
          await this.addItem(userId, null, item.product_id, item.quantity);
        }
        await this.clearCart(null, sessionId);
      }
    } catch (e) {
      console.warn('Cart merge warning:', e.message);
    }
  }
}

module.exports = Cart;
