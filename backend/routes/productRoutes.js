/**
 * Product Routes
 * Narayani Sarees, Tuljapur
 */
const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/productController');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/admin');
const upload = require('../middleware/upload');
const { validateProduct } = require('../middleware/validation');

// Public catalog routes
router.get('/', ProductController.getProducts);
router.get('/categories', ProductController.getCategories);
router.get('/festival-offers', ProductController.getFestivalOffers);
router.get('/filters', ProductController.getFilterOptions);
router.get('/:id', ProductController.getProductById);

// Admin & Manager protected routes
router.post('/', authenticate, requireManager, upload.array('images', 8), validateProduct, ProductController.createProduct);
router.put('/:id', authenticate, requireManager, ProductController.updateProduct);
router.delete('/:id', authenticate, requireManager, ProductController.deleteProduct);
router.post('/upload-images', authenticate, requireManager, upload.array('images', 8), ProductController.uploadImages);
router.post('/bulk-upload', authenticate, requireManager, upload.single('file'), ProductController.bulkUpload);

module.exports = router;
