/**
 * Narayani Sarees - Shop & Catalog Engine
 */
let currentFilters = {
  category: '',
  fabric: '',
  color: '',
  occasion: '',
  minPrice: '',
  maxPrice: '',
  sort: 'newest',
  search: '',
  inStockOnly: false,
  page: 1,
  limit: 12
};

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('category')) currentFilters.category = urlParams.get('category');
  if (urlParams.get('fabric')) currentFilters.fabric = urlParams.get('fabric');
  if (urlParams.get('color')) currentFilters.color = urlParams.get('color');
  if (urlParams.get('occasion')) currentFilters.occasion = urlParams.get('occasion');
  if (urlParams.get('search')) currentFilters.search = urlParams.get('search');
  if (urlParams.get('sort')) currentFilters.sort = urlParams.get('sort');

  loadFilterOptions();
  fetchProducts();

  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) {
    searchInput.value = currentFilters.search;
    searchInput.addEventListener('input', debounce((e) => {
      currentFilters.search = e.target.value;
      currentFilters.page = 1;
      fetchProducts();
    }, 400));
  }

  const sortSelect = document.getElementById('shop-sort-select');
  if (sortSelect) {
    sortSelect.value = currentFilters.sort;
    sortSelect.addEventListener('change', (e) => {
      currentFilters.sort = e.target.value;
      fetchProducts();
    });
  }
});

async function loadFilterOptions() {
  const res = await apiCall('/products/filters');
  if (res.success) {
    renderCategoryFilters(res.categories || []);
    renderFabricFilters(res.fabrics || []);
    renderColorFilters(res.colors || []);
    renderOccasionFilters(res.occasions || []);
  }
}

function renderCategoryFilters(categories) {
  const container = document.getElementById('category-filters-list');
  if (!container) return;

  container.innerHTML = categories.map(c => `
    <label class="filter-item">
      <input type="radio" name="categoryFilter" value="${c.slug}" ${currentFilters.category === c.slug ? 'checked' : ''} onchange="applyFilter('category', '${c.slug}')">
      <span>${c.name}</span>
    </label>
  `).join('');
}

function renderFabricFilters(fabrics) {
  const container = document.getElementById('fabric-filters-list');
  if (!container) return;

  container.innerHTML = fabrics.map(f => `
    <label class="filter-item">
      <input type="radio" name="fabricFilter" value="${f}" ${currentFilters.fabric === f ? 'checked' : ''} onchange="applyFilter('fabric', '${f}')">
      <span>${f}</span>
    </label>
  `).join('');
}

function renderColorFilters(colors) {
  const container = document.getElementById('color-filters-list');
  if (!container) return;

  container.innerHTML = colors.map(c => `
    <label class="filter-item">
      <input type="radio" name="colorFilter" value="${c}" ${currentFilters.color === c ? 'checked' : ''} onchange="applyFilter('color', '${c}')">
      <span>${c}</span>
    </label>
  `).join('');
}

function renderOccasionFilters(occasions) {
  const container = document.getElementById('occasion-filters-list');
  if (!container) return;

  container.innerHTML = occasions.map(o => `
    <label class="filter-item">
      <input type="radio" name="occasionFilter" value="${o}" ${currentFilters.occasion === o ? 'checked' : ''} onchange="applyFilter('occasion', '${o}')">
      <span>${o}</span>
    </label>
  `).join('');
}

function applyFilter(key, value) {
  currentFilters[key] = value;
  currentFilters.page = 1;
  fetchProducts();
}

function clearAllFilters() {
  currentFilters = {
    category: '',
    fabric: '',
    color: '',
    occasion: '',
    minPrice: '',
    maxPrice: '',
    sort: 'newest',
    search: '',
    inStockOnly: false,
    page: 1,
    limit: 12
  };
  const searchInput = document.getElementById('shop-search-input');
  if (searchInput) searchInput.value = '';
  document.querySelectorAll('input[type="radio"]').forEach(r => r.checked = false);
  fetchProducts();
}

async function fetchProducts() {
  const grid = document.getElementById('shop-products-grid');
  const countEl = document.getElementById('results-count-text');
  if (!grid) return;

  grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:60px;"><i class="fas fa-spinner fa-spin fa-2x" style="color:#7B1E3A;"></i><p style="margin-top:12px;">Loading exquisite drapes...</p></div>';

  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(currentFilters)) {
    if (v) params.set(k, v);
  }

  const res = await apiCall('/products?' + params.toString());
  if (res.success && res.products) {
    if (countEl) countEl.textContent = `Showing ${res.products.length} of ${res.total} Sarees`;
    if (res.products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <i class="fas fa-search"></i>
          <h3>No Sarees Found</h3>
          <p>We couldn't find any sarees matching your selected filters.</p>
          <button class="btn btn-outline" onclick="clearAllFilters()">Clear All Filters</button>
        </div>
      `;
      const pag = document.getElementById('pagination-container');
      if (pag) pag.innerHTML = '';
      return;
    }

    renderProductGrid(grid, res.products);
    renderPagination(res.page, res.pages);
  }
}

function renderPagination(currentPage, totalPages) {
  const container = document.getElementById('pagination-container');
  if (!container || totalPages <= 1) {
    if (container) container.innerHTML = '';
    return;
  }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
  }
  container.innerHTML = html;
}

function goToPage(page) {
  currentFilters.page = page;
  fetchProducts();
  window.scrollTo({ top: 250, behavior: 'smooth' });
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
