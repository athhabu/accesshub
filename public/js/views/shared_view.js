// Shared View Component — Enterprise Workspace Sharing View
// Demonstrates client-side URL Fragment / Hash handling (XSS-04)

const SharedView = {
  _listenerAttached: false,

  async render(currentUser) {
    const user = currentUser || State.user;

    // Schedule fragment extraction after the view is mounted into the DOM
    setTimeout(() => this.processFragment(), 50);

    if (!this._listenerAttached) {
      window.addEventListener('hashchange', () => {
        if (window.location.hash.includes('shared-view')) {
          this.processFragment();
        }
      });
      this._listenerAttached = true;
    }

    return `
      <div class="flex flex-col w-full pb-12 max-w-5xl mx-auto" id="shared-view-root">
        <!-- Header Context -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-primary text-[22px]">share_reviews</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Shared Resource</span>
            </div>
            <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">Shared Workspace Snapshot</h1>
            <p class="font-body-md text-body-md text-on-surface-variant mt-1">Viewing shared departmental board snapshot and team context.</p>
          </div>

          <div class="flex items-center gap-3">
            <a href="#/dashboard" class="h-9 px-4 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5 shadow-sm">
              <span class="material-symbols-outlined text-[16px]">arrow_back</span>
              Return to Workspace
            </a>
          </div>
        </div>

        <!-- Shared View Notice / Banner Card (DOM Sink target) -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm mb-6" id="shared-banner-card">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[22px]">link</span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2 mb-1">
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Shared View Notice</span>
                <span class="text-xs text-on-surface-variant">Live Client Snapshot</span>
              </div>
              <div class="font-body-md text-body-md text-on-surface font-medium leading-relaxed" id="shared-view-content">
                No specific view parameter provided in URL fragment. Showing default enterprise overview.
              </div>
            </div>
          </div>
        </div>

        <!-- Shared Snapshot Data Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-space-lg mb-6">
          <!-- Card 1: Team Focus -->
          <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
            <div class="flex items-center gap-2.5 pb-3 mb-4 border-b border-outline-variant/20">
              <span class="material-symbols-outlined text-primary text-[20px]">flag</span>
              <h3 class="font-title-md text-title-md font-bold text-on-surface">Sprint Goals & Roadmap</h3>
            </div>
            <p class="text-xs text-on-surface-variant leading-relaxed mb-4">
              Core platform infrastructure modernization, SOC-2 compliance audit review, and multi-tenant authorization pipeline.
            </p>
            <div class="space-y-2 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
                <span class="font-medium text-on-surface">Platform IAM RBAC Migration</span>
                <span class="px-2 py-0.5 rounded bg-secondary/10 text-secondary font-bold text-[11px]">In Progress</span>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
                <span class="font-medium text-on-surface">SOC-2 Readiness Audit</span>
                <span class="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[11px]">Review</span>
              </div>
            </div>
          </div>

          <!-- Card 2: Shared Resources -->
          <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
            <div class="flex items-center gap-2.5 pb-3 mb-4 border-b border-outline-variant/20">
              <span class="material-symbols-outlined text-primary text-[20px]">folder_shared</span>
              <h3 class="font-title-md text-title-md font-bold text-on-surface">Shared Workspace Files</h3>
            </div>
            <div class="space-y-2.5 text-xs">
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="material-symbols-outlined text-[16px] text-primary">description</span>
                  <span class="font-medium text-on-surface truncate">Q4_Infrastructure_Plan.pdf</span>
                </div>
                <a href="#/documents" class="text-primary font-semibold hover:underline shrink-0">Open</a>
              </div>
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-low">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="material-symbols-outlined text-[16px] text-primary">description</span>
                  <span class="font-medium text-on-surface truncate">Team_Roster_Q4.xlsx</span>
                </div>
                <a href="#/team" class="text-primary font-semibold hover:underline shrink-0">Open</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Client-side DOM XSS processing logic (XSS-04 — DOM XSS via URL Fragment / Hash)
  processFragment() {
    // Source: window.location.hash
    // In hash routing, URL looks like: #/shared-view#<fragment> or #/shared-view?<query>#<fragment>
    const fullHash = window.location.hash || '';
    const hashParts = fullHash.split('#');

    // Extract the fragment portion (the part after the route fragment)
    let fragmentData = '';
    if (hashParts.length > 2) {
      fragmentData = hashParts.slice(2).join('#');
    }

    if (!fragmentData) return;

    // Decode the fragment string
    let decodedValue = '';
    try {
      decodedValue = decodeURIComponent(fragmentData);
    } catch (e) {
      decodedValue = fragmentData;
    }

    // Extract specific parameters if format is key=value (e.g. notice=... or view=...)
    let displayHtml = decodedValue;
    if (decodedValue.includes('notice=')) {
      displayHtml = decodedValue.split('notice=')[1].split('&')[0];
    } else if (decodedValue.includes('view=')) {
      displayHtml = decodedValue.split('view=')[1].split('&')[0];
    } else if (decodedValue.includes('filter=')) {
      displayHtml = decodedValue.split('filter=')[1].split('&')[0];
    }

    // Unsafe DOM Sink: innerHTML insertion of client-decoded fragment
    const container = document.getElementById('shared-view-content');
    if (container) {
      container.innerHTML = displayHtml;
    }
  }
};

window.SharedView = SharedView;
