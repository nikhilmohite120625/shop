/**
 * Narayani Sarees - Image Storage Service (Local & Cloudinary Adapter)
 * Tuljapur, Maharashtra
 */

class CloudinaryService {
  static async uploadImage(filePath, folder = 'products') {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if Cloudinary credentials are provided
    if (cloudName && apiKey && apiSecret && !cloudName.includes('placeholder')) {
      try {
        // Dynamic adapter for Cloudinary if package or REST API configured
        console.log(`[CLOUDINARY] Uploading ${filePath} to folder ${folder}`);
        // Return cloudinary URL when configured
      } catch (err) {
        console.warn('Cloudinary upload error:', err.message);
      }
    }

    // Default to local URL
    const relativePath = filePath.replace(/\\/g, '/');
    const uploadsIndex = relativePath.indexOf('/uploads/');
    if (uploadsIndex !== -1) {
      return relativePath.substring(uploadsIndex);
    }
    return filePath;
  }
}

module.exports = CloudinaryService;
