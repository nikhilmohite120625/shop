/**
 * Order Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore, getPool } = require('../config/db');
const { generateOrderNumber } = require('../utils/helper');
const Product = require('./Product');

class Order {
  static async createOrder(orderData, items) {
    const {
      user_id,
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_pincode,
      subtotal,
      discount_amount = 0,
      delivery_charge = 0,
      grand_total,
      coupon_code = null,
      payment_method = 'COD',
      payment_status = 'pending',
      notes = ''
    } = orderData;

    const orderNumber = generateOrderNumber();

    // 1. Stock Validation Check
    for (const item of items) {
      const product = await Product.findById(item.product_id);
      if (!product) throw new Error(`Product not found (ID: ${item.product_id})`);
      if (product.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for "${product.name}". Available: ${product.stock_quantity}, Requested: ${item.quantity}`);
      }
    }

    if (isMysqlConnected()) {
      const pool = getPool();
      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();

        const [orderResult] = await conn.query(`
          INSERT INTO orders (
            order_number, user_id, customer_name, customer_email, customer_phone,
            shipping_address, shipping_city, shipping_state, shipping_pincode,
            subtotal, discount_amount, delivery_charge, grand_total,
            coupon_code, payment_method, payment_status, order_status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed', ?)
        `, [
          orderNumber, user_id, customer_name, customer_email, customer_phone,
          shipping_address, shipping_city, shipping_state, shipping_pincode,
          subtotal, discount_amount, delivery_charge, grand_total,
          coupon_code, payment_method, payment_status, notes
        ]);

        const orderId = orderResult.insertId;

        // Insert Order Items & Deduct Stock Atomically
        for (const item of items) {
          const itemTotal = (parseFloat(item.unit_price || item.price) * item.quantity);
          await conn.query(`
            INSERT INTO order_items (
              order_id, product_id, product_name, product_sku, product_image,
              fabric, color, unit_price, quantity, total_price
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            orderId, item.product_id, item.name || item.product_name, item.sku || item.product_sku || '',
            item.image || (item.images && item.images[0]) || '', item.fabric || '', item.color || '',
            item.unit_price || item.price, item.quantity, itemTotal
          ]);

          // Atomic Stock Decrement
          await conn.query(`
            UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - ?) WHERE id = ?
          `, [item.quantity, item.product_id]);
        }

        // Insert Payment Record if Razorpay or COD
        await conn.query(`
          INSERT INTO payments (
            order_id, payment_method, razorpay_order_id, razorpay_payment_id,
            razorpay_signature, amount, currency, status
          ) VALUES (?, ?, ?, ?, ?, ?, 'INR', ?)
        `, [
          orderId, payment_method, orderData.razorpay_order_id || null,
          orderData.razorpay_payment_id || null, orderData.razorpay_signature || null,
          grand_total, payment_status === 'paid' ? 'successful' : 'pending'
        ]);

        // Insert Initial Status History
        await conn.query(`
          INSERT INTO order_status_history (order_id, status, notes, changed_by)
          VALUES (?, 'Confirmed', 'Order placed successfully', 'System')
        `, [orderId]);

        await conn.commit();
        conn.release();

        return this.findById(orderId);
      } catch (err) {
        await conn.rollback();
        conn.release();
        throw err;
      }
    }

    // Memory Store Implementation
    const mem = getMemoryStore();
    const orderId = mem.orders.length + 1;
    const newOrder = {
      id: orderId,
      order_number: orderNumber,
      user_id: Number(user_id),
      customer_name,
      customer_email,
      customer_phone,
      shipping_address,
      shipping_city,
      shipping_state,
      shipping_pincode,
      subtotal: parseFloat(subtotal),
      discount_amount: parseFloat(discount_amount || 0),
      delivery_charge: parseFloat(delivery_charge || 0),
      grand_total: parseFloat(grand_total),
      coupon_code: coupon_code || null,
      payment_method,
      payment_status,
      razorpay_order_id: orderData.razorpay_order_id || null,
      razorpay_payment_id: orderData.razorpay_payment_id || null,
      razorpay_signature: orderData.razorpay_signature || null,
      order_status: 'Confirmed',
      notes: notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    mem.orders.unshift(newOrder);

    // Save payment record in memory
    mem.payments.push({
      id: mem.payments.length + 1,
      order_id: orderId,
      payment_method,
      razorpay_order_id: orderData.razorpay_order_id || null,
      razorpay_payment_id: orderData.razorpay_payment_id || null,
      razorpay_signature: orderData.razorpay_signature || null,
      amount: parseFloat(grand_total),
      currency: 'INR',
      status: payment_status === 'paid' ? 'successful' : 'pending',
      created_at: new Date().toISOString()
    });

    // Order items and stock decrease
    const savedItems = items.map((item, idx) => {
      const p = mem.products.find(prod => prod.id === Number(item.product_id));
      if (p) {
        p.stock_quantity = Math.max(0, p.stock_quantity - Number(item.quantity));
        if (p.stock_quantity <= 0) p.stock_status = 'out_of_stock';
        else if (p.stock_quantity <= 5) p.stock_status = 'low_stock';
        else p.stock_status = 'in_stock';
      }

      const orderItem = {
        id: mem.order_items.length + idx + 1,
        order_id: orderId,
        product_id: Number(item.product_id),
        product_name: item.name || item.product_name || (p ? p.name : 'Saree'),
        product_sku: item.sku || (p ? p.sku : ''),
        product_image: item.image || (p && p.images && p.images[0]) || '',
        fabric: item.fabric || (p ? p.fabric : ''),
        color: item.color || (p ? p.color : ''),
        unit_price: parseFloat(item.unit_price || item.price || (p ? p.price : 0)),
        quantity: Number(item.quantity),
        total_price: parseFloat(item.unit_price || item.price || (p ? p.price : 0)) * Number(item.quantity),
        created_at: new Date().toISOString()
      };
      mem.order_items.push(orderItem);
      return orderItem;
    });

    mem.order_status_history.push({
      id: mem.order_status_history.length + 1,
      order_id: orderId,
      status: 'Confirmed',
      notes: 'Order placed successfully',
      changed_by: 'System',
      created_at: new Date().toISOString()
    });

    return {
      ...newOrder,
      items: savedItems,
      history: [{ status: 'Confirmed', notes: 'Order placed successfully', created_at: newOrder.created_at }]
    };
  }

  static async findById(id) {
    if (isMysqlConnected()) {
      const orders = await query('SELECT * FROM orders WHERE id = ? OR order_number = ?', [id, id]);
      if (!orders || orders.length === 0) return null;
      const order = orders[0];

      const items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      const history = await query('SELECT * FROM order_status_history WHERE order_id = ? ORDER BY id ASC', [order.id]);

      return { ...order, items, history };
    }

    const mem = getMemoryStore();
    const order = mem.orders.find(o => o.id === Number(id) || o.order_number === String(id));
    if (!order) return null;

    const items = mem.order_items.filter(i => i.order_id === order.id);
    const history = mem.order_status_history.filter(h => h.order_id === order.id);
    return { ...order, items, history };
  }

  static async getUserOrders(userId) {
    if (isMysqlConnected()) {
      const orders = await query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [userId]);
      for (const order of orders) {
        order.items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      }
      return orders;
    }

    const mem = getMemoryStore();
    return mem.orders
      .filter(o => o.user_id === Number(userId))
      .map(o => ({
        ...o,
        items: mem.order_items.filter(i => i.order_id === o.id)
      }));
  }

  static async getAllOrders({ status, search, page = 1, limit = 20 } = {}) {
    if (isMysqlConnected()) {
      let whereConditions = [];
      let params = [];

      if (status && status !== 'all') {
        whereConditions.push('order_status = ?');
        params.push(status);
      }
      if (search) {
        whereConditions.push('(order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)');
        const searchWild = `%${search}%`;
        params.push(searchWild, searchWild, searchWild);
      }

      const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const countRes = await query(`SELECT COUNT(*) as total FROM orders ${whereSql}`, params);
      const total = countRes[0]?.total || 0;

      const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
      const orders = await query(`
        SELECT * FROM orders
        ${whereSql}
        ORDER BY id DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);

      for (const order of orders) {
        order.items = await query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      }

      return { orders, total, page: parseInt(page), pages: Math.ceil(total / limit) };
    }

    const mem = getMemoryStore();
    let list = [...mem.orders];

    if (status && status !== 'all') {
      list = list.filter(o => o.order_status.toLowerCase() === status.toLowerCase());
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(o =>
        o.order_number.toLowerCase().includes(s) ||
        o.customer_name.toLowerCase().includes(s) ||
        o.customer_phone.includes(s)
      );
    }

    const total = list.length;
    const pNum = Math.max(1, parseInt(page));
    const pLim = parseInt(limit);
    const paginated = list.slice((pNum - 1) * pLim, pNum * pLim).map(o => ({
      ...o,
      items: mem.order_items.filter(i => i.order_id === o.id)
    }));

    return { orders: paginated, total, page: pNum, pages: Math.ceil(total / pLim) };
  }

  static async updateStatus(orderId, newStatus, notes = '', changedBy = 'Admin') {
    const order = await this.findById(orderId);
    if (!order) throw new Error('Order not found');

    const previousStatus = order.order_status;

    if (isMysqlConnected()) {
      await query('UPDATE orders SET order_status = ?, updated_at = NOW() WHERE id = ?', [newStatus, order.id]);
      await query('INSERT INTO order_status_history (order_id, status, notes, changed_by) VALUES (?, ?, ?, ?)', [order.id, newStatus, notes, changedBy]);

      // If order is cancelled or returned, restore product stock
      if (['Cancelled', 'Returned'].includes(newStatus) && !['Cancelled', 'Returned'].includes(previousStatus)) {
        for (const item of order.items) {
          await query('UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?', [item.quantity, item.product_id]);
        }
      }

      return this.findById(order.id);
    }

    const mem = getMemoryStore();
    const memOrder = mem.orders.find(o => o.id === order.id);
    if (memOrder) {
      memOrder.order_status = newStatus;
      memOrder.updated_at = new Date().toISOString();

      mem.order_status_history.push({
        id: mem.order_status_history.length + 1,
        order_id: order.id,
        status: newStatus,
        notes: notes || `Status changed to ${newStatus}`,
        changed_by: changedBy,
        created_at: new Date().toISOString()
      });

      // Stock restoration on cancel/return
      if (['Cancelled', 'Returned'].includes(newStatus) && !['Cancelled', 'Returned'].includes(previousStatus)) {
        for (const item of order.items) {
          const p = mem.products.find(prod => prod.id === item.product_id);
          if (p) {
            p.stock_quantity += item.quantity;
            if (p.stock_quantity > 5) p.stock_status = 'in_stock';
            else if (p.stock_quantity > 0) p.stock_status = 'low_stock';
          }
        }
      }
      return this.findById(order.id);
    }
    return null;
  }
}

module.exports = Order;
