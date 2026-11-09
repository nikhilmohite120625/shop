/**
 * Product Model
 * Narayani Sarees, Tuljapur
 */
const { isMysqlConnected, query, getMemoryStore } = require('../config/db');
const { generateSlug, generateSKU } = require('../utils/helper');

class Product {
  static async getAll(filters = {}) {
    const {
      category,
      fabric,
      color,
      occasion,
      minPrice,
      maxPrice,
      rating,
      inStockOnly,
      sort = 'newest',
      search,
      featured,
      bestseller,
      newArrival,
      page = 1,
      limit = 12
    } = filters;

    if (isMysqlConnected()) {
      let whereConditions = ['p.is_active = TRUE'];
      let queryParams = [];

      if (category) {
        whereConditions.push('(c.slug = ? OR c.id = ?)');
        queryParams.push(category, isNaN(category) ? -1 : Number(category));
      }
      if (fabric) {
        whereConditions.push('p.fabric = ?');
        queryParams.push(fabric);
      }
      if (color) {
        whereConditions.push('p.color = ?');
        queryParams.push(color);
      }
      if (occasion) {
        whereConditions.push('p.occasion = ?');
        queryParams.push(occasion);
      }
      if (minPrice) {
        whereConditions.push('p.price >= ?');
        queryParams.push(parseFloat(minPrice));
      }
      if (maxPrice) {
        whereConditions.push('p.price <= ?');
        queryParams.push(parseFloat(maxPrice));
      }
      if (rating) {
        whereConditions.push('p.rating >= ?');
        queryParams.push(parseFloat(rating));
      }
      if (inStockOnly === 'true' || inStockOnly === true) {
        whereConditions.push('p.stock_quantity > 0');
      }
      if (featured === 'true' || featured === true) {
        whereConditions.push('p.is_featured = TRUE');
      }
      if (bestseller === 'true' || bestseller === true) {
        whereConditions.push('p.is_bestseller = TRUE');
      }
      if (newArrival === 'true' || newArrival === true) {
        whereConditions.push('p.is_new_arrival = TRUE');
      }
      if (search) {
        whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ? OR p.fabric LIKE ?)');
        const searchWild = `%${search}%`;
        queryParams.push(searchWild, searchWild, searchWild, searchWild);
      }

      let orderBy = 'p.id DESC';
      if (sort === 'price_asc') orderBy = 'p.price ASC';
      else if (sort === 'price_desc') orderBy = 'p.price DESC';
      else if (sort === 'rating') orderBy = 'p.rating DESC';
      else if (sort === 'bestseller') orderBy = 'p.is_bestseller DESC, p.total_reviews DESC';
      else if (sort === 'newest') orderBy = 'p.id DESC';

      const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
      const whereSql = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const countSql = `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereSql}`;
      const countRes = await query(countSql, queryParams);
      const total = countRes[0]?.total || 0;

      const dataSql = `
        SELECT p.*, c.name as category_name, c.slug as category_slug,
          (SELECT GROUP_CONCAT(image_url ORDER BY display_order ASC) FROM product_images WHERE product_id = p.id) as image_list
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        ${whereSql}
        ORDER BY ${orderBy}
        LIMIT ? OFFSET ?
      `;
      const rows = await query(dataSql, [...queryParams, parseInt(limit), offset]);

      const products = rows.map(r => ({
        ...r,
        images: r.image_list ? r.image_list.split(',') : [],
        specifications: typeof r.specifications === 'string' ? JSON.parse(r.specifications || '{}') : (r.specifications || {})
      }));

      return {
        products,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      };
    }

    // Memory Store Implementation
    const mem = getMemoryStore();
    let result = mem.products.filter(p => p.is_active !== false);

