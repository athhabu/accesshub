// =============================================================================
// Report Templates View — Check #39
// =============================================================================
// Realistic internal reporting tool for compiling and formatting company reports.
// The vulnerability lives entirely on the server side (SSTI) and is not hinted
// at anywhere in the UI.
// =============================================================================

const ReportTemplatesView = {
  render(user) {
    const currentEmployee = (user && user.name) || 'Alex Mercer';
    const currentDept = (user && user.department) || 'Engineering';

    return `
      <div class="max-w-5xl mx-auto space-y-6">

        <!-- Page Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="font-headline-sm text-headline-sm font-bold text-on-surface">Report Templates</h1>
            <p class="text-sm text-on-surface-variant mt-1">Generate standardized executive briefings, operational summaries, and audit logs.</p>
          </div>
          <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container border border-outline-variant/30 text-xs text-on-surface-variant">
            <span class="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
            <span>Document Engine v2.4</span>
          </div>
        </div>

        <!-- Main Form Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm p-6">
          <div class="flex items-center gap-2.5 pb-4 mb-5 border-b border-outline-variant/20">
            <span class="material-symbols-outlined text-primary text-[22px]">post_add</span>
            <h2 class="font-title-md text-title-md font-semibold text-on-surface">Create Report</h2>
          </div>

          <form id="report-template-form" onsubmit="event.preventDefault(); ReportTemplatesView.generate();" class="space-y-5">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Report Title -->
              <div class="md:col-span-1">
                <label for="report-title" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Report Title
                </label>
                <input
                  id="report-title"
                  type="text"
                  value="Quarterly Operations Report"
                  placeholder="e.g. System Performance Review"
                  class="w-full h-10 px-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <!-- Employee / Author -->
              <div>
                <label for="report-employee" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Employee
                </label>
                <input
                  id="report-employee"
                  type="text"
                  value="${currentEmployee}"
                  placeholder="e.g. Alex Mercer"
                  class="w-full h-10 px-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>

              <!-- Department -->
              <div>
                <label for="report-department" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                  Department
                </label>
                <select
                  id="report-department"
                  class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="Engineering" ${currentDept === 'Engineering' ? 'selected' : ''}>Engineering</option>
                  <option value="Product" ${currentDept === 'Product' ? 'selected' : ''}>Product</option>
                  <option value="Security" ${currentDept === 'Security' ? 'selected' : ''}>Security</option>
                  <option value="Finance" ${currentDept === 'Finance' ? 'selected' : ''}>Finance</option>
                  <option value="Operations" ${currentDept === 'Operations' ? 'selected' : ''}>Operations</option>
                  <option value="People Ops" ${currentDept === 'People Ops' ? 'selected' : ''}>People Ops</option>
                  <option value="Legal" ${currentDept === 'Legal' ? 'selected' : ''}>Legal</option>
                </select>
              </div>
            </div>

            <!-- Template Style selection -->
            <div>
              <label for="report-format" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                Template Layout
              </label>
              <select
                id="report-format"
                class="w-full sm:w-72 h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface focus:outline-none focus:border-primary"
              >
                <option value="standard" selected>Standard Corporate Audit</option>
                <option value="executive">Executive Briefing</option>
                <option value="operational">Operations Log</option>
              </select>
            </div>

            <!-- Summary -->
            <div>
              <label for="report-summary" class="block font-label-md text-label-md font-medium text-on-surface mb-1.5">
                Summary
              </label>
              <textarea
                id="report-summary"
                rows="4"
                placeholder="Enter executive summary, key findings, and operational milestones..."
                class="w-full p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 text-sm text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:border-primary transition-colors resize-y font-body-sm"
              >Standard review completed with no pending anomalies. All core infrastructure clusters remained within normal uptime parameters.</textarea>
            </div>

            <!-- Actions -->
            <div class="flex items-center justify-between pt-2">
              <span class="text-xs text-on-surface-variant/70">Formatted via Acme Document Compilation Pipeline</span>
              <button
                type="submit"
                id="generate-report-btn"
                class="h-10 px-5 rounded-lg bg-primary text-on-primary text-sm font-semibold hover:bg-on-primary-fixed-variant transition-colors shadow-sm flex items-center gap-2"
              >
                <span class="material-symbols-outlined text-[18px]">article</span>
                Generate Report
              </button>
            </div>
          </form>
        </div>

        <!-- Generated Report Output Area -->
        <div id="report-output-container" class="space-y-4">
          <div class="rounded-2xl border border-dashed border-outline-variant/40 bg-surface-container-lowest/50 p-10 flex flex-col items-center gap-3 text-center">
            <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[28px] text-on-surface-variant">description</span>
            </div>
            <p class="text-sm font-semibold text-on-surface">No report generated yet</p>
            <p class="text-xs text-on-surface-variant max-w-sm">Complete the form above and click "Generate Report" to compile and render a standardized report.</p>
          </div>
        </div>

      </div>
    `;
  },

  afterRender() {
    // Optional auto-render initial report
  },

  async generate() {
    const titleEl    = document.getElementById('report-title');
    const empEl      = document.getElementById('report-employee');
    const deptEl     = document.getElementById('report-department');
    const formatEl   = document.getElementById('report-format');
    const summaryEl  = document.getElementById('report-summary');
    const btn        = document.getElementById('generate-report-btn');
    const container  = document.getElementById('report-output-container');

    if (!titleEl || !btn || !container) return;

    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Generating...';

    try {
      const payload = {
        title: titleEl.value.trim(),
        employee: empEl ? empEl.value.trim() : '',
        department: deptEl ? deptEl.value : '',
        templateFormat: formatEl ? formatEl.value : 'standard',
        summary: summaryEl ? summaryEl.value : ''
      };

      const res = await State.apiFetch('/api/reports/templates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res && res.success && res.report) {
        const r = res.report;
        container.innerHTML = `
          <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-md p-6 sm:p-8">
            <div class="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-outline-variant/20">
              <div class="flex items-center gap-3">
                <span class="px-2.5 py-1 rounded bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-wider font-mono">
                  ${r.reportId || 'RPT-2026'}
                </span>
                <span class="text-xs text-on-surface-variant">Compiled: ${r.generatedAt || new Date().toISOString().slice(0, 10)}</span>
              </div>
              <button
                type="button"
                onclick="window.print()"
                class="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-xs text-on-surface flex items-center gap-1.5 transition-colors"
              >
                <span class="material-symbols-outlined text-[15px]">print</span>
                Print
              </button>
            </div>

            <!-- Rendered Report Content -->
            <div class="prose prose-sm max-w-none text-on-surface" id="compiled-report-content">
              ${r.renderedContent}
            </div>
          </div>
        `;
        State.showToast('Report generated successfully', 'task_alt');
      } else {
        throw new Error((res && res.error) || 'Failed to generate report');
      }
    } catch (err) {
      State.showToast(err.message || 'Report generation failed', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">article</span> Generate Report';
    }
  }
};

window.ReportTemplatesView = ReportTemplatesView;
