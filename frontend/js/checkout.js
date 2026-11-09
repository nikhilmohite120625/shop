/**
 * Narayani Sarees - Checkout Engine
 */
let checkoutCart = null;
let savedAddresses = [];
let selectedAddressId = null;
let deliveryCharge = 0;
let appliedDiscount = 0;
let appliedCoupon = null;

document.addEventListener('DOMContentLoaded', async () => {
  updateSecurityBadge();
  await loadCheckoutSummary();
  await loadCustomerAddresses();
});

function updateSecurityBadge() {
  const badge = document.getElementById('ssl-security-badge');
  if (!badge) return;
  const isHttps = window.location.protocol === 'https:';
  if (isHttps) {
    badge.innerHTML = '<i class="fas fa-lock" style="color:var(--accent);"></i> <span>256-Bit SSL Encrypted</span>';
  } else {
    badge.innerHTML = '<i class="fas fa-shield-alt" style="color:var(--primary);"></i> <span>Secure Checkout</span>';
  }
}

async function loadCheckoutSummary() {
  const res = await apiCall('/cart');
  if (!res.success || !res.cart || !res.cart.items || res.cart.items.length === 0) {
    showToast('Your cart is empty', 'error');
    setTimeout(() => window.location.href = '/pages/shop.html', 1000);
    return;
  }

  checkoutCart = res.cart;

  const storedCoupon = sessionStorage.getItem('ns_applied_coupon');
  if (storedCoupon) {
    appliedCoupon = JSON.parse(storedCoupon);
    appliedDiscount = appliedCoupon.discount_amount || 0;
  }

  const itemsContainer = document.getElementById('checkout-items-list');
  if (itemsContainer) {
    itemsContainer.innerHTML = checkoutCart.items.map(i => `
      <div style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:14px;">
        <span>${i.name} (x${i.quantity})</span>
        <strong>${formatINR(i.price * i.quantity)}</strong>
      </div>
    `).join('');
  }

  const subtotalEl = document.getElementById('checkout-subtotal');
  if (subtotalEl) subtotalEl.textContent = formatINR(checkoutCart.subtotal);

  const discountRow = document.getElementById('checkout-discount-row');
  const discountEl = document.getElementById('checkout-discount');
  if (discountRow && discountEl) {
    if (appliedDiscount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = '- ' + formatINR(appliedDiscount);
    } else {
      discountRow.style.display = 'none';
    }
  }

  updateCheckoutTotals();
}

async function loadCustomerAddresses() {
  const user = AuthState.getUser();
  if (user && AuthState.getToken()) {
    const res = await apiCall('/users/addresses');
    if (res.success && res.addresses && res.addresses.length > 0) {
      savedAddresses = res.addresses;
      renderAddressSelector(savedAddresses);
      return;
    }
  }

  const newForm = document.getElementById('new-address-form');
  if (newForm) newForm.style.display = 'grid';
}

function renderAddressSelector(addresses) {
  const container = document.getElementById('saved-addresses-container');
  if (!container) return;

  container.innerHTML = addresses.map((a, idx) => `
    <div class="address-select-card ${idx === 0 ? 'selected' : ''}" onclick="selectAddress(${a.id}, this)">
      <h4>${a.full_name} <span class="badge badge-outline">${a.address_type}</span></h4>
      <p>${a.address_line}, ${a.city}, ${a.state} - <strong>${a.pincode}</strong></p>
      <p style="margin-top:4px;"><i class="fas fa-phone"></i> ${a.phone}</p>
    </div>
  `).join('');

  selectAddress(addresses[0].id, container.children[0]);
}

function selectAddress(id, cardElem) {
  selectedAddressId = id;
  document.querySelectorAll('.address-select-card').forEach(c => c.classList.remove('selected'));
  if (cardElem) cardElem.classList.add('selected');

  const addr = savedAddresses.find(a => a.id === id);
  if (addr) {
    updateDeliveryChargeForPincode(addr.pincode);
  }
}

async function updateDeliveryChargeForPincode(pincode) {
  if (!pincode || String(pincode).length < 6 || !checkoutCart) return;
  const res = await apiCall(`/orders/calculate-delivery?pincode=${pincode}&subtotal=${checkoutCart.subtotal - appliedDiscount}`);
  if (res.success && res.delivery) {
    deliveryCharge = res.delivery.charge;
    const delEl = document.getElementById('checkout-delivery');
    if (delEl) delEl.textContent = deliveryCharge === 0 ? 'FREE' : formatINR(deliveryCharge);
    const zoneNote = document.getElementById('delivery-zone-note');
    if (zoneNote) zoneNote.textContent = `Estimated: ${res.delivery.estimated_days} (${res.delivery.zone})`;
    updateCheckoutTotals();
  }
}

function updateCheckoutTotals() {
  if (!checkoutCart) return;
  const grandTotal = Math.max(0, checkoutCart.subtotal - appliedDiscount + deliveryCharge);
  const gtEl = document.getElementById('checkout-grand-total');
  if (gtEl) gtEl.textContent = formatINR(grandTotal);
}

function toggleNewAddressForm() {
  const form = document.getElementById('new-address-form');
  if (form) form.style.display = form.style.display === 'none' ? 'grid' : 'none';
}

