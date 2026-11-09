/**
 * Review Routes
 * Narayani Sarees, Tuljapur
 */
const express = require('express');
const router = express.Router();
const ReviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/admin');

router.get('/product/:productId', ReviewController.getProductReviews);
router.post('/', authenticate, ReviewController.addReview);
router.get('/admin/all', authenticate, requireManager, ReviewController.getAllReviewsAdmin);
router.put('/admin/:id/status', authenticate, requireManager, ReviewController.updateReviewStatus);

module.exports = router;
