// Order Lookup View
// Check #34 — Order Lookup (SQL Injection)
//
// Authenticated order reference lookup interface.
// Communicates with GET /api/orders/lookup?reference=<value>

const OrderLookupView = {
  _currentRef: '',
  _lastOrder: null,

  async render(currentUser) {
    const user = currentUser || State.user;

    return `
      <div class="flex flex-col w-full pb-12 max-w-4xl mx-auto" id="order-lookup-root">

        <!-- Breadcrumb & Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
              <span>Procurement & Requisitions</span>
              <span>/</span>
              <span class="text-on-surface-variant">Order Lookup</span>
            </div>
            <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Procurement Order Reference Lookup
            </h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Verify procurement order status, requisitions, equipment fulfillment, and department allocation.
            </p>
          </div>
        </div>

        <!-- Search Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-sm mb-6">
          <form onsubmit="event.preventDefault(); OrderLookupView.handleLookup();" class="flex flex-col sm:flex-row gap-3">
            <div class="relative flex-1">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
                receipt_long
              </span>
              <input
                type="text"
                id="order-lookup-input"
                class="w-full h-11 pl-11 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm font-mono uppercase transition-colors"
                placeholder="Enter order reference (e.g. ORD-7935)..."
                value="${this._escapeHtml(this._currentRef)}"
              />
            </div>
            <button
              type="submit"
              id="order-lookup-btn"
              class="h-11 px-6 rounded-xl bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-label-md text-label-md transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
            >
              <span class="material-symbols-outlined text-[18px]">search</span>
              <span>Lookup Order</span>
            </button>
          </form>

          <!-- Suggested Reference Chips -->
          <div class="flex items-center gap-2 mt-4 pt-4 border-t border-outline-variant/20 flex-wrap">
            <span class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mr-1">Recent Requisitions:</span>
            ${['ORD-7935', 'ORD-7920', 'ORD-7940'].map(ref => `
              <button
                type="button"
                onclick="OrderLookupView.quickLookup('${ref}')"
                class="px-3 py-1 rounded-lg bg-surface-container font-mono text-xs font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
              >
                ${ref}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Order Display Container -->
        <div id="order-lookup-results-area">
          ${this._buildInitialState()}
        </div>

      </div>
    `;
  },

  async afterRender() {
    const input = document.getElementById('order-lookup-input');
    if (input) {
      input.focus();
    }
    if (this._currentRef) {
      this.handleLookup();
    }
  },

  _buildInitialState() {
    return `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
        <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-[28px]">receipt_long</span>
        </div>
        <h3 class="font-title-md text-title-md font-bold text-on-surface mb-1">Enter an Order Reference</h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
          Enter an order identifier (e.g. <span class="font-mono text-primary font-semibold">ORD-7935</span>) to view complete requisition details, approver notes, and equipment fulfillment status.
        </p>
      </div>
    `;
  },

  quickLookup(ref) {
    const input = document.getElementById('order-lookup-input');
    if (input) {
      input.value = ref;
    }
    this.handleLookup();
  },

  async handleLookup() {
    const input = document.getElementById('order-lookup-input');
    const reference = input ? input.value.trim() : '';
    this._currentRef = reference;

    const resultsArea = document.getElementById('order-lookup-results-area');
    if (!resultsArea) return;

    if (!reference) {
      resultsArea.innerHTML = this._buildInitialState();
      return;
    }

    resultsArea.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
        <span class="material-symbols-outlined text-[32px] text-primary animate-spin mb-3">progress_activity</span>
        <p class="font-body-sm text-body-sm text-on-surface-variant">Retrieving procurement record from database...</p>
      </div>
    `;

    try {
      const data = await State.apiFetch(`/api/orders/lookup?reference=${encodeURIComponent(reference)}`);
      this._lastOrder = data.order;
      this._renderOrder(data.order);
    } catch (err) {
      resultsArea.innerHTML = `
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-8 shadow-sm">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-error/10 text-error flex items-center justify-center shrink-0 mt-0.5">
              <span class="material-symbols-outlined text-[22px]">error</span>
            </div>
            <div>
              <h3 class="font-title-md text-title-md font-bold text-on-surface mb-1">Lookup Failed</h3>
              <p class="font-body-sm text-body-sm text-on-surface-variant">${this._escapeHtml(err.message || 'Unable to locate order record.')}</p>
            </div>
          </div>
        </div>
      `;
    }
  },

  _renderOrder(order) {
    const resultsArea = document.getElementById('order-lookup-results-area');
    if (!resultsArea) return;

    if (!order) {
      resultsArea.innerHTML = `
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto mb-3">
            <span class="material-symbols-outlined text-[24px]">search_off</span>
          </div>
          <h3 class="font-title-md text-title-md font-bold text-on-surface mb-1">Order Not Found</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            No procurement order found with reference "${this._escapeHtml(this._currentRef)}".
          </p>
        </div>
      `;
      return;
    }

    const statusBadge = order.status === 'Approved'
      ? '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-secondary/10 text-secondary border border-secondary/20 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>Approved</span>'
      : order.status === 'Pending Approval'
      ? '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-tertiary/10 text-tertiary border border-tertiary/20 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span>Pending Approval</span>'
      : '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span>Under Review</span>';

    const formattedAmount = typeof order.amount === 'number'
      ? `$${order.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : order.amount;

    resultsArea.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-8 shadow-sm">
        
        <!-- Header banner -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-outline-variant/20">
          <div>
            <div class="flex items-center gap-3 mb-1.5">
              <span class="font-mono text-sm font-bold text-primary px-2.5 py-0.5 rounded bg-primary/10 border border-primary/20">
                ${this._escapeHtml(order.order_number || '')}
              </span>
              ${statusBadge}
            </div>
            <h2 class="font-headline-sm text-headline-sm font-bold text-on-surface">
              ${this._escapeHtml(order.title || '')}
            </h2>
          </div>
          <div class="text-right sm:border-l sm:border-outline-variant/20 sm:pl-6">
            <span class="text-xs uppercase font-semibold text-on-surface-variant block mb-0.5">Total Amount</span>
            <span class="font-headline-sm text-headline-sm font-bold text-on-surface font-mono">
              ${this._escapeHtml(formattedAmount)}
            </span>
          </div>
        </div>

        <!-- Detail Fields Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-6 border-b border-outline-variant/20">
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Requester</span>
            <p class="font-body-sm text-body-sm font-semibold text-on-surface">${this._escapeHtml(order.requester_name || 'N/A')}</p>
            <p class="text-xs text-on-surface-variant mt-0.5">${this._escapeHtml(order.requester_email || '')}</p>
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Department</span>
            <p class="font-body-sm text-body-sm font-semibold text-on-surface">${this._escapeHtml(order.department || 'N/A')}</p>
            <p class="text-xs text-on-surface-variant mt-0.5">Corporate Procurement</p>
          </div>
          <div>
            <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1">Submitted Date</span>
            <p class="font-body-sm text-body-sm font-semibold text-on-surface font-mono">${this._escapeHtml(order.created_at || 'N/A')}</p>
            <p class="text-xs text-on-surface-variant mt-0.5">Fiscal Year 2026</p>
          </div>
        </div>

        <!-- Description -->
        <div class="pt-6">
          <span class="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">Requisition Purpose & Justification</span>
          <p class="font-body-md text-body-md text-on-surface bg-surface-container-low p-4 rounded-xl border border-outline-variant/30 leading-relaxed">
            ${this._escapeHtml(order.description || 'No additional remarks provided for this requisition.')}
          </p>
        </div>

      </div>
    `;
  },

  _escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
};

window.OrderLookupView = OrderLookupView;
