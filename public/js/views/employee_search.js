// Employee Directory Search View
// Check #33 — Employee Search (SQL Injection)
//
// Authenticated directory search interface.
// Communicates with GET /api/employees/search?q=<search>

const EmployeeSearchView = {
  _currentQuery: '',
  _lastResults: [],
  _isLoading: false,

  async render(currentUser) {
    const user = currentUser || State.user;

    return `
      <div class="flex flex-col w-full pb-12 max-w-5xl mx-auto" id="employee-search-root">

        <!-- Breadcrumb & Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
              <span>Enterprise Directory</span>
              <span>/</span>
              <span class="text-on-surface-variant">Employee Search</span>
            </div>
            <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Employee Directory Search
            </h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Search enterprise directory records by name, role, department, or keyword across all global locations.
            </p>
          </div>
        </div>

        <!-- Search Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-sm mb-6">
          <form onsubmit="event.preventDefault(); EmployeeSearchView.handleSearch();" class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                search
              </span>
              <input
                type="text"
                id="employee-search-input"
                class="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm transition-colors"
                placeholder="Search employees by name or department (e.g. Sarah, Alex, Engineering)..."
                value="${this._escapeHtml(this._currentQuery)}"
              />
            </div>
            <button
              type="submit"
              id="employee-search-btn"
              class="h-11 px-6 rounded-xl bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-label-md text-label-md transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
            >
              <span class="material-symbols-outlined text-[18px]">search</span>
              <span>Search Directory</span>
            </button>
          </form>

          <!-- Quick Search Filter Chips -->
          <div class="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/20 flex-wrap">
            <span class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mr-1">Quick Filters:</span>
            ${['Sarah', 'Alex', 'Engineering', 'Security', 'Finance', 'Product'].map(tag => `
              <button
                type="button"
                onclick="EmployeeSearchView.quickSearch('${tag}')"
                class="px-3 py-1 rounded-lg bg-surface-container text-xs font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                ${tag}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Results Container -->
        <div id="employee-search-results-area">
          ${this._buildInitialOrEmptyState()}
        </div>

      </div>
    `;
  },

  async afterRender() {
    const input = document.getElementById('employee-search-input');
    if (input) {
      input.focus();
    }
    // If there was a previous search, re-run or show results
    if (this._currentQuery) {
      this.handleSearch();
    }
  },

  _buildInitialOrEmptyState() {
    return `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
        <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-[28px]">badge</span>
        </div>
        <h3 class="font-title-md text-title-md font-bold text-on-surface mb-1">Corporate Directory Lookup</h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
          Enter an employee name or department above to search the organization roster.
        </p>
      </div>
    `;
  },

  quickSearch(query) {
    const input = document.getElementById('employee-search-input');
    if (input) {
      input.value = query;
    }
    this.handleSearch();
  },

  async handleSearch() {
    const input = document.getElementById('employee-search-input');
    const query = input ? input.value.trim() : '';
    this._currentQuery = query;

    const resultsArea = document.getElementById('employee-search-results-area');
    if (!resultsArea) return;

    if (!query) {
      resultsArea.innerHTML = this._buildInitialOrEmptyState();
      return;
    }

    resultsArea.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
        <span class="material-symbols-outlined text-[32px] text-primary animate-spin mb-3">progress_activity</span>
        <p class="font-body-sm text-body-sm text-on-surface-variant">Searching employee directory records...</p>
      </div>
    `;

    try {
      const data = await State.apiFetch(`/api/employees/search?q=${encodeURIComponent(query)}`);
      this._lastResults = data.results || [];
      this._renderResults(data.results || [], query);
    } catch (err) {
      resultsArea.innerHTML = `
        <div class="rounded-2xl bg-surface-container-lowest border border-error/30 p-8 shadow-sm">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0 mt-0.5">
              <span class="material-symbols-outlined text-[22px]">error</span>
            </div>
            <div>
              <h3 class="font-title-md text-title-md font-bold text-on-surface mb-1">Search Query Error</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant mb-2">${this._escapeHtml(err.message || 'An error occurred while executing the directory search.')}</p>
            </div>
          </div>
        </div>
      `;
    }
  },

  _renderResults(employees, query) {
    const resultsArea = document.getElementById('employee-search-results-area');
    if (!resultsArea) return;

    if (!employees || employees.length === 0) {
      resultsArea.innerHTML = `
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto mb-3">
            <span class="material-symbols-outlined text-[24px]">person_off</span>
          </div>
          <h3 class="font-title-md text-title-md font-bold text-on-surface mb-1">No Employees Found</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            No matching directory records found for "${this._escapeHtml(query)}".
          </p>
        </div>
      `;
      return;
    }

    const cardsHtml = employees.map(emp => {
      const initials = (emp.name || 'EM')
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      return `
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-5 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-start justify-between gap-3 mb-3">
            <div class="flex items-center gap-3">
              <div class="w-11 h-11 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0">
                ${this._escapeHtml(initials)}
              </div>
              <div>
                <h4 class="font-title-sm text-title-sm font-bold text-on-surface leading-tight">
                  ${this._escapeHtml(emp.name || '')}
                </h4>
                <p class="font-body-xs text-xs text-on-surface-variant mt-0.5">
                  ${this._escapeHtml(emp.role || '')}
                </p>
              </div>
            </div>
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary shrink-0">
              ${this._escapeHtml(emp.department || '')}
            </span>
          </div>

          <div class="space-y-1.5 pt-3 border-t border-outline-variant/20 text-xs text-on-surface-variant">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-outline">badge</span>
              <span class="font-mono text-on-surface font-medium">${this._escapeHtml(emp.emp_id || '')}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-outline">location_on</span>
              <span>${this._escapeHtml(emp.location || '')}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-outline">mail</span>
              <a href="mailto:${this._escapeHtml(emp.email || '')}" class="text-primary hover:underline truncate">
                ${this._escapeHtml(emp.email || '')}
              </a>
            </div>
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-outline">call</span>
              <span>${this._escapeHtml(emp.phone || '')}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    resultsArea.innerHTML = `
      <div class="flex items-center justify-between mb-4">
        <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
          Found <span class="text-on-surface font-bold">${employees.length}</span> matching ${employees.length === 1 ? 'employee' : 'employees'}
        </p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${cardsHtml}
      </div>
    `;
  },

  _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.EmployeeSearchView = EmployeeSearchView;
