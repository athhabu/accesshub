// Reports View
// Check #35 — Report Filtering (Blind SQL Injection)
//
// Internal activity reporting interface communicating with:
// GET /api/reports/activity?department=<value>&status=<value>

const ReportsView = {
  _currentDept: 'Engineering',
  _currentStatus: 'all',
  _lastReport: null,
  _isLoading: false,

  async render(currentUser) {
    const user = currentUser || State.user;

    return `
      <div class="flex flex-col w-full pb-12 max-w-5xl mx-auto" id="reports-root">

        <!-- Breadcrumb & Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
              <span>Operations & Analytics</span>
              <span>/</span>
              <span class="text-on-surface-variant">Activity Reports</span>
            </div>
            <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              Employee Activity & Operational Reports
            </h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Generate department audit logs, sprint velocity metrics, and compliance activity summaries.
            </p>
          </div>
        </div>

        <!-- Filter Controls Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-sm mb-6">
          <form onsubmit="event.preventDefault(); ReportsView.generateReport();" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              <!-- Department Selector -->
              <div>
                <label for="report-dept-select" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Department
                </label>
                <div class="relative">
                  <select
                    id="report-dept-select"
                    class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm appearance-none cursor-pointer"
                  >
                    <option value="Engineering" ${this._currentDept === 'Engineering' ? 'selected' : ''}>Engineering</option>
                    <option value="Security" ${this._currentDept === 'Security' ? 'selected' : ''}>Security</option>
                    <option value="Finance" ${this._currentDept === 'Finance' ? 'selected' : ''}>Finance</option>
                    <option value="Product" ${this._currentDept === 'Product' ? 'selected' : ''}>Product</option>
                    <option value="Operations" ${this._currentDept === 'Operations' ? 'selected' : ''}>Operations</option>
                    <option value="People Ops" ${this._currentDept === 'People Ops' ? 'selected' : ''}>People Ops</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              <!-- Status Filter -->
              <div>
                <label for="report-status-select" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Activity Status
                </label>
                <div class="relative">
                  <select
                    id="report-status-select"
                    class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm appearance-none cursor-pointer"
                  >
                    <option value="all" ${this._currentStatus === 'all' ? 'selected' : ''}>All Statuses</option>
                    <option value="Completed" ${this._currentStatus === 'Completed' ? 'selected' : ''}>Completed</option>
                    <option value="In Progress" ${this._currentStatus === 'In Progress' ? 'selected' : ''}>In Progress</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>

              <!-- Date Range -->
              <div>
                <label for="report-range-select" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Reporting Period
                </label>
                <div class="relative">
                  <select
                    id="report-range-select"
                    class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm appearance-none cursor-pointer"
                  >
                    <option value="30">Last 30 Days</option>
                    <option value="60">Last 60 Days</option>
                    <option value="90">Quarter-to-Date (Q3)</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>

            </div>

            <div class="flex items-center justify-between pt-4 border-t border-outline-variant/20 flex-wrap gap-3">
              <span class="text-xs text-on-surface-variant">
                Reports reflect verified internal identity metrics and project telemetry.
              </span>
              <button
                type="submit"
                id="generate-report-btn"
                class="h-10 px-5 rounded-xl bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-label-md text-label-md transition-all shadow-sm flex items-center gap-2 shrink-0"
              >
                <span class="material-symbols-outlined text-[18px]">analytics</span>
                <span>Generate Report</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Report Output Container -->
        <div id="report-results-area">
          <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
            <div class="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
              <span class="material-symbols-outlined text-[28px]">assessment</span>
            </div>
            <h3 class="font-title-md text-title-md font-bold text-on-surface mb-1">Ready to Generate</h3>
            <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md mx-auto">
              Select reporting criteria above and click <strong>Generate Report</strong> to query the activity ledger.
            </p>
          </div>
        </div>

      </div>
    `;
  },

  async afterRender() {
    this.generateReport();
  },

  async generateReport() {
    const deptSelect = document.getElementById('report-dept-select');
    const statusSelect = document.getElementById('report-status-select');
    const dept = deptSelect ? deptSelect.value : this._currentDept;
    const status = statusSelect ? statusSelect.value : this._currentStatus;
    this._currentDept = dept;
    this._currentStatus = status;

    const resultsArea = document.getElementById('report-results-area');
    if (!resultsArea) return;

    resultsArea.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
        <span class="material-symbols-outlined text-[32px] text-primary animate-spin mb-3">progress_activity</span>
        <p class="font-body-sm text-body-sm text-on-surface-variant">Compiling operational report records...</p>
      </div>
    `;

    try {
      const data = await State.apiFetch(`/api/reports/activity?department=${encodeURIComponent(dept)}&status=${encodeURIComponent(status)}`);
      this._lastReport = data;
      this._renderReportTable(data);
    } catch (err) {
      // Blind reporting: clean error message
      resultsArea.innerHTML = `
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
          <p class="font-body-sm text-body-sm text-on-surface-variant">No activity records match the specified reporting criteria.</p>
        </div>
      `;
    }
  },

  _renderReportTable(data) {
    const resultsArea = document.getElementById('report-results-area');
    if (!resultsArea) return;

    const activities = data.results || [];
    const count = data.count !== undefined ? data.count : activities.length;

    if (count === 0) {
      resultsArea.innerHTML = `
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-12 text-center shadow-sm">
          <div class="w-12 h-12 rounded-xl bg-surface-container text-on-surface-variant flex items-center justify-center mx-auto mb-3">
            <span class="material-symbols-outlined text-[24px]">folder_off</span>
          </div>
          <h3 class="font-title-md text-title-md font-bold text-on-surface mb-1">No Activity Records</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant">
            No events recorded matching criteria for department "${this._escapeHtml(data.department || '')}".
          </p>
        </div>
      `;
      return;
    }

    const rowsHtml = activities.map(act => {
      const statusBadge = act.status === 'Completed'
        ? '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary/10 text-secondary">Completed</span>'
        : '<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-tertiary/10 text-tertiary">In Progress</span>';

      return `
        <tr class="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
          <td class="py-3.5 px-4 font-semibold text-on-surface text-sm">
            ${this._escapeHtml(act.employee_name || '')}
          </td>
          <td class="py-3.5 px-4 text-xs font-medium text-on-surface-variant">
            <span class="px-2 py-0.5 rounded bg-surface-container text-on-surface font-mono">
              ${this._escapeHtml(act.department || '')}
            </span>
          </td>
          <td class="py-3.5 px-4 text-sm text-on-surface">
            ${this._escapeHtml(act.activity_type || '')}
          </td>
          <td class="py-3.5 px-4 text-xs text-on-surface-variant font-mono">
            ${this._escapeHtml(act.project || '')}
          </td>
          <td class="py-3.5 px-4">
            ${statusBadge}
          </td>
          <td class="py-3.5 px-4 text-xs font-mono text-on-surface-variant whitespace-nowrap">
            ${this._escapeHtml(act.timestamp || '')}
          </td>
          <td class="py-3.5 px-4 text-right font-mono font-bold text-primary text-sm">
            ${act.impact_score || 0}%
          </td>
        </tr>
      `;
    }).join('');

    resultsArea.innerHTML = `
      <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden">
        
        <!-- Summary Bar -->
        <div class="px-6 py-4 border-b border-outline-variant/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-low/50">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-primary text-[20px]">fact_check</span>
            <span class="font-title-sm text-title-sm font-bold text-on-surface">
              Activity Report: ${this._escapeHtml(data.department || '')}
            </span>
          </div>
          <div class="flex items-center gap-4 text-xs font-medium text-on-surface-variant">
            <span>Total Records: <strong class="text-on-surface font-mono text-sm">${count}</strong></span>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="border-b border-outline-variant/20 bg-surface-container text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th class="py-3 px-4">Employee</th>
                <th class="py-3 px-4">Department</th>
                <th class="py-3 px-4">Activity</th>
                <th class="py-3 px-4">Initiative / Project</th>
                <th class="py-3 px-4">Status</th>
                <th class="py-3 px-4">Timestamp</th>
                <th class="py-3 px-4 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
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

window.ReportsView = ReportsView;