async function handlePlaceOrder() {
  const submitBtn = document.getElementById('place-order-btn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Order...';

  let orderPayload = {
    payment_method: document.querySelector('input[name="payment_method"]:checked')?.value || 'COD',
    coupon_code: appliedCoupon ? appliedCoupon.code : null,
    notes: document.getElementById('order-notes')?.value || ''
  };

  if (selectedAddressId && savedAddresses.length > 0) {
    const addr = savedAddresses.find(a => a.id === selectedAddressId);
    orderPayload.customer_name = addr.full_name;
    orderPayload.customer_phone = addr.phone;
    orderPayload.customer_email = AuthState.getUser()?.email || 'customer@gmail.com';
    orderPayload.shipping_address = addr.address_line;
    orderPayload.shipping_city = addr.city;
    orderPayload.shipping_state = addr.state;
    orderPayload.shipping_pincode = addr.pincode;
  } else {
    orderPayload.customer_name = document.getElementById('ship-name').value.trim();
    orderPayload.customer_email = document.getElementById('ship-email').value.trim();
    orderPayload.customer_phone = document.getElementById('ship-phone').value.trim();
    orderPayload.shipping_address = document.getElementById('ship-address').value.trim();
    orderPayload.shipping_city = document.getElementById('ship-city').value.trim();
    orderPayload.shipping_state = document.getElementById('ship-state').value.trim();
    orderPayload.shipping_pincode = document.getElementById('ship-pincode').value.trim();
  }

  if (!orderPayload.customer_name || !orderPayload.customer_phone || !orderPayload.shipping_address || !orderPayload.shipping_pincode) {
    showToast('Please fill all required delivery address fields', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-lock"></i> Place Saree Order';
    return;
  }

  // --- 1. RAZORPAY STANDARD CHECKOUT FLOW ---
  if (orderPayload.payment_method === 'RAZORPAY') {
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening Razorpay Checkout...';

    // Step 1: Secure server-side Order creation (amount calculated by backend)
    const rzpInit = await apiCall('/orders/razorpay-initiate', 'POST', {
      coupon_code: orderPayload.coupon_code,
      shipping_pincode: orderPayload.shipping_pincode,
      customer_email: orderPayload.customer_email
    });

    if (!rzpInit.success || !rzpInit.order_id) {
      showToast(rzpInit.message || 'Failed to initiate Razorpay checkout', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-lock"></i> Place Saree Order';
      return;
    }

    // Step 2: If Razorpay SDK is loaded on page, open official Checkout Modal
    if (typeof window.Razorpay !== 'undefined') {
      const options = {
        key: rzpInit.key_id,
        amount: rzpInit.amount, // in paise
        currency: rzpInit.currency || 'INR',
        name: 'Narayani Sarees',
        description: 'Payment for Handcrafted Saree Order',
        image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80',
        order_id: rzpInit.order_id,
        prefill: {
          name: orderPayload.customer_name,
          email: orderPayload.customer_email,
          contact: orderPayload.customer_phone
        },
        notes: {
          address: `${orderPayload.shipping_address}, ${orderPayload.shipping_city} - ${orderPayload.shipping_pincode}`,
          store: 'Narayani Sarees (Tuljapur)'
        },
        theme: {
          color: '#7B1E3A'
        },
        modal: {
          ondismiss: function () {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-lock"></i> Place Saree Order';
            showToast('Payment window closed. You can retry payment or choose Cash on Delivery.', 'info');
          }
        },
        handler: async function (response) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Payment Signature...';

          orderPayload.razorpay_order_id = response.razorpay_order_id;
          orderPayload.razorpay_payment_id = response.razorpay_payment_id;
          orderPayload.razorpay_signature = response.razorpay_signature;

          const res = await apiCall('/orders', 'POST', orderPayload);
          if (res.success && res.order) {
            sessionStorage.removeItem('ns_applied_coupon');
            try { localStorage.removeItem('ns_cached_cart'); } catch(e) {}
            updateNavBadges();
            showToast('🎉 Payment verified! Order #' + res.order.order_number + ' placed successfully.', 'success');
            setTimeout(() => {
              window.location.href = '/pages/order-details.html?id=' + res.order.id;
            }, 1500);
          } else {
            showToast(res.message || 'Payment verification failed', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-lock"></i> Place Saree Order';
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          console.error('[RAZORPAY PAYMENT FAILED]:', resp.error);
          showToast('Payment failed: ' + (resp.error.description || 'Transaction declined by bank'), 'error');
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-lock"></i> Place Saree Order';
        });

        rzp.open();
        return;
      } catch (e) {
        console.warn('Razorpay SDK modal error:', e);
      }
    } else {
      // Test environment fallback simulation if checkout.js is blocked by offline network
      orderPayload.razorpay_order_id = rzpInit.order_id;
      orderPayload.razorpay_payment_id = 'pay_sim_' + Math.random().toString(36).substring(2, 12);
      orderPayload.razorpay_signature = 'simulated_valid_signature';
    }
  }

  // --- 2. CASH ON DELIVERY (COD) OR SIMULATED FLOW ---
  const res = await apiCall('/orders', 'POST', orderPayload);
  if (res.success && res.order) {
    sessionStorage.removeItem('ns_applied_coupon');
    try { localStorage.removeItem('ns_cached_cart'); } catch(e) {}
    updateNavBadges();
    showToast('🎉 Order placed successfully! Order #' + res.order.order_number, 'success');
    setTimeout(() => {
      window.location.href = '/pages/order-details.html?id=' + res.order.id;
    }, 1500);
  } else {
    showToast(res.message || 'Order placement failed', 'error');
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-lock"></i> Place Saree Order';
  }
}
