/**
 * Narayani Sarees - Global UI & API Client
 * Tuljapur, Maharashtra - "Grace In Every Drape"
 */

const API_BASE = '/api';

const AuthState = {
  getToken: () => localStorage.getItem('ns_auth_token'),
  setToken: (token) => localStorage.setItem('ns_auth_token', token),
  clearToken: () => {
    localStorage.removeItem('ns_auth_token');
    localStorage.removeItem('ns_user');
  },
  getUser: () => {
    try {
      const u = localStorage.getItem('ns_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('ns_user', JSON.stringify(user)),
  getSessionId: () => {
    let sid = localStorage.getItem('ns_session_id');
    if (!sid) {
      sid = 'ns_sess_' + Math.random().toString(36).substring(2, 12);
      localStorage.setItem('ns_session_id', sid);
    }
    return sid;
  }
};

async function apiCall(endpoint, method = 'GET', data = null, isFormData = false) {
  const headers = {
    'x-session-id': AuthState.getSessionId()
  };

  const token = AuthState.getToken();
  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const options = { method, headers };

  if (data) {
    if (isFormData) {
      options.body = data;
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
  }

  try {
    const res = await fetch(API_BASE + endpoint, options);
    const result = await res.json();
    return result;
  } catch (error) {
    console.error('API Error (' + endpoint + '):', error);
    return { success: false, message: 'Network connection error. Please try again.' };
  }
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  
  let icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';
  if (type === 'info') icon = 'fa-info-circle';

  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

function formatINR(num) {
  return '₹' + Number(num || 0).toLocaleString('en-IN');
}

async function updateNavBadges() {
  try {
    const cartRes = await apiCall('/cart');
    if (cartRes.success && cartRes.cart) {
      const count = cartRes.cart.items.reduce((sum, i) => sum + (i.quantity || 1), 0);
      const cartBadges = document.querySelectorAll('.cart-badge');
      cartBadges.forEach(b => {
        b.textContent = count;
        b.style.display = count > 0 ? 'flex' : 'none';
      });
    }

    const user = AuthState.getUser();
    if (user && AuthState.getToken()) {
      const wishRes = await apiCall('/wishlist');
      if (wishRes.success && wishRes.wishlist) {
        const wishBadges = document.querySelectorAll('.wishlist-badge');
        wishBadges.forEach(b => {
          b.textContent = wishRes.wishlist.length;
          b.style.display = wishRes.wishlist.length > 0 ? 'flex' : 'none';
        });
      }
    }
  } catch (e) {
    console.warn('Badge update error:', e);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  const user = AuthState.getUser();
  const authLinks = document.querySelectorAll('.auth-link');
  authLinks.forEach(link => {
    if (user) {
      link.href = user.role && ['admin', 'Super Admin', 'Manager', 'Staff'].includes(user.role) ? '/pages/admin.html' : '/pages/profile.html';
      link.innerHTML = `<i class="fas fa-user-circle"></i> <span class="nav-user-name" style="font-size:13px; font-weight:600;">${user.name.split(' ')[0]}</span>`;
    } else {
      link.href = '/pages/login.html';
      link.innerHTML = `<i class="far fa-user"></i>`;
    }
  });

  updateNavBadges();
});
