/**
 * Contact Message Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore } = require('../config/db');

class Contact {
  static async create({ name, email, phone, subject, message }) {
    if (isMysqlConnected()) {
      const res = await query(`
        INSERT INTO contact_messages (name, email, phone, subject, message, status)
        VALUES (?, ?, ?, ?, ?, 'unread')
      `, [name, email, phone || null, subject, message]);
      return { id: res.insertId, name, email, phone, subject, message, status: 'unread' };
    }

    const mem = getMemoryStore();
    const newMsg = {
      id: mem.contact_messages.length + 1,
      name,
      email,
      phone: phone || '',
      subject,
      message,
      status: 'unread',
      created_at: new Date().toISOString()
    };
    mem.contact_messages.unshift(newMsg);
    return newMsg;
  }

  static async getAll() {
    if (isMysqlConnected()) {
      return query('SELECT * FROM contact_messages ORDER BY id DESC');
    }
    const mem = getMemoryStore();
    return mem.contact_messages;
  }
}

module.exports = Contact;
