/**
 * profile.js — User profile page
 * Handles: profile info, change password, payment methods display, sidebar nav.
 *
 * SECURITY NOTE on payments:
 *   Card data must NEVER be sent to or stored on this server.
 *   To accept payments, integrate Stripe (https://stripe.com) — free to set up,
 *   transaction fees only. Stripe.js keeps card data on Stripe's PCI-compliant servers;
 *   your server only ever sees a payment method token (stripePaymentMethodId).
 */
(function () {
  // ── Auth guard — redirect to login if not logged in ──
  fetch('/api/auth/me', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      if (!data.success) {
        window.location.href = '/login?next=/profile';
        return;
      }
      initProfile(data.data.user);
    })
    .catch(() => { window.location.href = '/login?next=/profile'; });

  // ── Sidebar navigation ────────────────────────────────
  document.querySelectorAll('.profile-nav-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.profile-nav-item, .profile-section').forEach(el => el.classList.remove('active'));
      item.classList.add('active');
      const target = document.getElementById(item.dataset.section);
      if (target) target.classList.add('active');
    });
  });

  // ── Init ──────────────────────────────────────────────
  function initProfile(user) {
    // Avatar initials
    const av = document.getElementById('avatar-initials');
    if (av) av.textContent = (user.firstName[0] + user.lastName[0]).toUpperCase();

    const nameEl = document.getElementById('sidebar-name');
    if (nameEl) nameEl.textContent = `${user.firstName} ${user.lastName}`;

    const emailEl = document.getElementById('sidebar-email');
    if (emailEl) emailEl.textContent = user.email;

    // Pre-fill profile form
    setVal('prof-first',   user.firstName);
    setVal('prof-last',    user.lastName);
    setVal('prof-email',   user.email);
    setVal('prof-phone',   user.phone || '');
    setVal('prof-street',  user.address?.street || '');
    setVal('prof-city',    user.address?.city || '');
    setVal('prof-province',user.address?.province || '');
    setVal('prof-postal',  user.address?.postalCode || '');

    renderPaymentMethods(user.paymentMethods || []);
  }

  function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

  // ── Profile update form ───────────────────────────────
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    const btn = profileForm.querySelector('button[type="submit"]');
    btn.dataset.label = btn.textContent;

    profileForm.addEventListener('submit', async e => {
      e.preventDefault();
      clearAlert('prof-alert');
      setLoading(btn, true);

      const body = {
        firstName: document.getElementById('prof-first').value.trim(),
        lastName:  document.getElementById('prof-last').value.trim(),
        phone:     document.getElementById('prof-phone').value.trim(),
        address: {
          street:     document.getElementById('prof-street').value.trim(),
          city:       document.getElementById('prof-city').value.trim(),
          province:   document.getElementById('prof-province').value.trim(),
          postalCode: document.getElementById('prof-postal').value.trim(),
          country:    'Canada'
        }
      };

      try {
        const data = await putJSON('/api/auth/profile', body);
        if (data.success) {
          showAlert('prof-alert', 'Profile updated successfully.', 'success');
          // Refresh cached user name in nav
          const cached = JSON.parse(localStorage.getItem('tps_user') || '{}');
          cached.firstName = body.firstName;
          cached.lastName  = body.lastName;
          localStorage.setItem('tps_user', JSON.stringify(cached));
        } else {
          showAlert('prof-alert', data.message || 'Update failed.', 'error');
        }
      } catch {
        showAlert('prof-alert', 'Network error — please try again.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  }

  // ── Change password form ──────────────────────────────
  const pwForm = document.getElementById('password-form');
  if (pwForm) {
    const btn = pwForm.querySelector('button[type="submit"]');
    btn.dataset.label = btn.textContent;

    // Live requirements for new password
    const newPwInput = document.getElementById('pw-new');
    const rules = [
      { id: 'pw-req-length',  test: v => v.length >= 8 },
      { id: 'pw-req-upper',   test: v => /[A-Z]/.test(v) },
      { id: 'pw-req-lower',   test: v => /[a-z]/.test(v) },
      { id: 'pw-req-number',  test: v => /[0-9]/.test(v) },
      { id: 'pw-req-special', test: v => /[!@#$%^&*()\-_=+[\]{};:'",.<>/?\\|`~]/.test(v) }
    ];
    if (newPwInput) {
      newPwInput.addEventListener('input', () => {
        rules.forEach(r => {
          const el = document.getElementById(r.id);
          if (el) { el.classList.toggle('met', r.test(newPwInput.value)); el.classList.toggle('unmet', !r.test(newPwInput.value)); }
        });
      });
    }

    pwForm.addEventListener('submit', async e => {
      e.preventDefault();
      clearAlert('pw-alert');

      const current = document.getElementById('pw-current').value;
      const newPw   = document.getElementById('pw-new').value;
      const confirm = document.getElementById('pw-confirm').value;

      if (newPw !== confirm) { showAlert('pw-alert', 'New passwords do not match.', 'error'); return; }
      if (rules.some(r => !r.test(newPw))) { showAlert('pw-alert', 'New password does not meet requirements.', 'error'); return; }

      setLoading(btn, true);
      try {
        const data = await putJSON('/api/auth/password', { currentPassword: current, newPassword: newPw });
        if (data.success) {
          showAlert('pw-alert', 'Password changed successfully.', 'success');
          pwForm.reset();
          document.querySelectorAll('[id^="pw-req-"]').forEach(el => el.classList.remove('met','unmet'));
        } else {
          const msg = data.errors ? data.errors.map(e => e.message).join(' • ') : data.message;
          showAlert('pw-alert', msg, 'error');
        }
      } catch {
        showAlert('pw-alert', 'Network error.', 'error');
      } finally {
        setLoading(btn, false);
      }
    });
  }

  // ── Payment methods ───────────────────────────────────
  function renderPaymentMethods(methods) {
    const container = document.getElementById('payment-methods-list');
    if (!container) return;

    if (methods.length === 0) {
      container.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          No payment methods saved yet. Click "Add Payment Method" below to add one.
        </div>`;
      return;
    }

    container.innerHTML = methods.map(m => `
      <div class="payment-method-card ${m.isDefault ? 'default-method' : ''}">
        <div class="payment-method-info">
          <div class="card-brand-icon">${brandIcon(m.brand)}</div>
          <div class="card-details">
            <h4>${escHtml(capitalise(m.brand))} ···· ${escHtml(m.last4)}</h4>
            <p>Expires ${m.expMonth}/${m.expYear}${m.isDefault ? ' · Default' : ''}</p>
          </div>
        </div>
        <div class="card-actions">
          ${!m.isDefault ? `<button class="btn btn-outline btn-sm" onclick="setDefault('${m._id}')">Set Default</button>` : ''}
          <button class="btn btn-danger btn-sm" onclick="removeMethod('${m._id}')">Remove</button>
        </div>
      </div>`
    ).join('');
  }

  function brandIcon(brand) {
    const icons = { visa: '💳', mastercard: '💳', amex: '💳', discover: '💳' };
    return icons[brand?.toLowerCase()] || '💳';
  }
  function capitalise(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }

  // ── Add Payment Method modal ──────────────────────────
  // NOTE: In production, replace this form with Stripe Elements so that
  //       card numbers are sent directly to Stripe — never to your server.
  //       See: https://stripe.com/docs/stripe-js
  const addBtn = document.getElementById('add-payment-btn');
  const modal  = document.getElementById('payment-modal');
  const closeBtn = document.getElementById('modal-close');

  if (addBtn && modal) {
    addBtn.addEventListener('click',  () => modal.classList.add('open'));
    closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
  }

  // ── Utilities ─────────────────────────────────────────
  function showAlert(id, msg, type) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = `<div class="alert alert-${type}">${escHtml(msg)}</div>`;
  }
  function clearAlert(id) { const el = document.getElementById(id); if (el) el.innerHTML = ''; }
  function setLoading(btn, loading) { btn.disabled = loading; btn.textContent = loading ? 'Saving…' : btn.dataset.label; }
  function escHtml(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

  async function putJSON(url, body) {
    const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
    return res.json();
  }
})();
