/**
 * Narayani Sarees - WhatsApp Business Service
 * Tuljapur, Maharashtra - Phone: +91 9359594007
 */

class WhatsAppService {
  static getSellerWhatsAppNumber() {
    return (process.env.STORE_WHATSAPP || '919359594007').replace(/[^0-9]/g, '');
  }

  static generateChatLink(message = '') {
    const phone = this.getSellerWhatsAppNumber();
    const encoded = encodeURIComponent(message || 'Namaste Narayani Sarees, I would like to inquire about sarees in your collection.');
    return `https://wa.me/${phone}?text=${encoded}`;
  }

  static generateProductInquiryLink(product) {
    const phone = this.getSellerWhatsAppNumber();
    const text = `Namaste Narayani Sarees! I am interested in "${product.name}" (SKU: ${product.sku || 'N/A'}) priced at ₹${product.price}. Please share availability and details.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  static generateOrderSupportLink(order) {
    const phone = this.getSellerWhatsAppNumber();
    const text = `Namaste Narayani Sarees! I have a question regarding my Order #${order.order_number} (Amount: ₹${order.grand_total}).`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  }

  static async sendAutomatedOrderNotification(order, items) {
    const token = process.env.WHATSAPP_API_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!token || token.includes('placeholder') || !phoneId || phoneId.includes('placeholder')) {
      console.log(`[WHATSAPP NOTICE] Order #${order.order_number} simulated WhatsApp notification to +91 9359594007. Configure WHATSAPP_API_TOKEN for live cloud API.`);
      return { success: true, simulated: true };
    }

    try {
      const payload = {
        messaging_product: 'whatsapp',
        to: this.getSellerWhatsAppNumber(),
        type: 'text',
        text: {
          body: `*New Order Alert - Narayani Sarees*\nOrder #${order.order_number}\nCustomer: ${order.customer_name}\nPhone: ${order.customer_phone}\nAmount: ₹${order.grand_total}\nPayment: ${order.payment_method}\nCity: ${order.shipping_city} (${order.shipping_pincode})`
        }
      };

      const response = await fetch(`https://graph.facebook.com/v18.0/${phoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      console.warn('[WHATSAPP CLOUD API ERROR]:', err.message);
      return { success: false, error: err.message };
    }
  }
}

module.exports = WhatsAppService;