    if (category) {
      const catObj = mem.categories.find(c => c.slug === category || c.id === Number(category));
      if (catObj) {
        result = result.filter(p => p.category_id === catObj.id);
      }
    }
    if (fabric) {
      result = result.filter(p => p.fabric && p.fabric.toLowerCase() === fabric.toLowerCase());
    }
    if (color) {
      result = result.filter(p => p.color && p.color.toLowerCase() === color.toLowerCase());
    }
    if (occasion) {
      result = result.filter(p => p.occasion && p.occasion.toLowerCase() === occasion.toLowerCase());
    }
    if (minPrice) {
      result = result.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      result = result.filter(p => p.price <= parseFloat(maxPrice));
    }
    if (rating) {
      result = result.filter(p => p.rating >= parseFloat(rating));
    }
    if (inStockOnly === 'true' || inStockOnly === true) {
      result = result.filter(p => p.stock_quantity > 0);
    }
    if (featured === 'true' || featured === true) {
      result = result.filter(p => p.is_featured);
    }
    if (bestseller === 'true' || bestseller === true) {
      result = result.filter(p => p.is_bestseller);
    }
    if (newArrival === 'true' || newArrival === true) {
      result = result.filter(p => p.is_new_arrival);
    }
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(s)) ||
        (p.description && p.description.toLowerCase().includes(s)) ||
        (p.sku && p.sku.toLowerCase().includes(s)) ||
        (p.fabric && p.fabric.toLowerCase().includes(s))
      );
    }

    if (sort === 'price_asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      result.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'bestseller') {
      result.sort((a, b) => (b.is_bestseller ? 1 : 0) - (a.is_bestseller ? 1 : 0));
    } else {
      result.sort((a, b) => b.id - a.id);
    }

    const total = result.length;
    const pNum = Math.max(1, parseInt(page));
    const pLim = parseInt(limit);
    const paginated = result.slice((pNum - 1) * pLim, pNum * pLim).map(p => {
      const cat = mem.categories.find(c => c.id === p.category_id);
      return {
        ...p,
        category_name: cat ? cat.name : 'Sarees',
        category_slug: cat ? cat.slug : 'sarees',
        specifications: typeof p.specifications === 'string' ? JSON.parse(p.specifications || '{}') : (p.specifications || {})
      };
    });

    return {
      products: paginated,
      total,
      page: pNum,
      pages: Math.ceil(total / pLim)
    };
  }

  static async findById(id) {
    if (isMysqlConnected()) {
      const rows = await query(`
        SELECT p.*, c.name as category_name, c.slug as category_slug,
          (SELECT GROUP_CONCAT(image_url ORDER BY display_order ASC) FROM product_images WHERE product_id = p.id) as image_list
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = ?
      `, [id]);
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      return {
        ...r,
        images: r.image_list ? r.image_list.split(',') : [],
        specifications: typeof r.specifications === 'string' ? JSON.parse(r.specifications || '{}') : (r.specifications || {})
      };
    }

    const mem = getMemoryStore();
    const p = mem.products.find(item => item.id === Number(id));
    if (!p) return null;
    const cat = mem.categories.find(c => c.id === p.category_id);
    return {
      ...p,
      category_name: cat ? cat.name : 'Sarees',
      category_slug: cat ? cat.slug : 'sarees',
      specifications: typeof p.specifications === 'string' ? JSON.parse(p.specifications || '{}') : (p.specifications || {})
    };
  }

  static async findBySlug(slug) {
    if (isMysqlConnected()) {
      const rows = await query(`
        SELECT p.*, c.name as category_name, c.slug as category_slug,
          (SELECT GROUP_CONCAT(image_url ORDER BY display_order ASC) FROM product_images WHERE product_id = p.id) as image_list
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.slug = ?
      `, [slug]);
      if (!rows || rows.length === 0) return null;
      const r = rows[0];
      return {
        ...r,
        images: r.image_list ? r.image_list.split(',') : [],
        specifications: typeof r.specifications === 'string' ? JSON.parse(r.specifications || '{}') : (r.specifications || {})
      };
    }

    const mem = getMemoryStore();
    const p = mem.products.find(item => item.slug === slug);
    if (!p) return null;
    const cat = mem.categories.find(c => c.id === p.category_id);
    return {
      ...p,
      category_name: cat ? cat.name : 'Sarees',
      category_slug: cat ? cat.slug : 'sarees',
      specifications: typeof p.specifications === 'string' ? JSON.parse(p.specifications || '{}') : (p.specifications || {})
    };
  }

  static async create(data) {
    const {
      name,
      category_id,
      fabric,
      color,
      occasion,
      description,
      specifications,
      price,
      original_price,
      stock_quantity = 10,
      is_featured = false,
      is_bestseller = false,
      is_new_arrival = true,
      images = []
    } = data;

    const slug = generateSlug(name) + '-' + Math.floor(100 + Math.random() * 900);
    const sku = data.sku || generateSKU('NS', Math.floor(100 + Math.random() * 900));
    const origPrice = original_price || price;
    const discount = origPrice > price ? Math.round(((origPrice - price) / origPrice) * 100) : 0;
    const specStr = typeof specifications === 'object' ? JSON.stringify(specifications) : specifications;

    if (isMysqlConnected()) {
      const result = await query(`
        INSERT INTO products (name, slug, sku, category_id, fabric, color, occasion, description, specifications, price, original_price, discount, stock_quantity, is_featured, is_bestseller, is_new_arrival, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE)
      `, [name, slug, sku, category_id, fabric, color, occasion, description, specStr, price, origPrice, discount, stock_quantity, is_featured, is_bestseller, is_new_arrival]);

      const productId = result.insertId;
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          await query('INSERT INTO product_images (product_id, image_url, is_primary, display_order) VALUES (?, ?, ?, ?)', [productId, images[i], i === 0, i]);
        }
      }
      return this.findById(productId);
    }

    const mem = getMemoryStore();
    const newProduct = {
      id: mem.products.length + 1,
      name,
      slug,
      sku,
      category_id: Number(category_id),
      fabric: fabric || 'Pure Silk',
      color: color || 'Maroon',
      occasion: occasion || 'Wedding',
      description: description || '',
      specifications: typeof specifications === 'object' ? specifications : (JSON.parse(specifications || '{}')),
      price: parseFloat(price),
      original_price: parseFloat(origPrice),
      discount,
      stock_quantity: parseInt(stock_quantity),
      stock_status: stock_quantity <= 0 ? 'out_of_stock' : (stock_quantity <= 5 ? 'low_stock' : 'in_stock'),
      rating: 4.8,
      total_reviews: 0,
      is_featured: !!is_featured,
      is_bestseller: !!is_bestseller,
      is_new_arrival: !!is_new_arrival,
      is_active: true,
      images: images.length > 0 ? images : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']
    };
    mem.products.unshift(newProduct);
    return newProduct;
  }

  static async update(id, updateData) {
    const product = await this.findById(id);
    if (!product) return null;

    if (isMysqlConnected()) {
      const fields = [];
      const values = [];
      for (const [key, val] of Object.entries(updateData)) {
        if (['name', 'sku', 'category_id', 'fabric', 'color', 'occasion', 'description', 'price', 'original_price', 'discount', 'stock_quantity', 'is_featured', 'is_bestseller', 'is_new_arrival', 'is_active'].includes(key)) {
          fields.push(`${key} = ?`);
          values.push(val);
        }
      }
      if (fields.length > 0) {
        values.push(id);
        await query(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
      }
      return this.findById(id);
    }

    const mem = getMemoryStore();
    const p = mem.products.find(item => item.id === Number(id));
    if (p) {
      Object.assign(p, updateData);
      if (p.stock_quantity <= 0) p.stock_status = 'out_of_stock';
      else if (p.stock_quantity <= 5) p.stock_status = 'low_stock';
      else p.stock_status = 'in_stock';
      return p;
    }
    return null;
  }

  static async updateStock(id, change) {
    if (isMysqlConnected()) {
      await query('UPDATE products SET stock_quantity = GREATEST(0, stock_quantity + ?) WHERE id = ?', [change, id]);
      return this.findById(id);
    }

    const mem = getMemoryStore();
    const p = mem.products.find(item => item.id === Number(id));
    if (p) {
      p.stock_quantity = Math.max(0, p.stock_quantity + change);
      if (p.stock_quantity <= 0) p.stock_status = 'out_of_stock';
      else if (p.stock_quantity <= 5) p.stock_status = 'low_stock';
      else p.stock_status = 'in_stock';
      return p;
    }
    return null;
  }

  static async delete(id) {
    if (isMysqlConnected()) {
      await query('UPDATE products SET is_active = FALSE WHERE id = ?', [id]);
      return true;
    }
    const mem = getMemoryStore();
    const p = mem.products.find(item => item.id === Number(id));
    if (p) {
      p.is_active = false;
      return true;
    }
    return false;
  }
}

module.exports = Product;
