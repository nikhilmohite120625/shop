/**
 * Narayani Sarees - PDF Invoice Generator Utility with PDFKit
 * Tuljapur, Maharashtra
 */
const PDFDocument = require('pdfkit');

function generateInvoicePDF(order, items, res) {
  const doc = new PDFDocument({ margin: 45, size: 'A4' });

  // Stream directly to response
  doc.pipe(res);

  // Brand Header
  doc
    .fillColor('#7B1E3A')
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('NARAYANI SAREES', 45, 45);

  doc
    .fillColor('#D4AF37')
    .fontSize(10)
    .font('Helvetica')
    .text('GRACE IN EVERY DRAPE', 45, 70);

  doc
    .fillColor('#444444')
    .fontSize(9)
    .text('Infront Of Shreenath Mangal Karyalaya, Naldurg Road', 45, 85)
    .text('Tuljapur - 413601, Maharashtra, India', 45, 98)
    .text('Phone: +91 9359594007 | Email: nikhilmohitepcet@gmail.com', 45, 111);

  // Invoice Title & Info on Right
  doc
    .fillColor('#7B1E3A')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text('TAX INVOICE', 380, 45, { align: 'right' });

  const orderDate = new Date(order.created_at || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  doc
    .fillColor('#333333')
    .fontSize(9)
    .font('Helvetica')
    .text(`Invoice No: INV-${order.order_number}`, 380, 70, { align: 'right' })
    .text(`Order No: #${order.order_number}`, 380, 85, { align: 'right' })
    .text(`Date: ${orderDate}`, 380, 98, { align: 'right' })
    .text(`Payment: ${order.payment_method} (${(order.payment_status || 'Pending').toUpperCase()})`, 380, 111, { align: 'right' });

  // Divider Line
  doc
    .strokeColor('#D4AF37')
    .lineWidth(2)
    .moveTo(45, 135)
    .lineTo(550, 135)
    .stroke();

  // Customer / Billing Details Box
  doc
    .rect(45, 145, 505, 70)
    .fillColor('#FFFDF8')
    .fill()
    .strokeColor('#EADCC7')
    .lineWidth(1)
    .stroke();

  doc
    .fillColor('#7B1E3A')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('BILLED & SHIPPED TO:', 55, 155);

  doc
    .fillColor('#222222')
    .fontSize(9)
    .font('Helvetica')
    .text(`Customer Name: ${order.customer_name}`, 55, 170)
    .text(`Phone: ${order.customer_phone} | Email: ${order.customer_email}`, 55, 183)
    .text(`Address: ${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`, 55, 196);

  // Items Table Header
  const tableTop = 230;
  doc
    .rect(45, tableTop, 505, 24)
    .fillColor('#7B1E3A')
    .fill();

  doc
    .fillColor('#FFFFFF')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('#', 55, tableTop + 7)
    .text('Item Description & SKU', 80, tableTop + 7)
    .text('Qty', 360, tableTop + 7, { width: 40, align: 'center' })
    .text('Price (INR)', 410, tableTop + 7, { width: 60, align: 'right' })
    .text('Total (INR)', 480, tableTop + 7, { width: 60, align: 'right' });

  let currentY = tableTop + 24;
  items.forEach((item, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc
        .rect(45, currentY, 505, 26)
        .fillColor('#FAFAFA')
        .fill();
    }

    doc
      .fillColor('#222222')
      .fontSize(9)
      .font('Helvetica')
      .text(String(index + 1), 55, currentY + 7)
      .text(`${item.product_name} (${item.product_sku || 'Saree'})`, 80, currentY + 7, { width: 270, ellipsis: true })
      .text(String(item.quantity), 360, currentY + 7, { width: 40, align: 'center' })
      .text(Number(item.unit_price).toFixed(2), 410, currentY + 7, { width: 60, align: 'right' })
      .text(Number(item.total_price || item.unit_price * item.quantity).toFixed(2), 480, currentY + 7, { width: 60, align: 'right' });

    currentY += 26;
  });

  // Table Bottom Line
  doc
    .strokeColor('#CCCCCC')
    .lineWidth(1)
    .moveTo(45, currentY)
    .lineTo(550, currentY)
    .stroke();

  // Summary Totals
  const totalsY = currentY + 15;
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#444444')
    .text('Subtotal:', 360, totalsY, { width: 100, align: 'right' })
    .text(`₹${Number(order.subtotal).toFixed(2)}`, 480, totalsY, { width: 60, align: 'right' });

  let nextY = totalsY + 16;
  if (order.discount_amount && Number(order.discount_amount) > 0) {
    doc
      .fillColor('#1B5E20')
      .text(`Discount (${order.coupon_code || 'Promo'}):`, 330, nextY, { width: 130, align: 'right' })
      .text(`-₹${Number(order.discount_amount).toFixed(2)}`, 480, nextY, { width: 60, align: 'right' });
    nextY += 16;
  }

  doc
    .fillColor('#444444')
    .text('Shipping & Delivery:', 330, nextY, { width: 130, align: 'right' })
    .text(`₹${Number(order.delivery_charge || 0).toFixed(2)}`, 480, nextY, { width: 60, align: 'right' });
  nextY += 16;

  // Grand Total Box
  doc
    .rect(330, nextY, 220, 26)
    .fillColor('#7B1E3A')
    .fill();

  doc
    .fillColor('#FFFFFF')
    .fontSize(10)
    .font('Helvetica-Bold')
    .text('Grand Total:', 340, nextY + 7)
    .text(`INR ${Number(order.grand_total).toFixed(2)}`, 440, nextY + 7, { width: 100, align: 'right' });

  // Terms & Footer
  doc
    .fillColor('#777777')
    .fontSize(8)
    .font('Helvetica')
    .text('Terms & Conditions:', 45, 680)
    .text('1. Returns/Exchanges accepted within 7 days of delivery with original tags and packaging.', 45, 692)
    .text('2. Dry clean only recommended for pure silk and zari sarees.', 45, 704)
    .text('3. This is a computer-generated official tax invoice for Narayani Sarees, Tuljapur.', 45, 716);

  doc
    .fillColor('#D4AF37')
    .fontSize(9)
    .font('Helvetica-Bold')
    .text('Thank you for choosing Narayani Sarees — Tuljapur!', 45, 740, { align: 'center' });

  doc.end();
}

module.exports = {
  generateInvoicePDF
};
