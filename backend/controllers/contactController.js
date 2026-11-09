/**
 * Contact Message Controller
 * Narayani Sarees, Tuljapur
 */
const Contact = require('../models/Contact');
const { sendMail } = require('../utils/email');

class ContactController {
  static async submitMessage(req, res) {
    try {
      const { name, email, phone, subject, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: 'Name, email, and message are required.' });
      }

      const msg = await Contact.create({ name, email, phone, subject: subject || 'Store Inquiry', message });

      // Notify seller
      const sellerEmail = process.env.SELLER_EMAIL || 'nikhilmohitepcet@gmail.com';
      sendMail(
        sellerEmail,
        `[Contact Inquiry] ${subject || 'New Message'} from ${name}`,
        `<p><strong>From:</strong> ${name} (${email}, Phone: ${phone || 'N/A'})</p><p><strong>Subject:</strong> ${subject || 'General Inquiry'}</p><p><strong>Message:</strong></p><p>${message}</p>`
      ).catch(e => console.warn('Contact email error:', e.message));

      return res.status(201).json({
        success: true,
        message: 'Thank you for reaching out to Narayani Sarees! Our Tuljapur team will get back to you shortly.'
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to submit contact message', error: error.message });
    }
  }

  static async getMessages(req, res) {
    try {
      const messages = await Contact.getAll();
      return res.json({ success: true, messages });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch messages', error: error.message });
    }
  }
}

module.exports = ContactController;
