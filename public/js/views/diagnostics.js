// System Diagnostics View
// Check #36 — System Diagnostics (OS Command Injection)
//
// Internal diagnostic interface communicating with:
// GET /api/diagnostics/ping?host=<value>

const DiagnosticsView = {
  _currentHost: '127.0.0.1',
  _currentAction: 'ping',
  _lastOutput: null,
  _isRunning: false,

  async render(currentUser) {
    const user = currentUser || State.user;

    return `
      <div class="flex flex-col w-full pb-12 max-w-4xl mx-auto" id="diagnostics-root">

        <!-- Breadcrumb & Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
              <span>Infrastructure & Operations</span>
              <span>/</span>
              <span class="text-on-surface-variant">Diagnostics</span>
            </div>
            <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
              System Diagnostics & Connectivity Utility
            </h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Verify local gateway reachability, internal service endpoints, and subnet connectivity.
            </p>
          </div>
        </div>

        <!-- Diagnostic Request Card -->
        <div class="rounded-2xl bg-surface-container-lowest border border-outline-variant/30 p-6 shadow-sm mb-6">
          <form onsubmit="event.preventDefault(); DiagnosticsView.runDiagnostic();" class="space-y-4">
            
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <!-- Host / Target Input -->
              <div class="sm:col-span-2">
                <label for="diagnostic-host-input" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Target Host / Internal Service
                </label>
                <div class="relative">
                  <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                    dns
                  </span>
                  <input
                    type="text"
                    id="diagnostic-host-input"
                    class="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-container-low border border-outline-variant/40 font-mono text-on-surface focus:outline-none focus:border-primary text-sm"
                    placeholder="e.g. 127.0.0.1 or localhost"
                    value="${this._escapeHtml(this._currentHost)}"
                    required
                  />
                </div>
              </div>

              <!-- Action Selector -->
              <div>
                <label for="diagnostic-action-select" class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Diagnostic Action
                </label>
                <div class="relative">
                  <select
                    id="diagnostic-action-select"
                    class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm appearance-none cursor-pointer"
                  >
                    <option value="ping" selected>Connectivity Test (ICMP)</option>
                    <option value="dns">DNS Resolution Check</option>
                    <option value="route">Route Verification</option>
                  </select>
                  <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">
                    arrow_drop_down
                  </span>
                </div>
              </div>
            </div>

            <!-- Pre-configured Targets -->
            <div class="flex items-center gap-2 pt-2 flex-wrap">
              <span class="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mr-1">Local Endpoints:</span>
              ${['127.0.0.1', 'localhost', 'internal-gateway'].map(target => `
                <button
                  type="button"
                  onclick="DiagnosticsView.setTarget('${target}')"
                  class="px-2.5 py-1 rounded-lg bg-surface-container font-mono text-xs font-medium text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface transition-colors"
                >
                  ${target}
                </button>
              `).join('')}
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-outline-variant/20 gap-3">
              <span class="text-xs text-on-surface-variant">
                Execution is routed through the internal diagnostic subsystem.
              </span>
              <button
                type="submit"
                id="run-diagnostic-btn"
                class="h-10 px-5 rounded-xl bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-label-md text-label-md transition-all shadow-sm flex items-center gap-2 shrink-0"
              >
                <span class="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Run Diagnostic</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Terminal Output Viewer -->
        <div class="rounded-2xl bg-[#0f172a] text-slate-200 border border-slate-800 shadow-xl overflow-hidden font-mono text-xs">
          <!-- Terminal Header -->
          <div class="px-5 py-3 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
              <span class="ml-2 font-semibold text-slate-400">Diagnostic Console</span>
            </div>
            <span id="diagnostic-status-indicator" class="text-emerald-400 flex items-center gap-1.5 font-sans text-xs">
              <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
              Idle
            </span>
          </div>

          <!-- Terminal Content -->
          <div class="p-5 min-h-[220px] max-h-[400px] overflow-y-auto">
            <pre id="diagnostic-output-pre" class="whitespace-pre-wrap leading-relaxed text-slate-300 font-mono">
AccessHub Diagnostic Environment Initialized.
Specify an endpoint and click "Run Diagnostic" to probe connectivity.
            </pre>
          </div>
        </div>

      </div>
    `;
  },

  setTarget(target) {
    const input = document.getElementById('diagnostic-host-input');
    if (input) {
      input.value = target;
    }
  },

  async runDiagnostic() {
    const input = document.getElementById('diagnostic-host-input');
    const host = input ? input.value.trim() : '';
    if (!host) return;

    this._currentHost = host;
    const outputPre = document.getElementById('diagnostic-output-pre');
    const statusInd = document.getElementById('diagnostic-status-indicator');
    const btn = document.getElementById('run-diagnostic-btn');

    if (outputPre) {
      outputPre.textContent = `[DIAGNOSTIC] Dispatching ICMP probe to target: ${host}...\n[DIAGNOSTIC] Awaiting packet response...`;
    }
    if (statusInd) {
      statusInd.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span> Probing...';
      statusInd.className = 'text-amber-400 flex items-center gap-1.5 font-sans text-xs';
    }
    if (btn) {
      btn.disabled = true;
    }

    try {
      const data = await State.apiFetch(`/api/diagnostics/ping?host=${encodeURIComponent(host)}`);
      if (outputPre) {
        outputPre.textContent = data.output || 'Diagnostic probe finished with no return packets.';
      }
      if (statusInd) {
        statusInd.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Completed';
        statusInd.className = 'text-emerald-400 flex items-center gap-1.5 font-sans text-xs';
      }
    } catch (err) {
      if (outputPre) {
        outputPre.textContent = `[DIAGNOSTIC ERROR] Probe execution failed:\n${err.message || 'Operation timed out or failed to reach host.'}`;
      }
      if (statusInd) {
        statusInd.innerHTML = '<span class="w-2 h-2 rounded-full bg-rose-400"></span> Failed';
        statusInd.className = 'text-rose-400 flex items-center gap-1.5 font-sans text-xs';
      }
    } finally {
      if (btn) {
        btn.disabled = false;
      }
    }
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

window.DiagnosticsView = DiagnosticsView;
