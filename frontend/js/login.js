/**
 * Narayani Sarees - Customer & Admin Login Logic
 */
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  if (form) {
    form.addEventListener('submit', handleLogin);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const res = await apiCall('/auth/login', 'POST', { email, password });
  if (res.success && res.token) {
    AuthState.setToken(res.token);
    AuthState.setUser(res.user);
    showToast(`Welcome back, ${res.user.name}!`, 'success');

    setTimeout(() => {
      if (['admin', 'Super Admin', 'Manager', 'Staff'].includes(res.user.role)) {
        window.location.href = '/pages/admin.html';
      } else {
        window.location.href = '/pages/profile.html';
      }
    }, 1200);
  } else {
    showToast(res.message || 'Login failed', 'error');
  }
}

function quickFill(email, password) {
  document.getElementById('login-email').value = email;
  document.getElementById('login-password').value = password;
}

async function requestOTP() {
  const target = document.getElementById('login-email').value.trim();
  if (!target) {
    showToast('Please enter your email or phone number above', 'error');
    return;
  }

  const res = await apiCall('/auth/send-otp', 'POST', { email: target });
  if (res.success) {
    showToast(res.message, 'success');
    document.getElementById('otp-section').style.display = 'block';
    if (res.testOtp) {
      document.getElementById('otp-input').value = res.testOtp;
    }
  } else {
    showToast(res.message, 'error');
  }
}

async function verifyOTP() {
  const target = document.getElementById('login-email').value.trim();
  const otp = document.getElementById('otp-input').value.trim();

  const res = await apiCall('/auth/verify-otp', 'POST', { email: target, otp });
  if (res.success && res.token) {
    AuthState.setToken(res.token);
    AuthState.setUser(res.user);
    showToast('OTP verified successfully!', 'success');
    setTimeout(() => window.location.href = '/pages/profile.html', 1200);
  } else {
    showToast(res.message, 'error');
  }
}
