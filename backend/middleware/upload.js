/**
 * Narayani Sarees - Multer File Upload Middleware
 * Tuljapur, Maharashtra
 */
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure base upload directories exist
const uploadDirs = [
  path.join(__dirname, '../uploads'),
  path.join(__dirname, '../uploads/products'),
  path.join(__dirname, '../uploads/banners'),
  path.join(__dirname, '../uploads/users')
];

uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = path.join(__dirname, '../uploads/products');
    if (req.originalUrl && req.originalUrl.includes('users')) {
      dest = path.join(__dirname, '../uploads/users');
    } else if (req.originalUrl && req.originalUrl.includes('banners')) {
      dest = path.join(__dirname, '../uploads/banners');
    } else if (file.fieldname === 'csvFile' || file.fieldname === 'excelFile' || file.fieldname === 'file') {
      dest = path.join(__dirname, '../uploads');
    }
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `saree_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|webp|gif|csv|xlsx|xls/;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  if (allowedExtensions.test(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, webp) and data sheets (csv, xlsx) are permitted.'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
});

module.exports = upload;
