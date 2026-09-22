// Help Center View
// Check #31 — DOM Sink Vulnerability (DOM XSS — Unsafe Client-Side Sink)
//
// Vulnerable data flow:
//   Source:     sessionStorage.getItem('ah_help_last_query')
//               Written by the search form — value originates from user input
//   Processing: buildSearchContextBanner(query)
//               JS helper that formats the cached query into an HTML string
//               via template-literal concatenation without escaping
//   Sink:       filterBar.insertAdjacentHTML('afterbegin', bannerHtml)
//               insertAdjacentHTML — different sink from checks #23/#24

const HelpSearchView = {
  _articles: [
    {
      id: 'HS-01',
      category: 'IT Support',
      title: 'How to Reset Your Corporate Password',
      summary: 'Step-by-step guide for resetting your AccessHub account password through the self-service portal or by contacting IT Helpdesk.',
      tags: ['password', 'account', 'login', 'reset'],
      updatedAt: '2026-09-10'
    },
    {
      id: 'HS-02',
      category: 'Procurement',
      title: 'Requesting New Hardware or Peripherals',
      summary: 'Learn how to submit an equipment request, track approval status, and coordinate with the IT asset team for delivery.',
      tags: ['hardware', 'equipment', 'order', 'laptop', 'peripherals'],
      updatedAt: '2026-09-05'
    },
    {
      id: 'HS-03',
      category: 'Finance',
      title: 'Submitting an Expense Report',
      summary: 'Guide to submitting and tracking expense reimbursements, including receipt requirements and GL code assignments.',
      tags: ['expense', 'reimbursement', 'receipt', 'finance'],
      updatedAt: '2026-08-28'
    },
    {
      id: 'HS-04',
      category: 'People Ops',
      title: 'Remote Work Approval Process',
      summary: 'How to apply for remote or hybrid work arrangements, including eligibility requirements and required sign-offs.',
      tags: ['remote', 'work from home', 'hybrid', 'approval'],
      updatedAt: '2026-09-12'
    },
    {
      id: 'HS-05',
      category: 'Security',
      title: 'Reporting a Phishing Email',
      summary: 'Recognize suspicious messages and report them to the Security Operations Center using the official reporting workflow.',
      tags: ['phishing', 'security', 'email', 'report', 'suspicious'],
      updatedAt: '2026-09-18'
    },
    {
      id: 'HS-06',
      category: 'IT Support',
      title: 'VPN Setup and Troubleshooting',
      summary: 'Configuration steps for the corporate VPN client on macOS and Windows, plus common connectivity troubleshooting tips.',
      tags: ['vpn', 'network', 'remote access', 'connectivity'],
      updatedAt: '2026-09-14'
    },
    {
      id: 'HS-07',
      category: 'People Ops',
      title: 'Updating Your Emergency Contact Information',
      summary: 'How to review and update personal emergency contacts in the employee directory through your AccessHub profile.',
      tags: ['emergency', 'contact', 'profile', 'personal'],
      updatedAt: '2026-08-20'
    },
    {
      id: 'HS-08',
      category: 'Finance',
      title: 'Understanding Your Payroll Deductions',
      summary: 'Breakdown of standard payroll deductions including federal withholding, health benefits, and 401(k) contributions.',
      tags: ['payroll', 'deductions', 'benefits', 'salary', '401k'],
      updatedAt: '2026-07-15'
    }
  ],

  _currentFilter: 'All',
  _currentResults: null,

  async render(currentUser) {
    return `
      <div class="flex flex-col w-full pb-12 max-w-5xl mx-auto" id="help-search-root">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Employee Resources</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">Help Center</span>
          </div>
        </div>

        <!-- Hero -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-sm mb-6">
          <div class="flex items-center gap-2 mb-1 text-primary">
            <span class="material-symbols-outlined text-[20px]">help_center</span>
            <span class="text-xs uppercase tracking-wider font-bold">Employee Help Center</span>
          </div>
          <h1 class="font-headline-md text-headline-md font-bold text-on-surface mb-3">How can we help you?</h1>
          <!-- Search Form -->
          <div class="flex gap-2 max-w-2xl">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input
                type="text"
                id="help-search-input"
                placeholder="Search help articles, guides, and FAQs..."
                class="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm"
                onkeydown="if(event.key==='Enter') HelpSearchView.submitSearch()"
              />
            </div>
            <button
              type="button"
              onclick="HelpSearchView.submitSearch()"
              id="help-search-btn"
              class="h-10 px-5 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-label-md text-label-md transition-all shadow-sm flex items-center gap-2"
            >
              <span class="material-symbols-outlined text-[16px]">search</span>
              Search
            </button>
          </div>
        </div>

        <!-- Filter Bar — recent search context banner injected here (XSS-31 sink) -->
        <div id="help-filter-bar" class="flex items-center gap-2 flex-wrap mb-5">
          ${['All', 'IT Support', 'Finance', 'People Ops', 'Security', 'Procurement'].map(cat => `
            <button
              class="px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${this._currentFilter === cat ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}"
              onclick="HelpSearchView.setFilter('${cat}')"
              type="button"
            >${cat}</button>
          `).join('')}
        </div>

        <!-- Results -->
        <div id="help-results-grid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${this._buildArticleCards(this._articles)}
        </div>

      </div>
    `;
  },

  async afterRender() {
    this._restoreLastSearch();
  },

  // ------------------------------------------------------------------
  // #31 Vulnerable data flow:
  //   1. Read last query from sessionStorage (source)
  //   2. Pass through buildSearchContextBanner() (processing)
  //   3. Insert result via insertAdjacentHTML (sink)
  // ------------------------------------------------------------------
  _restoreLastSearch() {
    const lastQuery = sessionStorage.getItem('ah_help_last_query');
    if (!lastQuery) return;

    // Restore the search input
    const input = document.getElementById('help-search-input');
    if (input) input.value = lastQuery;

    // Build context banner via helper and inject into filter bar
    const filterBar = document.getElementById('help-filter-bar');
    if (filterBar) {
      const bannerHtml = this._buildSearchContextBanner(lastQuery);
      // XSS-31 sink: insertAdjacentHTML with unsanitised sessionStorage value
      filterBar.insertAdjacentHTML('afterbegin', bannerHtml);
    }

    // Show filtered results
    this._applyFilter(lastQuery);
  },

  // Processing step: formats the cached query into an HTML string.
  // No sanitisation applied — lastQuery flows directly into the template literal.
  _buildSearchContextBanner(query) {
    return (
      '<div class="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface-variant mb-2">' +
      '<span class="material-symbols-outlined text-[13px] shrink-0">history</span>' +
      '<span>Last search: <span class="font-semibold text-on-surface">' + query + '</span></span>' +
      '<button type="button" class="ml-auto text-on-surface-variant hover:text-error transition-colors" onclick="HelpSearchView.clearLastSearch()" title="Clear">' +
      '<span class="material-symbols-outlined text-[14px]">close</span></button>' +
      '</div>'
    );
  },

  submitSearch() {
    const input = document.getElementById('help-search-input');
    if (!input) return;
    const query = input.value.trim();
    if (!query) return;

    // Write user input to sessionStorage — this is the value that becomes the XSS source
    sessionStorage.setItem('ah_help_last_query', query);

    // Update banner immediately via insertAdjacentHTML sink (XSS-31)
    const filterBar = document.getElementById('help-filter-bar');
    if (filterBar) {
      const existing = filterBar.querySelector('div.mb-2');
      if (existing) existing.remove();
      const bannerHtml = this._buildSearchContextBanner(query);
      filterBar.insertAdjacentHTML('afterbegin', bannerHtml);
    }

    this._applyFilter(query);
  },

  clearLastSearch() {
    sessionStorage.removeItem('ah_help_last_query');
    const banner = document.querySelector('#help-filter-bar [data-search-banner]');
    // Remove banner if present (look for the injected element)
    const filterBar = document.getElementById('help-filter-bar');
    if (filterBar) {
      const existing = filterBar.querySelector('div.mb-2');
      if (existing) existing.remove();
    }
    const input = document.getElementById('help-search-input');
    if (input) input.value = '';
  },

  _applyFilter(query) {
    const results = query
      ? this._articles.filter(a =>
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.summary.toLowerCase().includes(query.toLowerCase()) ||
          a.tags.some(t => t.includes(query.toLowerCase()))
        )
      : this._articles;

    const grid = document.getElementById('help-results-grid');
    if (!grid) return;

    if (!results.length) {
      grid.innerHTML = `
        <div class="col-span-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-10 text-center text-on-surface-variant">
          <span class="material-symbols-outlined text-[40px] mb-3 block opacity-40">search_off</span>
          <p class="text-sm font-medium">No articles found matching your search.</p>
          <p class="text-xs mt-1">Try different keywords or browse all categories.</p>
        </div>`;
    } else {
      grid.innerHTML = this._buildArticleCards(results);
    }
  },

  setFilter(category) {
    this._currentFilter = category;
    const filtered = category === 'All' ? this._articles : this._articles.filter(a => a.category === category);
    const grid = document.getElementById('help-results-grid');
    if (grid) grid.innerHTML = this._buildArticleCards(filtered);

    // Update button states
    document.querySelectorAll('#help-filter-bar button[onclick*="setFilter"]').forEach(btn => {
      const cat = btn.textContent.trim();
      if (cat === category) {
        btn.className = btn.className.replace('bg-surface-container text-on-surface-variant hover:bg-surface-container-high', 'bg-primary text-on-primary shadow-sm');
      } else {
        btn.className = btn.className.replace('bg-primary text-on-primary shadow-sm', 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high');
      }
    });
  },

  _buildArticleCards(articles) {
    const categoryIcons = {
      'IT Support':  'computer',
      'Finance':     'receipt_long',
      'People Ops':  'people',
      'Security':    'shield',
      'Procurement': 'shopping_bag'
    };
    return articles.map(art => {
      const icon = categoryIcons[art.category] || 'help';
      const date = art.updatedAt
        ? new Date(art.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '';
      return `
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-3">
          <div class="flex items-start gap-3">
            <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-primary text-[18px]">${icon}</span>
            </div>
            <div class="min-w-0 flex-1">
              <span class="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">${art.category}</span>
              <h2 class="font-title-sm text-title-sm font-semibold text-on-surface leading-snug mt-0.5">${art.title}</h2>
            </div>
          </div>
          <p class="text-xs text-on-surface-variant leading-relaxed">${art.summary}</p>
          <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant mt-auto">
            <div class="flex gap-1 flex-wrap">
              ${art.tags.slice(0, 3).map(t => `<span class="px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/20">${t}</span>`).join('')}
            </div>
            <span>Updated ${date}</span>
          </div>
        </div>`;
    }).join('');
  }
};

window.HelpSearchView = HelpSearchView;
