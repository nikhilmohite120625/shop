/**
 * Narayani Sarees - Admin Dashboard Controller
 * Tuljapur, Maharashtra
 */
let allProducts = [];
let allOrders = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  loadAdminDashboardStats();
});

function checkAdminAuth() {
  const user = AuthState.getUser();
  const token = AuthState.getToken();
  if (!token || !user || !['admin', 'Super Admin', 'Manager', 'Staff'].includes(user.role)) {
    alert('Admin access required. Please login with admin credentials.');
    window.location.href = '/pages/login.html';
  } else {
    const nameEl = document.getElementById('admin-user-name');
    if (nameEl) nameEl.textContent = user.name;
    const roleEl = document.getElementById('admin-user-role');
    if (roleEl) roleEl.textContent = user.role;
  }
}

function showAdminTab(tabName, elem) {
  document.querySelectorAll('.admin-tab-content').forEach(t => t.style.display = 'none');
  document.querySelectorAll('.admin-nav-item').forEach(n => n.classList.remove('active'));
  
  const target = document.getElementById('tab-' + tabName);
  if (target) target.style.display = 'block';
  if (elem) elem.classList.add('active');

  if (tabName === 'products') loadAdminProducts();
  if (tabName === 'orders') loadAdminOrders();
  if (tabName === 'inventory') loadAdminInventory();
  if (tabName === 'coupons') loadAdminCoupons();
  if (tabName === 'reviews') loadAdminReviews();
  if (tabName === 'customers') loadAdminCustomers();
  if (tabName === 'staff') loadAdminStaff();
  if (tabName === 'settings') loadAdminSettings();
}

async function loadAdminDashboardStats() {
  const res = await apiCall('/users/admin/analytics');
  if (res.success && res.stats) {
    const s = res.stats;
    const ts = document.getElementById('stat-total-sales');
    if (ts) ts.textContent = formatINR(s.totalSales);
    const tds = document.getElementById('stat-today-sales');
    if (tds) tds.textContent = formatINR(s.todaySales);
    const to = document.getElementById('stat-total-orders');
    if (to) to.textContent = s.totalOrders;
    const po = document.getElementById('stat-pending-orders');
    if (po) po.textContent = s.pendingOrders;
    const tp = document.getElementById('stat-total-products');
    if (tp) tp.textContent = s.totalProducts;
    const ls = document.getElementById('stat-low-stock');
    if (ls) ls.textContent = s.lowStockProducts;
  }
}

