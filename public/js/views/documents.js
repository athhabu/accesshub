// Documents View Component matching 5._documents_accesshub/screen.png
const DocumentsView = {
  searchQuery: '',
  selectedCategory: 'all',
  selectedType: 'all',
  selectedOwner: 'all',

  async render(currentUser) {
    const user = currentUser || State.user;

    let docs = [];
    try {
      const queryParams = new URLSearchParams();
      if (this.searchQuery) queryParams.set('q', this.searchQuery);
      if (this.selectedCategory !== 'all') queryParams.set('category', this.selectedCategory);
      if (this.selectedType !== 'all') queryParams.set('type', this.selectedType);
      if (this.selectedOwner !== 'all') queryParams.set('ownerId', this.selectedOwner);

      const res = await State.apiFetch(`/api/documents?${queryParams.toString()}`);
      docs = res.documents;
    } catch (err) {
      console.warn('Failed to load documents:', err);
    }

    return `
      <div class="flex flex-col w-full pb-12">
        <!-- Breadcrumb & Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
              <span>STORAGE POOL ALPHA</span>
              <span>•</span>
              <span class="text-on-surface-variant">Vault 04</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">Document Repository</h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Centralized company documentation, technical specifications, and internal corporate files.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button 
              class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30" 
              onclick="State.showToast('Advanced filter criteria applied')" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">filter_list</span>
              <span>Filter View</span>
            </button>
            <button 
              class="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm" 
              onclick="DocumentsView.openUploadModal()" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px]">cloud_upload</span>
              <span>Upload Document</span>
            </button>
          </div>
        </div>

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-6">
          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">TOTAL STORED</span>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">1,284</span>
                <span class="text-xs text-secondary font-semibold">+12% m/m</span>
              </div>
              <span class="text-[11px] text-on-surface-variant mt-0.5 block">Across 18 enterprise units</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[20px]">folder</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">PENDING ACCESS</span>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">14</span>
                <span class="px-1.5 py-0.2 rounded bg-tertiary-fixed-dim/30 text-tertiary text-[10px] font-bold">Requires Review</span>
              </div>
              <span class="text-[11px] text-on-surface-variant mt-0.5 block">3 confidential requests</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary">
              <span class="material-symbols-outlined text-[20px]">lock_clock</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div class="w-full mr-3">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">CLOUD STORAGE</span>
                <span class="text-[11px] text-primary font-bold">34.8% Capacity</span>
              </div>
              <span class="font-headline-md text-headline-md font-bold text-on-surface">34.8 GB</span>
              <span class="text-xs text-on-surface-variant">/ 100 GB</span>
              <div class="w-full bg-surface-container rounded-full h-1.5 mt-2">
                <div class="bg-primary h-full rounded-full" style="width: 34.8%;"></div>
              </div>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">COMPLIANCE SCORE</span>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">99.4%</span>
              </div>
              <span class="text-[11px] text-secondary font-medium mt-0.5 flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px]">verified</span>
                SOC2 & ISO 27001
              </span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
              <span class="material-symbols-outlined text-[20px]">shield</span>
            </div>
          </div>
        </div>

        <!-- Search, Dropdowns, and Format Chips -->
        <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm mb-4 space-y-3">
          <div class="flex flex-col lg:flex-row items-center gap-3">
            <!-- Search -->
            <div class="relative flex-1 w-full">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input 
                id="doc-search-input"
                class="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" 
                placeholder="Search by document name, ID, or owner..."
                type="text"
                value="${this.searchQuery}"
                oninput="DocumentsView.handleSearch(this.value)"
              />
            </div>

            <!-- Dropdowns -->
            <div class="flex items-center gap-2.5 w-full lg:w-auto">
              <select 
                class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary"
                onchange="DocumentsView.handleCategoryFilter(this.value)"
              >
                <option value="all" ${this.selectedCategory === 'all' ? 'selected' : ''}>All Categories</option>
                <option value="Engineering" ${this.selectedCategory === 'Engineering' ? 'selected' : ''}>Engineering</option>
                <option value="HR Confidential" ${this.selectedCategory === 'HR Confidential' ? 'selected' : ''}>HR Confidential</option>
                <option value="Product Strategy" ${this.selectedCategory === 'Product Strategy' ? 'selected' : ''}>Product Strategy</option>
                <option value="DevOps" ${this.selectedCategory === 'DevOps' ? 'selected' : ''}>DevOps</option>
                <option value="Leadership" ${this.selectedCategory === 'Leadership' ? 'selected' : ''}>Leadership</option>
                <option value="General" ${this.selectedCategory === 'General' ? 'selected' : ''}>General</option>
              </select>

              <select 
                class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary"
                onchange="DocumentsView.handleOwnerFilter(this.value)"
              >
                <option value="all" ${this.selectedOwner === 'all' ? 'selected' : ''}>All Owners</option>
                <option value="101" ${this.selectedOwner === '101' ? 'selected' : ''}>Alex Mercer</option>
                <option value="102" ${this.selectedOwner === '102' ? 'selected' : ''}>Sarah Jenkins</option>
                <option value="1" ${this.selectedOwner === '1' ? 'selected' : ''}>Administrator / Corporate</option>
              </select>

              <button 
                class="h-10 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface flex items-center gap-1 text-xs font-semibold"
                onclick="DocumentsView.resetFilters()"
              >
                <span class="material-symbols-outlined text-[16px]">refresh</span>
                <span>Refresh</span>
              </button>
            </div>
          </div>

          <!-- Format Filter Chips & Sync status -->
          <div class="flex items-center justify-between pt-1 border-t border-outline-variant/20 flex-wrap gap-2 text-xs">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-on-surface-variant font-medium">FORMAT:</span>
              <button class="px-3 py-1 rounded-full font-semibold ${this.selectedType === 'all' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}" onclick="DocumentsView.handleTypeFilter('all')">
                All Types (64)
              </button>
              <button class="px-3 py-1 rounded-full font-semibold ${this.selectedType === 'PDF' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}" onclick="DocumentsView.handleTypeFilter('PDF')">
                <span class="w-2 h-2 rounded-full inline-block bg-error mr-1"></span>PDF (42)
              </button>
              <button class="px-3 py-1 rounded-full font-semibold ${this.selectedType === 'DOCX' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}" onclick="DocumentsView.handleTypeFilter('DOCX')">
                <span class="w-2 h-2 rounded-full inline-block bg-primary mr-1"></span>DOCX (12)
              </button>
              <button class="px-3 py-1 rounded-full font-semibold ${this.selectedType === 'XLSX' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}" onclick="DocumentsView.handleTypeFilter('XLSX')">
                <span class="w-2 h-2 rounded-full inline-block bg-secondary mr-1"></span>XLSX (7)
              </button>
              <button class="px-3 py-1 rounded-full font-semibold ${this.selectedType === 'MD' ? 'bg-primary text-on-primary' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}" onclick="DocumentsView.handleTypeFilter('MD')">
                <span class="w-2 h-2 rounded-full inline-block bg-outline mr-1"></span>Markdown (3)
              </button>
            </div>

            <div class="flex items-center gap-1.5 text-secondary font-medium">
              <span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
              <span>Live Sync Enabled</span>
            </div>
          </div>
        </div>

        <!-- Documents Table Card -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden mb-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low/60 border-b border-outline-variant/20 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th class="py-3 px-4 w-10 text-center">
                    <input type="checkbox" class="rounded w-4 h-4 text-primary focus:ring-0 cursor-pointer"/>
                  </th>
                  <th class="py-3 px-4">DOCUMENT NAME</th>
                  <th class="py-3 px-4">DOC ID</th>
                  <th class="py-3 px-4">OWNER / AUTHOR</th>
                  <th class="py-3 px-4">CATEGORY</th>
                  <th class="py-3 px-4">UPLOADED</th>
                  <th class="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/15 font-body-sm text-body-sm">
                ${docs.map(doc => {
                  const isOwner = doc.ownerId === user.id;
                  const canDelete = isOwner || user.role === 'Administrator';
                  return `
                    <tr class="hover:bg-surface-container-low/50 transition-colors group">
                      <td class="py-3.5 px-4 text-center">
                        <input type="checkbox" class="rounded w-4 h-4 text-primary focus:ring-0 cursor-pointer"/>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            doc.type === 'PDF' ? 'bg-error-container/20 text-error' :
                            doc.type === 'DOCX' ? 'bg-primary-container/20 text-primary' :
                            doc.type === 'XLSX' ? 'bg-secondary-container/20 text-secondary' :
                            'bg-surface-container text-on-surface-variant'
                          }">
                            <span class="material-symbols-outlined text-[20px]">
                              ${doc.type === 'PDF' ? 'picture_as_pdf' : doc.type === 'DOCX' ? 'article' : doc.type === 'XLSX' ? 'table_chart' : 'description'}
                            </span>
                          </div>
                          <div>
                            <p class="font-label-lg text-label-lg font-bold text-on-surface hover:text-primary cursor-pointer transition-colors" onclick="DocumentsView.openPreview('${doc.id}')">
                              ${doc.name}
                            </p>
                            <p class="text-xs text-on-surface-variant flex items-center gap-2">
                              <span>${doc.size}</span>
                              <span>•</span>
                              <span class="${doc.version === 'Encrypted' ? 'text-tertiary font-semibold flex items-center gap-0.5' : 'text-secondary'}">
                                ${doc.version === 'Encrypted' ? '<span class="material-symbols-outlined text-[12px]">lock</span>' : ''}
                                ${doc.version}
                              </span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs">
                        <span class="px-2 py-0.5 rounded bg-surface-container font-semibold text-on-surface">${doc.id}</span>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-2.5">
                          <div class="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-xs font-bold text-primary">
                            ${doc.ownerName ? doc.ownerName.split(' ').map(n=>n[0]).join('') : 'EM'}
                          </div>
                          <div>
                            <p class="font-medium text-on-surface text-xs leading-tight">${doc.ownerName || 'Alex Mercer'}</p>
                            <span class="text-[10px] text-on-surface-variant font-mono">${doc.ownerEmpId || 'EMP-10482'}</span>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="px-2 py-0.5 rounded text-xs font-semibold ${
                          doc.category === 'HR Confidential' ? 'bg-tertiary-fixed-dim/30 text-tertiary font-bold' :
                          doc.category === 'Product Strategy' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' :
                          'bg-surface-container text-on-surface'
                        }">
                          ${doc.category}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-xs text-on-surface-variant">${doc.uploadedAt}</td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="inline-flex items-center gap-1">
                          <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" onclick="DocumentsView.openPreview('${doc.id}')" title="Preview Document">
                            <span class="material-symbols-outlined text-[18px]">visibility</span>
                          </button>
                          <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" onclick="DocumentsView.downloadDoc('${doc.id}', '${doc.name}')" title="Download">
                            <span class="material-symbols-outlined text-[18px]">download</span>
                          </button>
                          ${canDelete ? `
                            <button class="p-1 rounded hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors" onclick="DocumentsView.deleteDoc('${doc.id}', '${doc.name}')" title="Delete Document">
                              <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Bar -->
          <div class="px-6 py-3.5 bg-surface-container-low/40 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <div class="flex items-center gap-2">
              <span>Showing <strong>${docs.length}</strong> of <strong>64</strong> documents</span>
              <span>•</span>
              <span class="flex items-center gap-1 font-semibold text-on-surface">
                <span class="material-symbols-outlined text-[14px] text-primary">pie_chart</span>
                Quota: 34.8 GB / 100 GB used
              </span>
            </div>

            <div class="flex items-center gap-1">
              <button class="w-7 h-7 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container">
                <span class="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button class="w-7 h-7 rounded bg-primary text-on-primary font-bold">1</button>
              <button class="w-7 h-7 rounded hover:bg-surface-container font-semibold" onclick="State.showToast('Page 2')">2</button>
              <button class="w-7 h-7 rounded hover:bg-surface-container font-semibold" onclick="State.showToast('Page 3')">3</button>
              <span>...</span>
              <button class="w-7 h-7 rounded hover:bg-surface-container font-semibold" onclick="State.showToast('Page 10')">10</button>
              <button class="w-7 h-7 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container">
                <span class="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Bottom 3 Cards: Retention Policies, Shared With Me, Access Audit Log -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-lg">
          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                <span class="material-symbols-outlined text-[20px]">verified_user</span>
                <h4>Retention Policies</h4>
              </div>
              <p class="text-xs text-on-surface-variant">
                Automatic archival triggers after 180 days of zero modifications. Critical engineering blueprints are mirrored multi-regionally.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
              <span class="text-secondary font-semibold">Auto-Archival Active</span>
              <a href="javascript:void(0)" onclick="State.showToast('Opening Compliance Policy Rules...')" class="text-primary font-semibold hover:underline flex items-center gap-0.5">
                Policy Rules <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                <span class="material-symbols-outlined text-[20px]">share</span>
                <h4>Shared With Me</h4>
              </div>
              <p class="text-xs text-on-surface-variant">
                You have access to 18 cross-department folders with delegated sign-off authority for Q3 deliverables.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
              <span class="text-on-surface font-medium">5 pending signatures</span>
              <a href="javascript:void(0)" onclick="State.showToast('Opening Delegated Vault...')" class="text-primary font-semibold hover:underline flex items-center gap-0.5">
                Open Vault <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-col justify-between">
            <div>
              <div class="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                <span class="material-symbols-outlined text-[20px]">description</span>
                <h4>Access Audit Log</h4>
              </div>
              <p class="text-xs text-on-surface-variant">
                Last external export occurred 2h ago by Elena Rostova. Zero anomalies detected in active permission pools.
              </p>
            </div>
            <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs">
              <span class="font-mono text-outline">192.168.1.144 (VPN)</span>
              <a href="javascript:void(0)" onclick="State.showToast('Loading SIEM telemetry trace...')" class="text-primary font-semibold hover:underline flex items-center gap-0.5">
                View Trace <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>

        <!-- Document Viewer Modal -->
        <div id="doc-preview-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-2xl overflow-hidden" id="doc-preview-content">
          </div>
        </div>

        <!-- Upload Document Modal -->
        <div id="doc-upload-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">cloud_upload</span>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">Upload New Document</h3>
              </div>
              <button onclick="DocumentsView.closeUploadModal()" class="text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onsubmit="DocumentsView.submitUpload(event)" class="p-6 space-y-4">
              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface" for="upload-doc-name">Document Title / File Name</label>
                <input id="upload-doc-name" required placeholder="e.g. Infrastructure_Security_Audit_2025.pdf" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary"/>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-label-md text-label-md font-semibold text-on-surface" for="upload-doc-type">File Type</label>
                  <select id="upload-doc-type" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary">
                    <option value="PDF">PDF Document</option>
                    <option value="DOCX">Word (.docx)</option>
                    <option value="XLSX">Excel Spreadsheet</option>
                    <option value="MD">Markdown (.md)</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="font-label-md text-label-md font-semibold text-on-surface" for="upload-doc-category">Category</label>
                  <select id="upload-doc-category" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary">
                    <option value="Engineering">Engineering</option>
                    <option value="Product Strategy">Product Strategy</option>
                    <option value="HR Confidential">HR Confidential</option>
                    <option value="DevOps">DevOps</option>
                    <option value="Leadership">Leadership</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface" for="upload-doc-desc">Summary & Description</label>
                <textarea id="upload-doc-desc" rows="3" placeholder="Brief explanation of document contents, retention tier, and scopes..." class="w-full p-2.5 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary"></textarea>
              </div>

              <div class="p-4 border-2 border-dashed border-outline-variant/50 rounded-lg text-center bg-surface-container-low/50">
                <span class="material-symbols-outlined text-[32px] text-primary">upload_file</span>
                <p class="text-xs text-on-surface font-medium mt-1">Drag and drop document here, or browse local device</p>
                <span class="text-[10px] text-outline">Supported: PDF, DOCX, XLSX, Markdown up to 50MB</span>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button type="button" onclick="DocumentsView.closeUploadModal()" class="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high">
                  Cancel
                </button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-sm">
                  Upload to Repository
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  handleSearch(query) {
    this.searchQuery = query;
    AppRouter.renderCurrentRoute();
  },

  handleCategoryFilter(cat) {
    this.selectedCategory = cat;
    AppRouter.renderCurrentRoute();
  },

  handleTypeFilter(type) {
    this.selectedType = type;
    AppRouter.renderCurrentRoute();
  },

  handleOwnerFilter(ownerId) {
    this.selectedOwner = ownerId;
    AppRouter.renderCurrentRoute();
  },

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory = 'all';
    this.selectedType = 'all';
    this.selectedOwner = 'all';
    AppRouter.renderCurrentRoute();
  },

  async openPreview(id) {
    const modal = document.getElementById('doc-preview-modal');
    const container = document.getElementById('doc-preview-content');

    // Show loading state
    container.innerHTML = `
      <div class="p-12 flex flex-col items-center justify-center gap-3 text-on-surface-variant">
        <span class="material-symbols-outlined text-[40px] animate-spin text-primary">progress_activity</span>
        <span class="text-sm font-medium">Loading document <span class="font-mono text-primary">${id}</span>...</span>
      </div>
    `;
    modal.classList.remove('hidden');

    try {
      // INTENTIONAL IDOR: The server's GET /api/documents/:id endpoint performs NO ownership check.
      // Any authenticated user can retrieve any document by supplying a known document ID.
      // This is Vulnerability #1 — Broken Object-Level Authorization (BOLA/IDOR).
      const res = await State.apiFetch(`/api/documents/${id}`);
      const doc = res.document;

      container.innerHTML = `
        <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <div class="flex items-center gap-2">
            <span class="material-symbols-outlined text-primary text-[20px]">description</span>
            <h3 class="font-title-md text-title-md font-bold text-on-surface">${doc.name}</h3>
            <span class="font-mono text-xs text-outline">(${doc.id})</span>
          </div>
          <button onclick="DocumentsView.closePreview()" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-6 space-y-3">
          <div class="flex items-center gap-4 text-xs text-on-surface-variant pb-3 border-b border-outline-variant/20">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">person</span> Owner: <strong class="text-on-surface">${doc.ownerName}</strong> (${doc.ownerEmpId})</span>
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">category</span> ${doc.category}</span>
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">schedule</span> ${doc.uploadedAt}</span>
          </div>
          <div class="p-4 rounded-lg bg-surface-container-low font-mono text-xs text-on-surface whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed border border-outline-variant/30">
${doc.content || doc.description}
          </div>
        </div>
        <div class="px-6 py-3 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between text-xs">
          <span class="text-secondary font-medium flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">verified</span>
            Verified Document Integrity
          </span>
          <button onclick="DocumentsView.downloadDoc('${doc.id}', '${doc.name}')" class="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold flex items-center gap-1.5">
            <span class="material-symbols-outlined text-[16px]">download</span>
            Download File
          </button>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="p-8 flex flex-col items-center gap-3 text-error">
          <span class="material-symbols-outlined text-[36px]">error</span>
          <p class="text-sm font-semibold">${err.message || 'Failed to load document'}</p>
          <button onclick="DocumentsView.closePreview()" class="mt-2 px-4 py-1.5 rounded-lg bg-surface-container text-on-surface text-xs font-semibold">Close</button>
        </div>
      `;
    }
  },

  closePreview() {
    const modal = document.getElementById('doc-preview-modal');
    if (modal) modal.classList.add('hidden');
  },

  async downloadDoc(id, name) {
    try {
      const token = State.token || localStorage.getItem('accesshub_token');
      const res = await fetch(`/api/documents/${id}/download`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to download document');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name || `${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      State.showToast(`Downloaded ${name || id}`, 'download');
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  openUploadModal() {
    const modal = document.getElementById('doc-upload-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeUploadModal() {
    const modal = document.getElementById('doc-upload-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitUpload(event) {
    event.preventDefault();
    const name = document.getElementById('upload-doc-name').value;
    const type = document.getElementById('upload-doc-type').value;
    const category = document.getElementById('upload-doc-category').value;
    const description = document.getElementById('upload-doc-desc').value;

    try {
      await State.apiFetch('/api/documents', {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          category,
          description,
          content: `${name}\n\nUploaded to AccessHub Enterprise Vault on ${new Date().toISOString()}.\nDescription: ${description}`
        })
      });

      this.closeUploadModal();
      State.showToast(`Document "${name}" uploaded successfully!`, 'cloud_done');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  async deleteDoc(id, name) {
    if (!confirm(`Are you sure you want to delete document ${name} (${id})?`)) return;

    try {
      await State.apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
      State.showToast(`Document ${id} deleted`, 'delete');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  }
};

window.DocumentsView = DocumentsView;
