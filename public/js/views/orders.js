// Orders View Component matching 6._orders_accesshub/screen.png
const OrdersView = {
  activeTab: 'orders',
  searchQuery: '',
  selectedStatus: 'all',
  selectedOrderId: null,
  selectedRequestId: null,
  selectedAssetId: null,

  switchTab(tab) {
    this.activeTab = tab;
    AppRouter.renderCurrentRoute();
  },

  async render(currentUser) {
    const user = currentUser || State.user;

    let orders = [];
    try {
      const queryParams = new URLSearchParams();
      if (this.searchQuery) queryParams.set('q', this.searchQuery);
      if (this.selectedStatus !== 'all') queryParams.set('status', this.selectedStatus);

      const res = await State.apiFetch(`/api/orders?${queryParams.toString()}`);
      orders = res.orders;
    } catch (err) {
      console.warn('Failed to load orders:', err);
    }

    // Load requests if activeTab is requests
    let requests = [];
    if (this.activeTab === 'requests') {
      try {
        const reqRes = await State.apiFetch('/api/requests');
        requests = reqRes.requests || [];
      } catch (err) {
        console.warn('Failed to load requests:', err);
      }

      if (!this.selectedRequestId && requests.length > 0) {
        this.selectedRequestId = requests[0].id;
      } else if (this.selectedRequestId && !requests.find(r => r.id === this.selectedRequestId) && requests.length > 0) {
        this.selectedRequestId = requests[0].id;
      }
    }

    // Load assets if activeTab is assets
    let assets = [];
    let allEmployees = [];
    if (this.activeTab === 'assets') {
      try {
        const assetRes = await State.apiFetch('/api/assets');
        assets = assetRes.assets || [];
        const empRes = await State.apiFetch('/api/employees');
        allEmployees = empRes.employees || [];
      } catch (err) {
        console.warn('Failed to load assets:', err);
      }

      if (!this.selectedAssetId && assets.length > 0) {
        this.selectedAssetId = assets[0].id;
      } else if (this.selectedAssetId && !assets.find(a => a.id === this.selectedAssetId) && assets.length > 0) {
        this.selectedAssetId = assets[0].id;
      }
    }

    // Default select first order if none or not in list
    if (!this.selectedOrderId && orders.length > 0) {
      this.selectedOrderId = orders[0].id;
    } else if (this.selectedOrderId && !orders.find(o => o.id === this.selectedOrderId) && orders.length > 0) {
      this.selectedOrderId = orders[0].id;
    }

    const selectedOrder = orders.find(o => o.id === this.selectedOrderId) || orders[0] || null;
    const selectedRequest = requests.find(r => r.id === this.selectedRequestId) || requests[0] || null;
    const selectedAsset = assets.find(a => a.id === this.selectedAssetId) || assets[0] || null;

    // Compute stats
    const totalCount = orders.length;
    const allocatedTotal = orders.reduce((sum, o) => sum + (o.amount || 0), 0);
    const inTransit = orders.filter(o => o.progress === 'Dispatched').length;
    const pendingApproval = orders.filter(o => o.status === 'Pending Approval').length;

    return `
      <div class="flex flex-col w-full pb-12">
        <!-- Breadcrumb & Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
              <span>• CORPORATE PROCUREMENT</span>
              <span>•</span>
              <span class="text-on-surface-variant">EMPLOYEE PORTAL</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
              My Orders & Hardware Requisitions
            </h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Track IT equipment requests, software license allocations, and corporate procurement orders.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button 
              class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30" 
              onclick="OrdersView.exportReport()" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
              <span>Export Report</span>
            </button>
            <button 
              class="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm" 
              onclick="OrdersView.openNewOrderModal()" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span>Create New Requisition</span>
            </button>
          </div>
        </div>

        <!-- 3 Stat Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-space-md mb-6">
          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">TOTAL REQUISITIONS</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-display-lg text-display-lg font-bold text-on-surface">${totalCount}</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Active</span>
              </div>
              <div class="mt-2 text-xs">
                <span class="text-on-surface-variant">Allocated Total: </span>
                <strong class="text-primary font-bold">$${allocatedTotal.toFixed(2)}</strong>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[24px]">inventory_2</span>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <span class="text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">IN TRANSIT • DELIVERY</span>
              </div>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-display-lg text-display-lg font-bold text-on-surface">${inTransit}</span>
                <span class="font-label-md text-label-md text-on-surface-variant">Shipment</span>
              </div>
              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="w-2 h-2 rounded-full bg-secondary"></span>
                <span class="text-on-surface font-medium">ETA: Tomorrow by 10:30 AM</span>
                <span class="px-1.5 py-0.2 rounded bg-secondary/15 text-secondary font-semibold text-[10px]">FedEx Priority</span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
              <span class="material-symbols-outlined text-[24px]">local_shipping</span>
            </div>
          </div>

          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">AWAITING MANAGER APPROVAL</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-display-lg text-display-lg font-bold text-tertiary">${pendingApproval}</span>
                <span class="font-label-md text-label-md text-tertiary">Pending</span>
              </div>
              <div class="mt-2 flex items-center gap-2 text-xs">
                <span class="text-on-surface-variant">Reviewer: Marcus Vance</span>
                <span class="px-1.5 py-0.2 rounded bg-tertiary-fixed-dim/30 text-tertiary font-bold text-[10px]">Requires Sign-off</span>
              </div>
            </div>
            <div class="w-12 h-12 rounded-xl bg-tertiary/15 flex items-center justify-center text-tertiary">
              <span class="material-symbols-outlined text-[24px]">hourglass_top</span>
            </div>
          </div>
        </div>

        <!-- Workflow Tabs: Orders vs Service Requests vs Company Assets -->
        <div class="flex items-center gap-6 border-b border-outline-variant/30 mb-6">
          <button 
            onclick="OrdersView.switchTab('orders')" 
            class="pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${this.activeTab === 'orders' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}"
          >
            <span class="material-symbols-outlined text-[18px]">inventory_2</span>
            <span>Procurement Orders</span>
          </button>
          <button 
            onclick="OrdersView.switchTab('requests')" 
            class="pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${this.activeTab === 'requests' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}"
          >
            <span class="material-symbols-outlined text-[18px]">assignment</span>
            <span>Service & Equipment Requests</span>
          </button>
          <button 
            onclick="OrdersView.switchTab('assets')" 
            class="pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${this.activeTab === 'assets' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}"
          >
            <span class="material-symbols-outlined text-[18px]">devices</span>
            <span>Company Hardware & Assets</span>
          </button>
        </div>

        ${this.activeTab === 'requests' 
          ? this.renderRequestsSection(user, requests, selectedRequest) 
          : this.activeTab === 'assets'
          ? this.renderAssetsSection(user, assets, selectedAsset, allEmployees)
          : this.renderOrdersSection(user, orders, selectedOrder, totalCount, pendingApproval)}

        <!-- Modal: Create New Requisition -->
        <div id="new-order-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-lg overflow-hidden">
            <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[20px]">add_shopping_cart</span>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">New Procurement Requisition</h3>
              </div>
              <button onclick="OrdersView.closeNewOrderModal()" class="text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onsubmit="OrdersView.submitNewOrder(event)" class="p-6 space-y-4 text-xs">
              <div>
                <label class="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Product / Item Name *</label>
                <input id="order-product" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary" placeholder="e.g., Apple Studio Display 27-inch 5K" required />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Category *</label>
                  <select id="order-category" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary">
                    <option value="Hardware Equipment">Hardware Equipment</option>
                    <option value="Software & Licenses">Software & Licenses</option>
                    <option value="Office Ergonomics">Office Ergonomics</option>
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                  </select>
                </div>
                <div>
                  <label class="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Estimated Cost ($) *</label>
                  <input id="order-amount" type="number" step="0.01" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary" placeholder="199.00" required />
                </div>
              </div>
              <div>
                <label class="block font-bold text-on-surface-variant uppercase tracking-wider mb-1">Business Justification *</label>
                <textarea id="order-desc" rows="3" class="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary" placeholder="Provide business reason for hardware grant request..." required></textarea>
              </div>
              <div class="pt-4 border-t border-outline-variant/20 flex justify-end gap-2">
                <button type="button" onclick="OrdersView.closeNewOrderModal()" class="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container font-semibold">Cancel</button>
                <button type="submit" class="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-semibold">Submit Requisition</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Modal: Edit Request Note -->
        <div id="edit-note-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-md overflow-hidden" id="edit-note-modal-content">
          </div>
        </div>

        <!-- Modal: Reassign Asset -->
        <div id="reassign-asset-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-md overflow-hidden" id="reassign-asset-modal-content">
          </div>
        </div>
      </div>
    `;
  },

  renderRequestsSection(currentUser, requests, selectedRequest) {
    return `
      <!-- 2-Column Split Layout for Service Requests -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <!-- Left Column: Requests List (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-3">
          ${requests.length === 0 ? `
            <div class="p-8 text-center rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <span class="material-symbols-outlined text-[36px] text-outline mb-2">assignment</span>
              <p class="font-bold text-on-surface">No service requests found</p>
            </div>
          ` : requests.map(req => {
            const isSelected = selectedRequest && selectedRequest.id === req.id;
            const isOwner = req.ownerId === currentUser.id;
            return `
              <div 
                class="rounded-xl border p-space-md cursor-pointer transition-all duration-150 ${
                  isSelected 
                    ? 'bg-surface-container-lowest border-primary shadow-md ring-1 ring-primary/20' 
                    : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:shadow-sm'
                }"
                onclick="OrdersView.selectRequest('${req.id}')"
              >
                <div class="flex items-start justify-between gap-3">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs font-bold text-primary">${req.id}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        req.status === 'Approved' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' :
                        req.status === 'Pending Approval' || req.status === 'Pending Review' ? 'bg-tertiary-fixed-dim/30 text-tertiary font-bold' :
                        'bg-surface-container-high text-on-surface-variant'
                      }">
                        ${req.status}
                      </span>
                      ${isOwner ? `<span class="px-1.5 py-0.2 rounded bg-primary/20 text-primary text-[10px] font-bold">Your Request</span>` : ''}
                    </div>
                    <h3 class="font-title-md text-sm font-bold text-on-surface mt-1.5">${req.title}</h3>
                    <p class="text-xs text-on-surface-variant mt-0.5">
                      ${req.department} • Requested by ${req.owner ? req.owner.name : 'Employee #' + req.ownerId}
                    </p>
                  </div>
                  <div class="flex items-center gap-1 text-xs text-on-surface-variant shrink-0">
                    <span class="material-symbols-outlined text-[16px] text-outline">chat_bubble</span>
                    <span class="font-medium">${req.notesCount} note${req.notesCount !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Right Column: Request Details & Notes Inspector (5 cols) -->
        <div class="lg:col-span-5">
          ${selectedRequest ? `
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm sticky top-20">
              <!-- Header -->
              <div class="flex items-start justify-between pb-4 border-b border-outline-variant/20">
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-title-md text-title-md font-bold text-on-surface">${selectedRequest.title}</h2>
                  </div>
                  <p class="text-xs text-on-surface-variant mt-1 font-mono">
                    ${selectedRequest.id} • ${selectedRequest.department} Department
                  </p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedRequest.status === 'Approved' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' :
                  selectedRequest.status === 'Pending Approval' || selectedRequest.status === 'Pending Review' ? 'bg-tertiary-fixed-dim/30 text-tertiary font-bold' :
                  'bg-surface-container-high text-on-surface-variant'
                }">
                  ${selectedRequest.status}
                </span>
              </div>

              <!-- Owner & Approver Info -->
              <div class="grid grid-cols-2 gap-3 my-4">
                <div class="p-3 rounded-lg bg-surface-container-low">
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">REQUEST OWNER</span>
                  <p class="font-bold text-xs text-on-surface mt-1 truncate">${selectedRequest.owner ? selectedRequest.owner.name : 'Employee #' + selectedRequest.ownerId}</p>
                  <p class="text-[11px] text-on-surface-variant truncate">${selectedRequest.owner ? selectedRequest.owner.empId : 'N/A'} • ${selectedRequest.department}</p>
                  <p class="text-[11px] text-outline truncate">${selectedRequest.owner ? selectedRequest.owner.email : 'N/A'}</p>
                </div>
                <div class="p-3 rounded-lg bg-surface-container-low flex flex-col justify-between">
                  <div>
                    <span class="block text-[10px] uppercase font-bold text-on-surface-variant">DESIGNATED APPROVER</span>
                    <p class="font-bold text-xs text-on-surface mt-1 truncate">${selectedRequest.approver ? selectedRequest.approver.name : 'Department Reviewer'}</p>
                    <p class="text-[11px] text-on-surface-variant truncate">${selectedRequest.approver ? (selectedRequest.approver.jobTitle || selectedRequest.approver.department) : selectedRequest.department}</p>
                  </div>
                  ${selectedRequest.status === 'Approved' ? `
                    <div class="mt-2 text-[10px] text-secondary flex items-center gap-1 font-semibold">
                      <span class="material-symbols-outlined text-[14px]">check_circle</span>
                      <span class="truncate">Approved by ${selectedRequest.approvedByName || 'Authorized Reviewer'}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Approval Action (Visible only for Administrator or designated Approver when Pending Approval) -->
              ${(currentUser.role === 'Administrator' || currentUser.id === selectedRequest.approverId) && selectedRequest.status === 'Pending Approval' ? `
                <div class="mb-4 p-3 rounded-lg bg-secondary-container/20 border border-secondary/30 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary text-[20px]">verified_user</span>
                    <div>
                      <p class="text-xs font-bold text-on-surface">Approval Authority</p>
                      <p class="text-[11px] text-on-surface-variant">Sign-off required for requisition.</p>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button 
                      onclick="OrdersView.rejectRequest('${selectedRequest.id}')" 
                      class="px-3 py-1.5 rounded-lg bg-error/10 hover:bg-error/20 text-error text-xs font-semibold flex items-center gap-1 transition-all shrink-0"
                    >
                      <span class="material-symbols-outlined text-[16px]">cancel</span>
                      <span>Reject</span>
                    </button>
                    <button 
                      onclick="OrdersView.approveRequest('${selectedRequest.id}')" 
                      class="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                    >
                      <span class="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Approve Request</span>
                    </button>
                  </div>
                </div>
              ` : ''}

              <!-- Internal Notes & Activity Section -->
              <div class="mb-2">
                <div class="flex items-center justify-between mb-3">
                  <span class="text-xs uppercase font-bold text-on-surface-variant tracking-wider">
                    INTERNAL NOTES & ACTIVITY (${selectedRequest.notes ? selectedRequest.notes.length : 0})
                  </span>
                </div>

                <div class="space-y-3">
                  ${selectedRequest.notes && selectedRequest.notes.length > 0 ? selectedRequest.notes.map(note => {
                    const isOwnerOrAdmin = currentUser.role === 'Administrator' || selectedRequest.ownerId === currentUser.id;
                    const formattedDate = new Date(note.updatedAt || note.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return `
                      <div class="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-xs">
                        <div class="flex items-center justify-between mb-1.5">
                          <div class="flex items-center gap-2">
                            <span class="font-mono text-[10px] text-primary font-bold">${note.id}</span>
                            <span class="font-semibold text-on-surface">${note.authorName || 'Staff Member'}</span>
                          </div>
                          <span class="text-[10px] text-on-surface-variant">${formattedDate}</span>
                        </div>
                        <p class="text-on-surface leading-relaxed text-xs mb-2 whitespace-pre-wrap">${note.content}</p>

                        <div class="flex items-center justify-between pt-2 border-t border-outline-variant/20 text-[11px]">
                          <span class="text-on-surface-variant italic">Note activity verified</span>
                          ${isOwnerOrAdmin ? `
                            <button 
                              onclick="OrdersView.openEditNoteModal('${selectedRequest.id}', '${note.id}', '${encodeURIComponent(note.content)}')"
                              class="text-primary font-semibold hover:underline flex items-center gap-1"
                            >
                              <span class="material-symbols-outlined text-[13px]">edit</span>
                              <span>Edit Note</span>
                            </button>
                          ` : `
                            <span class="text-outline text-[10px] flex items-center gap-1">
                              <span class="material-symbols-outlined text-[12px]">lock</span>
                              Read-only
                            </span>
                          `}
                        </div>
                      </div>
                    `;
                  }).join('') : `
                    <p class="text-xs text-on-surface-variant italic p-4 text-center bg-surface-container-low rounded-lg">
                      No internal notes recorded on this request.
                    </p>
                  `}
                </div>
              </div>
            </div>
          ` : `
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-8 text-center text-on-surface-variant">
              Select a request from the list to view notes and activity.
            </div>
          `}
        </div>
      </div>
    `;
  },

  renderAssetsSection(currentUser, assets, selectedAsset, allEmployees) {
    const isManagerOrAdmin = currentUser.role === 'Administrator' || (selectedAsset && selectedAsset.managerId === currentUser.id);

    return `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <!-- Left Column: Assets List (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-3">
          ${assets.length === 0 ? `
            <div class="p-8 text-center rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <span class="material-symbols-outlined text-[36px] text-outline mb-2">devices</span>
              <p class="font-bold text-on-surface">No company assets found</p>
            </div>
          ` : assets.map(asset => {
            const isSelected = selectedAsset && selectedAsset.id === asset.id;
            const isAssignedToMe = asset.assignedTo === currentUser.id;

            return `
              <div 
                class="rounded-xl border p-space-md cursor-pointer transition-all duration-150 ${
                  isSelected 
                    ? 'bg-surface-container-lowest border-primary shadow-md ring-1 ring-primary/20' 
                    : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:shadow-sm'
                }"
                onclick="OrdersView.selectAsset('${asset.id}')"
              >
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-[20px]">
                        ${asset.type === 'Laptop' ? 'laptop_mac' : asset.type === 'Monitor' ? 'desktop_windows' : asset.type === 'Mobile' ? 'smartphone' : 'devices'}
                      </span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-bold text-primary">${asset.assetTag}</span>
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          asset.status === 'Assigned' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' :
                          asset.status === 'Available' ? 'bg-primary-container/30 text-primary font-bold' :
                          'bg-surface-container-high text-on-surface-variant'
                        }">
                          ${asset.status}
                        </span>
                        ${isAssignedToMe ? `<span class="px-1.5 py-0.2 rounded bg-primary/20 text-primary text-[10px] font-bold">Assigned to You</span>` : ''}
                      </div>
                      <h3 class="font-title-md text-sm font-bold text-on-surface mt-1">${asset.model}</h3>
                      <p class="text-xs text-on-surface-variant mt-0.5">
                        ${asset.location} • S/N: <span class="font-mono text-[11px]">${asset.serialNumber}</span>
                      </p>
                    </div>
                  </div>
                  <div class="text-right shrink-0">
                    <span class="text-[10px] uppercase font-bold text-on-surface-variant block">Current Assignee</span>
                    <span class="text-xs font-semibold text-on-surface mt-0.5 block">
                      ${asset.assignee ? asset.assignee.name : 'Unassigned (Vault)'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Right Column: Asset Details & Custody Inspector (5 cols) -->
        <div class="lg:col-span-5">
          ${selectedAsset ? `
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm sticky top-20">
              <!-- Header -->
              <div class="flex items-start justify-between pb-4 border-b border-outline-variant/20">
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-title-md text-title-md font-bold text-on-surface">${selectedAsset.model}</h2>
                  </div>
                  <p class="text-xs text-on-surface-variant mt-1 font-mono">
                    ${selectedAsset.assetTag} • ${selectedAsset.type}
                  </p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-semibold ${
                  selectedAsset.status === 'Assigned' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' :
                  selectedAsset.status === 'Available' ? 'bg-primary-container/30 text-primary font-bold' :
                  'bg-surface-container-high text-on-surface-variant'
                }">
                  ${selectedAsset.status}
                </span>
              </div>

              <!-- Asset Specs Info -->
              <div class="grid grid-cols-2 gap-3 my-4">
                <div class="p-3 rounded-lg bg-surface-container-low">
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">SERIAL NUMBER</span>
                  <p class="font-mono text-xs text-on-surface mt-1 font-semibold truncate">${selectedAsset.serialNumber}</p>
                  <p class="text-[11px] text-on-surface-variant truncate mt-0.5">${selectedAsset.location}</p>
                </div>
                <div class="p-3 rounded-lg bg-surface-container-low">
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">IT ASSET MANAGER</span>
                  <p class="font-bold text-xs text-on-surface mt-1 truncate">${selectedAsset.manager ? selectedAsset.manager.name : 'IT Operations'}</p>
                  <p class="text-[11px] text-on-surface-variant truncate mt-0.5">${selectedAsset.manager ? (selectedAsset.manager.jobTitle || selectedAsset.manager.department) : 'Enterprise Assets'}</p>
                </div>
              </div>

              <!-- Assignee Card -->
              <div class="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/20 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">ASSIGNED EMPLOYEE</span>
                  ${selectedAsset.assignedAt ? `
                    <span class="text-[10px] text-on-surface-variant">Assigned: ${new Date(selectedAsset.assignedAt).toLocaleDateString()}</span>
                  ` : ''}
                </div>
                ${selectedAsset.assignee ? `
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                      ${selectedAsset.assignee.name.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <p class="font-bold text-xs text-on-surface">${selectedAsset.assignee.name}</p>
                      <p class="text-[11px] text-on-surface-variant">${selectedAsset.assignee.jobTitle || selectedAsset.assignee.department} • ${selectedAsset.assignee.empId}</p>
                      <p class="text-[10px] text-outline">${selectedAsset.assignee.email}</p>
                    </div>
                  </div>
                ` : `
                  <p class="text-xs text-on-surface-variant italic py-1">Device currently available in corporate inventory vault.</p>
                `}
                ${selectedAsset.reassignedByName ? `
                  <div class="mt-2.5 pt-2 border-t border-outline-variant/20 text-[10px] text-on-surface-variant flex items-center gap-1">
                    <span class="material-symbols-outlined text-[13px] text-secondary">history</span>
                    <span>Last reassigned by <strong>${selectedAsset.reassignedByName}</strong> on ${new Date(selectedAsset.reassignedAt).toLocaleDateString()}</span>
                  </div>
                ` : ''}
              </div>

              <!-- Reassignment Action (Visible only for Administrator or designated Asset Manager) -->
              ${isManagerOrAdmin && (selectedAsset.status === 'Assigned' || selectedAsset.status === 'Available') ? `
                <div class="p-3.5 rounded-lg bg-secondary-container/20 border border-secondary/30 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-secondary text-[20px]">swap_horiz</span>
                    <div>
                      <p class="text-xs font-bold text-on-surface">Asset Custody Control</p>
                      <p class="text-[11px] text-on-surface-variant">Reassign device to another employee.</p>
                    </div>
                  </div>
                  <button 
                    onclick="OrdersView.openReassignAssetModal('${selectedAsset.id}')" 
                    class="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                  >
                    <span class="material-symbols-outlined text-[16px]">person_add</span>
                    <span>Reassign Asset</span>
                  </button>
                </div>
              ` : `
                <div class="p-3 rounded-lg bg-surface-container-low text-center text-[11px] text-outline flex items-center justify-center gap-1.5">
                  <span class="material-symbols-outlined text-[14px]">lock</span>
                  <span>Asset management custody controlled by IT Hardware Operations</span>
                </div>
              `}
            </div>
          ` : `
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-8 text-center text-on-surface-variant">
              Select an asset from the list to view custody and tracking details.
            </div>
          `}
        </div>
      </div>
    `;
  },

  renderOrdersSection(user, orders, selectedOrder, totalCount, pendingApproval) {
    return `
      <!-- Search & Filter Tabs -->
      <div class="flex flex-col lg:flex-row items-center justify-between gap-3 mb-6">
        <div class="relative flex-1 w-full max-w-md">
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input 
            class="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all shadow-sm" 
            placeholder="Search by Order ID (ORD-XXXX), item name..." 
            type="text"
            value="${this.searchQuery}"
            oninput="OrdersView.handleSearch(this.value)"
          />
        </div>

        <div class="flex items-center gap-2 overflow-x-auto w-full lg:w-auto">
          <button class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${this.selectedStatus === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30'}" onclick="OrdersView.filterStatus('all')">
            All Orders (${totalCount})
          </button>
          <button class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${this.selectedStatus === 'Pending Approval' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30'}" onclick="OrdersView.filterStatus('Pending Approval')">
            Pending Approval (${pendingApproval})
          </button>
          <button class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${this.selectedStatus === 'Approved' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30'}" onclick="OrdersView.filterStatus('Approved')">
            Approved
          </button>
          <button class="px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${this.selectedStatus === 'Delivered' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container border border-outline-variant/30'}" onclick="OrdersView.filterStatus('Delivered')">
            Delivered
          </button>

          <select class="h-10 px-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary text-xs shadow-sm">
            <option>Fiscal Year: FY2024</option>
            <option>Fiscal Year: FY2023</option>
          </select>

          <button class="p-2 rounded-lg bg-surface-container-lowest border border-outline-variant/40 hover:bg-surface-container text-on-surface-variant shadow-sm" title="Advanced Filter">
            <span class="material-symbols-outlined text-[18px]">tune</span>
          </button>
        </div>
      </div>

      <!-- Main 2-Column Split Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        <!-- Left Column: Orders List (7 cols) -->
        <div class="lg:col-span-7 flex flex-col gap-3">
          ${orders.length === 0 ? `
            <div class="p-8 text-center rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <span class="material-symbols-outlined text-[36px] text-outline mb-2">inventory_2</span>
              <p class="font-bold text-on-surface">No requisitions found</p>
              <p class="text-xs text-on-surface-variant mt-1">Try resetting your filters or submit a new requisition.</p>
            </div>
          ` : orders.map(order => {
            const isSelected = selectedOrder && selectedOrder.id === order.id;
            const itemCount = (order.items && order.items.length) || 1;
            return `
              <div 
                class="rounded-xl border p-space-md cursor-pointer transition-all duration-150 ${
                  isSelected 
                    ? 'bg-surface-container-lowest border-primary shadow-md ring-1 ring-primary/20' 
                    : 'bg-surface-container-lowest border-outline-variant/30 hover:border-outline-variant hover:shadow-sm'
                }"
                onclick="OrdersView.selectOrder('${order.id}')"
              >
                <!-- Card Header -->
                <div class="flex items-start justify-between">
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-[20px]">shopping_cart</span>
                    </div>
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="font-mono text-xs font-bold text-primary">${order.id}</span>
                        <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          order.status === 'Approved' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' :
                          order.status === 'Delivered' ? 'bg-surface-container-high text-on-surface-variant' :
                          order.status === 'Cancelled' ? 'bg-error-container/30 text-error' :
                          'bg-tertiary-fixed-dim/30 text-tertiary font-bold'
                        }">
                          ${order.status}
                        </span>
                      </div>
                      <p class="text-xs text-on-surface-variant mt-0.5">
                        Requisitioned on ${order.date} • ${order.category}
                      </p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="font-display-lg text-2xl font-bold text-on-surface">$${parseFloat(order.amount).toFixed(2)}</span>
                    <span class="block text-[10px] text-on-surface-variant font-medium">${order.grant || 'Standard Hardware Grant'}</span>
                  </div>
                </div>

                <!-- Product summary -->
                <div class="flex items-center justify-between mt-3 pt-2.5 border-t border-outline-variant/20 text-xs">
                  <div class="flex items-center gap-2 truncate mr-2">
                    <span class="material-symbols-outlined text-[16px] text-outline">package_2</span>
                    <span class="font-medium text-on-surface truncate">${order.product}</span>
                    <span class="px-1.5 py-0.2 rounded bg-surface-container text-on-surface-variant text-[10px]">${itemCount} item${itemCount > 1 ? 's' : ''}</span>
                  </div>
                  <div class="flex items-center gap-1 text-primary font-semibold hover:underline shrink-0">
                    <span>View Details</span>
                    <span class="material-symbols-outlined text-[14px]">chevron_right</span>
                  </div>
                </div>

                <!-- Shipment/Routing mini badge -->
                <div class="mt-2 text-xs flex items-center gap-2 text-on-surface-variant">
                  <span class="material-symbols-outlined text-[14px] ${order.status === 'Delivered' ? 'text-secondary' : 'text-primary'}">
                    ${order.status === 'Delivered' ? 'check_circle' : 'local_shipping'}
                  </span>
                  <span>${order.eta || 'FedEx Overnight (ETA: Tomorrow, 10:30 AM)'}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Right Column: Selected Order Details (5 cols) -->
        <div class="lg:col-span-5">
          ${selectedOrder ? `
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm sticky top-20">
              <!-- Header -->
              <div class="flex items-start justify-between pb-4 border-b border-outline-variant/20">
                <div>
                  <div class="flex items-center gap-2">
                    <h2 class="font-title-md text-title-md font-bold text-on-surface">Requisition Details — #${selectedOrder.id}</h2>
                    <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      selectedOrder.status === 'Approved' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' :
                      selectedOrder.status === 'Delivered' ? 'bg-surface-container-high text-on-surface-variant' :
                      selectedOrder.status === 'Cancelled' ? 'bg-error-container/30 text-error font-bold' :
                      'bg-tertiary-fixed-dim/30 text-tertiary font-bold'
                    }">
                      ${selectedOrder.status}
                    </span>
                  </div>
                  <p class="text-xs text-on-surface-variant mt-1 font-mono">
                    PO Token: ${selectedOrder.poToken || 'PO-2024-ENG-08992'} • Authorized Corporate Grant
                  </p>
                </div>
              </div>

              <!-- Requisitioner & Approver cards -->
              <div class="grid grid-cols-2 gap-3 my-4">
                <div class="p-3 rounded-lg bg-surface-container-low">
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">REQUISITIONER</span>
                  <p class="font-bold text-xs text-on-surface mt-1">${selectedOrder.requisitioner || user.name}</p>
                  <p class="text-[11px] text-on-surface-variant">${selectedOrder.requisitionerEmpId || user.empId} • Engineering</p>
                  <p class="text-[11px] text-outline truncate">${selectedOrder.requisitionerEmail || user.email}</p>
                </div>

                <div class="p-3 rounded-lg bg-surface-container-low">
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">APPROVER</span>
                  <p class="font-bold text-xs text-on-surface mt-1">${selectedOrder.approver || 'Marcus Vance'}</p>
                  <p class="text-[11px] text-on-surface-variant">${selectedOrder.approverEmpId || 'EMP-10024'} • ${selectedOrder.approverTitle || 'VP of Eng'}</p>
                  <span class="inline-flex items-center gap-1 text-[11px] text-secondary font-medium mt-0.5">
                    <span class="material-symbols-outlined text-[12px]">verified</span>
                    ${selectedOrder.autoCleared || 'Auto-cleared tier 1'}
                  </span>
                </div>
              </div>

              <!-- Courier & Routing progress track -->
              <div class="p-3.5 rounded-lg bg-surface-container-low mb-4">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[10px] uppercase font-bold text-on-surface-variant">COURIER & ROUTING</span>
                  <span class="font-bold text-[11px] text-primary">${selectedOrder.courier || 'FEDEX-PRIORITY'}</span>
                </div>
                <!-- Progress Bar -->
                <div class="flex items-center justify-between text-[11px] text-on-surface-variant mb-1 font-medium">
                  <span class="text-secondary font-bold">Ordered<br/><span class="text-[9px] font-normal text-outline">Oct 24, 09:12</span></span>
                  <span class="${selectedOrder.progressStep >= 2 ? 'text-secondary font-bold' : ''}">Dispatched<br/><span class="text-[9px] font-normal text-outline">Oct 25, 04:30</span></span>
                  <span class="${selectedOrder.progressStep >= 3 ? 'text-secondary font-bold' : ''}">Out for Delivery<br/><span class="text-[9px] font-normal text-outline">Oct 26 (Est.)</span></span>
                </div>
                <div class="w-full bg-surface-container rounded-full h-1.5 overflow-hidden mb-2">
                  <div class="bg-secondary h-full rounded-full" style="width: ${selectedOrder.progressStep === 3 ? '100%' : selectedOrder.progressStep === 2 ? '66%' : '33%'};"></div>
                </div>
                <div class="flex items-center justify-between text-xs pt-1 border-t border-outline-variant/20">
                  <span class="text-on-surface-variant">Tracking Number:</span>
                  <div class="flex items-center gap-1 font-mono font-bold text-on-surface">
                    <span>${selectedOrder.trackingNumber || '7892-4910-2210'}</span>
                    <button class="hover:text-primary" onclick="ProfileView.copyValue('${selectedOrder.trackingNumber || '7892-4910-2210'}', 'Tracking Number')">
                      <span class="material-symbols-outlined text-[16px]">content_copy</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- Destination Facility -->
              <div class="p-3 rounded-lg bg-surface-container-low mb-4 flex items-start gap-2.5">
                <span class="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">location_on</span>
                <div>
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">DESTINATION FACILITY</span>
                  <p class="font-bold text-xs text-on-surface mt-0.5">${selectedOrder.destinationFacility || '500 Howard St, Floor 3 Desk 34B'}</p>
                  <p class="text-[11px] text-on-surface-variant">${selectedOrder.destinationDetails || 'San Francisco HQ, CA 94105 • Attention: ' + user.name}</p>
                </div>
              </div>

              <!-- Itemization -->
              <div class="mb-4">
                <span class="block text-[10px] uppercase font-bold text-on-surface-variant mb-2">REQUISITION ITEMIZATION</span>
                <div class="space-y-2">
                  ${(selectedOrder.items || [
                    { name: selectedOrder.product, sku: 'SKU-LOG-MX3S', qty: 1, price: selectedOrder.amount }
                  ]).map(item => `
                    <div class="flex items-center justify-between p-2 rounded bg-surface-container-low text-xs">
                      <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-outline text-[18px]">inventory_2</span>
                        <div>
                          <p class="font-medium text-on-surface">${item.name}</p>
                          <span class="text-[10px] text-on-surface-variant font-mono">SKU: ${item.sku} • Qty: ${item.qty}</span>
                        </div>
                      </div>
                      <span class="font-bold text-on-surface">$${parseFloat(item.price).toFixed(2)}</span>
                    </div>
                  `).join('')}
                </div>

                <div class="mt-3 pt-3 border-t border-outline-variant/20 space-y-1 text-xs">
                  <div class="flex items-center justify-between text-on-surface-variant">
                    <span>Subtotal Items</span>
                    <span>$${(selectedOrder.subtotal || selectedOrder.amount).toFixed(2)}</span>
                  </div>
                  <div class="flex items-center justify-between text-secondary">
                    <span>Corporate Discount (Enterprise MSA)</span>
                    <span>-$0.00</span>
                  </div>
                  <div class="flex items-center justify-between font-bold text-on-surface pt-1 border-t border-outline-variant/20">
                    <span>Total Allocated Grant</span>
                    <span class="text-primary text-base font-bold">$${parseFloat(selectedOrder.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <!-- Action buttons -->
              <div class="pt-4 border-t border-outline-variant/20 flex flex-col gap-2">
                <div class="flex items-center gap-2">
                  <button 
                    class="flex-1 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    onclick="OrdersView.downloadReceipt('${selectedOrder.id}')"
                  >
                    <span class="material-symbols-outlined text-[16px]">receipt_long</span>
                    <span>PO Receipt</span>
                  </button>
                  <button 
                    class="flex-1 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    onclick="OrdersView.printSummary('${selectedOrder.id}')"
                  >
                    <span class="material-symbols-outlined text-[16px]">print</span>
                    <span>Print Voucher</span>
                  </button>
                </div>

                ${selectedOrder.status !== 'Cancelled' && selectedOrder.status !== 'Delivered' ? `
                  <button 
                    class="w-full py-2 rounded-lg bg-error/10 hover:bg-error/20 text-error font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    onclick="OrdersView.cancelOrder('${selectedOrder.id}')"
                  >
                    <span class="material-symbols-outlined text-[16px]">cancel</span>
                    <span>Cancel Requisition</span>
                  </button>
                ` : ''}
              </div>
            </div>
          ` : `
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-8 text-center text-on-surface-variant">
              Select an order from the list to view its tracking and routing details.
            </div>
          `}
        </div>
      </div>
    `;
  },

  handleSearch(query) {
    this.searchQuery = query;
    AppRouter.renderCurrentRoute();
  },

  filterStatus(status) {
    this.selectedStatus = status;
    AppRouter.renderCurrentRoute();
  },

  selectOrder(id) {
    this.selectedOrderId = id;
    AppRouter.renderCurrentRoute();
  },

  selectRequest(id) {
    this.selectedRequestId = id;
    AppRouter.renderCurrentRoute();
  },

  exportReport() {
    State.showToast('Generating Corporate Procurement PO Report...', 'download');
  },

  downloadReceipt(id) {
    State.showToast(`Downloading signed PO Receipt for #${id}...`, 'download');
  },

  printSummary(id) {
    State.showToast(`Printing summary voucher for #${id}...`, 'print');
  },

  async cancelOrder(id) {
    if (!confirm(`Are you sure you want to cancel requisition #${id}?`)) return;
    try {
      const res = await State.apiFetch(`/api/orders/${id}/cancel`, {
        method: 'POST'
      });
      State.showToast(res.message || `Requisition #${id} marked as cancelled`, 'cancel');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  openNewOrderModal() {
    const modal = document.getElementById('new-order-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeNewOrderModal() {
    const modal = document.getElementById('new-order-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitNewOrder(event) {
    event.preventDefault();
    const product = document.getElementById('order-product').value;
    const category = document.getElementById('order-category').value;
    const amount = parseFloat(document.getElementById('order-amount').value) || 199.00;
    const description = document.getElementById('order-desc').value;

    try {
      const res = await State.apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          product,
          category,
          amount,
          description,
          items: [{ name: product, sku: `REQ-${Math.floor(1000+Math.random()*9000)}`, qty: 1, price: amount }]
        })
      });

      this.selectedOrderId = res.order.id;
      this.closeNewOrderModal();
      State.showToast(`Requisition #${res.order.id} submitted for approval!`, 'check_circle');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  openEditNoteModal(requestId, noteId, encodedContent) {
    const content = decodeURIComponent(encodedContent || '');
    const modal = document.getElementById('edit-note-modal');
    const modalContent = document.getElementById('edit-note-modal-content');

    modalContent.innerHTML = `
      <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">edit_note</span>
          <h3 class="font-title-md text-title-md font-bold text-on-surface">Edit Request Note</h3>
        </div>
        <button onclick="OrdersView.closeEditNoteModal()" class="text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form onsubmit="OrdersView.submitEditNote(event, '${requestId}', '${noteId}')" class="p-6 space-y-4 text-xs">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block font-bold text-on-surface-variant uppercase tracking-wider">Note Content *</label>
            <span class="font-mono text-[10px] text-outline">${requestId} / ${noteId}</span>
          </div>
          <textarea 
            id="edit-note-content-input" 
            rows="4" 
            class="w-full p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary" 
            placeholder="Update procurement or provisioning note..." 
            required
          >${content}</textarea>
        </div>
        <p class="text-[11px] text-on-surface-variant leading-relaxed">
          Updates will be logged in the internal compliance activity ledger and visible to requisitioners.
        </p>
        <div class="pt-4 border-t border-outline-variant/20 flex justify-end gap-2">
          <button type="button" onclick="OrdersView.closeEditNoteModal()" class="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-semibold">Save Changes</button>
        </div>
      </form>
    `;

    modal.classList.remove('hidden');
  },

  closeEditNoteModal() {
    const modal = document.getElementById('edit-note-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitEditNote(event, requestId, noteId) {
    event.preventDefault();
    const input = document.getElementById('edit-note-content-input');
    if (!input || !input.value.trim()) {
      State.showToast('Note content cannot be empty.', 'error');
      return;
    }

    try {
      const res = await State.apiFetch(`/api/requests/${requestId}/notes/${noteId}`, {
        method: 'PUT',
        body: JSON.stringify({ content: input.value.trim() })
      });

      this.closeEditNoteModal();
      State.showToast(res.message || 'Note updated successfully', 'check_circle');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message || 'Failed to update note', 'error');
    }
  },

  async approveRequest(requestId) {
    try {
      const res = await State.apiFetch(`/api/requests/${requestId}/approve`, {
        method: 'POST'
      });
      State.showToast(res.message || 'Request approved successfully', 'check_circle');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message || 'Failed to approve request', 'error');
    }
  },

  async rejectRequest(requestId) {
    const reason = prompt('Optional reason for rejecting this requisition:');
    try {
      const res = await State.apiFetch(`/api/requests/${requestId}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: reason || 'Rejected by designated reviewer' })
      });
      State.showToast(res.message || 'Request rejected successfully', 'cancel');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message || 'Failed to reject request', 'error');
    }
  },

  selectAsset(id) {
    this.selectedAssetId = id;
    AppRouter.renderCurrentRoute();
  },

  async openReassignAssetModal(assetId) {
    const modal = document.getElementById('reassign-asset-modal');
    const modalContent = document.getElementById('reassign-asset-modal-content');
    if (!modal || !modalContent) return;

    let employees = [];
    try {
      const res = await State.apiFetch('/api/employees');
      employees = res.employees || [];
    } catch (err) {
      console.warn('Failed to load employees for asset reassignment:', err);
    }

    let asset = null;
    try {
      const res = await State.apiFetch(`/api/assets/${assetId}`);
      asset = res.asset;
    } catch (err) {
      console.warn('Failed to load asset details:', err);
    }

    modalContent.innerHTML = `
      <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-primary text-[20px]">swap_horiz</span>
          <h3 class="font-title-md text-title-md font-bold text-on-surface">Reassign Hardware Custody</h3>
        </div>
        <button onclick="OrdersView.closeReassignAssetModal()" class="text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined">close</span>
        </button>
      </div>
      <form onsubmit="OrdersView.submitReassignAsset(event, '${assetId}')" class="p-6 space-y-4 text-xs">
        <div>
          <div class="flex items-center justify-between mb-1.5">
            <label class="block font-bold text-on-surface-variant uppercase tracking-wider">Asset Item</label>
            <span class="font-mono text-[10px] text-outline">${asset ? asset.assetTag : assetId}</span>
          </div>
          <div class="p-3 rounded-lg bg-surface-container-low border border-outline-variant/30">
            <p class="font-bold text-on-surface">${asset ? asset.model : assetId}</p>
            <p class="text-[11px] text-on-surface-variant mt-0.5">Currently assigned to: <strong>${asset && asset.assignee ? asset.assignee.name : 'Unassigned'}</strong></p>
          </div>
        </div>

        <div>
          <label class="block font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">New Assignee (Employee) *</label>
          <select id="reassign-target-employee" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary" required>
            <option value="">Select an employee...</option>
            ${employees.map(emp => `
              <option value="${emp.id}" ${asset && asset.assignedTo === emp.id ? 'selected' : ''}>
                ${emp.name} (${emp.empId}) — ${emp.department}
              </option>
            `).join('')}
          </select>
        </div>

        <p class="text-[11px] text-on-surface-variant leading-relaxed">
          Reassignment will transfer hardware responsibility and record the custody update in corporate audit logs.
        </p>

        <div class="pt-4 border-t border-outline-variant/20 flex justify-end gap-2">
          <button type="button" onclick="OrdersView.closeReassignAssetModal()" class="px-4 py-2 rounded-lg border border-outline-variant/40 text-on-surface hover:bg-surface-container font-semibold">Cancel</button>
          <button type="submit" class="px-5 py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-semibold">Confirm Reassignment</button>
        </div>
      </form>
    `;

    modal.classList.remove('hidden');
  },

  closeReassignAssetModal() {
    const modal = document.getElementById('reassign-asset-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitReassignAsset(event, assetId) {
    event.preventDefault();
    const select = document.getElementById('reassign-target-employee');
    if (!select || !select.value) {
      State.showToast('Please select a target employee.', 'error');
      return;
    }

    try {
      const res = await State.apiFetch(`/api/assets/${assetId}/assignment`, {
        method: 'PUT',
        body: JSON.stringify({ assignedTo: parseInt(select.value, 10) })
      });

      this.closeReassignAssetModal();
      State.showToast(res.message || 'Asset reassigned successfully', 'check_circle');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message || 'Failed to reassign asset', 'error');
    }
  }
};

window.OrdersView = OrdersView;
