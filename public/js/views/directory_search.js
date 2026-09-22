// =============================================================================
// Directory Search View — Check #37: LDAP Injection
// =============================================================================
// Presents a realistic corporate directory lookup UI backed by a synthetic
// LDAP-style search API.  The vulnerability lives entirely on the server side
// and is not hinted at anywhere in the UI.
// =============================================================================

const DirectorySearchView = {
  render(user) {
    return `
      <div class="max-w-5xl mx-auto space-y-6">

        <!-- Page header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="font-headline-sm text-headline-sm font-bold text-on-surface">Corporate Directory</h1>
            <p class="text-sm text-on-surface-variant mt-1">Search for employees, departments, and organisational contacts.</p>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px] text-secondary">verified_user</span>
            <span>Acme Corp Active Directory</span>
          </div>
        </div>

        <!-- Search form -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6">
          <div class="flex flex-col sm:flex-row gap-3">
            <div class="flex-1 relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[20px] text-on-surface-variant pointer-events-none">person_search</span>
              <input
                id="dir-search-query"
                type="text"
                placeholder="Search by name, e.g. Alex"
                class="w-full h-10 pl-10 pr-4 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <select
              id="dir-dept-filter"
              class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary min-w-[160px]"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Security">Security</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="People Ops">People Ops</option>
              <option value="Legal">Legal</option>
              <option value="IT">IT</option>
            </select>
            <button
              id="dir-search-btn"
              onclick="DirectorySearchView.runSearch()"
              class="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap"
            >
              <span class="material-symbols-outlined text-[18px]">search</span>
              Search
            </button>
          </div>

          <!-- Advanced filter hint -->
          <p class="mt-3 text-xs text-on-surface-variant/70">
            Tip: use wildcards for broader results. Supports partial name matching across the full directory.
          </p>
        </div>

        <!-- Results area -->
        <div id="dir-results-area">
          <!-- Initial hint state -->
          <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 flex flex-col items-center gap-3 text-center">
            <div class="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[32px] text-on-surface-variant">corporate_fare</span>
            </div>
            <p class="text-sm font-semibold text-on-surface">Enter a name to search the directory</p>
            <p class="text-xs text-on-surface-variant max-w-xs">Results will show employee name, department, title, office location, and contact details.</p>
          </div>
        </div>

      </div>
    `;
  },

  afterRender() {
    const input = document.getElementById('dir-search-query');
    if (input) {
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') DirectorySearchView.runSearch();
      });
      // Auto-focus
      setTimeout(() => input.focus(), 50);
    }
  },

  async runSearch() {
    const queryEl = document.getElementById('dir-search-query');
    const deptEl  = document.getElementById('dir-dept-filter');
    const areaEl  = document.getElementById('dir-results-area');
    const btn     = document.getElementById('dir-search-btn');

    if (!queryEl || !areaEl) return;

    const q    = queryEl.value;
    const dept = deptEl  ? deptEl.value : 'all';

    // Show loading state
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Searching…'; }
    areaEl.innerHTML = `
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 flex flex-col items-center gap-3">
        <span class="material-symbols-outlined text-[36px] text-primary animate-spin">progress_activity</span>
        <p class="text-sm text-on-surface-variant">Querying Active Directory…</p>
      </div>
    `;

    try {
      const params = new URLSearchParams({ q });
      if (dept && dept !== 'all') params.set('dept', dept);

      const data = await State.apiFetch(`/api/directory/search?${params}`);
      DirectorySearchView.renderResults(data);
    } catch (err) {
      areaEl.innerHTML = `
        <div class="rounded-2xl border border-error/30 bg-error-container/20 p-6 text-sm text-on-surface">
          <span class="font-semibold">Directory query failed:</span> ${err.message || 'Unexpected server error.'}
        </div>
      `;
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">search</span> Search'; }
    }
  },

  renderResults(data) {
    const areaEl = document.getElementById('dir-results-area');
    if (!areaEl) return;

    const results = data.results || [];

    if (results.length === 0) {
      areaEl.innerHTML = `
        <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 flex flex-col items-center gap-3 text-center">
          <span class="material-symbols-outlined text-[36px] text-on-surface-variant">person_off</span>
          <p class="text-sm font-semibold text-on-surface">No directory entries found</p>
          <p class="text-xs text-on-surface-variant">Try a different name or expand your department filter.</p>
        </div>
      `;
      return;
    }

    const statusBadge = s => {
      if (s === 'active')   return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-container/30 text-secondary">Active</span>`;
      if (s === 'service')  return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-container text-on-surface-variant">Service</span>`;
      if (s === 'disabled') return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-error-container/40 text-error">Disabled</span>`;
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-tertiary-container/30 text-tertiary">${s}</span>`;
    };

    const rows = results.map(r => `
      <tr class="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[16px] text-primary">person</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-on-surface">${escapeHtml(r.cn)}</p>
              <p class="text-xs text-on-surface-variant font-mono">${escapeHtml(r.uid)}</p>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-on-surface-variant">${escapeHtml(r.dept)}</td>
        <td class="px-4 py-3 text-sm text-on-surface-variant">${escapeHtml(r.title)}</td>
        <td class="px-4 py-3 text-sm text-on-surface-variant">${escapeHtml(r.office)}</td>
        <td class="px-4 py-3 text-sm">
          <a href="mailto:${escapeHtml(r.mail)}" class="text-primary hover:underline text-xs font-mono">${escapeHtml(r.mail)}</a>
        </td>
        <td class="px-4 py-3">${statusBadge(r.status)}</td>
      </tr>
    `).join('');

    areaEl.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-primary">group</span>
            <span class="text-sm font-semibold text-on-surface">${results.length} result${results.length !== 1 ? 's' : ''}</span>
          </div>
          <span class="text-xs text-on-surface-variant">Acme Corp Active Directory · ou=users,dc=accesshub,dc=internal</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-surface-container/50 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                <th class="px-4 py-3">Name / UID</th>
                <th class="px-4 py-3">Department</th>
                <th class="px-4 py-3">Title</th>
                <th class="px-4 py-3">Office</th>
                <th class="px-4 py-3">Email</th>
                <th class="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.DirectorySearchView = DirectorySearchView;
