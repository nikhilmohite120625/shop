/**
 * Narayani Sarees - Wishlist Page Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  loadWishlist();
});

async function loadWishlist() {
  const container = document.getElementById('wishlist-grid');
  if (!container) return;

  const user = AuthState.getUser();
  if (!user || !AuthState.getToken()) {
    container.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <i class="far fa-heart"></i>
        <h3>Please Login</h3>
        <p>Log in to view and manage your saved dream sarees.</p>
        <a href="/pages/login.html" class="btn btn-primary" style="margin-top:16px;">Login Now</a>
      </div>
    `;
    return;
  }

  const res = await apiCall('/wishlist');
  if (res.success && res.wishlist) {
    if (res.wishlist.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <i class="far fa-heart"></i>
          <h3>Your Wishlist is Empty</h3>
          <p>Explore our handcrafted Paithani & Banarasi drapes and save your favorites.</p>
          <a href="/pages/shop.html" class="btn btn-primary" style="margin-top:16px;">Explore Sarees</a>
        </div>
      `;
      return;
    }

    container.innerHTML = res.wishlist.map(p => `
      <div class="wishlist-card">
        <div class="wishlist-thumb">
          <div class="remove-wishlist-icon" onclick="removeFromWishlist(${p.id})"><i class="fas fa-trash"></i></div>
          <img src="${(p.images && p.images[0]) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80'}" alt="${p.name}">
        </div>
        <div class="wishlist-content">
          <h4>${p.name}</h4>
          <div style="font-weight:700; color:var(--primary); margin-bottom:12px;">${formatINR(p.price)}</div>
          <button class="btn btn-primary btn-block" onclick="moveWishlistToCart(${p.id})">
            <i class="fas fa-shopping-bag"></i> Move to Cart
          </button>
        </div>
      </div>
    `).join('');
  }
}

async function removeFromWishlist(id) {
  const res = await apiCall('/wishlist/remove/' + id, 'DELETE');
  if (res.success) {
    showToast('Removed from wishlist', 'info');
    loadWishlist();
    updateNavBadges();
  }
}

async function moveWishlistToCart(id) {
  const res = await apiCall('/wishlist/move-to-cart/' + id, 'POST');
  if (res.success) {
    showToast('Moved to cart!', 'success');
    loadWishlist();
    updateNavBadges();
  }
}
