/**
 * Narayani Sarees - Home Page Logic
 */
document.addEventListener('DOMContentLoaded', async () => {
  loadFeaturedCategories();
  loadFeaturedProducts();
  loadFestivalOffers();
  loadBestsellerProducts();
});

async function loadFeaturedCategories() {
  const container = document.getElementById('categories-container');
  if (!container) return;

  const res = await apiCall('/products/categories');
  if (res.success && res.categories) {
    container.innerHTML = res.categories.map(cat => `
      <a href="/pages/shop.html?category=${cat.slug}" class="category-card">
        <img src="${cat.image || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80'}" alt="${cat.name}">
        <div class="category-card-overlay">
          <h3>${cat.name}</h3>
          <span>EXPLORE WEAVES <i class="fas fa-arrow-right"></i></span>
        </div>
      </a>
    `).join('');
  }
}

async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products-container');
  if (!container) return;

  const res = await apiCall('/products?featured=true&limit=8');
  if (res.success && res.products) {
    renderProductGrid(container, res.products);
  }
}

async function loadBestsellerProducts() {
  const container = document.getElementById('bestseller-products-container');
  if (!container) return;

  const res = await apiCall('/products?bestseller=true&limit=4');
  if (res.success && res.products) {
    renderProductGrid(container, res.products);
  }
}

async function loadFestivalOffers() {
  const container = document.getElementById('festival-offers-container');
  if (!container) return;

  const res = await apiCall('/products/festival-offers');
  if (res.success && res.offers && res.offers.length > 0) {
    const offer = res.offers[0];
    container.innerHTML = `
      <div class="festival-banner-card">
        <div class="festival-banner-img">
          <img src="${offer.banner_image}" alt="${offer.title}">
        </div>
        <div class="festival-banner-info">
          <div class="festival-tag"><i class="fas fa-certificate"></i> ${offer.festival_name} Special</div>
          <h2>${offer.title}</h2>
          <p>Adorn yourself in divine elegance with our auspicious handcrafted sarees woven specially for Maharashtra's grand festivals.</p>
          <div style="margin-bottom:24px;">
            <span class="badge badge-gold" style="font-size:14px; padding:6px 16px;">${offer.discount_tag}</span>
          </div>
          <a href="${offer.link_url || '/pages/shop.html'}" class="btn btn-primary">Shop Festive Collection</a>
        </div>
      </div>
    `;
  }
}

function renderProductGrid(container, products) {
  container.innerHTML = products.map(p => {
    const isOutOfStock = p.stock_quantity <= 0;
    const imgUrl = (p.images && p.images.length > 0) ? p.images[0] : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

    return `
      <div class="product-card">
        <div class="product-thumb">
          <div class="product-badges">
            ${isOutOfStock ? '<span class="badge badge-danger">OUT OF STOCK</span>' : ''}
            ${p.is_bestseller ? '<span class="badge badge-gold">BESTSELLER</span>' : ''}
            ${p.discount > 0 ? `<span class="badge badge-primary">${p.discount}% OFF</span>` : ''}
          </div>
          <button class="wishlist-btn" onclick="toggleWishlist(${p.id}, this)" title="Add to Wishlist">
            <i class="far fa-heart"></i>
          </button>
          <a href="/pages/product.html?id=${p.id}">
            <img src="${imgUrl}" alt="${p.name}" loading="lazy">
          </a>
        </div>
        <div class="product-details-content">
          <span class="product-category-name">${p.fabric || 'Pure Silk'} • ${p.category_name || 'Sarees'}</span>
          <a href="/pages/product.html?id=${p.id}" class="product-title" title="${p.name}">${p.name}</a>
          <div class="product-rating">
            <i class="fas fa-star"></i> <strong>${p.rating || 4.8}</strong> <span>(${p.total_reviews || 12})</span>
          </div>
          <div class="product-price-row">
            <span class="price-current">${formatINR(p.price)}</span>
            ${p.original_price > p.price ? `<span class="price-original">${formatINR(p.original_price)}</span>` : ''}
          </div>
          <div class="product-actions">
            <button class="btn btn-primary btn-block" ${isOutOfStock ? 'disabled' : ''} onclick="quickAddToCart(${p.id})">
              ${isOutOfStock ? 'Out of Stock' : '<i class="fas fa-shopping-bag"></i> Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function quickAddToCart(productId) {
  const res = await apiCall('/cart/add', 'POST', { product_id: productId, quantity: 1 });
  if (res.success) {
    if (res.cart) {
      try { localStorage.setItem('ns_cached_cart', JSON.stringify(res.cart)); } catch(e) {}
    }
    showToast('Saree added to your cart!', 'success');
    updateNavBadges();
  } else {
    showToast(res.message || 'Could not add to cart', 'error');
  }
}

async function toggleWishlist(productId, btn) {
  const user = AuthState.getUser();
  if (!user || !AuthState.getToken()) {
    showToast('Please login to save to your wishlist', 'info');
    setTimeout(() => { window.location.href = '/pages/login.html'; }, 1000);
    return;
  }

  const res = await apiCall('/wishlist/add', 'POST', { product_id: productId });
  if (res.success) {
    btn.classList.add('active');
    btn.innerHTML = '<i class="fas fa-heart" style="color:#fff;"></i>';
    showToast('Added to your Wishlist!', 'success');
    updateNavBadges();
  } else {
    showToast(res.message || 'Wishlist update error', 'error');
  }
}
