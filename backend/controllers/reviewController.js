/**
 * Review Controller
 * Narayani Sarees, Tuljapur
 */
const Review = require('../models/Review');

class ReviewController {
  static async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const reviews = await Review.getProductReviews(productId);
      return res.json({ success: true, reviews });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
    }
  }

  static async addReview(req, res) {
    try {
      const userId = req.user.id;
      const userName = req.user.name;
      const { product_id, rating, title, comment, image_url } = req.body;

      if (!product_id || !rating || !comment) {
        return res.status(400).json({ success: false, message: 'Product, rating (1-5), and review comment are required.' });
      }

      const review = await Review.addReview({
        product_id,
        user_id: userId,
        user_name: userName,
        rating: parseInt(rating),
        title,
        comment,
        image_url
      });

      return res.status(201).json({
        success: true,
        message: 'Thank you for reviewing! Your feedback has been published.',
        review
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to submit review', error: error.message });
    }
  }

  static async getAllReviewsAdmin(req, res) {
    try {
      const reviews = await Review.getAllReviews();
      return res.json({ success: true, reviews });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch reviews', error: error.message });
    }
  }

  static async updateReviewStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body; // approved / rejected
      await Review.updateStatus(id, status);
      return res.json({ success: true, message: `Review status changed to ${status}` });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to update review status', error: error.message });
    }
  }
}

module.exports = ReviewController;
