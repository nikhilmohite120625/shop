/**
 * User & Admin Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore } = require('../config/db');

class User {
  static async findByEmail(email) {
    if (isMysqlConnected()) {
      const rows = await query('SELECT * FROM users WHERE email = ?', [email]);
      if (rows && rows.length > 0) return rows[0];
      const adminRows = await query('SELECT a.*, r.name as role FROM admins a JOIN roles r ON a.role_id = r.id WHERE a.email = ?', [email]);
      return adminRows && adminRows.length > 0 ? adminRows[0] : null;
    }

    const mem = getMemoryStore();
    const user = mem.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (user) return user;
    const admin = mem.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    return admin || null;
  }

  static async findById(id) {
    if (isMysqlConnected()) {
      const rows = await query('SELECT id, name, email, phone, role, profile_image, is_verified, created_at FROM users WHERE id = ?', [id]);
      if (rows && rows.length > 0) return rows[0];
      const adminRows = await query('SELECT a.id, a.name, a.email, a.phone, r.name as role, a.status, a.created_at FROM admins a JOIN roles r ON a.role_id = r.id WHERE a.id = ?', [id]);
      return adminRows && adminRows.length > 0 ? adminRows[0] : null;
    }

    const mem = getMemoryStore();
    const user = mem.users.find(u => u.id === Number(id));
    if (user) return user;
    const admin = mem.admins.find(a => a.id === Number(id));
    return admin || null;
  }

  static async create({ name, email, phone, password_hash, role = 'customer' }) {
    if (isMysqlConnected()) {
      const result = await query(
        'INSERT INTO users (name, email, phone, password_hash, role, is_verified) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email, phone || null, password_hash, role, true]
      );
      return { id: result.insertId, name, email, phone, role, is_verified: true };
    }

    const mem = getMemoryStore();
    const newUser = {
      id: mem.users.length + 1,
      name,
      email,
      phone,
      password_hash,
      role,
      is_verified: true,
      created_at: new Date().toISOString()
    };
    mem.users.push(newUser);
    return newUser;
  }

  static async updateProfile(id, { name, phone, profile_image }) {
    if (isMysqlConnected()) {
      await query('UPDATE users SET name = COALESCE(?, name), phone = COALESCE(?, phone), profile_image = COALESCE(?, profile_image) WHERE id = ?', [name, phone, profile_image, id]);
      return this.findById(id);
    }

    const mem = getMemoryStore();
    const user = mem.users.find(u => u.id === Number(id));
    if (user) {
      if (name) user.name = name;
      if (phone) user.phone = phone;
      if (profile_image) user.profile_image = profile_image;
      return user;
    }
    return null;
  }

  static async getAddresses(userId) {
    if (isMysqlConnected()) {
      return query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC', [userId]);
    }
    const mem = getMemoryStore();
    return mem.addresses.filter(a => a.user_id === Number(userId));
  }

  static async addAddress(userId, addressData) {
    const { full_name, phone, alternate_phone, address_line, landmark, city, state, pincode, address_type, is_default } = addressData;

    if (isMysqlConnected()) {
      if (is_default) {
        await query('UPDATE addresses SET is_default = FALSE WHERE user_id = ?', [userId]);
      }
      const result = await query(
        'INSERT INTO addresses (user_id, full_name, phone, alternate_phone, address_line, landmark, city, state, pincode, address_type, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, full_name, phone, alternate_phone || null, address_line, landmark || null, city, state, pincode, address_type || 'home', is_default ? true : false]
      );
      return { id: result.insertId, ...addressData, user_id: userId };
    }

    const mem = getMemoryStore();
    if (is_default) {
      mem.addresses.forEach(a => { if (a.user_id === Number(userId)) a.is_default = false; });
    }
    const newAddr = {
      id: mem.addresses.length + 1,
      user_id: Number(userId),
      full_name,
      phone,
      alternate_phone: alternate_phone || '',
      address_line,
      landmark: landmark || '',
      city,
      state,
      pincode,
      address_type: address_type || 'home',
      is_default: is_default ? true : (mem.addresses.filter(a => a.user_id === Number(userId)).length === 0),
      created_at: new Date().toISOString()
    };
    mem.addresses.push(newAddr);
    return newAddr;
  }

  static async getAllUsers() {
    if (isMysqlConnected()) {
      return query('SELECT id, name, email, phone, role, is_verified, created_at FROM users ORDER BY id DESC');
    }
    const mem = getMemoryStore();
    return mem.users.map(({ password_hash, ...u }) => u);
  }

  static async getAllAdmins() {
    if (isMysqlConnected()) {
      return query('SELECT a.id, a.name, a.email, a.phone, a.status, r.name as role, a.created_at FROM admins a JOIN roles r ON a.role_id = r.id ORDER BY a.id ASC');
    }
    const mem = getMemoryStore();
    return mem.admins.map(({ password_hash, ...a }) => a);
  }

  static async updateAdminCredentials(adminId, { email, password_hash, name, phone }) {
    if (isMysqlConnected()) {
      const updates = [];
      const params = [];
      if (email) { updates.push('email = ?'); params.push(email.toLowerCase()); }
      if (password_hash) { updates.push('password_hash = ?'); params.push(password_hash); }
      if (name) { updates.push('name = ?'); params.push(name); }
      if (phone) { updates.push('phone = ?'); params.push(phone); }
      if (updates.length > 0) {
        params.push(adminId);
        await query(`UPDATE admins SET ${updates.join(', ')} WHERE id = ?`, params);
      }
      return this.findById(adminId);
    }

    const mem = getMemoryStore();
    const admin = mem.admins.find(a => a.id === Number(adminId));
    if (admin) {
      if (email) admin.email = email.toLowerCase();
      if (password_hash) admin.password_hash = password_hash;
      if (name) admin.name = name;
      if (phone) admin.phone = phone;
      return admin;
    }
    return null;
  }
}

module.exports = User;
