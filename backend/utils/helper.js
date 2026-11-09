/**
 * Narayani Sarees - Helper Utilities
 * Tuljapur, Maharashtra
 */

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `NS-${dateStr}-${randomSuffix}`;
}

function generateSlug(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

function generateSKU(categoryPrefix = 'NS', count = 1) {
  const pad = String(count).padStart(3, '0');
  return `${categoryPrefix}-${pad}`;
}

function calculateDeliveryCharge(pincode, subtotal, deliveryZones = []) {
  const pin = String(pincode || '').trim();
  
  if (!pin || pin.length < 3) {
    return {
      zone: 'Standard Delivery',
      charge: 99.00,
      estimated_days: '3-5 Business Days',
      is_free: subtotal >= 1999
    };
  }

  // Default fallback zones if not passed
  const zones = deliveryZones.length > 0 ? deliveryZones : [
    { zone_name: 'Tuljapur & Marathwada (Local)', pincode_prefixes: '413,414,431', delivery_charge: 0.00, free_delivery_above: 999.00, estimated_days: '1-2 Days (Express)' },
    { zone_name: 'Maharashtra & Goa', pincode_prefixes: '400,401,402,403,410,411,412,415,416,421,422,423,424,425,440,441,442,443,444,445', delivery_charge: 49.00, free_delivery_above: 1499.00, estimated_days: '2-3 Days' },
    { zone_name: 'Rest of India', pincode_prefixes: '1,2,3,5,6,7,8,9', delivery_charge: 99.00, free_delivery_above: 1999.00, estimated_days: '4-6 Days' }
  ];

  for (const zone of zones) {
    const prefixes = zone.pincode_prefixes.split(',').map(p => p.trim());
    for (const prefix of prefixes) {
      if (pin.startsWith(prefix)) {
        const isFree = subtotal >= Number(zone.free_delivery_above);
        return {
          zone: zone.zone_name,
          charge: isFree ? 0.00 : Number(zone.delivery_charge),
          estimated_days: zone.estimated_days,
          is_free: isFree
        };
      }
    }
  }

  return {
    zone: 'Standard National Delivery',
    charge: subtotal >= 1999 ? 0.00 : 99.00,
    estimated_days: '4-6 Business Days',
    is_free: subtotal >= 1999
  };
}

module.exports = {
  generateOrderNumber,
  generateSlug,
  generateSKU,
  calculateDeliveryCharge
};
