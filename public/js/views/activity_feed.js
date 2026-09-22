// Activity Feed View Component
// Check #28 — Activity Feed (JSON/API → DOM XSS)
// Consumes authenticated JSON API endpoint (/api/activity) and dynamically
// parses and renders activity notifications into the DOM.

const ActivityFeedView = {
  _activities: [],
  _activeFilter: 'all',

  async render(currentUser) {
    const user = currentUser || State.user;

    return `
      <div class="flex flex-col w-full pb-12 max-w-5xl mx-auto" id="activity-feed-root">
        <!-- Header / Breadcrumb Context Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Enterprise Operations</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">Activity Feed</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Live Audit Stream
            </span>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30"
              onclick="ActivityFeedView.fetchAndRender()"
              type="button"
            >
              <span class="material-symbols-outlined text-[18px]">refresh</span>
              <span>Refresh Feed</span>
            </button>
            <button
              class="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-sm shadow-primary/20"
              onclick="ActivityFeedView.openPostModal()"
              type="button"
              id="log-activity-btn"
            >
              <span class="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Log Activity Note</span>
            </button>
          </div>
        </div>

        <!-- Hero Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1 text-primary">
              <span class="material-symbols-outlined text-[20px]">history_edu</span>
              <span class="text-xs uppercase tracking-wider font-bold">Corporate Event Stream</span>
            </div>
            <h1 class="font-headline-md text-headline-md font-bold text-on-surface">Recent Activity &amp; Audit Log</h1>
            <p class="text-xs text-on-surface-variant mt-1">Cross-department updates, procurement submissions, and security attestation events.</p>
          </div>
          <div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/20 text-xs font-medium text-on-surface-variant">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>REST API Synced (/api/activity)</span>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="flex items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-2">
            ${['all', 'order', 'security', 'policy', 'general'].map(f => `
              <button
                class="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  this._activeFilter === f
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }"
                onclick="ActivityFeedView.setFilter('${f}')"
              >
                ${f}
              </button>
            `).join('')}
          </div>
          <span class="text-xs text-on-surface-variant" id="activity-count-text">Loading events...</span>
        </div>

        <!-- Activity Stream Container (DOM Sink Target) -->
        <div class="space-y-3" id="activity-feed-container">
          <div class="flex items-center justify-center h-48 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-on-surface-variant">
            <span class="material-symbols-outlined text-3xl animate-spin text-primary">progress_activity</span>
          </div>
        </div>

        <!-- Log Activity Modal -->
        <div id="activity-post-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop bg-on-surface/40 backdrop-blur-sm">
          <div class="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-150">
            <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-primary text-[22px]">add_task</span>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">Log Activity Note</h3>
              </div>
              <button onclick="ActivityFeedView.closePostModal()" class="text-on-surface-variant hover:text-on-surface p-1 rounded">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <form id="activity-post-form" onsubmit="ActivityFeedView.submitActivity(event)" class="p-6 space-y-4">
              <div class="space-y-1">
                <label class="font-label-md text-label-md text-on-surface font-semibold" for="act-message">Activity Message / Description</label>
                <textarea id="act-message" rows="3" required placeholder="e.g. Completed infrastructure migration review for VPC cluster..." class="w-full px-3 py-2 rounded-lg border border-outline-variant/50 font-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"></textarea>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="act-type">Event Type</label>
                  <select id="act-type" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary">
                    <option value="general">General Update</option>
                    <option value="security">Security & Access</option>
                    <option value="order">Order & Procurement</option>
                    <option value="policy">Policy Compliance</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="act-meta">Department / Tag</label>
                  <input id="act-meta" placeholder="e.g. Platform Infrastructure" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-on-surface focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div class="pt-3 border-t border-outline-variant/20 flex items-center justify-end gap-2">
                <button type="button" onclick="ActivityFeedView.closePostModal()" class="h-9 px-4 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors">
                  Cancel
                </button>
                <button type="submit" class="h-9 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm">
                  Publish Update
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  // Lifecycle: after template mounting, fetch JSON from API and construct DOM
  async fetchAndRender() {
    const container = document.getElementById('activity-feed-container');
    const countEl = document.getElementById('activity-count-text');
    if (!container) return;

    try {
      // 1. Source: Authenticated JSON API endpoint
      const res = await State.apiFetch('/api/activity');
      this._activities = res.activities || [];

      const filtered = this._activeFilter === 'all'
        ? this._activities
        : this._activities.filter(a => a.type === this._activeFilter);

      if (countEl) countEl.textContent = `${filtered.length} activities logged`;

      if (filtered.length === 0) {
        container.innerHTML = `
          <div class="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-on-surface-variant">
            <span class="material-symbols-outlined text-3xl mb-2 text-outline">history_toggle_off</span>
            <p class="font-semibold text-sm text-on-surface">No activities match the current filter</p>
          </div>
        `;
        return;
      }

      // 2. Processing: Build HTML markup dynamically interpolating JSON properties
      const htmlCards = filtered.map(act => {
        const iconName = act.icon || (act.type === 'order' ? 'shopping_cart' : (act.type === 'security' ? 'verified_user' : 'notifications'));
        const iconColor = act.iconColor || (act.type === 'security' ? 'text-secondary' : 'text-primary');
        const iconBg = act.iconBg || (act.type === 'security' ? 'bg-secondary/15' : 'bg-surface-container');

        // Unsafe interpolation of API JSON fields (actor & message) directly into template string
        return `
          <div class="activity-card p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm hover:border-primary/40 transition-all flex items-start gap-4" id="act-item-${act.id}">
            <div class="w-10 h-10 rounded-xl ${iconBg} ${iconColor} flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <span class="material-symbols-outlined text-[20px]">${iconName}</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-semibold text-sm text-on-surface">${act.actor}</span>
                <span class="text-xs text-on-surface-variant font-medium">${act.timestamp || 'Recent'}</span>
              </div>
              <!-- Unsafe DOM Sink: activity.message rendered into innerHTML -->
              <div class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                ${act.message}
              </div>
              <div class="mt-2 flex items-center gap-2">
                <span class="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">${act.meta || act.type || 'Audit'}</span>
                <span class="font-mono text-[10px] text-outline-variant">${act.id}</span>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // 3. Sink: Write constructed HTML to container innerHTML
      container.innerHTML = htmlCards;
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-error">
          <span class="material-symbols-outlined text-3xl mb-2">error</span>
          <p class="font-semibold text-sm">Failed to retrieve activity stream</p>
          <p class="text-xs mt-1 text-on-surface-variant">${err.message}</p>
        </div>
      `;
    }
  },

  setFilter(filter) {
    this._activeFilter = filter;
    this.fetchAndRender();
  },

  openPostModal() {
    const modal = document.getElementById('activity-post-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closePostModal() {
    const modal = document.getElementById('activity-post-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitActivity(event) {
    event.preventDefault();
    const message = document.getElementById('act-message').value;
    const type = document.getElementById('act-type').value;
    const meta = document.getElementById('act-meta').value;

    try {
      await State.apiFetch('/api/activity', {
        method: 'POST',
        body: JSON.stringify({ message, type, meta })
      });

      this.closePostModal();
      State.showToast('Activity logged to corporate feed', 'check_circle');
      this.fetchAndRender();
    } catch (err) {
      State.showToast(err.message || 'Failed to log activity', 'error');
    }
  }
};

window.ActivityFeedView = ActivityFeedView;
