/**
 * nav.js — Injected into every page.
 * Renders the navbar, highlights the active page, and manages auth state.
 * The JWT lives in an httpOnly cookie — JS cannot read it.
 * We store only non-sensitive user info (name, email) in localStorage for fast UI rendering,
 * then verify the session with /api/auth/me on every page load.
 */
(function () {
  const currentPath = window.location.pathname.replace(/\/$/, '') || '/';

  const navHTML = `
    <nav class="navbar">
      <div class="container">
        <a href="/" class="logo">
          <span class="logo-primary">TechPro</span>
          <span class="logo-secondary">Solutions</span>
        </a>
        <button class="nav-toggle" id="navToggle" aria-label="Toggle navigation">
          <span></span><span></span><span></span>
        </button>
        <ul class="nav-links" id="navLinks">
          <li><a href="/"        class="nav-link" data-path="/">Home</a></li>
          <li><a href="/services" class="nav-link" data-path="/services">Services</a></li>
          <li><a href="/contact"  class="nav-link" data-path="/contact">Contact Us</a></li>
          <li><a href="/about"    class="nav-link" data-path="/about">About</a></li>
          <li class="nav-auth" id="navAuth">
            <a href="/login" class="btn btn-nav">Log In</a>
          </li>
        </ul>
      </div>
    </nav>
  `;

  const footerHTML = `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <div>
            <div class="footer-logo">TechPro Solutions</div>
            <p style="margin-top:.75rem">Expert electronics sales & repair serving the Greater Montreal area. Father &amp; son engineers with over 25 years of combined experience.</p>
          </div>
          <div>
            <h4>Quick Links</h4>
            <a href="/"         class="footer-link">Home</a>
            <a href="/services" class="footer-link">Services</a>
            <a href="/about"    class="footer-link">About Us</a>
            <a href="/contact"  class="footer-link">Contact</a>
          </div>
          <div>
            <h4>Services</h4>
            <a href="/services" class="footer-link">PC Repair</a>
            <a href="/services" class="footer-link">SOHO Repair</a>
            <a href="/services" class="footer-link">Hardware Upgrades</a>
            <a href="/services" class="footer-link">Data Recovery</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="mailto:contact@techprosolutions.com" class="footer-link">contact@techprosolutions.com</a>
            <a href="https://instagram.com/techprosolutions" class="footer-link" target="_blank">Instagram</a>
            <a href="https://facebook.com/TechProSolutions" class="footer-link" target="_blank">Facebook</a>
            <p style="margin-top:.5rem;font-size:.8rem">Mon–Sat: 9 am – 6 pm</p>
          </div>
        </div>
        <div class="footer-bottom">
          <span>&copy; ${new Date().getFullYear()} TechPro Solutions. All rights reserved.</span>
          <span>Montreal, QC, Canada</span>
        </div>
      </div>
    </footer>
  `;

  // Inject navbar at top of body
  document.body.insertAdjacentHTML('afterbegin', navHTML);

  // Inject footer before closing body (if a <footer id="site-footer"> placeholder exists, replace it)
  const footerPlaceholder = document.getElementById('site-footer');
  if (footerPlaceholder) {
    footerPlaceholder.outerHTML = footerHTML;
  } else {
    document.body.insertAdjacentHTML('beforeend', footerHTML);
  }

  // Highlight active nav link
  document.querySelectorAll('.nav-link[data-path]').forEach(link => {
    if (link.dataset.path === currentPath) link.classList.add('active');
  });

  // Mobile toggle
  document.getElementById('navToggle').addEventListener('click', () => {
    document.getElementById('navLinks').classList.toggle('open');
  });

  // Close mobile nav when a link is clicked
  document.getElementById('navLinks').addEventListener('click', e => {
    if (e.target.classList.contains('nav-link')) {
      document.getElementById('navLinks').classList.remove('open');
    }
  });

  // ── Auth state ──────────────────────────────────────────
  const cached = JSON.parse(localStorage.getItem('tps_user') || 'null');
  if (cached) renderUserNav(cached);   // fast render from cache

  // Verify session with server
  fetch('/api/auth/me', { credentials: 'include' })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        const u = data.data.user;
        const info = { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email };
        localStorage.setItem('tps_user', JSON.stringify(info));
        renderUserNav(info);
      } else {
        localStorage.removeItem('tps_user');
        renderGuestNav();
      }
    })
    .catch(() => { /* server unreachable — keep cached UI */ });

  function renderUserNav(user) {
    document.getElementById('navAuth').innerHTML = `
      <div class="nav-user">
        <a href="/profile" class="nav-user-name">${escHtml(user.firstName)} ${escHtml(user.lastName)}</a>
        <button class="btn-nav-outline" onclick="window.tpsLogout()">Logout</button>
      </div>
    `;
  }

  function renderGuestNav() {
    document.getElementById('navAuth').innerHTML =
      `<a href="/login" class="btn btn-nav">Log In</a>`;
  }

  // Exposed globally so inline onclick can reach it
  window.tpsLogout = async function () {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      localStorage.removeItem('tps_user');
      window.location.href = '/';
    }
  };

  function escHtml(str) {
    return String(str).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }
})();
