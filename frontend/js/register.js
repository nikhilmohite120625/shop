/**
 * Narayani Sarees - Customer Registration Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('register-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('reg-name').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const phone = document.getElementById('reg-phone').value.trim();
      const password = document.getElementById('reg-password').value;

      const res = await apiCall('/auth/register', 'POST', { name, email, phone, password });
      if (res.success && res.token) {
        AuthState.setToken(res.token);
        AuthState.setUser(res.user);
        showToast('Registration successful! Welcome to Narayani Sarees.', 'success');
        setTimeout(() => window.location.href = '/pages/profile.html', 1200);
      } else {
        showToast(res.message || 'Registration failed', 'error');
      }
    });
  }
});
