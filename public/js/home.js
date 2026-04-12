/**
 * home.js — Product listing for index.html
 * Fetches products from /api/products with category/condition/search/sort/page filters.
 */
(function () {
  const grid        = document.getElementById('products-grid');
  const resultsMeta = document.getElementById('results-meta');
  const pagination  = document.getElementById('pagination');
  const searchInput = document.getElementById('search-input');
  const catSelect   = document.getElementById('cat-select');
  const condSelect  = document.getElementById('cond-select');
  const sortSelect  = document.getElementById('sort-select');

  let state = { page: 1, search: '', category: 'All', condition: 'All', sort: 'featured' };

  const categoryIcons = {
    Laptop:    '💻', Desktop:   '🖥️', TV:        '📺',
    Tablet:    '📱', Phone:     '📱', Accessory: '🔌', Other:     '🔧'
  };

  // ── Fetch & render ────────────────────────────────────
  async function loadProducts() {
    grid.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
    pagination.innerHTML = '';
    if (resultsMeta) resultsMeta.textContent = '';

    const params = new URLSearchParams({
      page:      state.page,
      limit:     12,
      sort:      state.sort,
      category:  state.category,
      condition: state.condition,
      search:    state.search
    });

    try {
      const res  = await fetch(`/api/products?${params}`);
      const data = await res.json();

      if (!data.success) { grid.innerHTML = '<p class="text-muted" style="padding:2rem">Failed to load products.</p>'; return; }

      const { products, pagination: pages } = data.data;

      if (resultsMeta) resultsMeta.textContent = `${pages.total} product${pages.total !== 1 ? 's' : ''} found`;

      if (products.length === 0) {
        grid.innerHTML = `
          <div style="grid-column:1/-1;text-align:center;padding:4rem 1rem">
            <div style="font-size:3rem;margin-bottom:1rem">🔍</div>
            <h3 class="text-blue">No products found</h3>
            <p class="text-muted">Try adjusting your search or filters.</p>
          </div>`;
        return;
      }

      grid.innerHTML = products.map(renderCard).join('');
      renderPagination(pages.page, pages.pages);
    } catch {
      grid.innerHTML = '<p class="text-muted" style="padding:2rem">Could not reach the server. Is it running?</p>';
    }
  }

  function renderCard(p) {
    const icon  = categoryIcons[p.category] || '📦';
    const badge = conditionBadge(p.condition);
    const price = `$${Number(p.price).toFixed(2)}`;
    const amz   = p.amazonUrl ? `<a href="${esc(p.amazonUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-amazon"><i class="fab fa-amazon"></i> Amazon</a>` : '';
    const ebay  = p.ebayUrl   ? `<a href="${esc(p.ebayUrl)}"   target="_blank" rel="noopener noreferrer" class="btn btn-ebay">eBay</a>` : '';
    const feat  = p.featured  ? '<span class="badge badge-featured">Featured</span>' : '';

    return `
      <article class="product-card">
        <div class="product-img" aria-hidden="true">${icon}</div>
        <div class="product-body">
          <div class="product-badges">${badge}${feat}</div>
          <p class="product-name">${escHtml(p.name)}</p>
          <p class="product-brand">${escHtml(p.brand || p.category)}</p>
          <p class="product-price">${price}</p>
          <div class="product-actions">${amz}${ebay}</div>
        </div>
      </article>`;
  }

  function conditionBadge(c) {
    const map = { New: 'badge-new', Refurbished: 'badge-refurbished', Used: 'badge-used' };
    return `<span class="badge ${map[c] || 'badge-used'}">${escHtml(c)}</span>`;
  }

  function renderPagination(current, total) {
    if (total <= 1) return;
    let html = '';
    const prev = current > 1;
    const next = current < total;

    html += `<button class="page-btn" ${!prev ? 'disabled' : ''} onclick="goPage(${current - 1})">&#8249;</button>`;
    for (let i = 1; i <= total; i++) {
      html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
    }
    html += `<button class="page-btn" ${!next ? 'disabled' : ''} onclick="goPage(${current + 1})">&#8250;</button>`;
    pagination.innerHTML = html;
  }

  window.goPage = function (p) { state.page = p; loadProducts(); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // ── Filter / search events ────────────────────────────
  let debounceTimer;
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => { state.search = searchInput.value.trim(); state.page = 1; loadProducts(); }, 400);
    });
  }
  if (catSelect)  catSelect.addEventListener('change',  () => { state.category  = catSelect.value;  state.page = 1; loadProducts(); });
  if (condSelect) condSelect.addEventListener('change', () => { state.condition = condSelect.value; state.page = 1; loadProducts(); });
  if (sortSelect) sortSelect.addEventListener('change', () => { state.sort      = sortSelect.value; state.page = 1; loadProducts(); });

  // ── Escape helpers ────────────────────────────────────
  function escHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
    );
  }
  function esc(s) { return encodeURI(String(s)); }

  // Initial load
  loadProducts();
})();
