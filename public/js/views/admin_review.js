// Administration Review View
// Check #30 — Administration Review (Stored XSS — Privileged View)
// Admin-only view that fetches all stored announcements via the privileged
// /api/admin/announcements endpoint and renders content via innerHTML.
// Technically distinct from Check #29: the sink is an admin-exclusive code path
// that renders the same stored payload in a privileged review context.

const AdminReviewView = {
  _announcements: [],

  async render(currentUser) {
    const user = currentUser || State.user;

    // Server enforces admin-only via requireAdmin middleware, but add client-side
    // guard for UX consistency (prevents flash of content on fast redirects).
    if (!user || user.role !== 'Administrator') {
      return `
        <div class="flex flex-col items-center justify-center py-24 text-on-surface-variant">
          <span class="material-symbols-outlined text-[48px] mb-4 text-outline">lock</span>
          <h1 class="font-headline-sm text-headline-sm font-bold text-on-surface mb-2">Access Restricted</h1>
          <p class="text-sm">This area is only accessible to system administrators.</p>
        </div>`;
    }

    return `
      <div class="flex flex-col w-full pb-12 max-w-5xl mx-auto" id="admin-review-root">

        <!-- Header Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Administration</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">Content Review</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm text-error bg-error/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1 border border-error/20">
              <span class="w-1.5 h-1.5 rounded-full bg-error"></span>
              Admin Only
            </span>
          </div>
          <button
            class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30"
            onclick="AdminReviewView.fetchAndRender()"
            type="button"
          >
            <span class="material-symbols-outlined text-[18px]">refresh</span>
            <span>Refresh</span>
          </button>
        </div>

        <!-- Hero Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1 text-primary">
              <span class="material-symbols-outlined text-[20px]">admin_panel_settings</span>
              <span class="text-xs uppercase tracking-wider font-bold">Privileged Content Review</span>
            </div>
            <h1 class="font-headline-md text-headline-md font-bold text-on-surface">Announcement Review Panel</h1>
            <p class="text-xs text-on-surface-variant mt-1">Full content review of all submitted company announcements. Administrator access only.</p>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-2 bg-error/10 border border-error/20 px-3 py-1.5 rounded-xl text-xs font-medium text-error">
              <span class="material-symbols-outlined text-[14px]">shield</span>
              <span>Restricted Access</span>
            </div>
          </div>
        </div>

        <!-- Stats Row -->
        <div id="admin-review-stats" class="grid grid-cols-3 gap-4 mb-6">
          <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-4 shadow-sm text-center">
            <div class="text-2xl font-bold text-on-surface" id="stat-total">—</div>
            <div class="text-xs text-on-surface-variant mt-1">Total Announcements</div>
          </div>
          <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-4 shadow-sm text-center">
            <div class="text-2xl font-bold text-error" id="stat-high">—</div>
            <div class="text-xs text-on-surface-variant mt-1">High Priority</div>
          </div>
          <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-4 shadow-sm text-center">
            <div class="text-2xl font-bold text-secondary" id="stat-authors">—</div>
            <div class="text-xs text-on-surface-variant mt-1">Unique Authors</div>
          </div>
        </div>

        <!-- Review Table / List -->
        <div id="admin-review-list" class="space-y-4">
          <div class="flex items-center justify-center py-12 text-on-surface-variant">
            <span class="material-symbols-outlined text-[32px] animate-spin">progress_activity</span>
          </div>
        </div>

      </div>
    `;
  },

  async afterRender() {
    await this.fetchAndRender();
  },

  async fetchAndRender() {
    try {
      const data = await State.apiFetch('/api/admin/announcements');
      this._announcements = data.announcements || [];
      this._updateStats();
      this._renderList();
    } catch (err) {
      const list = document.getElementById('admin-review-list');
      if (list) list.innerHTML = `
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-8 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-[32px] mb-2 block">error_outline</span>
          <p class="text-sm">${err.message || 'Failed to load announcement review data.'}</p>
        </div>`;
    }
  },

  _updateStats() {
    const totalEl   = document.getElementById('stat-total');
    const highEl    = document.getElementById('stat-high');
    const authorsEl = document.getElementById('stat-authors');
    if (totalEl)   totalEl.textContent   = this._announcements.length;
    if (highEl)    highEl.textContent    = this._announcements.filter(a => a.priority === 'high' || a.priority === 'urgent').length;
    if (authorsEl) authorsEl.textContent = new Set(this._announcements.map(a => a.author)).size;
  },

  _renderList() {
    const list = document.getElementById('admin-review-list');
    if (!list) return;

    if (!this._announcements.length) {
      list.innerHTML = `
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-10 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-[40px] mb-3 block opacity-40">inbox</span>
          <p class="text-sm font-medium">No announcements pending review.</p>
        </div>`;
      return;
    }

    const priorityConfig = {
      high:   { badge: 'bg-error/10 text-error border-error/20', label: 'High Priority' },
      urgent: { badge: 'bg-error/20 text-error border-error/30', label: 'Urgent' },
      normal: { badge: 'bg-surface-container text-on-surface-variant border-outline-variant/20', label: 'Normal' }
    };

    // Build review card shells — content rendered below via innerHTML (XSS-30 sink)
    const cardsHtml = this._announcements.map(ann => {
      const pCfg = priorityConfig[ann.priority] || priorityConfig.normal;
      const date = ann.publishedAt
        ? new Date(ann.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        : 'Unknown';
      return `
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden" id="review-card-${ann.id}">
          <!-- Review Card Header -->
          <div class="px-5 py-3.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between gap-4">
            <div class="flex items-center gap-3 min-w-0">
              <span class="font-mono text-[11px] font-bold text-on-surface-variant shrink-0">${ann.id}</span>
              <span class="text-on-surface-variant text-[11px]">|</span>
              <span class="font-semibold text-sm text-on-surface truncate">${ann.title}</span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border ${pCfg.badge}">${pCfg.label}</span>
              <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant border border-outline-variant/20">${ann.category}</span>
            </div>
          </div>
          <!-- Content Preview — XSS-30 sink (admin privileged view) -->
          <div class="px-5 py-4">
            <div class="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2 flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">article</span>
              Content Preview
            </div>
            <div class="rounded-lg bg-surface-container-low border border-outline-variant/20 p-4 text-sm text-on-surface-variant leading-relaxed review-content"></div>
          </div>
          <!-- Meta Footer -->
          <div class="px-5 pb-4 flex items-center justify-between text-[11px] text-on-surface-variant">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">person</span>
                <span>Author: <span class="font-semibold text-on-surface">${ann.author}</span></span>
              </div>
              <div class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">badge</span>
                <span>Author ID: <span class="font-mono">${ann.authorId !== undefined ? ann.authorId : 'N/A'}</span></span>
              </div>
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">schedule</span>
              <span>${date}</span>
            </div>
          </div>
        </div>`;
    }).join('');

    list.innerHTML = cardsHtml;

    // XSS-30 sink: stored announcement content injected into admin review panel via innerHTML.
    // Distinct from Check #29: this code path is admin-exclusive (requireAdmin middleware),
    // meaning the payload executes only for administrators reviewing the content.
    this._announcements.forEach(ann => {
      const card = document.getElementById(`review-card-${ann.id}`);
      if (!card) return;
      const contentDiv = card.querySelector('.review-content');
      if (contentDiv) contentDiv.innerHTML = ann.content;
    });
  }
};

window.AdminReviewView = AdminReviewView;
