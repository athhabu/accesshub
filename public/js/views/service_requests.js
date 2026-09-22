// =============================================================================
// Service Requests View — Check #42
// =============================================================================
// Realistic internal service and equipment request management portal.
// Users can file new requests and managers can aggregate departmental activity.
// The vulnerability lives entirely on the server side (Second-Order SQL Injection)
// where stored requestor data is reused in an unparameterized report aggregation query.
// =============================================================================

const ServiceRequestsView = {
  requests: [],

  render(user) {
    const currentName = (user && user.name) || 'Alex Mercer';
    const currentEmail = (user && user.email) || 'alex.mercer@accesshub.internal';
    const currentDept = (user && user.department) || 'Engineering';

    return `
      <div class="max-w-6xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="font-headline-sm text-headline-sm font-bold text-on-surface">Service Desk & Requests</h1>
            <p class="text-sm text-on-surface-variant mt-1">Submit internal requests for hardware, software access, network provisioning, and facilities.</p>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px] text-primary">confirmation_number</span>
            <span>Ticket Queue v4.0</span>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <!-- Left Column: Submit New Request (Stage 1 Safe Parameterized) -->
          <div class="lg:col-span-1 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6 space-y-4">
            <div class="flex items-center gap-2.5 pb-3 border-b border-outline-variant/20">
              <span class="material-symbols-outlined text-primary text-[20px]">add_circle</span>
              <h2 class="font-title-md font-semibold text-on-surface">New Request</h2>
            </div>

            <form id="service-request-form" onsubmit="event.preventDefault(); ServiceRequestsView.submit();" class="space-y-3.5">
              <div>
                <label for="req-name" class="block font-label-md text-label-md font-medium text-on-surface mb-1">
                  Requestor Full Name
                </label>
                <input
                  id="req-name"
                  type="text"
                  value="${currentName}"
                  placeholder="e.g. Alex Mercer"
                  class="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label for="req-email" class="block font-label-md text-label-md font-medium text-on-surface mb-1">
                  Requestor Email
                </label>
                <input
                  id="req-email"
                  type="email"
                  value="${currentEmail}"
                  placeholder="user@accesshub.internal"
                  class="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div class="grid grid-cols-2 gap-2.5">
                <div>
                  <label for="req-dept" class="block font-label-md text-label-md font-medium text-on-surface mb-1">
                    Department
                  </label>
                  <select id="req-dept" class="w-full h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary">
                    <option value="Engineering" ${currentDept === 'Engineering' ? 'selected' : ''}>Engineering</option>
                    <option value="Finance" ${currentDept === 'Finance' ? 'selected' : ''}>Finance</option>
                    <option value="Security" ${currentDept === 'Security' ? 'selected' : ''}>Security</option>
                    <option value="People Ops" ${currentDept === 'People Ops' ? 'selected' : ''}>People Ops</option>
                    <option value="Operations" ${currentDept === 'Operations' ? 'selected' : ''}>Operations</option>
                  </select>
                </div>

                <div>
                  <label for="req-priority" class="block font-label-md text-label-md font-medium text-on-surface mb-1">
                    Priority
                  </label>
                  <select id="req-priority" class="w-full h-9 px-2 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary">
                    <option value="Normal" selected>Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label for="req-category" class="block font-label-md text-label-md font-medium text-on-surface mb-1">
                  Category
                </label>
                <select id="req-category" class="w-full h-9 px-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary">
                  <option value="Hardware">Hardware Provisioning</option>
                  <option value="Software License">Software License</option>
                  <option value="Access Request">Access & RBAC</option>
                  <option value="Network">Network & VPN</option>
                  <option value="Compliance">Security / Compliance</option>
                </select>
              </div>

              <div>
                <label for="req-subject" class="block font-label-md text-label-md font-medium text-on-surface mb-1">
                  Subject
                </label>
                <input
                  id="req-subject"
                  type="text"
                  placeholder="e.g. Ergonomic Monitor Replacement"
                  class="w-full h-9 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div>
                <label for="req-desc" class="block font-label-md text-label-md font-medium text-on-surface mb-1">
                  Description / Justification
                </label>
                <textarea
                  id="req-desc"
                  rows="3"
                  placeholder="Provide business justification and details..."
                  class="w-full p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary resize-none"
                ></textarea>
              </div>

              <button
                id="submit-req-btn"
                type="submit"
                class="w-full h-9 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition-colors"
              >
                <span class="material-symbols-outlined text-[16px]">send</span>
                Submit Service Ticket
              </button>
            </form>
          </div>

          <!-- Right Column: Request Queue & Report Generation (Stage 2) -->
          <div class="lg:col-span-2 space-y-6">

            <!-- Active Requests List -->
            <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6">
              <div class="flex items-center justify-between gap-4 pb-4 mb-4 border-b border-outline-variant/20">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[20px]">inbox</span>
                  <h2 class="font-title-md font-semibold text-on-surface">Service Tickets Queue</h2>
                </div>
                <div class="flex items-center gap-2">
                  <select
                    id="req-status-filter"
                    onchange="ServiceRequestsView.loadRequests()"
                    class="h-8 px-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-xs text-on-surface focus:outline-none focus:border-primary"
                  >
                    <option value="all">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="In Progress">In Progress</option>
                  </select>
                  <button
                    onclick="ServiceRequestsView.loadRequests()"
                    class="h-8 w-8 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface flex items-center justify-center transition-colors"
                    title="Refresh Queue"
                  >
                    <span class="material-symbols-outlined text-[16px]">refresh</span>
                  </button>
                </div>
              </div>

              <div id="service-requests-table-container" class="overflow-x-auto min-h-[160px]">
                <div class="flex items-center justify-center py-10 text-on-surface-variant text-sm">
                  <span class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  Loading requests...
                </div>
              </div>
            </div>

            <!-- Stage 2 Report Output Container -->
            <div id="service-report-container"></div>

          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadRequests();
  },

  async loadRequests() {
    const filterEl = document.getElementById('req-status-filter');
    const container = document.getElementById('service-requests-table-container');
    if (!container) return;

    const status = filterEl ? filterEl.value : 'all';

    try {
      const res = await State.apiFetch(`/api/service-requests?status=${encodeURIComponent(status)}`);
      this.requests = (res && res.requests) || [];

      if (this.requests.length === 0) {
        container.innerHTML = `
          <div class="text-center py-8 text-on-surface-variant text-xs">
            No service requests found for this status.
          </div>
        `;
        return;
      }

      const rows = this.requests.map(req => {
        const priorityColors = {
          Normal: 'bg-surface-container text-on-surface-variant',
          High: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
          Urgent: 'bg-error-container/40 text-error'
        };
        const pBadge = priorityColors[req.priority] || priorityColors.Normal;

        return `
          <tr class="border-b border-outline-variant/15 hover:bg-surface-container-low/50 transition-colors">
            <td class="py-2.5 px-3 text-xs font-mono font-bold text-primary">${req.ticket_number}</td>
            <td class="py-2.5 px-3">
              <div class="text-xs font-medium text-on-surface">${req.subject}</div>
              <div class="text-[11px] text-on-surface-variant">${req.category}</div>
            </td>
            <td class="py-2.5 px-3">
              <div class="text-xs text-on-surface">${req.requestor_name}</div>
              <div class="text-[11px] text-on-surface-variant">${req.department}</div>
            </td>
            <td class="py-2.5 px-3">
              <span class="px-2 py-0.5 rounded text-[10px] font-semibold ${pBadge}">
                ${req.priority}
              </span>
            </td>
            <td class="py-2.5 px-3 text-xs text-on-surface-variant">${req.status}</td>
            <td class="py-2.5 px-3 text-right">
              <button
                type="button"
                onclick="ServiceRequestsView.generateReport(${req.id})"
                class="h-7 px-2.5 rounded bg-surface-container hover:bg-primary hover:text-on-primary text-on-surface-variant text-[11px] font-medium transition-colors inline-flex items-center gap-1 shadow-sm"
                title="Generate audit summary for requestor"
              >
                <span class="material-symbols-outlined text-[13px]">summarize</span>
                Audit Report
              </button>
            </td>
          </tr>
        `;
      }).join('');

      container.innerHTML = `
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-outline-variant/30 text-[11px] font-semibold text-on-surface-variant uppercase tracking-wider">
              <th class="py-2 px-3">Ticket</th>
              <th class="py-2 px-3">Subject / Category</th>
              <th class="py-2 px-3">Requestor / Dept</th>
              <th class="py-2 px-3">Priority</th>
              <th class="py-2 px-3">Status</th>
              <th class="py-2 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      `;
    } catch (err) {
      container.innerHTML = `
        <div class="text-center py-6 text-error text-xs">
          Failed to load requests: ${err.message}
        </div>
      `;
    }
  },

  async submit() {
    const nameEl    = document.getElementById('req-name');
    const emailEl   = document.getElementById('req-email');
    const deptEl    = document.getElementById('req-dept');
    const prioEl    = document.getElementById('req-priority');
    const catEl     = document.getElementById('req-category');
    const subEl     = document.getElementById('req-subject');
    const descEl    = document.getElementById('req-desc');
    const btn       = document.getElementById('submit-req-btn');

    if (!nameEl || !subEl) return;

    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Submitting...';
    }

    try {
      const payload = {
        requestorName: nameEl.value.trim(),
        requestorEmail: emailEl ? emailEl.value.trim() : '',
        department: deptEl ? deptEl.value : 'Engineering',
        category: catEl ? catEl.value : 'Hardware',
        priority: prioEl ? prioEl.value : 'Normal',
        subject: subEl.value.trim(),
        description: descEl ? descEl.value.trim() : ''
      };

      const res = await State.apiFetch('/api/service-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res && res.success) {
        State.showToast(`Request ${res.ticketNumber} created successfully`, 'check_circle');
        subEl.value = '';
        if (descEl) descEl.value = '';
        await this.loadRequests();
      } else {
        throw new Error((res && res.error) || 'Failed to submit request');
      }
    } catch (err) {
      State.showToast(err.message || 'Submission failed', 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">send</span> Submit Service Ticket';
      }
    }
  },

  async generateReport(requestId) {
    const container = document.getElementById('service-report-container');
    if (!container) return;

    container.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-md p-5 flex items-center gap-3">
        <span class="material-symbols-outlined animate-spin text-primary">progress_activity</span>
        <span class="text-xs text-on-surface-variant">Generating second-stage audit report...</span>
      </div>
    `;

    try {
      const res = await State.apiFetch(`/api/service-requests/${requestId}/report`, {
        method: 'POST'
      });

      if (res && res.success && res.report) {
        const r = res.report;

        if (r.error) {
          container.innerHTML = `
            <div class="rounded-2xl bg-error-container/20 border border-error/30 p-5 flex items-start gap-3">
              <span class="material-symbols-outlined text-error text-[22px] shrink-0">report</span>
              <div>
                <h3 class="font-title-sm font-semibold text-on-surface">Audit Query Error</h3>
                <p class="text-xs text-on-surface-variant font-mono mt-1">${r.error}</p>
                <div class="mt-2 text-xs text-on-surface-variant">
                  <span>Executing SQL:</span>
                  <code class="block font-mono bg-surface-container p-2 rounded mt-1 text-[11px] overflow-x-auto">${r.generatedSql || ''}</code>
                </div>
              </div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-md p-6">
              <div class="flex items-center justify-between pb-4 mb-4 border-b border-outline-variant/20">
                <div class="flex items-center gap-2.5">
                  <span class="material-symbols-outlined text-primary text-[20px]">assignment</span>
                  <h3 class="font-title-md font-semibold text-on-surface">Requestor Audit Summary</h3>
                </div>
                <span class="px-2.5 py-1 rounded bg-secondary-container/30 text-secondary text-xs font-mono font-bold">
                  Period: ${r.period}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                <div class="p-4 rounded-xl bg-surface-container-low">
                  <div class="text-xs text-on-surface-variant font-medium">Requestor Identity</div>
                  <div class="text-sm font-bold text-on-surface mt-1 font-mono truncate" title="${r.requestorName}">${r.requestorName}</div>
                  <div class="text-[11px] text-on-surface-variant mt-0.5">${r.department}</div>
                </div>
                <div class="p-4 rounded-xl bg-surface-container-low">
                  <div class="text-xs text-on-surface-variant font-medium">Ticket Reference</div>
                  <div class="text-sm font-bold text-on-surface mt-1 font-mono">${r.ticketNumber}</div>
                  <div class="text-[11px] text-on-surface-variant mt-0.5">Database ID: #${r.requestId}</div>
                </div>
                <div class="p-4 rounded-xl bg-primary/10 border border-primary/20">
                  <div class="text-xs text-primary font-medium">Total Tickets Matched</div>
                  <div class="text-2xl font-bold text-primary mt-1">${r.totalRequests}</div>
                  <div class="text-[11px] text-on-surface-variant mt-0.5">Aggregated in period</div>
                </div>
              </div>

              <div class="p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant font-mono">
                <div class="text-[10px] text-on-surface-variant/70 uppercase tracking-wider mb-1">Generated Query:</div>
                <div class="text-on-surface break-all">${r.generatedSql}</div>
              </div>
            </div>
          `;
          State.showToast('Audit report aggregated successfully', 'task_alt');
        }
      } else {
        throw new Error((res && res.error) || 'Report generation failed');
      }
    } catch (err) {
      container.innerHTML = `
        <div class="rounded-2xl bg-error-container/20 border border-error/30 p-4 text-xs text-error">
          Error: ${err.message}
        </div>
      `;
    }
  }
};

window.ServiceRequestsView = ServiceRequestsView;
