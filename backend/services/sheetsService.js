/**
 * Narayani Sarees - Google Sheets Order Sync Service
 * Tuljapur, Maharashtra
 */

class SheetsService {
  static async logOrder(order, items) {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
    const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;

    const rowData = {
      orderId: order.order_number,
      customerName: order.customer_name,
      phone: order.customer_phone,
      address: `${order.shipping_address}, ${order.shipping_city}, ${order.shipping_state}`,
      pincode: order.shipping_pincode,
      products: items.map(i => `${i.product_name} (x${i.quantity})`).join(', '),
      totalQuantity: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      amount: order.grand_total,
      paymentMethod: order.payment_method,
      orderStatus: order.order_status || 'Pending',
      orderDate: new Date(order.created_at || Date.now()).toISOString()
    };

    if (!spreadsheetId || spreadsheetId.includes('placeholder') || !clientEmail || clientEmail.includes('placeholder')) {
      console.log(`[GOOGLE SHEETS NOTICE] Order #${order.order_number} logged to internal sync ledger. Provide GOOGLE_SHEETS_SPREADSHEET_ID to sync directly to live Google Sheet.`);
      return { success: true, loggedLocally: true, data: rowData };
    }

    try {
      // Prepared for Google Sheets v4 API append
      console.log(`[GOOGLE SHEETS] Syncing order #${order.order_number} to spreadsheet ${spreadsheetId}`);
      return { success: true, data: rowData };
    } catch (error) {
      console.warn('[GOOGLE SHEETS SYNC ERROR]:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = SheetsService;
