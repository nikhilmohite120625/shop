/**
 * Narayani Sarees - Product Details Logic
 */
let currentProduct = null;
let currentQuantity = 1;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');
  if (!id) {
    window.location.href = '/pages/shop.html';
    return;
  }
  loadProductDetails(id);
});

async function loadProductDetails(id) {
  const res = await apiCall('/products/' + id);
  if (!res.success || !res.product) {
    showToast('Product not found', 'error');
    setTimeout(() => window.location.href = '/pages/shop.html', 1500);
    return;
  }

  currentProduct = res.product;
  renderProductPage(currentProduct);
  if (res.relatedProducts) {
    const relGrid = document.getElementById('related-products-grid');
    if (relGrid) renderProductGrid(relGrid, res.relatedProducts);
  }
  loadReviews(currentProduct.id);
}

function renderProductPage(p) {
  // Dynamic SEO and Structured Data injection
  document.title = `${p.name} — Narayani Sarees, Tuljapur`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.content = `${p.name} - ${p.fabric || 'Pure Silk'}, ${p.color || ''}. ${p.description ? p.description.substring(0, 140) : ''} Buy online at Narayani Sarees Tuljapur.`;

  // Inject Product JSON-LD schema
  let schemaScript = document.getElementById('product-jsonld');
  if (!schemaScript) {
    schemaScript = document.createElement('script');
    schemaScript.id = 'product-jsonld';
    schemaScript.type = 'application/ld+json';
    document.head.appendChild(schemaScript);
  }
  schemaScript.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    "name": p.name,
    "image": p.images && p.images.length > 0 ? p.images : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'],
    "description": p.description,
    "sku": p.sku || `NS-PROD-${p.id}`,
    "brand": {
      "@type": "Brand",
      "name": "Narayani Sarees"
    },
    "offers": {
      "@type": "Offer",
      "url": window.location.href,
      "priceCurrency": "INR",
      "price": p.price,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": p.stock_quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "Narayani Sarees (Tuljapur)"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": p.rating || "4.8",
      "reviewCount": p.total_reviews || "15"
    }
  });

  document.getElementById('product-name').textContent = p.name;
  document.getElementById('product-sku').textContent = p.sku;
  document.getElementById('product-rating-stars').innerHTML = renderStars(p.rating);
  document.getElementById('product-rating-val').textContent = `${p.rating} (${p.total_reviews} reviews)`;
  document.getElementById('product-price').textContent = formatINR(p.price);

  if (p.original_price > p.price) {
    document.getElementById('product-original-price').textContent = formatINR(p.original_price);
    document.getElementById('product-discount-tag').textContent = `${p.discount}% OFF`;
    document.getElementById('product-discount-tag').style.display = 'inline-block';
  } else {
    document.getElementById('product-original-price').textContent = '';
    document.getElementById('product-discount-tag').style.display = 'none';
  }

  document.getElementById('product-desc').textContent = p.description;

  const stockEl = document.getElementById('stock-badge-container');
  const isOutOfStock = p.stock_quantity <= 0;
  if (isOutOfStock) {
    stockEl.innerHTML = '<span class="stock-indicator stock-out"><i class="fas fa-times-circle"></i> OUT OF STOCK</span>';
    document.getElementById('add-to-cart-btn').disabled = true;
    document.getElementById('buy-now-btn').disabled = true;
  } else if (p.stock_quantity <= 5) {
    stockEl.innerHTML = `<span class="stock-indicator stock-low"><i class="fas fa-exclamation-triangle"></i> Hurry, only ${p.stock_quantity} left in stock!</span>`;
  } else {
    stockEl.innerHTML = '<span class="stock-indicator stock-in"><i class="fas fa-check-circle"></i> In Stock (Ready to Ship)</span>';
  }

  document.getElementById('chip-fabric').textContent = p.fabric || 'Pure Silk';
  document.getElementById('chip-color').textContent = p.color || 'Maroon';
  document.getElementById('chip-occasion').textContent = p.occasion || 'Wedding';

  const images = (p.images && p.images.length > 0) ? p.images : ['https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'];
  const mainImg = document.getElementById('main-product-image');
  mainImg.src = images[0];

  const thumbsContainer = document.getElementById('gallery-thumbs');
  thumbsContainer.innerHTML = images.map((img, idx) => `
    <div class="thumb-item ${idx === 0 ? 'active' : ''}" onclick="switchGalleryImage('${img}', this)">
      <img src="${img}" alt="Thumbnail ${idx + 1}">
    </div>
  `).join('');

  const specs = p.specifications || {};
  const specsTbody = document.getElementById('specs-tbody');
  specsTbody.innerHTML = Object.entries(specs).map(([k, v]) => `
    <tr>
      <td>${k}</td>
      <td>${v}</td>
    </tr>
  `).join('') || `<tr><td>Fabric</td><td>${p.fabric}</td></tr><tr><td>Occasion</td><td>${p.occasion}</td></tr>`;

  const waBtn = document.getElementById('wa-inquire-btn');
  if (waBtn) {
    const text = encodeURIComponent(`Namaste Narayani Sarees! I am interested in "${p.name}" (SKU: ${p.sku || 'N/A'}) listed for ${formatINR(p.price)}.`);
    waBtn.href = `https://wa.me/919359594007?text=${text}`;
  }
}

