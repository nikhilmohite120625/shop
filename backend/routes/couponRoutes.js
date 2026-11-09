/**
 * Coupon Routes
 * Narayani Sarees, Tuljapur
 */
const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/couponController');
const { authenticate } = require('../middleware/auth');
const { requireManager } = require('../middleware/admin');

router.post('/validate', CouponController.validateCoupon);
router.get('/', authenticate, requireManager, CouponController.getAllCoupons);
router.post('/', authenticate, requireManager, CouponController.createCoupon);
router.delete('/:id', authenticate, requireManager, CouponController.deleteCoupon);

module.exports = router;