async function loadAdminProducts() {
  const tbody = document.getElementById('admin-products-tbody');
  if (!tbody) return;

  const res = await apiCall('/products?limit=100');
  if (res.success && res.products) {
    allProducts = res.products;
    tbody.innerHTML = allProducts.map(p => `
      <tr>
        <td>
          <img src="${(p.images && p.images[0]) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=300&q=80'}" style="width:45px; height:55px; border-radius:4px; object-fit:cover;">
        </td>
        <td><strong>${p.name}</strong><br><small style="color:#777;">${p.sku || 'N/A'}</small></td>
        <td>${p.category_name || 'Paithani'}</td>
        <td>${formatINR(p.price)}</td>
        <td><span class="badge ${p.stock_quantity <= 0 ? 'badge-danger' : (p.stock_quantity <= 5 ? 'badge-warning' : 'badge-success')}">${p.stock_quantity} in stock</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="deleteProduct(${p.id})" style="color:var(--danger); border-color:var(--danger);"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }
}

async function loadAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;

  const res = await apiCall('/orders/admin/all');
  if (res.success && res.orders) {
    allOrders = res.orders;
    tbody.innerHTML = allOrders.map(o => `
      <tr>
        <td><strong>#${o.order_number}</strong></td>
        <td>${o.customer_name}<br><small>${o.customer_phone}</small></td>
        <td>${formatINR(o.grand_total)} (${o.payment_method})</td>
        <td>
          <select onchange="updateOrderStatus(${o.id}, this.value)" style="padding:6px 10px; border-radius:4px; border:1px solid #ccc; font-weight:600;">
            ${['Pending', 'Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'].map(s => `
              <option value="${s}" ${o.order_status === s ? 'selected' : ''}>${s}</option>
            `).join('')}
          </select>
        </td>
        <td>${new Date(o.created_at).toLocaleDateString('en-IN')}</td>
        <td>
          <a href="/api/orders/${o.id}/invoice" target="_blank" class="btn btn-secondary btn-sm"><i class="fas fa-file-pdf"></i> Invoice</a>
        </td>
      </tr>
    `).join('');
  }
}

async function loadAdminInventory() {
  const tbody = document.getElementById('admin-inventory-tbody');
  if (!tbody) return;

  const res = await apiCall('/products?limit=100');
  if (res.success && res.products) {
    tbody.innerHTML = res.products.map(p => `
      <tr>
        <td><strong>${p.name}</strong> (${p.sku || 'N/A'})</td>
        <td>${p.category_name}</td>
        <td><strong>${p.stock_quantity}</strong></td>
        <td><span class="badge ${p.stock_quantity <= 0 ? 'badge-danger' : (p.stock_quantity <= 5 ? 'badge-warning' : 'badge-success')}">${p.stock_quantity <= 0 ? 'Out of Stock' : (p.stock_quantity <= 5 ? 'Low Stock Warning' : 'Healthy')}</span></td>
        <td>
          <div style="display:flex; gap:8px; align-items:center;">
            <input type="number" id="stock-val-${p.id}" value="${p.stock_quantity}" style="width:70px; padding:4px 8px; border:1px solid #ccc; border-radius:4px;">
            <button class="btn btn-primary btn-sm" onclick="saveStockChange(${p.id})">Update</button>
          </div>
        </td>
      </tr>
    `).join('');
  }
}

async function saveStockChange(productId) {
  const input = document.getElementById(`stock-val-${productId}`);
  const newStock = parseInt(input.value);
  const res = await apiCall(`/products/${productId}`, 'PUT', { stock_quantity: newStock });
  if (res.success) {
    showToast('Stock quantity updated successfully!', 'success');
    loadAdminInventory();
  } else {
    showToast(res.message, 'error');
  }
}

async function loadAdminCoupons() {
  const tbody = document.getElementById('admin-coupons-tbody');
  if (!tbody) return;

  const res = await apiCall('/coupons');
  if (res.success && res.coupons) {
    tbody.innerHTML = res.coupons.map(c => `
      <tr>
        <td><strong>${c.code}</strong></td>
        <td>${c.discount_type === 'percentage' ? `${c.discount_value}%` : `₹${c.discount_value}`}</td>
        <td>₹${c.min_order_amount || 0}</td>
        <td>${c.expiry_date}</td>
        <td><span class="badge badge-success">Active</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="deleteCoupon(${c.id})" style="color:var(--danger); border-color:var(--danger);"><i class="fas fa-trash"></i></button>
        </td>
      </tr>
    `).join('');
  }
}

async function handleCreateCoupon(e) {
  e.preventDefault();
  const payload = {
    code: document.getElementById('cp-code').value.trim(),
    description: document.getElementById('cp-desc').value.trim(),
    discount_type: document.getElementById('cp-type').value,
    discount_value: parseFloat(document.getElementById('cp-val').value),
    min_order_amount: parseFloat(document.getElementById('cp-min').value || 0),
    expiry_date: document.getElementById('cp-expiry').value || '2028-12-31'
  };

  const res = await apiCall('/coupons', 'POST', payload);
  if (res.success) {
    showToast('Coupon created successfully!', 'success');
    document.getElementById('create-coupon-form').reset();
    loadAdminCoupons();
  } else {
    showToast(res.message, 'error');
  }
}

async function deleteCoupon(id) {
  if (!confirm('Are you sure you want to remove this coupon?')) return;
  const res = await apiCall('/coupons/' + id, 'DELETE');
  if (res.success) {
    showToast('Coupon deleted', 'info');
    loadAdminCoupons();
  }
}

async function loadAdminReviews() {
  const tbody = document.getElementById('admin-reviews-tbody');
  if (!tbody) return;

  const res = await apiCall('/reviews/admin/all');
  if (res.success && res.reviews) {
    tbody.innerHTML = res.reviews.map(r => `
      <tr>
        <td>${r.product_name || 'Saree'}</td>
        <td>${r.user_name} ${r.is_verified_purchase ? '<span class="badge badge-success">Verified</span>' : ''}</td>
        <td>${'★'.repeat(r.rating)}</td>
        <td><strong>${r.title || ''}</strong><br><small>${r.comment}</small></td>
        <td><span class="badge ${r.status === 'approved' ? 'badge-success' : 'badge-warning'}">${r.status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="changeReviewStatus(${r.id}, 'approved')"><i class="fas fa-check"></i></button>
          <button class="btn btn-outline btn-sm" style="color:var(--danger);" onclick="changeReviewStatus(${r.id}, 'rejected')"><i class="fas fa-times"></i></button>
        </td>
      </tr>
    `).join('');
  }
}

async function changeReviewStatus(id, status) {
  const res = await apiCall(`/reviews/admin/${id}/status`, 'PUT', { status });
  if (res.success) {
    showToast(`Review ${status}`, 'info');
    loadAdminReviews();
  }
}

async function loadAdminCustomers() {
  const tbody = document.getElementById('admin-customers-tbody');
  if (!tbody) return;

  const res = await apiCall('/users/admin/customers');
  if (res.success && res.customers) {
    tbody.innerHTML = res.customers.map(c => `
      <tr>
        <td><strong>${c.name}</strong></td>
        <td>${c.email}</td>
        <td>${c.phone || 'N/A'}</td>
        <td>${new Date(c.created_at).toLocaleDateString('en-IN')}</td>
      </tr>
    `).join('');
  }
}

async function loadAdminStaff() {
  const tbody = document.getElementById('admin-staff-tbody');
  if (!tbody) return;

  const res = await apiCall('/users/admin/staff');
  if (res.success && res.admins) {
    tbody.innerHTML = res.admins.map(a => `
      <tr>
        <td><strong>${a.name}</strong></td>
        <td>${a.email}</td>
        <td><span class="badge badge-primary">${a.role}</span></td>
        <td>${a.phone || 'N/A'}</td>
        <td><span class="badge badge-success">${a.status}</span></td>
      </tr>
    `).join('');
  }
}

async function updateOrderStatus(orderId, status) {
  const res = await apiCall('/orders/' + orderId + '/status', 'PUT', { status });
  if (res.success) {
    showToast('Order status updated to ' + status, 'success');
  } else {
    showToast(res.message, 'error');
  }
}

async function handleBulkCsvUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById('csv-file-input');
  if (!fileInput || !fileInput.files[0]) {
    showToast('Please choose a CSV/Excel file', 'error');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  const res = await apiCall('/products/bulk-upload', 'POST', formData, true);
  if (res.success) {
    showToast(res.message, 'success');
    fileInput.value = '';
    loadAdminProducts();
  } else {
    showToast(res.message, 'error');
  }
}

async function handleCreateProduct(e) {
  e.preventDefault();
  const form = document.getElementById('create-product-form');
  const formData = new FormData(form);

  const res = await apiCall('/products', 'POST', formData, true);
  if (res.success) {
    showToast('Saree product added to catalog!', 'success');
    form.reset();
    document.getElementById('product-modal').classList.remove('active');
    loadAdminProducts();
  } else {
    showToast(res.message, 'error');
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this saree from catalog?')) return;
  const res = await apiCall('/products/' + id, 'DELETE');
  if (res.success) {
    showToast('Product deleted from catalog', 'info');
    loadAdminProducts();
  }
}

function openProductModal() {
  document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.remove('active');
}

function downloadSampleCsv() {
  const csvContent = 'Product Name,SKU,Category,Price,Original Price,Fabric,Color,Occasion,Stock,Description\n' +
    'Royal Paithani Maroon,NS-PTH-099,Paithani Sarees,15999,19999,Pure Silk,Maroon,Wedding,10,Handwoven Mor-bangadi pallu with pure zari border\n' +
    'Banarasi Georgette Khaddi,NS-BNR-099,Banarasi Sarees,12999,16999,Georgette,Red,Wedding,8,Pure khaddi georgette with kadhwa weave antique zari\n' +
    'Chanderi Silk Floral Drape,NS-CTN-099,Cotton Sarees,2899,3999,Chanderi Cotton,Ivory,Daily Wear,15,Breathable handcrafted chanderi with handblock floral motifs\n';

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'sample_sarees_import.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function adminLogout() {
  AuthState.clearToken();
  showToast('Logged out of Admin panel', 'info');
  setTimeout(() => window.location.href = '/pages/login.html', 1000);
}

function loadAdminSettings() {
  const user = AuthState.getUser() || {};
  const nameEl = document.getElementById('admin-edit-name');
  if (nameEl) nameEl.value = user.name || '';
  const emailEl = document.getElementById('admin-edit-email');
  if (emailEl) emailEl.value = user.email || '';
  const phoneEl = document.getElementById('admin-edit-phone');
  if (phoneEl) phoneEl.value = user.phone || '';
  const passEl = document.getElementById('admin-edit-password');
  if (passEl) passEl.value = '';
}

async function handleUpdateAdminSecurity(e) {
  e.preventDefault();
  const name = document.getElementById('admin-edit-name').value.trim();
  const email = document.getElementById('admin-edit-email').value.trim();
  const password = document.getElementById('admin-edit-password').value;
  const phone = document.getElementById('admin-edit-phone').value.trim();

  const payload = { name, email, phone };
  if (password) {
    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }
    payload.password = password;
  }

  const res = await apiCall('/users/admin/change-credentials', 'PUT', payload);
  if (res.success) {
    showToast('Admin credentials updated successfully!', 'success');
    const user = AuthState.getUser() || {};
    user.name = name;
    user.email = email;
    user.phone = phone;
    AuthState.setUser(user);
    const nameEl = document.getElementById('admin-user-name');
    if (nameEl) nameEl.textContent = name;
    const passEl = document.getElementById('admin-edit-password');
    if (passEl) passEl.value = '';
  } else {
    showToast(res.message || 'Failed to update credentials', 'error');
  }
}