function switchGalleryImage(url, elem) {
  document.getElementById('main-product-image').src = url;
  document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
  elem.classList.add('active');
}

function changeQty(delta) {
  if (!currentProduct) return;
  const newQty = currentQuantity + delta;
  if (newQty >= 1 && newQty <= (currentProduct.stock_quantity || 10)) {
    currentQuantity = newQty;
    document.getElementById('qty-input').value = currentQuantity;
  }
}

async function handleAddToCart() {
  if (!currentProduct) return;
  const res = await apiCall('/cart/add', 'POST', { product_id: currentProduct.id, quantity: currentQuantity });
  if (res.success) {
    if (res.cart) {
      try { localStorage.setItem('ns_cached_cart', JSON.stringify(res.cart)); } catch(e) {}
    }
    showToast(`${currentQuantity} saree(s) added to cart!`, 'success');
    updateNavBadges();
  } else {
    showToast(res.message, 'error');
  }
}

async function handleBuyNow() {
  if (!currentProduct) return;
  const res = await apiCall('/cart/add', 'POST', { product_id: currentProduct.id, quantity: currentQuantity });
  if (res.success) {
    if (res.cart) {
      try { localStorage.setItem('ns_cached_cart', JSON.stringify(res.cart)); } catch(e) {}
    }
    window.location.href = '/pages/checkout.html';
  } else {
    showToast(res.message, 'error');
  }
}

async function checkPincode() {
  const pin = document.getElementById('pincode-input').value.trim();
  const resEl = document.getElementById('pincode-result');
  if (!pin || pin.length < 6) {
    resEl.innerHTML = '<span style="color:#c62828;">Please enter a valid 6-digit PIN code.</span>';
    return;
  }

  resEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking delivery...';
  const res = await apiCall(`/orders/calculate-delivery?pincode=${pin}&subtotal=${currentProduct ? currentProduct.price : 0}`);
  if (res.success && res.delivery) {
    const d = res.delivery;
    resEl.innerHTML = `
      <div style="color:#1B5E20; font-weight:600; margin-top:6px;">
        <i class="fas fa-truck"></i> Delivery to ${pin}: ${d.charge === 0 ? 'FREE Delivery' : formatINR(d.charge)}
      </div>
      <div style="font-size:12px; color:#666;">Estimated Delivery: ${d.estimated_days} (${d.zone})</div>
    `;
  }
}

async function loadReviews(productId) {
  const container = document.getElementById('reviews-list-container');
  if (!container) return;

  const res = await apiCall('/reviews/product/' + productId);
  if (res.success && res.reviews) {
    if (res.reviews.length === 0) {
      container.innerHTML = '<p style="color:#777; font-style:italic;">No reviews yet. Be the first to share your experience with this saree!</p>';
      return;
    }

    container.innerHTML = res.reviews.map(r => `
      <div class="review-card" style="margin-bottom:16px;">
        <div class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        <h4>${r.title || 'Exceptional Drape & Finish'}</h4>
        <p>"${r.comment}"</p>
        <div class="review-author">
          <div class="review-avatar">${(r.user_name || 'Customer')[0]}</div>
          <div class="review-author-info">
            <h5>${r.user_name}</h5>
            ${r.is_verified_purchase ? '<span class="verified-badge"><i class="fas fa-check-circle"></i> Verified Buyer</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');
  }
}

let selectedRating = 5;
function setRating(val) {
  selectedRating = val;
  const stars = document.querySelectorAll('.star-rating-selector i');
  stars.forEach((s, idx) => {
    if (idx < val) s.classList.add('active');
    else s.classList.remove('active');
  });
}

async function submitProductReview(e) {
  e.preventDefault();
  const user = AuthState.getUser();
  if (!user || !AuthState.getToken()) {
    showToast('Please login to submit a review', 'info');
    setTimeout(() => window.location.href = '/pages/login.html', 1000);
    return;
  }

  const title = document.getElementById('review-title-input').value;
  const comment = document.getElementById('review-comment-input').value;

  const res = await apiCall('/reviews', 'POST', {
    product_id: currentProduct.id,
    rating: selectedRating,
    title,
    comment
  });

  if (res.success) {
    showToast(res.message, 'success');
    document.getElementById('review-form').reset();
    loadReviews(currentProduct.id);
  } else {
    showToast(res.message, 'error');
  }
}
