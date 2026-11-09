/**
 * Request Validation Middleware
 * Narayani Sarees, Tuljapur
 */

function validateRegister(req, res, next) {
  const { name, email, password, phone } = req.body;
  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Please provide a valid full name (at least 2 characters).' });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid email address.' });
  }
  if (!password || password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  next();
}

function validateProduct(req, res, next) {
  const { name, price, category_id, fabric, color, occasion } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Product name and price are required.' });
  }
  if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    return res.status(400).json({ success: false, message: 'Price must be a positive number.' });
  }
  next();
}

function validateCheckout(req, res, next) {
  const { shipping_address, shipping_city, shipping_state, shipping_pincode, customer_name, customer_phone } = req.body;
  if (!shipping_address || !shipping_city || !shipping_state || !shipping_pincode || !customer_name || !customer_phone) {
    return res.status(400).json({ success: false, message: 'All delivery address fields and contact details are required.' });
  }
  if (!/^\d{6}$/.test(String(shipping_pincode).trim())) {
    return res.status(400).json({ success: false, message: 'Please provide a valid 6-digit Indian PIN code.' });
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateProduct,
  validateCheckout
};
