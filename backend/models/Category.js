/**
 * Category Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore } = require('../config/db');
const { generateSlug } = require('../utils/helper');

class Category {
  static async getAll() {
    if (isMysqlConnected()) {
      return query('SELECT * FROM categories WHERE is_active = TRUE ORDER BY display_order ASC, id ASC');
    }
    const mem = getMemoryStore();
    return mem.categories.filter(c => c.is_active !== false);
  }

  static async findBySlug(slug) {
    if (isMysqlConnected()) {
      const rows = await query('SELECT * FROM categories WHERE slug = ?', [slug]);
      return rows && rows.length > 0 ? rows[0] : null;
    }
    const mem = getMemoryStore();
    return mem.categories.find(c => c.slug === slug) || null;
  }

  static async findById(id) {
    if (isMysqlConnected()) {
      const rows = await query('SELECT * FROM categories WHERE id = ?', [id]);
      return rows && rows.length > 0 ? rows[0] : null;
    }
    const mem = getMemoryStore();
    return mem.categories.find(c => c.id === Number(id)) || null;
  }

  static async create({ name, description, image, is_featured = false, display_order = 0 }) {
    const slug = generateSlug(name);
    if (isMysqlConnected()) {
      const result = await query(
        'INSERT INTO categories (name, slug, description, image, is_featured, is_active, display_order) VALUES (?, ?, ?, ?, ?, TRUE, ?)',
        [name, slug, description, image, is_featured, display_order]
      );
      return { id: result.insertId, name, slug, description, image, is_featured, display_order };
    }

    const mem = getMemoryStore();
    const newCat = {
      id: mem.categories.length + 1,
      name,
      slug,
      description,
      image,
      is_featured: !!is_featured,
      is_active: true,
      display_order: Number(display_order) || 0
    };
    mem.categories.push(newCat);
    return newCat;
  }

  static async update(id, updateData) {
    const { name, description, image, is_featured, display_order } = updateData;
    if (isMysqlConnected()) {
      await query(
        'UPDATE categories SET name = COALESCE(?, name), description = COALESCE(?, description), image = COALESCE(?, image), is_featured = COALESCE(?, is_featured), display_order = COALESCE(?, display_order) WHERE id = ?',
        [name, description, image, is_featured, display_order, id]
      );
      return this.findById(id);
    }

    const mem = getMemoryStore();
    const cat = mem.categories.find(c => c.id === Number(id));
    if (cat) {
      if (name) {
        cat.name = name;
        cat.slug = generateSlug(name);
      }
      if (description !== undefined) cat.description = description;
      if (image) cat.image = image;
      if (is_featured !== undefined) cat.is_featured = !!is_featured;
      if (display_order !== undefined) cat.display_order = Number(display_order);
      return cat;
    }
    return null;
  }

  static async delete(id) {
    if (isMysqlConnected()) {
      await query('DELETE FROM categories WHERE id = ?', [id]);
      return true;
    }
    const mem = getMemoryStore();
    const index = mem.categories.findIndex(c => c.id === Number(id));
    if (index !== -1) {
      mem.categories.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = Category;
