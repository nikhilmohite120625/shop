/**
 * Product & Category Controller
 * Narayani Sarees, Tuljapur
 */
const Product = require('../models/Product');
const Category = require('../models/Category');
const { getMemoryStore, isMysqlConnected, query } = require('../config/db');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const xlsx = require('xlsx');

class ProductController {
  static async getProducts(req, res) {
    try {
      const filters = {
        category: req.query.category,
        fabric: req.query.fabric,
        color: req.query.color,
        occasion: req.query.occasion,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
        rating: req.query.rating,
        inStockOnly: req.query.inStockOnly,
        sort: req.query.sort || 'newest',
        search: req.query.search,
        featured: req.query.featured,
        bestseller: req.query.bestseller,
        newArrival: req.query.newArrival,
        page: req.query.page || 1,
        limit: req.query.limit || 12
      };

      const result = await Product.getAll(filters);
      return res.json({ success: true, ...result });
    } catch (error) {
      console.error('getProducts error:', error);
      return res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
    }
  }

  static async getProductById(req, res) {
    try {
      const { id } = req.params;
      const product = isNaN(id) ? await Product.findBySlug(id) : await Product.findById(id);

      if (!product) {
        return res.status(404).json({ success: false, message: 'Saree product not found' });
      }

      // Related products in same category
      const related = await Product.getAll({ category: product.category_id, limit: 4 });

      return res.json({
        success: true,
        product,
        relatedProducts: related.products.filter(p => p.id !== product.id).slice(0, 4)
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch product details', error: error.message });
    }
  }

  static async createProduct(req, res) {
    try {
      let images = [];
      if (req.files && req.files.length > 0) {
        images = req.files.map(f => `/uploads/products/${f.filename}`);
      } else if (req.body.images) {
        images = Array.isArray(req.body.images) ? req.body.images : [req.body.images];
      } else if (req.body.image_url) {
        images = [req.body.image_url];
      }

      const product = await Product.create({
        ...req.body,
        images
      });

      return res.status(201).json({
        success: true,
        message: 'Saree product created successfully!',
        product
      });
    } catch (error) {
      console.error('createProduct error:', error);
      return res.status(500).json({ success: false, message: 'Failed to create product', error: error.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updated = await Product.update(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Product not found' });
      }
      return res.json({ success: true, message: 'Product updated successfully!', product: updated });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      await Product.delete(id);
      return res.json({ success: true, message: 'Product removed from catalog.' });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
    }
  }

  static async uploadImages(req, res) {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ success: false, message: 'No image files provided.' });
      }
      const fileUrls = req.files.map(f => `/uploads/products/${f.filename}`);
      return res.json({ success: true, imageUrls: fileUrls });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Image upload failed', error: error.message });
    }
  }

  static async bulkUpload(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Please upload a CSV or Excel file.' });
      }

      const filePath = req.file.path;
      const ext = path.extname(req.file.originalname).toLowerCase();
      let rows = [];

      if (ext === '.csv') {
        rows = await new Promise((resolve, reject) => {
          const results = [];
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
        });
      } else if (ext === '.xlsx' || ext === '.xls') {
        const workbook = xlsx.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      }

      const categories = await Category.getAll();
      const catMap = new Map();
      categories.forEach(c => {
        catMap.set(c.name.toLowerCase(), c.id);
        catMap.set(c.slug.toLowerCase(), c.id);
      });

      const createdProducts = [];
      for (const row of rows) {
        const name = row['Product Name'] || row['name'] || row['Title'];
        const price = parseFloat(row['Price'] || row['price'] || 0);
        if (!name || isNaN(price) || price <= 0) continue;

        const catName = (row['Category'] || row['category'] || 'Paithani Sarees').toLowerCase();
        const categoryId = catMap.get(catName) || 1;

        const newP = await Product.create({
          name,
          sku: row['SKU'] || row['sku'],
          category_id: categoryId,
          price,
          original_price: parseFloat(row['Original Price'] || row['original_price'] || price * 1.25),
          fabric: row['Fabric'] || row['fabric'] || 'Pure Silk',
          color: row['Color'] || row['color'] || 'Maroon',
          occasion: row['Occasion'] || row['occasion'] || 'Wedding',
          stock_quantity: parseInt(row['Stock'] || row['stock'] || 10),
          description: row['Description'] || row['description'] || `${name} - Handcrafted with pure grace and tradition.`,
          images: row['Image'] || row['image_url'] ? [row['Image'] || row['image_url']] : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80']
        });
        createdProducts.push(newP);
      }

      // Cleanup temp uploaded file
      try { fs.unlinkSync(filePath); } catch (e) {}

      return res.json({
        success: true,
        message: `Successfully imported ${createdProducts.length} saree products into catalog!`,
        count: createdProducts.length
      });
    } catch (error) {
      console.error('bulkUpload error:', error);
      return res.status(500).json({ success: false, message: 'Bulk product upload failed', error: error.message });
    }
  }

  static async getCategories(req, res) {
    try {
      const categories = await Category.getAll();
      return res.json({ success: true, categories });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch categories', error: error.message });
    }
  }

  static async getFestivalOffers(req, res) {
    try {
      if (isMysqlConnected()) {
        const offers = await query('SELECT * FROM festival_offers WHERE is_active = TRUE');
        return res.json({ success: true, offers });
      }
      const mem = getMemoryStore();
      return res.json({ success: true, offers: mem.festival_offers || [] });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch festival offers', error: error.message });
    }
  }

  static async getFilterOptions(req, res) {
    try {
      const productsRes = await Product.getAll({ limit: 1000 });
      const prods = productsRes.products || [];

      const fabrics = [...new Set(prods.map(p => p.fabric).filter(Boolean))];
      const colors = [...new Set(prods.map(p => p.color).filter(Boolean))];
      const occasions = [...new Set(prods.map(p => p.occasion).filter(Boolean))];
      const categories = await Category.getAll();

      return res.json({
        success: true,
        fabrics,
        colors,
        occasions,
        categories
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch filters', error: error.message });
    }
  }
}

module.exports = ProductController;
