// Expenses & Invoices View Component
const ExpensesView = {
  selectedStatus: 'all',
  selectedCategory: 'all',
  selectedExpenseId: null,

  async render(currentUser) {
    const user = currentUser || State.user;
    const isAdmin = user && user.role === 'Administrator';

    let expenses = [];
    try {
      const queryParams = new URLSearchParams();
      if (this.selectedStatus !== 'all') queryParams.set('status', this.selectedStatus);
      if (this.selectedCategory !== 'all') queryParams.set('category', this.selectedCategory);

      const res = await State.apiFetch(`/api/expenses?${queryParams.toString()}`);
      expenses = res.expenses || [];
    } catch (err) {
      console.warn('Failed to load expenses:', err);
    }

    const totalAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const approvedCount = expenses.filter(e => e.status === 'Approved' || e.status === 'Reimbursed').length;
    const pendingCount = expenses.filter(e => e.status === 'Pending Review').length;

    return `
      <div class="space-y-6">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="material-symbols-outlined text-primary text-[28px]">receipt_long</span>
              <h1 class="font-headline-md text-headline-md font-bold text-on-surface">
                ${isAdmin ? 'Company Expenses & Reimbursable Claims' : 'My Expenses & Reimbursable Claims'}
              </h1>
            </div>
            <p class="text-sm text-on-surface-variant">
              ${isAdmin ? 'Enterprise audit log of submitted travel, vendor invoices, and employee expense reports.' : 'Track submitted corporate expenses, travel receipts, and reimbursement approval status.'}
            </p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="ExpensesView.handleNewClaim()" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold shadow-sm hover:bg-on-primary-fixed-variant transition-all flex items-center gap-2">
              <span class="material-symbols-outlined text-[18px]">add</span>
              <span>Submit Expense</span>
            </button>
          </div>
        </div>

        <!-- Metric Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Total Amount</p>
              <p class="text-2xl font-bold text-on-surface">$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]">account_balance_wallet</span>
            </div>
          </div>
          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Approved Claims</p>
              <p class="text-2xl font-bold text-secondary">${approvedCount}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]">verified</span>
            </div>
          </div>
          <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <p class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Pending Review</p>
              <p class="text-2xl font-bold text-tertiary-container">${pendingCount}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-tertiary-container/10 text-tertiary-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]">pending_actions</span>
            </div>
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-on-surface-variant uppercase">Filter Status:</span>
            <div class="flex gap-1">
              ${['all', 'Approved', 'Pending Review', 'Reimbursed'].map(s => `
                <button onclick="ExpensesView.filterStatus('${s}')" class="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${this.selectedStatus === s ? 'bg-primary text-on-primary font-semibold' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'}">
                  ${s === 'all' ? 'All Records' : s}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="text-xs text-on-surface-variant">
            Showing <span class="font-bold text-on-surface">${expenses.length}</span> record${expenses.length === 1 ? '' : 's'}
          </div>
        </div>

        <!-- Expenses Table -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-surface-container-low text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30">
                <tr>
                  <th class="py-3.5 px-4">Claim ID</th>
                  <th class="py-3.5 px-4">Title / Purpose</th>
                  ${isAdmin ? '<th class="py-3.5 px-4">Employee</th>' : ''}
                  <th class="py-3.5 px-4">Category</th>
                  <th class="py-3.5 px-4">Merchant</th>
                  <th class="py-3.5 px-4">Date</th>
                  <th class="py-3.5 px-4">Amount</th>
                  <th class="py-3.5 px-4">Status</th>
                  <th class="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/20">
                ${expenses.length === 0 ? `
                  <tr>
                    <td colspan="${isAdmin ? 9 : 8}" class="py-8 text-center text-on-surface-variant text-sm">
                      No expense records found matching current filters.
                    </td>
                  </tr>
                ` : expenses.map(e => `
                  <tr class="hover:bg-surface-container-low/50 transition-colors">
                    <td class="py-3.5 px-4 font-mono font-semibold text-primary text-xs">${e.id}</td>
                    <td class="py-3.5 px-4">
                      <p class="font-medium text-on-surface">${e.title}</p>
                      <p class="text-xs text-on-surface-variant truncate max-w-xs">${e.description || ''}</p>
                    </td>
                    ${isAdmin ? `
                      <td class="py-3.5 px-4">
                        <p class="font-medium text-on-surface text-xs">${e.employeeName}</p>
                        <p class="text-[11px] text-on-surface-variant">${e.department}</p>
                      </td>
                    ` : ''}
                    <td class="py-3.5 px-4">
                      <span class="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant text-xs">${e.category}</span>
                    </td>
                    <td class="py-3.5 px-4 text-on-surface text-xs">${e.merchant || '—'}</td>
                    <td class="py-3.5 px-4 text-on-surface-variant text-xs">${new Date(e.submissionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td class="py-3.5 px-4 font-bold text-on-surface font-mono">$${Number(e.amount).toFixed(2)}</td>
                    <td class="py-3.5 px-4">
                      ${this.renderStatusBadge(e.status)}
                    </td>
                    <td class="py-3.5 px-4 text-right">
                      <button onclick="ExpensesView.viewDetail('${e.id}')" class="px-3 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs transition-colors">
                        Details
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Detail Modal Container -->
        <div id="expense-modal-root"></div>
      </div>
    `;
  },

  renderStatusBadge(status) {
    if (status === 'Approved') {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">Approved</span>';
    } else if (status === 'Reimbursed') {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">Reimbursed</span>';
    } else {
      return '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-tertiary-container/10 text-tertiary-container">Pending Review</span>';
    }
  },

  filterStatus(status) {
    this.selectedStatus = status;
    AppRouter.renderCurrentRoute();
  },

  handleNewClaim() {
    State.showToast('Corporate expense submission portal is active for current fiscal quarter.', 'info');
  },

  async viewDetail(id) {
    try {
      const res = await State.apiFetch(`/api/expenses/${id}`);
      if (!res.expense) {
        State.showToast('Expense record not found', 'error');
        return;
      }
      this.openModal(res.expense);
    } catch (err) {
      State.showToast(err.message || 'Failed to fetch expense details', 'error');
    }
  },

  openModal(exp) {
    const root = document.getElementById('expense-modal-root');
    if (!root) return;

    root.innerHTML = `
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onclick="if(event.target === this) ExpensesView.closeModal()">
        <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
          <div class="flex items-center justify-between pb-3 border-b border-outline-variant/20">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-bold text-primary">${exp.id}</span>
                ${this.renderStatusBadge(exp.status)}
              </div>
              <h2 class="font-title-lg text-title-lg font-bold text-on-surface mt-1">${exp.title}</h2>
            </div>
            <button onclick="ExpensesView.closeModal()" class="w-8 h-8 rounded-lg hover:bg-surface-container-low flex items-center justify-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div class="space-y-3 text-sm">
            <div class="flex justify-between py-1.5 border-b border-outline-variant/10">
              <span class="text-on-surface-variant">Claimant</span>
              <span class="font-semibold text-on-surface">${exp.employeeName} (${exp.department})</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-outline-variant/10">
              <span class="text-on-surface-variant">Category</span>
              <span class="font-semibold text-on-surface">${exp.category}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-outline-variant/10">
              <span class="text-on-surface-variant">Merchant / Vendor</span>
              <span class="font-semibold text-on-surface">${exp.merchant || '—'}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-outline-variant/10">
              <span class="text-on-surface-variant">Submitted Date</span>
              <span class="font-mono text-on-surface text-xs">${new Date(exp.submissionDate).toLocaleString()}</span>
            </div>
            <div class="flex justify-between py-1.5 border-b border-outline-variant/10">
              <span class="text-on-surface-variant">Claim Amount</span>
              <span class="font-mono font-bold text-on-surface text-base">$${Number(exp.amount).toFixed(2)} ${exp.currency || 'USD'}</span>
            </div>
            <div>
              <p class="text-xs font-bold uppercase text-on-surface-variant mb-1">Business Purpose / Notes</p>
              <p class="p-3 rounded-lg bg-surface-container-low text-xs text-on-surface leading-relaxed">${exp.description || 'No additional notes provided.'}</p>
            </div>
          </div>

          <div class="pt-3 flex justify-end gap-2 border-t border-outline-variant/20">
            <button onclick="ExpensesView.closeModal()" class="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-on-surface">
              Close
            </button>
          </div>
        </div>
      </div>
    `;
  },

  closeModal() {
    const root = document.getElementById('expense-modal-root');
    if (root) root.innerHTML = '';
  }
};
