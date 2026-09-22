// =============================================================================
// User Filter View — Check #38: NoSQL Injection
// =============================================================================
// Presents a realistic employee roster filtering UI backed by a synthetic
// document-store API.  The vulnerability is entirely server-side; the UI
// gives no indication of the underlying query mechanism.
// =============================================================================

const UserFilterView = {
  render(user) {
    return `
      <div class="max-w-5xl mx-auto space-y-6">

        <!-- Page header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="font-headline-sm text-headline-sm font-bold text-on-surface">Employee Roster</h1>
            <p class="text-sm text-on-surface-variant mt-1">Browse and filter the company employee roster by department and employment status.</p>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px] text-secondary">storage</span>
            <span>Workforce Management System</span>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider">Department</label>
              <select
                id="uf-dept"
                class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
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
            </div>
            <div>
              <label class="block text-xs font-semibold text-on-surface-variant uppercase mb-1.5 tracking-wider">Status</label>
              <select
                id="uf-status"
                class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="service">Service Accounts</option>
                <option value="all">All Statuses</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                id="uf-filter-btn"
                onclick="UserFilterView.applyFilter()"
                class="w-full h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span class="material-symbols-outlined text-[18px]">filter_list</span>
                Apply Filters
              </button>
            </div>
          </div>
          <p class="mt-3 text-xs text-on-surface-variant/70">Filters apply instantly across the Workforce Management System employee database.</p>
        </div>

        <!-- Results area -->
        <div id="uf-results-area">
          <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 flex flex-col items-center gap-3 text-center">
            <div class="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[32px] text-on-surface-variant">people</span>
            </div>
            <p class="text-sm font-semibold text-on-surface">Select filters and apply to view the roster</p>
            <p class="text-xs text-on-surface-variant max-w-xs">Results include name, department, role, clearance level, and employment status.</p>
          </div>
        </div>

      </div>
    `;
  },

  afterRender() {
    // Auto-load default filter on entry
    UserFilterView.applyFilter();
  },

  async applyFilter() {
    const deptEl   = document.getElementById('uf-dept');
    const statusEl = document.getElementById('uf-status');
    const areaEl   = document.getElementById('uf-results-area');
    const btn      = document.getElementById('uf-filter-btn');

    if (!areaEl) return;

    const dept   = deptEl   ? deptEl.value   : 'all';
    const status = statusEl ? statusEl.value : 'active';

    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Filtering…'; }
    areaEl.innerHTML = `
      <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 flex flex-col items-center gap-3">
        <span class="material-symbols-outlined text-[36px] text-primary animate-spin">progress_activity</span>
        <p class="text-sm text-on-surface-variant">Retrieving employee records…</p>
      </div>
    `;

    try {
      const data = await State.apiFetch('/api/users/filter', {
        method: 'POST',
        body: JSON.stringify({ department: dept === 'all' ? null : dept, status: status === 'all' ? null : status })
      });
      UserFilterView.renderResults(data);
    } catch (err) {
      areaEl.innerHTML = `
        <div class="rounded-2xl border border-error/30 bg-error-container/20 p-6 text-sm text-on-surface">
          <span class="font-semibold">Filter error:</span> ${err.message || 'Unexpected error retrieving employee data.'}
        </div>
      `;
    } finally {
      if (btn) { btn.disabled = false; btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">filter_list</span> Apply Filters'; }
    }
  },

  renderResults(data) {
    const areaEl = document.getElementById('uf-results-area');
    if (!areaEl) return;

    const results = data.results || [];

    if (results.length === 0) {
      areaEl.innerHTML = `
        <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 flex flex-col items-center gap-3 text-center">
          <span class="material-symbols-outlined text-[36px] text-on-surface-variant">person_off</span>
          <p class="text-sm font-semibold text-on-surface">No employees matched the selected filters</p>
          <p class="text-xs text-on-surface-variant">Try adjusting the department or status filter.</p>
        </div>
      `;
      return;
    }

    const clearanceBadge = c => {
      const map = {
        standard:   'bg-surface-container text-on-surface-variant',
        elevated:   'bg-secondary-container/30 text-secondary',
        privileged: 'bg-primary-container/20 text-primary',
        none:       'bg-surface-container/50 text-on-surface-variant/60'
      };
      const cls = map[c] || map.standard;
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${cls} capitalize">${c}</span>`;
    };

    const statusBadge = s => {
      const map = {
        active:         'bg-secondary-container/30 text-secondary',
        on_leave:       'bg-tertiary-container/30 text-tertiary',
        service:        'bg-surface-container text-on-surface-variant',
        admin_reserved: 'bg-primary-container/20 text-primary'
      };
      const cls = map[s] || 'bg-surface-container text-on-surface-variant';
      const label = s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${cls}">${label}</span>`;
    };

    const rows = results.map(r => `
      <tr class="border-b border-outline-variant/20 hover:bg-surface-container-low/50 transition-colors">
        <td class="px-4 py-3">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[16px] text-primary">account_circle</span>
            </div>
            <div>
              <p class="text-sm font-semibold text-on-surface">${escapeHtmlUF(r.name)}</p>
              <p class="text-xs text-on-surface-variant font-mono">${escapeHtmlUF(r._id)}</p>
            </div>
          </div>
        </td>
        <td class="px-4 py-3 text-sm text-on-surface-variant">${escapeHtmlUF(r.department)}</td>
        <td class="px-4 py-3 text-sm text-on-surface-variant">${escapeHtmlUF(r.role)}</td>
        <td class="px-4 py-3">${clearanceBadge(r.clearance)}</td>
        <td class="px-4 py-3 text-sm text-on-surface-variant">${r.hiredYear}</td>
        <td class="px-4 py-3">${statusBadge(r.status)}</td>
      </tr>
    `).join('');

    areaEl.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-[18px] text-primary">badge</span>
            <span class="text-sm font-semibold text-on-surface">${results.length} employee record${results.length !== 1 ? 's' : ''}</span>
          </div>
          <span class="text-xs text-on-surface-variant">Workforce Management System · v2.4.1</span>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-left">
            <thead>
              <tr class="bg-surface-container/50 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                <th class="px-4 py-3">Employee</th>
                <th class="px-4 py-3">Department</th>
                <th class="px-4 py-3">Role</th>
                <th class="px-4 py-3">Clearance</th>
                <th class="px-4 py-3">Hired</th>
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

function escapeHtmlUF(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.UserFilterView = UserFilterView;
