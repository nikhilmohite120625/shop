/**
 * Narayani Sarees - Orders & Tracking Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('id');

  if (orderId && document.getElementById('order-details-container')) {
    loadOrderDetails(orderId);
  } else if (document.getElementById('orders-list-container')) {
    loadMyOrders();
  }
});

async function loadMyOrders() {
  const container = document.getElementById('orders-list-container');
  if (!container) return;

  const user = AuthState.getUser();
  if (!user || !AuthState.getToken()) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-lock"></i>
        <h3>Please Login</h3>
        <p>Log in to your account to view your past saree orders and tracking status.</p>
        <a href="/pages/login.html" class="btn btn-primary" style="margin-top:14px;">Login Now</a>
      </div>
    `;
    return;
  }

  const res = await apiCall('/orders/my-orders');
  if (res.success && res.orders) {
    if (res.orders.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-box-open"></i>
          <h3>No Orders Yet</h3>
          <p>You haven't placed any saree orders yet.</p>
          <a href="/pages/shop.html" class="btn btn-primary" style="margin-top:14px;">Start Shopping</a>
        </div>
      `;
      return;
    }

    container.innerHTML = res.orders.map(o => `
      <div class="order-card">
        <div class="order-card-header">
          <div class="order-num-date">
            <h4>Order #${o.order_number}</h4>
            <span>Placed on ${new Date(o.created_at).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric'})}</span>
          </div>
          <span class="badge ${getStatusBadgeClass(o.order_status)}">${o.order_status}</span>
        </div>
        <div>
          ${(o.items || []).map(i => `
            <div class="order-item-row">
              <div class="order-item-img">
                <img src="${i.product_image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'}" alt="${i.product_name}">
              </div>
              <div class="order-item-info">
                <h5>${i.product_name}</h5>
                <p>Qty: ${i.quantity} | ${formatINR(i.unit_price)}</p>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="order-card-footer">
          <div class="order-total-price">Total: ${formatINR(o.grand_total)} (${o.payment_method})</div>
          <div class="order-card-actions">
            <a href="/pages/order-details.html?id=${o.id}" class="btn btn-outline btn-sm">View Details & Track</a>
            <a href="/api/orders/${o.id}/invoice" target="_blank" class="btn btn-secondary btn-sm"><i class="fas fa-file-pdf"></i> Invoice</a>
          </div>
        </div>
      </div>
    `).join('');
  }
}

async function loadOrderDetails(orderId) {
  const container = document.getElementById('order-details-container');
  if (!container) return;

  const res = await apiCall('/orders/' + orderId);
  if (!res.success || !res.order) {
    container.innerHTML = '<div class="empty-state"><h3>Order Not Found</h3></div>';
    return;
  }

  const o = res.order;
  container.innerHTML = `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <h2>Order #${o.order_number}</h2>
          <p style="color:#666; font-size:13px;">Placed on ${new Date(o.created_at).toLocaleString('en-IN')}</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="badge ${getStatusBadgeClass(o.order_status)}" style="font-size:14px; padding:6px 16px;">${o.order_status}</span>
          <a href="/api/orders/${o.id}/invoice" target="_blank" class="btn btn-secondary btn-sm"><i class="fas fa-download"></i> Download Invoice PDF</a>
        </div>
      </div>

      <h3 style="margin-top:20px;">Order Progress</h3>
      ${renderTrackingTimeline(o.order_status)}

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:25px; margin:30px 0; background:#fbf9f5; padding:20px; border-radius:12px;">
        <div>
          <h4 style="color:#7B1E3A; margin-bottom:8px;">Delivery Address</h4>
          <p><strong>${o.customer_name}</strong></p>
          <p>${o.shipping_address}</p>
          <p>${o.shipping_city}, ${o.shipping_state} - ${o.shipping_pincode}</p>
          <p>Phone: ${o.customer_phone}</p>
        </div>
        <div>
          <h4 style="color:#7B1E3A; margin-bottom:8px;">Payment & Summary</h4>
          <p>Payment Mode: <strong>${o.payment_method}</strong> (${(o.payment_status || 'Pending').toUpperCase()})</p>
          <p>Subtotal: ${formatINR(o.subtotal)}</p>
          ${o.discount_amount > 0 ? `<p style="color:#1B5E20;">Discount: -${formatINR(o.discount_amount)}</p>` : ''}
          <p>Delivery: ${formatINR(o.delivery_charge)}</p>
          <h3 style="color:#7B1E3A; margin-top:8px;">Grand Total: ${formatINR(o.grand_total)}</h3>
        </div>
      </div>

      <h3>Ordered Items</h3>
      <div style="margin-top:16px;">
        ${(o.items || []).map(i => `
          <div class="order-item-row" style="padding:14px 0; border-bottom:1px solid #eee;">
            <div class="order-item-img">
              <img src="${i.product_image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'}" alt="${i.product_name}">
            </div>
            <div class="order-item-info" style="flex:1;">
              <h5>${i.product_name}</h5>
              <p>SKU: ${i.product_sku || 'N/A'} • ${i.fabric || ''}</p>
            </div>
            <div><strong>${i.quantity} x ${formatINR(i.unit_price)} = ${formatINR(i.total_price || i.quantity * i.unit_price)}</strong></div>
          </div>
        `).join('')}
      </div>

      <div style="margin-top:30px; text-align:right;">
        <a href="https://wa.me/919359594007?text=Namaste Narayani Sarees, I need support for Order #${o.order_number}" target="_blank" class="btn btn-outline"><i class="fab fa-whatsapp"></i> WhatsApp Order Support</a>
      </div>
    </div>
  `;
}

function renderTrackingTimeline(status) {
  const steps = ['Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentIdx = steps.indexOf(status);

  return `
    <div class="tracking-timeline">
      ${steps.map((step, idx) => {
        let stateClass = '';
        if (currentIdx >= idx) stateClass = 'completed';
        if (currentIdx === idx) stateClass = 'active';
        return `
          <div class="timeline-step ${stateClass}">
            <div class="timeline-icon"><i class="fas ${getStepIcon(step)}"></i></div>
            <p>${step}</p>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getStepIcon(step) {
  switch (step) {
    case 'Confirmed': return 'fa-check';
    case 'Packed': return 'fa-box';
    case 'Shipped': return 'fa-shipping-fast';
    case 'Out for Delivery': return 'fa-truck';
    case 'Delivered': return 'fa-home';
    default: return 'fa-circle';
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case 'Delivered': return 'badge-success';
    case 'Shipped':
    case 'Out for Delivery':
    case 'Packed': return 'badge-gold';
    case 'Cancelled': return 'badge-danger';
    default: return 'badge-primary';
  }
}
