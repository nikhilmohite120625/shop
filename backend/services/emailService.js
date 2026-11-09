/**
 * Narayani Sarees - Email Service
 * Tuljapur, Maharashtra
 */
const { sendMail, sendSellerNewOrderNotification, sendCustomerOrderConfirmation } = require('../utils/email');

class EmailService {
  static async sendWelcome(user) {
    const html = `
      <h2 style="color:#7B1E3A; margin-top:0;">Welcome to Narayani Sarees, Tuljapur</h2>
      <p>Namaste <strong>${user.name}</strong>,</p>
      <p>Thank you for joining the Narayani Sarees family! We bring you the finest handwoven Paithanis, opulent Banarasis, and traditional Indian drapes crafted with utmost grace.</p>
      <div style="text-align:center; margin:30px 0;">
        <a href="${process.env.CLIENT_URL || 'http://localhost:5000'}/pages/shop.html" style="background:#D4AF37; color:#222; padding:12px 30px; border-radius:30px; text-decoration:none; font-weight:bold;">Explore Saree Collection</a>
      </div>
      <p>Enjoy our exclusive introductory coupon <strong>WELCOME10</strong> for 10% off your first purchase.</p>
    `;
    return sendMail(user.email, 'Welcome to Narayani Sarees - Grace In Every Drape', html);
  }

  static async sendOTP(email, otp) {
    const html = `
      <h2 style="color:#7B1E3A; margin-top:0;">Your Verification OTP</h2>
      <p>Use the following One-Time Password (OTP) to complete your verification with Narayani Sarees:</p>
      <div style="background:#FFFDF8; border:2px dashed #7B1E3A; text-align:center; padding:18px; font-size:32px; font-weight:bold; letter-spacing:6px; color:#7B1E3A; margin:20px 0;">
        ${otp}
      </div>
      <p style="color:#777; font-size:12px;">This OTP is valid for 10 minutes. Do not share this OTP with anyone.</p>
    `;
    return sendMail(email, `Your OTP Code: ${otp} - Narayani Sarees`, html);
  }

  static async notifyNewOrder(order, items) {
    // Send both customer confirmation and seller alert
    await Promise.allSettled([
      sendCustomerOrderConfirmation(order, items),
      sendSellerNewOrderNotification(order, items)
    ]);
  }

  static async notifyOrderStatus(order, newStatus) {
    const html = `
      <h2 style="color:#7B1E3A; margin-top:0;">Order Status Update: #${order.order_number}</h2>
      <p>Namaste <strong>${order.customer_name}</strong>,</p>
      <p>The status of your saree order has been updated to:</p>
      <div style="background:#FFFDF8; border-left:4px solid #D4AF37; padding:15px; font-size:18px; font-weight:bold; color:#7B1E3A; margin:20px 0;">
        ${newStatus.toUpperCase()}
      </div>
      <p>We are ensuring your order reaches you safely. You can track the progress on our website anytime.</p>
    `;
    return sendMail(order.customer_email, `Order Status Update: #${order.order_number} is now ${newStatus}`, html);
  }
}

module.exports = EmailService;
