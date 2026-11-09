/**
 * Narayani Sarees - Shopping Cart Engine
 */
let cartData = null;
let appliedCouponCode = null;

document.addEventListener('DOMContentLoaded', () => {
  loadCart();
});

async function loadCart() {
  const tbody = document.getElementById('cart-items-tbody');
  if (!tbody) return;

  const res = await apiCall('/cart');
  if (res.success && res.cart) {
    cartData = res.cart;
    try { localStorage.setItem('ns_cached_cart', JSON.stringify(res.cart)); } catch(e) {}
    renderCart(cartData);
  } else {
    try {
      const cached = localStorage.getItem('ns_cached_cart');
      if (cached) {
        cartData = JSON.parse(cached);
        renderCart(cartData);
      } else {
        renderCart({ items: [], subtotal: 0 });
      }
    } catch(e) {
      renderCart({ items: [], subtotal: 0 });
    }
  }
}

function renderCart(cart) {
  const tbody = document.getElementById('cart-items-tbody');
  const summarySubtotal = document.getElementById('cart-subtotal');

  if (!cart || !cart.items || cart.items.length === 0) {
    const layout = document.querySelector('.cart-layout');
    if (layout) {
      layout.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <i class="fas fa-shopping-bag"></i>
          <h2>Your Saree Cart is Empty</h2>
          <p>Discover our heirloom Paithani, Banarasi, and silk collections.</p>
          <a href="/pages/shop.html" class="btn btn-primary" style="margin-top:16px;">Explore Collections</a>
        </div>
      `;
    }
    updateNavBadges();
    return;
  }

  tbody.innerHTML = cart.items.map(item => `
    <tr>
      <td>
        <div class="cart-product-info">
          <div class="cart-product-img">
            <img src="${item.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'}" alt="${item.name}">
          </div>
          <div>
            <div class="cart-product-title">${item.name}</div>
            <div class="cart-product-meta">${item.fabric || 'Pure Silk'} • ${item.color || 'Maroon'}</div>
          </div>
        </div>
      </td>
      <td class="cart-item-price">${formatINR(item.price)}</td>
      <td>
        <div class="quantity-stepper">
          <button onclick="updateItemQty(${item.product_id}, ${item.quantity - 1})">-</button>
          <input type="text" value="${item.quantity}" readonly>
          <button onclick="updateItemQty(${item.product_id}, ${item.quantity + 1})">+</button>
        </div>
      </td>
      <td class="cart-item-price">${formatINR(item.price * item.quantity)}</td>
      <td>
        <i class="fas fa-trash remove-cart-btn" onclick="removeCartItem(${item.product_id})" title="Remove item"></i>
      </td>
    </tr>
  `).join('');

  if (summarySubtotal) summarySubtotal.textContent = formatINR(cart.subtotal);
  calculateGrandTotal(cart.subtotal);
  updateNavBadges();
}

async function updateItemQty(productId, qty) {
  const res = await apiCall('/cart/update', 'PUT', { product_id: productId, quantity: qty });
  if (res.success) {
    cartData = res.cart;
    try { localStorage.setItem('ns_cached_cart', JSON.stringify(res.cart)); } catch(e) {}
    renderCart(cartData);
  } else {
    showToast(res.message, 'error');
  }
}

async function removeCartItem(productId) {
  const res = await apiCall('/cart/item/' + productId, 'DELETE');
  if (res.success) {
    showToast('Item removed from cart', 'info');
    cartData = res.cart;
    try { localStorage.setItem('ns_cached_cart', JSON.stringify(res.cart)); } catch(e) {}
    renderCart(cartData);
  }
}

async function applyCoupon() {
  const code = document.getElementById('coupon-input').value.trim();
  if (!code) {
    showToast('Please enter a coupon code', 'error');
    return;
  }

  const res = await apiCall('/coupons/validate', 'POST', { code, subtotal: cartData.subtotal });
  if (res.success && res.valid) {
    appliedCouponCode = res.coupon.code;
    showToast(res.message, 'success');
    
    document.getElementById('coupon-tag-container').innerHTML = `
      <div class="applied-coupon-tag">
        <span><i class="fas fa-tag"></i> ${res.coupon.code} (-₹${res.coupon.discount_amount})</span>
        <i class="fas fa-times" onclick="removeCoupon()"></i>
      </div>
    `;
    sessionStorage.setItem('ns_applied_coupon', JSON.stringify(res.coupon));
    calculateGrandTotal(cartData.subtotal, res.coupon.discount_amount);
  } else {
    showToast(res.message, 'error');
  }
}

function removeCoupon() {
  appliedCouponCode = null;
  sessionStorage.removeItem('ns_applied_coupon');
  document.getElementById('coupon-tag-container').innerHTML = '';
  document.getElementById('coupon-input').value = '';
  calculateGrandTotal(cartData.subtotal, 0);
  showToast('Coupon removed', 'info');
}

function calculateGrandTotal(subtotal, discount = 0) {
  const storedCoupon = sessionStorage.getItem('ns_applied_coupon');
  let currentDiscount = discount;
  if (!currentDiscount && storedCoupon) {
    currentDiscount = JSON.parse(storedCoupon).discount_amount || 0;
  }

  const discountRow = document.getElementById('cart-discount-row');
  const discountVal = document.getElementById('cart-discount-val');
  if (discountRow && discountVal) {
    if (currentDiscount > 0) {
      discountRow.style.display = 'flex';
      discountVal.textContent = '- ' + formatINR(currentDiscount);
    } else {
      discountRow.style.display = 'none';
    }
  }

  const grandTotal = Math.max(0, subtotal - currentDiscount);
  const grandTotalEl = document.getElementById('cart-grand-total');
  if (grandTotalEl) grandTotalEl.textContent = formatINR(grandTotal);
}

function proceedToCheckout() {
  if (!cartData || !cartData.items || cartData.items.length === 0) {
    showToast('Your cart is empty', 'error');
    return;
  }
  window.location.href = '/pages/checkout.html';
}
