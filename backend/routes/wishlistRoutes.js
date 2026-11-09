/**
 * Wishlist Routes
 * Narayani Sarees, Tuljapur
 */
const express = require('express');
const router = express.Router();
const WishlistController = require('../controllers/wishlistController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', WishlistController.getWishlist);
router.post('/add', WishlistController.addToWishlist);
router.delete('/remove/:id', WishlistController.removeFromWishlist);
router.post('/move-to-cart/:id', WishlistController.moveToCart);

module.exports = router;
