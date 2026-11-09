/**
 * Cart Routes
 * Narayani Sarees, Tuljapur
 */
const express = require('express');
const router = express.Router();
const CartController = require('../controllers/cartController');
const { optionalAuth } = require('../middleware/auth');

router.get('/', optionalAuth, CartController.getCart);
router.post('/add', optionalAuth, CartController.addToCart);
router.put('/update', optionalAuth, CartController.updateQuantity);
router.delete('/item/:id', optionalAuth, CartController.removeItem);
router.delete('/clear', optionalAuth, CartController.clearCart);

module.exports = router;
