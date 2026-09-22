// Company Announcements View
// Check #29 — Company Announcements (Stored XSS — Shared Announcement)
// Stored XSS: announcement content is posted to /api/announcements and
// stored without server-side sanitisation. On load, items are fetched and
// rendered via innerHTML — executing any embedded script payload for every
// employee who views the page.

const AnnouncementsView = {
  _announcements: [],

  async render(currentUser) {
    const user = currentUser || State.user;
    return `
      <div class="flex flex-col w-full pb-12 max-w-5xl mx-auto" id="announcements-root">

        <!-- Header Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Internal Communications</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">Company Announcements</span>
          </div>
          <button
            class="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-sm shadow-primary/20"
            onclick="AnnouncementsView.openPostModal()"
            type="button"
            id="post-announcement-btn"
          >
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Post Announcement</span>
          </button>
        </div>

        <!-- Hero Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-sm mb-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1 text-primary">
              <span class="material-symbols-outlined text-[20px]">campaign</span>
              <span class="text-xs uppercase tracking-wider font-bold">All-Staff Broadcast</span>
            </div>
            <h1 class="font-headline-md text-headline-md font-bold text-on-surface">Company Announcements</h1>
            <p class="text-xs text-on-surface-variant mt-1">Official internal communications, policy updates, and company-wide notices.</p>
          </div>
          <div class="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-xl border border-outline-variant/20 text-xs font-medium text-on-surface-variant">
            <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Live Feed</span>
          </div>
        </div>

        <!-- Announcements List -->
        <div id="announcements-list" class="space-y-4">
          <div class="flex items-center justify-center py-12 text-on-surface-variant">
            <span class="material-symbols-outlined text-[32px] animate-spin">progress_activity</span>
          </div>
        </div>

        <!-- Post Announcement Modal -->
        <div id="post-announcement-modal"
          class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm hidden"
          onclick="AnnouncementsView.handleModalBackdropClick(event)"
        >
          <div class="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 w-full max-w-2xl mx-4 flex flex-col" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-[22px]">campaign</span>
                <h2 class="font-title-lg text-title-lg font-bold text-on-surface">Post Company Announcement</h2>
              </div>
              <button type="button" onclick="AnnouncementsView.closePostModal()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div class="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5" for="ann-title">Title</label>
                <input id="ann-title" type="text" placeholder="e.g. Q4 All-Hands — October 28"
                  class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5" for="ann-category">Category</label>
                  <select id="ann-category" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm">
                    <option value="Company">Company</option>
                    <option value="People Ops">People Ops</option>
                    <option value="Security">Security</option>
                    <option value="Finance">Finance</option>
                    <option value="IT">IT</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5" for="ann-priority">Priority</label>
                  <select id="ann-priority" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm">
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5" for="ann-content">Content</label>
                <textarea id="ann-content" rows="6" placeholder="Write the announcement body here. Supports basic HTML formatting."
                  class="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm resize-none"></textarea>
                <p class="text-[11px] text-on-surface-variant mt-1">Supports HTML formatting for rich text rendering.</p>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-end gap-3">
              <button type="button" onclick="AnnouncementsView.closePostModal()"
                class="h-9 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-label-md text-label-md transition-colors">Cancel</button>
              <button type="button" id="ann-submit-btn" onclick="AnnouncementsView.submitAnnouncement()"
                class="h-9 px-5 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-label-md text-label-md transition-all shadow-sm">Publish</button>
            </div>
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
      const data = await State.apiFetch('/api/announcements');
      this._announcements = data.announcements || [];
      this._renderList();
    } catch (err) {
      const list = document.getElementById('announcements-list');
      if (list) list.innerHTML = `
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-8 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-[32px] mb-2 block">error_outline</span>
          <p class="text-sm">Failed to load announcements. Please try again.</p>
        </div>`;
    }
  },

  _renderList() {
    const list = document.getElementById('announcements-list');
    if (!list) return;

    if (!this._announcements.length) {
      list.innerHTML = `
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-10 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-[40px] mb-3 block opacity-40">campaign</span>
          <p class="text-sm font-medium">No announcements yet.</p>
          <p class="text-xs mt-1">Check back later or post an update for your team.</p>
        </div>`;
      return;
    }

    const priorityConfig = {
      high:   { badge: 'bg-error/10 text-error border-error/20', label: 'High Priority', icon: 'priority_high' },
      urgent: { badge: 'bg-error/20 text-error border-error/30', label: 'Urgent', icon: 'warning' },
      normal: { badge: 'bg-surface-container text-on-surface-variant border-outline-variant/20', label: 'Informational', icon: 'info' }
    };

    // Build article shells — content injected below via innerHTML (XSS-29 sink)
    const cardsHtml = this._announcements.map(ann => {
      const pCfg = priorityConfig[ann.priority] || priorityConfig.normal;
      const date = ann.publishedAt
        ? new Date(ann.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      return `
        <article class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-5 shadow-sm hover:shadow-md transition-all duration-200" id="ann-card-${ann.id}">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap mb-1">
                <span class="px-2 py-0.5 rounded-full text-[11px] font-bold border ${pCfg.badge} flex items-center gap-1">
                  <span class="material-symbols-outlined text-[12px]">${pCfg.icon}</span>${pCfg.label}
                </span>
                <span class="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-container text-on-surface-variant border border-outline-variant/20">${ann.category}</span>
              </div>
              <h2 class="font-title-md text-title-md font-bold text-on-surface">${ann.title}</h2>
            </div>
          </div>
          <div class="prose prose-sm max-w-none text-sm text-on-surface-variant leading-relaxed announcement-body"></div>
          <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-[11px] text-on-surface-variant">
            <div class="flex items-center gap-1.5">
              <span class="material-symbols-outlined text-[13px]">person</span>
              <span>${ann.author}</span>
            </div>
            <span>${date}</span>
          </div>
        </article>`;
    }).join('');

    list.innerHTML = cardsHtml;

    // XSS-29 sink: stored announcement content injected as innerHTML
    // Any script payload stored in ann.content executes here for all viewers
    this._announcements.forEach(ann => {
      const card = document.getElementById(`ann-card-${ann.id}`);
      if (!card) return;
      const body = card.querySelector('.announcement-body');
      if (body) body.innerHTML = ann.content;
    });
  },

  openPostModal() {
    const modal = document.getElementById('post-announcement-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closePostModal() {
    const modal = document.getElementById('post-announcement-modal');
    if (modal) modal.classList.add('hidden');
    const t = document.getElementById('ann-title');
    const c = document.getElementById('ann-content');
    if (t) t.value = '';
    if (c) c.value = '';
  },

  handleModalBackdropClick(e) {
    if (e.target === document.getElementById('post-announcement-modal')) {
      this.closePostModal();
    }
  },

  async submitAnnouncement() {
    const titleEl   = document.getElementById('ann-title');
    const catEl     = document.getElementById('ann-category');
    const priEl     = document.getElementById('ann-priority');
    const contentEl = document.getElementById('ann-content');
    const submitBtn = document.getElementById('ann-submit-btn');
    const title   = titleEl ? titleEl.value.trim() : '';
    const content = contentEl ? contentEl.value : '';

    if (!title || !content.trim()) {
      State.showToast('Please provide a title and content.', 'error');
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Publishing\u2026'; }

    try {
      await State.apiFetch('/api/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category: catEl ? catEl.value : 'General',
          priority: priEl ? priEl.value : 'normal',
          content
        })
      });
      State.showToast('Announcement published successfully.', 'check_circle');
      this.closePostModal();
      await this.fetchAndRender();
    } catch (err) {
      State.showToast(err.message || 'Failed to publish announcement.', 'error');
    } finally {
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Publish'; }
    }
  }
};

window.AnnouncementsView = AnnouncementsView;
