// Security Assessment Scoreboard View
// /lab-progress — Private cybersecurity training lab progress tracker
//
// Vulnerability names are managed exclusively server-side in
// server/securityAssessment.js. This file contains NO vulnerability
// name mapping. Names are revealed only via the POST /verify response.

const LabProgressView = {
  _assessmentData: null,
  _snackbarTimer: null,

  async render(user) {
    try {
      this._assessmentData = await State.apiFetch('/api/security-assessment');
    } catch (err) {
      console.error('Failed to load security assessment:', err);
      this._assessmentData = { checks: {} };
    }
    return this._buildHTML();
  },

  _getCheckData(id) {
    const checks = this._assessmentData && this._assessmentData.checks ? this._assessmentData.checks : {};
    return checks[id] || checks[String(id)] || { status: 'pending', verifiedAt: null };
  },

  _buildHTML() {
    const checksObj = (this._assessmentData && this._assessmentData.checks) ? this._assessmentData.checks : {};
    const total = Math.max(42, Object.keys(checksObj).length);
    let verifiedCount = 0;
    for (let i = 1; i <= total; i++) {
      if (this._getCheckData(i).status === 'verified') verifiedCount++;
    }
    const pct = Math.round((verifiedCount / total) * 100);
    const isComplete = verifiedCount === total;

    // Iterate 1–42; title and vulnerabilityName come from server via _assessmentData
    const checksHTML = Array.from({ length: total }, (_, i) => i + 1).map(id => {
      const checkData = this._getCheckData(id);
      const isPending = checkData.status !== 'verified';
      const num = String(id).padStart(2, '0');
      const title = checkData.title || `Check ${id}`;

      if (isPending) {
        return `
          <div class="lab-check-card rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-md shadow-sm hover:shadow-md transition-all duration-200"
               id="check-card-${id}" data-check-id="${id}">
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-start gap-4 flex-1 min-w-0">
                <span class="font-mono text-label-sm text-on-surface-variant font-bold tracking-wider shrink-0 mt-0.5">${num}</span>
                <div class="flex-1 min-w-0">
                  <h3 class="font-title-md text-title-md text-on-surface font-semibold">${title}</h3>
                  <div class="flex items-center gap-1.5 mt-2">
                    <span class="w-2.5 h-2.5 rounded-full border-2 border-outline shrink-0"></span>
                    <span class="font-label-lg text-label-lg text-on-surface-variant">Pending</span>
                  </div>
                </div>
              </div>
              <div class="shrink-0">
                <button
                  class="h-8 px-3.5 rounded-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-label-md text-label-md transition-all shadow-sm flex items-center gap-1.5"
                  onclick="LabProgressView.markVerified(${id})"
                  id="verify-btn-${id}"
                  type="button"
                >
                  <span class="material-symbols-outlined text-[15px]">task_alt</span>
                  Mark Verified
                </button>
              </div>
            </div>
          </div>`;
      } else {
        const verifiedAt = checkData.verifiedAt
          ? new Date(checkData.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          : 'Unknown';
        // vulnerabilityName is provided by the server only for verified checks
        const vulnName = checkData.vulnerabilityName || '';
        return `
          <div class="lab-check-card rounded-xl bg-surface-container-lowest border border-secondary/30 p-space-md shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden"
               id="check-card-${id}" data-check-id="${id}">
            <div class="absolute inset-y-0 left-0 w-1 bg-secondary rounded-l-xl"></div>
            <div class="pl-3 flex items-start justify-between gap-4">
              <div class="flex items-start gap-4 flex-1 min-w-0">
                <span class="font-mono text-label-sm text-secondary font-bold tracking-wider shrink-0 mt-0.5">${num}</span>
                <div class="flex-1 min-w-0">
                  <h3 class="font-title-md text-title-md text-on-surface font-semibold">${title}</h3>
                  <div class="flex items-center gap-1.5 mt-1.5">
                    <span class="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                    <span class="font-label-lg text-label-lg text-secondary font-semibold">Verified</span>
                  </div>
                  <p class="font-body-sm text-body-sm text-on-surface-variant mt-1.5 font-medium">${vulnName}</p>
                  <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Verified: ${verifiedAt}</p>
                </div>
              </div>
              <div class="shrink-0">
                <button
                  class="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md transition-all flex items-center gap-1.5"
                  onclick="LabProgressView.resetCheck(${id})"
                  id="reset-btn-${id}"
                  type="button"
                >
                  <span class="material-symbols-outlined text-[14px]">restart_alt</span>
                  Reset
                </button>
              </div>
            </div>
          </div>`;
      }
    }).join('');

    const completionBannerHTML = isComplete ? `
      <div class="rounded-xl bg-secondary/10 border border-secondary/30 p-space-lg mb-space-lg flex items-center gap-4 shadow-sm">
        <div class="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-on-secondary text-[22px]">verified_user</span>
        </div>
        <div>
          <p class="font-title-md text-title-md text-secondary font-bold">Security Assessment Complete</p>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">All access-control and client-side security checks have been manually verified.</p>
        </div>
      </div>` : '';

    return `
      <div class="flex flex-col w-full pb-12 max-w-4xl mx-auto" id="lab-progress-root">

        <!-- Page Header -->
        <div class="mb-space-lg">
          <div class="flex items-center gap-2 mb-1">
            <span class="material-symbols-outlined text-primary text-[22px]">security</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">Private Lab</span>
          </div>
          <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">Security Assessment</h1>
          <p class="font-body-md text-body-md text-on-surface-variant mt-1">Access Control Verification</p>
        </div>

        <!-- Progress Summary Card -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm mb-space-lg">
          <div class="flex items-end justify-between mb-3">
            <div>
              <span class="font-display-lg-mobile text-display-lg-mobile text-on-surface font-bold">${verifiedCount} <span class="text-on-surface-variant font-normal text-headline-md">/ ${total}</span></span>
              <p class="font-label-lg text-label-lg text-on-surface-variant mt-0.5">Verified</p>
            </div>
            <div class="text-right">
              <span class="font-headline-md text-headline-md text-on-surface font-bold">${pct}%</span>
              <p class="font-label-lg text-label-lg text-on-surface-variant mt-0.5">Complete</p>
            </div>
          </div>
          <div class="w-full h-3 rounded-full bg-surface-container-high overflow-hidden">
            <div
              class="h-full rounded-full transition-all duration-500 ease-out ${pct === 100 ? 'bg-secondary' : 'bg-primary'}"
              style="width: ${pct}%"
            ></div>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <span class="font-label-sm text-label-sm text-on-surface-variant">${total - verifiedCount} remaining</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant">${total} total checks</span>
          </div>
        </div>

        ${completionBannerHTML}

        <!-- Checks List -->
        <div class="flex flex-col gap-3 mb-space-xl" id="checks-list">
          ${checksHTML}
        </div>

        <!-- Reset All -->
        <div class="flex items-center justify-end pt-4 border-t border-outline-variant/20">
          <button
            class="h-9 px-4 rounded-lg bg-surface-container hover:bg-error-container text-on-surface-variant hover:text-error font-label-md text-label-md transition-all flex items-center gap-2"
            onclick="LabProgressView.confirmResetAll()"
            type="button"
            id="reset-all-btn"
          >
            <span class="material-symbols-outlined text-[16px]">reset_settings</span>
            Reset Assessment
          </button>
        </div>

      </div>

      <!-- Reset All Confirmation Modal -->
      <div id="lab-reset-modal" class="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-50 hidden items-center justify-center p-4">
        <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-md p-space-lg">
          <div class="flex items-center gap-3 mb-4">
            <div class="w-9 h-9 rounded-lg bg-error-container flex items-center justify-center">
              <span class="material-symbols-outlined text-error text-[20px]">reset_settings</span>
            </div>
            <h2 class="font-headline-sm text-headline-sm text-on-surface font-bold">Reset Security Assessment?</h2>
          </div>
          <p class="font-body-md text-body-md text-on-surface-variant mb-6">
            This will reset all ${total} checks to <strong class="text-on-surface">Pending</strong>. Verified findings and timestamps will be permanently cleared.
          </p>
          <div class="flex items-center justify-end gap-3">
            <button
              class="h-9 px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-all"
              onclick="LabProgressView.closeResetModal()"
              type="button"
            >
              Cancel
            </button>
            <button
              class="h-9 px-4 rounded-lg bg-error hover:opacity-90 text-on-error font-label-md text-label-md transition-all flex items-center gap-2"
              onclick="LabProgressView.executeResetAll()"
              type="button"
              id="confirm-reset-btn"
            >
              <span class="material-symbols-outlined text-[15px]">delete_forever</span>
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Assessment Snackbar -->
      <div
        id="assessment-snackbar"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transform translate-y-20 opacity-0 pointer-events-none transition-all duration-300 ease-out"
      >
        <div class="flex items-start gap-3 px-5 py-4 bg-inverse-surface text-inverse-on-surface rounded-xl shadow-2xl min-w-72 max-w-sm">
          <span class="material-symbols-outlined text-secondary-fixed text-[22px] shrink-0 mt-0.5">verified_user</span>
          <div>
            <p class="font-label-lg text-label-lg font-bold text-inverse-on-surface">✓ Vulnerability Verified</p>
            <p class="font-body-sm text-body-sm text-inverse-on-surface/80 mt-0.5" id="assessment-snackbar-text"></p>
          </div>
        </div>
      </div>
    `;
  },

  _showVerifySnackbar(vulnName, checkTitle) {
    const snackbar = document.getElementById('assessment-snackbar');
    const snackbarText = document.getElementById('assessment-snackbar-text');
    if (!snackbar || !snackbarText) return;

    snackbarText.textContent = `${vulnName} \u2014 ${checkTitle}`;
    snackbar.classList.remove('translate-y-20', 'opacity-0');
    snackbar.classList.add('translate-y-0', 'opacity-100');

    if (this._snackbarTimer) clearTimeout(this._snackbarTimer);
    this._snackbarTimer = setTimeout(() => {
      snackbar.classList.remove('translate-y-0', 'opacity-100');
      snackbar.classList.add('translate-y-20', 'opacity-0');
    }, 4500);
  },

  async markVerified(checkId) {
    const btn = document.getElementById(`verify-btn-${checkId}`);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[15px]">hourglass_top</span>';
    }
    try {
      // The verify response is the ONLY moment the vulnerability name is revealed
      const res = await State.apiFetch(`/api/security-assessment/${checkId}/verify`, { method: 'POST' });
      this._assessmentData = res.assessment;
      this._rerenderCard(checkId);
      this._refreshProgress();
      // res.title and res.vulnerability come from server/securityAssessment.js
      this._showVerifySnackbar(res.vulnerability, res.title);
    } catch (err) {
      State.showToast(err.message || 'Failed to mark verified', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[15px]">task_alt</span> Mark Verified';
      }
    }
  },

  async resetCheck(checkId) {
    const btn = document.getElementById(`reset-btn-${checkId}`);
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">hourglass_top</span>';
    }
    try {
      const res = await State.apiFetch(`/api/security-assessment/${checkId}/reset`, { method: 'POST' });
      this._assessmentData = res.assessment;
      this._rerenderCard(checkId);
      this._refreshProgress();
      State.showToast('Check reset to Pending', 'restart_alt');
    } catch (err) {
      State.showToast(err.message || 'Failed to reset check', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">restart_alt</span> Reset';
      }
    }
  },

  _rerenderCard(checkId) {
    const card = document.getElementById(`check-card-${checkId}`);
    if (!card) return;
    const checkData = this._getCheckData(checkId);
    const id = checkId;
    const num = String(id).padStart(2, '0');
    // title and vulnerabilityName come from server via _assessmentData
    const title = checkData.title || `Check ${id}`;
    const isPending = checkData.status !== 'verified';

    if (isPending) {
      card.className = 'lab-check-card rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-md shadow-sm hover:shadow-md transition-all duration-200';
      card.innerHTML = `
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-4 flex-1 min-w-0">
            <span class="font-mono text-label-sm text-on-surface-variant font-bold tracking-wider shrink-0 mt-0.5">${num}</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-title-md text-title-md text-on-surface font-semibold">${title}</h3>
              <div class="flex items-center gap-1.5 mt-2">
                <span class="w-2.5 h-2.5 rounded-full border-2 border-outline shrink-0"></span>
                <span class="font-label-lg text-label-lg text-on-surface-variant">Pending</span>
              </div>
            </div>
          </div>
          <div class="shrink-0">
            <button
              class="h-8 px-3.5 rounded-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-label-md text-label-md transition-all shadow-sm flex items-center gap-1.5"
              onclick="LabProgressView.markVerified(${id})"
              id="verify-btn-${id}"
              type="button"
            >
              <span class="material-symbols-outlined text-[15px]">task_alt</span>
              Mark Verified
            </button>
          </div>
        </div>`;
    } else {
      const verifiedAt = checkData.verifiedAt
        ? new Date(checkData.verifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Unknown';
      // vulnerabilityName is provided by server only for verified checks
      const vulnName = checkData.vulnerabilityName || '';
      card.className = 'lab-check-card rounded-xl bg-surface-container-lowest border border-secondary/30 p-space-md shadow-sm hover:shadow-md transition-all duration-200 relative overflow-hidden';
      card.innerHTML = `
        <div class="absolute inset-y-0 left-0 w-1 bg-secondary rounded-l-xl"></div>
        <div class="pl-3 flex items-start justify-between gap-4">
          <div class="flex items-start gap-4 flex-1 min-w-0">
            <span class="font-mono text-label-sm text-secondary font-bold tracking-wider shrink-0 mt-0.5">${num}</span>
            <div class="flex-1 min-w-0">
              <h3 class="font-title-md text-title-md text-on-surface font-semibold">${title}</h3>
              <div class="flex items-center gap-1.5 mt-1.5">
                <span class="material-symbols-outlined text-secondary text-[16px]">check_circle</span>
                <span class="font-label-lg text-label-lg text-secondary font-semibold">Verified</span>
              </div>
              <p class="font-body-sm text-body-sm text-on-surface-variant mt-1.5 font-medium">${vulnName}</p>
              <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Verified: ${verifiedAt}</p>
            </div>
          </div>
          <div class="shrink-0">
            <button
              class="h-8 px-3 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md transition-all flex items-center gap-1.5"
              onclick="LabProgressView.resetCheck(${id})"
              id="reset-btn-${id}"
              type="button"
            >
              <span class="material-symbols-outlined text-[14px]">restart_alt</span>
              Reset
            </button>
          </div>
        </div>`;
    }
  },

  _refreshProgress() {
    const total = 36;
    let verifiedCount = 0;
    for (let i = 1; i <= total; i++) {
      if (this._getCheckData(i).status === 'verified') verifiedCount++;
    }
    const pct = Math.round((verifiedCount / total) * 100);

    // Update progress bar
    const bar = document.querySelector('#lab-progress-root .h-3 > div');
    if (bar) {
      bar.style.width = pct + '%';
      if (pct === 100) {
        bar.classList.remove('bg-primary');
        bar.classList.add('bg-secondary');
      }
    }

    // Update count text
    const countEl = document.querySelector('#lab-progress-root .font-display-lg-mobile');
    if (countEl) {
      countEl.innerHTML = `${verifiedCount} <span class="text-on-surface-variant font-normal text-headline-md">/ ${total}</span>`;
    }

    // Update percentage
    const pctEls = document.querySelectorAll('#lab-progress-root .font-headline-md');
    pctEls.forEach(el => {
      if (el.textContent.includes('%')) el.textContent = pct + '%';
    });

    // Update remaining
    const remainingEls = document.querySelectorAll('#lab-progress-root .font-label-sm');
    remainingEls.forEach(el => {
      if (el.textContent.includes('remaining')) el.textContent = (total - verifiedCount) + ' remaining';
    });
  },

  confirmResetAll() {
    const modal = document.getElementById('lab-reset-modal');
    if (modal) {
      modal.classList.remove('hidden');
      modal.classList.add('flex');
    }
  },

  closeResetModal() {
    const modal = document.getElementById('lab-reset-modal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  },

  async executeResetAll() {
    const btn = document.getElementById('confirm-reset-btn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined text-[15px]">hourglass_top</span> Resetting...';
    }
    try {
      await State.apiFetch('/api/security-assessment/reset', { method: 'POST' });
      this.closeResetModal();
      State.showToast('All checks reset to Pending', 'reset_settings');
      AppRouter.renderCurrentRoute('lab-progress', State.user);
    } catch (err) {
      State.showToast(err.message || 'Reset failed', 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined text-[15px]">delete_forever</span> Reset';
      }
    }
  }
};

// Listen for auto-detected exploit completion events
window.addEventListener('lab-check-solved', async () => {
  if (document.getElementById('lab-progress-root')) {
    try {
      LabProgressView._assessmentData = await State.apiFetch('/api/security-assessment');
      for (let i = 1; i <= 36; i++) {
        LabProgressView._rerenderCard(i);
      }
      LabProgressView._refreshProgress();
    } catch (e) {
      console.warn('Failed to auto-refresh lab progress:', e);
    }
  }
});

window.LabProgressView = LabProgressView;
