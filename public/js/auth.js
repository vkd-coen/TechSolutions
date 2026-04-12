/**
 * auth.js — login.html logic
 * Handles login / register forms, real-time password strength meter,
 * and redirect after successful auth.
 */
(function () {
  // ── Tab switching ─────────────────────────────────────
  document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.auth-tab, .auth-form').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.target).classList.add('active');
      clearAllAlerts();
    });
  });

  // ── Password strength ─────────────────────────────────
  const pwInput = document.getElementById('reg-password');
  if (pwInput) {
    pwInput.addEventListener('input', () => evaluatePassword(pwInput.value));
  }

  const rules = [
    { id: 'req-length',  test: v => v.length >= 8,                label: 'At least 8 characters' },
    { id: 'req-upper',   test: v => /[A-Z]/.test(v),              label: 'One uppercase letter' },
    { id: 'req-lower',   test: v => /[a-z]/.test(v),              label: 'One lowercase letter' },
    { id: 'req-number',  test: v => /[0-9]/.test(v),              label: 'One number' },
    { id: 'req-special', test: v => /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(v), label: 'One special character' }
  ];

  function evaluatePassword(val) {
    let passed = 0;
    rules.forEach(r => {
      const met = r.test(val);
      if (met) passed++;
      const el = document.getElementById(r.id);
      if (el) {
        el.classList.toggle('met', met);
        el.classList.toggle('unmet', !met);
      }
    });

    const fill = document.getElementById('pw-fill');
    if (fill) {
      fill.className = 'pw-strength-fill';
      if (val.length === 0) { fill.style.width = '0'; return; }
      const levels = ['weak', 'fair', 'good', 'strong', 'strong'];
      fill.classList.add(levels[Math.min(passed - 1, 4)]);
    }
    return passed === rules.length;
  }

  // ── Helpers ───────────────────────────────────────────
  function showAlert(containerId, message, type = 'error') {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="alert alert-${type}">${escHtml(message)}</div>`;
  }

  function clearAllAlerts() {
    document.querySelectorAll('[id$="-alert"]').forEach(el => el.innerHTML = '');
  }

  function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.textContent = loading ? 'Please wait…' : btn.dataset.label;
  }

  function escHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body)
    });
    return res.json();
  }

  // ── Login form ────────────────────────────────────────
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const btn = loginForm.querySelector('button[type="submit"]');
    btn.dataset.label = btn.textContent;

    loginForm.addEventListener('submit', async e => {
      e.preventDefault();
      clearAllAlerts();
      setLoading(btn, true);

      const email    = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      try {
        const data = await postJSON('/api/auth/login', { email, password });

        if (data.success) {
          const u = data.data.user;
          localStorage.setItem('tps_user', JSON.stringify({
            id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email
          }));
          const redirect = new URLSearchParams(window.location.search).get('next') || '/profile';
          window.location.href = redirect;
        } else {
          const msg = data.errors ? data.errors.map(e => e.message).join(', ') : data.message;
          showAlert('login-alert', msg, 'error');
        }
      } catch {
        showAlert('login-alert', 'Network error — please try again.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  }

  // ── Register form ─────────────────────────────────────
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const btn = registerForm.querySelector('button[type="submit"]');
    btn.dataset.label = btn.textContent;

    registerForm.addEventListener('submit', async e => {
      e.preventDefault();
      clearAllAlerts();

      const firstName = document.getElementById('reg-first').value.trim();
      const lastName  = document.getElementById('reg-last').value.trim();
      const email     = document.getElementById('reg-email').value.trim();
      const password  = document.getElementById('reg-password').value;
      const confirm   = document.getElementById('reg-confirm').value;

      if (password !== confirm) {
        showAlert('register-alert', 'Passwords do not match.', 'error');
        return;
      }

      if (!evaluatePassword(password)) {
        showAlert('register-alert', 'Please meet all password requirements.', 'error');
        return;
      }

      setLoading(btn, true);
      try {
        const data = await postJSON('/api/auth/register', { firstName, lastName, email, password });

        if (data.success) {
          const u = data.data.user;
          localStorage.setItem('tps_user', JSON.stringify({
            id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email
          }));
          showAlert('register-alert', `Welcome, ${escHtml(u.firstName)}! Redirecting…`, 'success');
          setTimeout(() => window.location.href = '/profile', 1200);
        } else {
          const msg = data.errors ? data.errors.map(e => e.message).join(' • ') : data.message;
          showAlert('register-alert', msg, 'error');
        }
      } catch {
        showAlert('register-alert', 'Network error — please try again.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  }
})();
