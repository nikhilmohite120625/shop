/**
 * Contact Routes
 * Narayani Sarees, Tuljapur
 */
const express = require('express');
const router = express.Router();
const ContactController = require('../controllers/contactController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

router.post('/', ContactController.submitMessage);
router.get('/admin/all', authenticate, requireAdmin, ContactController.getMessages);

module.exports = router;
