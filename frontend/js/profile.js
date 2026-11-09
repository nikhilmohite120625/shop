/**
 * Narayani Sarees - Profile Dashboard Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const user = AuthState.getUser();
  if (!user || !AuthState.getToken()) {
    window.location.href = '/pages/login.html';
    return;
  }

  const nameEl = document.getElementById('profile-name');
  if (nameEl) nameEl.textContent = user.name;
  const emailEl = document.getElementById('profile-email');
  if (emailEl) emailEl.textContent = user.email;
  const phoneEl = document.getElementById('profile-phone');
  if (phoneEl) phoneEl.textContent = user.phone || 'Add phone number';
  const initEl = document.getElementById('profile-initial');
  if (initEl) initEl.textContent = (user.name || 'U')[0].toUpperCase();

  loadAddresses();
});

async function loadAddresses() {
  const container = document.getElementById('saved-addresses-list');
  if (!container) return;

  const res = await apiCall('/users/addresses');
  if (res.success && res.addresses) {
    if (res.addresses.length === 0) {
      container.innerHTML = '<p style="color:#777;">No saved delivery addresses yet.</p>';
      return;
    }

    container.innerHTML = res.addresses.map(a => `
      <div class="address-select-card" style="margin-bottom:14px;">
        <h4>${a.full_name} ${a.is_default ? '<span class="badge badge-primary">Default</span>' : ''}</h4>
        <p>${a.address_line}, ${a.city}, ${a.state} - ${a.pincode}</p>
        <p>Phone: ${a.phone}</p>
      </div>
    `).join('');
  }
}

async function handleAddAddress(e) {
  e.preventDefault();
  const payload = {
    full_name: document.getElementById('addr-name').value.trim(),
    phone: document.getElementById('addr-phone').value.trim(),
    address_line: document.getElementById('addr-line').value.trim(),
    city: document.getElementById('addr-city').value.trim(),
    state: document.getElementById('addr-state').value.trim(),
    pincode: document.getElementById('addr-pincode').value.trim(),
    address_type: document.getElementById('addr-type').value,
    is_default: document.getElementById('addr-default').checked
  };

  const res = await apiCall('/users/addresses', 'POST', payload);
  if (res.success) {
    showToast('Address saved successfully!', 'success');
    document.getElementById('add-address-form').reset();
    document.getElementById('address-modal').classList.remove('active');
    loadAddresses();
  } else {
    showToast(res.message, 'error');
  }
}

function customerLogout() {
  AuthState.clearToken();
  showToast('Logged out successfully', 'info');
  setTimeout(() => window.location.href = '/pages/login.html', 1000);
}
