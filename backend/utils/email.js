/**
 * Narayani Sarees - Email Utility with Nodemailer
 * Tuljapur, Maharashtra
 */
const nodemailer = require('nodemailer');

function createTransporter() {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT || '587', 10);
  const user = process.env.EMAIL_USER || 'nikhilmohitepcet@gmail.com';
  const pass = process.env.EMAIL_PASSWORD || '';

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  });
}

const BRAND_HEADER = `
  <div style="background-color:#7B1E3A; padding:24px; text-align:center; border-radius:8px 8px 0 0;">
    <h1 style="color:#D4AF37; margin:0; font-family:'Cinzel', Georgia, serif; font-size:26px; letter-spacing:1px;">NARAYANI SAREES</h1>
    <p style="color:#FFFDF8; margin:4px 0 0 0; font-size:13px; letter-spacing:2px; text-transform:uppercase;">Grace In Every Drape • Tuljapur</p>
  </div>
`;

const BRAND_FOOTER = `
  <div style="background-color:#f9f9f9; padding:20px; text-align:center; font-size:12px; color:#666; border-radius:0 0 8px 8px; border-top:1px solid #eee;">
    <p style="margin:4px 0;"><strong>Narayani Sarees</strong></p>
    <p style="margin:4px 0;">Infront Of Shreenath Mangal Karyalaya, Naldurg Road, Tuljapur - 413601, Maharashtra</p>
    <p style="margin:4px 0;">Phone: +91 9359594007 | Email: nikhilmohitepcet@gmail.com</p>
  </div>
`;

async function sendMail(to, subject, htmlContent) {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"Narayani Sarees" <nikhilmohitepcet@gmail.com>',
      to,
      subject,
      html: `
        <div style="font-family:'Poppins', Arial, sans-serif; max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #e2d9cb; border-radius:8px;">
          ${BRAND_HEADER}
          <div style="padding:30px; color:#222222; line-height:1.6;">
            ${htmlContent}
          </div>
          ${BRAND_FOOTER}
        </div>
      `
    });
    console.log(`[EMAIL SENT] Subject: "${subject}" to: ${to} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.warn(`[EMAIL NOTICE] Could not deliver email to ${to}: ${error.message}. (Ensure EMAIL_PASSWORD is valid app password)`);
    return { success: false, error: error.message };
  }
}

async function sendSellerNewOrderNotification(order, items) {
  const sellerEmail = process.env.SELLER_EMAIL || 'nikhilmohitepcet@gmail.com';
  const itemsHtml = items.map(item => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:10px 8px;"><strong>${item.product_name}</strong><br><small style="color:#777;">SKU: ${item.product_sku || 'N/A'}</small></td>
      <td style="padding:10px 8px; text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px; text-align:right;">₹${Number(item.unit_price).toLocaleString('en-IN')}</td>
      <td style="padding:10px 8px; text-align:right;"><strong>₹${Number(item.total_price || item.unit_price * item.quantity).toLocaleString('en-IN')}</strong></td>
    </tr>
  `).join('');

  const html = `
    <h2 style="color:#7B1E3A; margin-top:0;">🎉 New Order Received! (#${order.order_number})</h2>
    <p>A customer has placed a new order on <strong>Narayani Sarees</strong>.</p>
    
    <div style="background:#fdfcf9; border:1px solid #e8e0d5; padding:16px; border-radius:6px; margin:18px 0;">
      <h3 style="color:#7B1E3A; margin:0 0 10px 0; font-size:16px;">Customer Details:</h3>
      <p style="margin:4px 0;"><strong>Name:</strong> ${order.customer_name}</p>
      <p style="margin:4px 0;"><strong>Phone:</strong> <a href="tel:${order.customer_phone}">${order.customer_phone}</a></p>
      <p style="margin:4px 0;"><strong>Email:</strong> ${order.customer_email}</p>
      <p style="margin:4px 0;"><strong>Delivery Address:</strong> ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}</p>
    </div>

    <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:14px;">
      <thead>
        <tr style="background:#7B1E3A; color:#fff;">
          <th style="padding:10px 8px; text-align:left;">Saree</th>
          <th style="padding:10px 8px; text-align:center;">Qty</th>
          <th style="padding:10px 8px; text-align:right;">Price</th>
          <th style="padding:10px 8px; text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="text-align:right; font-size:15px; margin-top:15px; border-top:2px solid #7B1E3A; padding-top:10px;">
      <p style="margin:4px 0;">Subtotal: ₹${Number(order.subtotal).toLocaleString('en-IN')}</p>
      ${order.discount_amount > 0 ? `<p style="margin:4px 0; color:#1B5E20;">Discount: -₹${Number(order.discount_amount).toLocaleString('en-IN')}</p>` : ''}
      <p style="margin:4px 0;">Delivery: ₹${Number(order.delivery_charge).toLocaleString('en-IN')}</p>
      <h3 style="margin:8px 0; color:#7B1E3A;">Grand Total: ₹${Number(order.grand_total).toLocaleString('en-IN')}</h3>
      <p style="margin:4px 0;"><strong>Payment Method:</strong> ${order.payment_method} (${order.payment_status || 'Pending'})</p>
    </div>
  `;

  return sendMail(sellerEmail, `[New Order Alert] #${order.order_number} - ₹${order.grand_total} by ${order.customer_name}`, html);
}

async function sendCustomerOrderConfirmation(order, items) {
  const itemsHtml = items.map(item => `
    <tr style="border-bottom:1px solid #eee;">
      <td style="padding:10px 8px;"><strong>${item.product_name}</strong></td>
      <td style="padding:10px 8px; text-align:center;">${item.quantity}</td>
      <td style="padding:10px 8px; text-align:right;">₹${Number(item.total_price || item.unit_price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>
  `).join('');

  const html = `
    <h2 style="color:#7B1E3A; margin-top:0;">Thank You For Your Order!</h2>
    <p>Namaste <strong>${order.customer_name}</strong>,</p>
    <p>We are delighted to confirm your order <strong>#${order.order_number}</strong> with Narayani Sarees. Our master artisans and packing team will prepare your saree with utmost care.</p>
    
    <table style="width:100%; border-collapse:collapse; margin:20px 0; font-size:14px;">
      <thead>
        <tr style="background:#7B1E3A; color:#fff;">
          <th style="padding:10px 8px; text-align:left;">Saree</th>
          <th style="padding:10px 8px; text-align:center;">Qty</th>
          <th style="padding:10px 8px; text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <div style="text-align:right; font-size:14px; margin-top:10px;">
      <h3 style="color:#7B1E3A;">Total Paid/Payable: ₹${Number(order.grand_total).toLocaleString('en-IN')}</h3>
      <p>Payment: <strong>${order.payment_method}</strong></p>
    </div>

    <p style="margin-top:20px;">Delivery to: <strong>${order.shipping_address}, ${order.shipping_city} - ${order.shipping_pincode}</strong></p>
    <p>Track your order status anytime on our website or reply to this email for any assistance.</p>
  `;

  return sendMail(order.customer_email, `Order Confirmation #${order.order_number} - Narayani Sarees`, html);
}

module.exports = {
  sendMail,
  sendSellerNewOrderNotification,
  sendCustomerOrderConfirmation
};
