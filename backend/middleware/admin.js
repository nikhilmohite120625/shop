/**
 * Role-Based Admin Authorization Middleware
 * Narayani Sarees, Tuljapur
 */

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const role = req.user.role || '';
  const allowed = ['admin', 'Super Admin', 'Manager', 'Staff'];

  if (!allowed.includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required.'
    });
  }

  next();
}

function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const role = req.user.role || '';
  if (role !== 'Super Admin' && role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Super Admin privileges required.'
    });
  }

  next();
}

function requireManager(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required.' });
  }

  const role = req.user.role || '';
  if (!['Super Admin', 'admin', 'Manager'].includes(role)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Manager or higher privileges required.'
    });
  }

  next();
}

module.exports = {
  requireAdmin,
  requireSuperAdmin,
  requireManager
};
