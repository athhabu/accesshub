// =============================================================================
// Document Lookup View — Check #40
// =============================================================================
// Realistic internal document repository search backed by a synthetic
// XML document archive and server-side XPath lookup.
// The vulnerability lives entirely on the server side (XPath Injection)
// and is not hinted at anywhere in the UI.
// =============================================================================

const DocumentLookupView = {
  render(user) {
    return `
      <div class="max-w-5xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="font-headline-sm text-headline-sm font-bold text-on-surface">Document Archive</h1>
            <p class="text-sm text-on-surface-variant mt-1">Search the corporate XML document repository for contracts, runbooks, and policies.</p>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px] text-primary">folder_open</span>
            <span>Enterprise Archive Index</span>
          </div>
        </div>

        <!-- Search Form Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6">
          <div class="flex items-center gap-2.5 pb-4 mb-5 border-b border-outline-variant/20">
            <span class="material-symbols-outlined text-primary text-[22px]">manage_search</span>
            <h2 class="font-title-md text-title-md font-semibold text-on-surface">Search Documents</h2>
          </div>

          <form id="doc-lookup-form" onsubmit="event.preventDefault(); DocumentLookupView.search();" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Category Filter -->
              <div>
                <label for="doc-category" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Document Category
                </label>
                <select
                  id="doc-category"
                  class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="all">All Categories</option>
                  <option value="Operations">Operations</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Finance">Finance</option>
                  <option value="Security">Security</option>
                  <option value="Legal">Legal</option>
                  <option value="Product">Product</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Strategy">Strategy</option>
                </select>
              </div>

              <!-- Owner Filter -->
              <div>
                <label for="doc-owner" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Document Owner
                </label>
                <select
                  id="doc-owner"
                  class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="all">All Employees</option>
                  <option value="Alex Mercer">Alex Mercer</option>
                  <option value="Sarah Jenkins">Sarah Jenkins</option>
                  <option value="Chloe Bennett">Chloe Bennett</option>
                  <option value="Elena Rodriguez">Elena Rodriguez</option>
                  <option value="Priya Nair">Priya Nair</option>
                  <option value="James Holbrook">James Holbrook</option>
                  <option value="Thomas Reed">Thomas Reed</option>
                  <option value="David Chen">David Chen</option>
                  <option value="Maya Patel">Maya Patel</option>
                  <option value="Marcus Vance">Marcus Vance</option>
                </select>
              </div>

              <!-- Title Query -->
              <div>
                <label for="doc-title" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Document Title
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[18px] text-on-surface-variant pointer-events-none">search</span>
                  <input
                    id="doc-title"
                    type="text"
                    placeholder="e.g. Operations, Plan, Overview"
                    class="w-full h-10 pl-9 pr-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="flex items-center justify-between pt-2">
              <span class="text-xs text-on-surface-variant/70">Repository index refreshed daily from internal XML repository</span>
              <button
                type="submit"
                id="doc-search-btn"
                class="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-[18px]">search</span>
                Search Documents
              </button>
            </div>
          </form>
        </div>

        <!-- Results Area -->
        <div id="doc-results-container">
          <div class="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-10 flex flex-col items-center gap-3 text-center">
            <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[28px] text-on-surface-variant">library_books</span>
            </div>
            <p class="text-sm font-semibold text-on-surface">Search the corporate document archive</p>
            <p class="text-xs text-on-surface-variant max-w-sm">Use the filters above to retrieve official policies, reports, and architecture specifications.</p>
          </div>
        </div>

      </div>
    `;
  },

  afterRender() {
    // Perform an initial default search to display active documents
    this.search();
  },

  async search() {
    const categoryEl = document.getElementById('doc-category');
    const ownerEl    = document.getElementById('doc-owner');
    const titleEl    = document.getElementById('doc-title');
    const btn        = document.getElementById('doc-search-btn');
    const container  = document.getElementById('doc-results-container');

    if (!container) return;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Searching...';
    }

    try {
      const category = categoryEl ? categoryEl.value : 'all';
      const owner    = ownerEl ? ownerEl.value : 'all';
      const title    = titleEl ? titleEl.value : '';

      const params = new URLSearchParams();
      if (category && category !== 'all') params.set('category', category);
      if (owner && owner !== 'all') params.set('owner', owner);
      if (title) params.set('title', title);

      const res = await State.apiFetch(`/api/documents/lookup?${params.toString()}`);

      const docs = (res && Array.isArray(res.documents)) ? res.documents : [];

      if (docs.length === 0) {
        container.innerHTML = `
          <div class="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-10 text-center">
            <span class="material-symbols-outlined text-[36px] text-on-surface-variant/60 mb-2">find_replace</span>
            <p class="text-sm font-semibold text-on-surface">No documents match the specified criteria</p>
            <p class="text-xs text-on-surface-variant mt-1">Try broadening your search title or selecting "All Categories".</p>
          </div>
        `;
      } else {
        const rows = docs.map(d => {
          const isRestricted = d.status === 'restricted';
          const isArchived = d.status === 'archived';

          let statusBadgeClass = 'bg-secondary/10 text-secondary border-secondary/20';
          if (isRestricted) statusBadgeClass = 'bg-error-container text-on-error-container border-error/30 font-bold';
          else if (isArchived) statusBadgeClass = 'bg-surface-container-high text-on-surface-variant border-outline-variant/30';

          return `
            <tr class="border-b border-outline-variant/15 hover:bg-surface-container-low/50 transition-colors">
              <td class="py-3 px-4 font-mono text-xs font-semibold text-primary">${d.id || 'N/A'}</td>
              <td class="py-3 px-4 font-medium text-on-surface text-sm">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-[18px] text-on-surface-variant">description</span>
                  <span>${d.title || 'Untitled'}</span>
                </div>
              </td>
              <td class="py-3 px-4 text-xs text-on-surface-variant">${d.category || 'General'}</td>
              <td class="py-3 px-4 text-xs text-on-surface">${d.owner || 'Unknown'}</td>
              <td class="py-3 px-4 text-xs text-on-surface-variant">${d.department || 'Corporate'}</td>
              <td class="py-3 px-4">
                <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${statusBadgeClass}">
                  ${d.status || 'unknown'}
                </span>
              </td>
              <td class="py-3 px-4 text-xs font-mono text-on-surface-variant">${d.classification || 'Internal'}</td>
            </tr>
          `;
        }).join('');

        container.innerHTML = `
          <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden">
            <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low/30">
              <span class="text-xs font-medium text-on-surface-variant">${docs.length} matching document(s) retrieved</span>
              <span class="text-[11px] font-mono text-on-surface-variant/70">XML Schema: &lt;documents&gt;</span>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="border-b border-outline-variant/25 bg-surface-container-low/60 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
                    <th class="py-3 px-4">Document ID</th>
                    <th class="py-3 px-4">Title</th>
                    <th class="py-3 px-4">Category</th>
                    <th class="py-3 px-4">Owner</th>
                    <th class="py-3 px-4">Department</th>
                    <th class="py-3 px-4">Status</th>
                    <th class="py-3 px-4">Classification</th>
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
    } catch (err) {
      container.innerHTML = `
        <div class="rounded-2xl border border-error/20 bg-error-container/20 p-6 text-center text-sm text-error">
          Failed to load documents: ${err.message || 'Server error'}
        </div>
      `;
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">search</span> Search Documents';
      }
    }
  }
};

window.DocumentLookupView = DocumentLookupView;
