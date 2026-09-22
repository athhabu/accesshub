// My Workspace View
// Check #32 — Client-Side Template (Client-Side Template Injection)
//
// Vulnerable data flow:
//   Source:     localStorage.getItem('ah_workspace_tpl')
//               Written by the "Customize Greeting" modal — value originates from user input
//   Processing: PortalTemplate.render(tpl, ctx)
//               Evaluates {{ expression }} blocks using new Function()
//               Expressions run as real JavaScript with ctx vars in scope
//   Sink:       greetingBanner.innerHTML = PortalTemplate.render(tpl, ctx)
//               The rendered output (which may include HTML or trigger code execution)
//               is assigned to innerHTML
//
// Discovery:
//   1. Open DevTools → Application → Local Storage → find 'ah_workspace_tpl'
//   2. Set it to: {{alert(document.domain)}}
//   3. Navigate to /#/workspace — the PortalTemplate engine evaluates the expression
//      via new Function(), triggering code execution at template render time.

// ------------------------------------------------------------------
// Small self-contained template engine
// Evaluates {{expression}} blocks using new Function()
// Available context: name, department, role, weekday, date
// ------------------------------------------------------------------
const PortalTemplate = {
  // Default template shown if no customisation is saved
  DEFAULT_TPL: 'Welcome back, {{name}}! Today is {{weekday}}.',

  // Render a template string with the given context object.
  // {{ expr }} blocks are evaluated as JavaScript expressions.
  render(tpl, ctx) {
    if (typeof tpl !== 'string' || !tpl.trim()) return '';
    return tpl.replace(/\{\{([^}]+)\}\}/g, function(match, expr) {
      try {
        // Construct a function with context variable names as parameters.
        // Calling it with context values makes them available by name inside expr.
        var fn = new Function(...Object.keys(ctx), 'return String(' + expr.trim() + ')');
        return fn(...Object.values(ctx));
      } catch (e) {
        return '';
      }
    });
  }
};

const WorkspaceView = {
  async render(currentUser) {
    const user = currentUser || State.user;
    const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Context available inside templates
    const ctx = {
      name:       user ? (user.name || 'Employee') : 'Employee',
      department: user ? (user.department || 'Your Department') : 'Your Department',
      role:       user ? (user.role || 'Employee') : 'Employee',
      weekday,
      date:       dateStr
    };

    // Retrieve saved template from localStorage (XSS-32 source)
    const savedTpl = localStorage.getItem('ah_workspace_tpl') || PortalTemplate.DEFAULT_TPL;

    // Render the template — new Function() evaluates any {{ expr }} blocks (XSS-32 processing)
    const renderedGreeting = PortalTemplate.render(savedTpl, ctx);

    return `
      <div class="flex flex-col w-full pb-12 max-w-5xl mx-auto" id="workspace-root">

        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">My Portal</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">My Workspace</span>
          </div>
          <button
            type="button"
            onclick="WorkspaceView.openCustomizeModal()"
            id="customize-greeting-btn"
            class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30"
          >
            <span class="material-symbols-outlined text-[18px]">tune</span>
            <span>Customize Greeting</span>
          </button>
        </div>

        <!-- Personalized Greeting Banner — XSS-32 sink: innerHTML assigned rendered template -->
        <div class="rounded-2xl bg-gradient-to-r from-primary/10 to-primary-container/10 border border-primary/20 p-6 shadow-sm mb-6 relative overflow-hidden">
          <div class="absolute top-0 right-0 w-32 h-32 rounded-full bg-primary/5 -translate-y-8 translate-x-8"></div>
          <div class="flex items-center gap-2 mb-2 text-primary">
            <span class="material-symbols-outlined text-[20px]">dashboard_customize</span>
            <span class="text-xs uppercase tracking-wider font-bold">Personal Workspace</span>
          </div>
          <!-- innerHTML sink — rendered template output assigned here -->
          <div id="workspace-greeting-banner" class="font-headline-sm text-headline-sm font-bold text-on-surface"></div>
          <p class="text-xs text-on-surface-variant mt-1">${dateStr} &mdash; ${weekday}</p>
        </div>

        <!-- Quick Access Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          ${[
            { label: 'My Profile',      icon: 'person',           path: 'profile',    color: 'text-primary bg-primary/10' },
            { label: 'My Documents',    icon: 'description',      path: 'documents',  color: 'text-secondary bg-secondary/10' },
            { label: 'My Expenses',     icon: 'receipt_long',     path: 'expenses',   color: 'text-tertiary bg-tertiary/10' },
            { label: 'Calendar',        icon: 'calendar_month',   path: 'calendar',   color: 'text-primary bg-primary/10' },
            { label: 'Announcements',   icon: 'campaign',         path: 'announcements', color: 'text-secondary bg-secondary/10' },
            { label: 'Help Center',     icon: 'help_center',      path: 'help',       color: 'text-tertiary bg-tertiary/10' },
            { label: 'Activity Feed',   icon: 'history',          path: 'activity',   color: 'text-primary bg-primary/10' },
            { label: 'Knowledge Base',  icon: 'menu_book',        path: 'knowledge-base', color: 'text-secondary bg-secondary/10' }
          ].map(item => `
            <a href="#/${item.path}" class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-center gap-2 group">
              <div class="w-10 h-10 rounded-xl ${item.color} flex items-center justify-center group-hover:scale-110 transition-transform">
                <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
              </div>
              <span class="text-xs font-semibold text-on-surface text-center leading-tight">${item.label}</span>
            </a>
          `).join('')}
        </div>

        <!-- Recent Activity Widget -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-5 shadow-sm mb-6">
          <div class="flex items-center gap-2 mb-4">
            <span class="material-symbols-outlined text-primary text-[18px]">history</span>
            <h2 class="font-title-sm text-title-sm font-semibold text-on-surface">Recent Portal Activity</h2>
          </div>
          <div class="space-y-3">
            ${[
              { icon: 'description',   label: 'You uploaded Q3 Financial Summary',             time: '2h ago' },
              { icon: 'shopping_bag',  label: 'Order ORD-7312 approved for fulfilment',         time: '5h ago' },
              { icon: 'receipt_long',  label: 'Expense report EXP-2284 submitted for review',   time: '1d ago' },
              { icon: 'calendar_month',label: 'Calendar event updated: Q3 Roadmap Review',      time: '2d ago' }
            ].map(item => `
              <div class="flex items-center gap-3 text-sm">
                <div class="w-7 h-7 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                  <span class="material-symbols-outlined text-on-surface-variant text-[15px]">${item.icon}</span>
                </div>
                <span class="flex-1 text-on-surface-variant text-xs">${item.label}</span>
                <span class="text-[11px] text-on-surface-variant shrink-0">${item.time}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Greeting Customization Modal -->
        <div id="customize-greeting-modal"
          class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm hidden"
          onclick="WorkspaceView.handleModalBackdropClick(event)"
        >
          <div class="bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 w-full max-w-xl mx-4 flex flex-col" onclick="event.stopPropagation()">
            <div class="flex items-center justify-between px-6 py-4 border-b border-outline-variant/20">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary text-[22px]">tune</span>
                <h2 class="font-title-lg text-title-lg font-bold text-on-surface">Customize Greeting</h2>
              </div>
              <button type="button" onclick="WorkspaceView.closeCustomizeModal()"
                class="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors">
                <span class="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div class="px-6 py-5 space-y-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5" for="workspace-tpl-input">Greeting Template</label>
                <textarea
                  id="workspace-tpl-input"
                  rows="3"
                  class="w-full px-3 py-2.5 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary text-sm resize-none font-mono"
                  placeholder="e.g. Welcome back, {{name}}! Today is {{weekday}}."
                ></textarea>
                <div class="mt-2 flex flex-wrap gap-1.5">
                  ${['{{name}}', '{{department}}', '{{role}}', '{{weekday}}', '{{date}}'].map(v => `
                    <button type="button"
                      onclick="WorkspaceView.insertToken('${v}')"
                      class="px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/20 text-[11px] font-mono hover:bg-primary/10 hover:text-primary hover:border-primary/30 transition-colors"
                    >${v}</button>
                  `).join('')}
                </div>
                <p class="text-[11px] text-on-surface-variant mt-2">Use <span class="font-mono">{{variable}}</span> to personalise your greeting. Token values are substituted at render time.</p>
              </div>
              <div id="tpl-preview-box" class="rounded-lg bg-surface-container-low border border-outline-variant/20 p-3 text-sm text-on-surface-variant min-h-[36px]">
                <span class="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block mb-1">Preview</span>
                <div id="tpl-preview-output" class="text-sm text-on-surface font-medium"></div>
              </div>
            </div>
            <div class="px-6 py-4 border-t border-outline-variant/20 flex items-center justify-between gap-3">
              <button type="button"
                onclick="WorkspaceView.resetTemplate()"
                class="h-9 px-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-label-md text-label-md transition-colors text-xs">
                Reset to Default
              </button>
              <div class="flex items-center gap-2">
                <button type="button" onclick="WorkspaceView.closeCustomizeModal()"
                  class="h-9 px-4 rounded-lg text-on-surface-variant hover:bg-surface-container-low font-label-md text-label-md transition-colors">
                  Cancel
                </button>
                <button type="button" id="save-tpl-btn" onclick="WorkspaceView.saveTemplate()"
                  class="h-9 px-5 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant font-label-md text-label-md transition-all shadow-sm">
                  Save & Apply
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>
    `;
  },

  async afterRender() {
    // Apply the rendered greeting to the banner via innerHTML (XSS-32 sink)
    const user = State.user || {};
    const weekday = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const ctx = {
      name:       user.name || 'Employee',
      department: user.department || 'Your Department',
      role:       user.role || 'Employee',
      weekday,
      date:       dateStr
    };
    const savedTpl = localStorage.getItem('ah_workspace_tpl') || PortalTemplate.DEFAULT_TPL;
    const rendered = PortalTemplate.render(savedTpl, ctx);
    const banner = document.getElementById('workspace-greeting-banner');
    // XSS-32 sink: rendered template (which may contain attacker-controlled JS output) assigned to innerHTML
    if (banner) banner.innerHTML = rendered;
  },

  openCustomizeModal() {
    const modal = document.getElementById('customize-greeting-modal');
    if (!modal) return;
    const input = document.getElementById('workspace-tpl-input');
    if (input) {
      input.value = localStorage.getItem('ah_workspace_tpl') || PortalTemplate.DEFAULT_TPL;
      this._updatePreview();
    }
    modal.classList.remove('hidden');
    if (input) {
      input.oninput = () => this._updatePreview();
    }
  },

  closeCustomizeModal() {
    const modal = document.getElementById('customize-greeting-modal');
    if (modal) modal.classList.add('hidden');
  },

  handleModalBackdropClick(e) {
    if (e.target === document.getElementById('customize-greeting-modal')) {
      this.closeCustomizeModal();
    }
  },

  insertToken(token) {
    const input = document.getElementById('workspace-tpl-input');
    if (!input) return;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    input.value = input.value.slice(0, start) + token + input.value.slice(end);
    input.selectionStart = input.selectionEnd = start + token.length;
    input.focus();
    this._updatePreview();
  },

  _updatePreview() {
    const input = document.getElementById('workspace-tpl-input');
    const preview = document.getElementById('tpl-preview-output');
    if (!input || !preview) return;
    const user = State.user || {};
    const ctx = {
      name:       user.name || 'Employee',
      department: user.department || 'Your Department',
      role:       user.role || 'Employee',
      weekday:    new Date().toLocaleDateString('en-US', { weekday: 'long' }),
      date:       new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
    try {
      const rendered = PortalTemplate.render(input.value, ctx);
      preview.innerHTML = rendered || '<span class="text-on-surface-variant italic text-xs">Enter a template above</span>';
    } catch (e) {
      preview.textContent = '';
    }
  },

  saveTemplate() {
    const input = document.getElementById('workspace-tpl-input');
    if (!input) return;
    const tpl = input.value;
    localStorage.setItem('ah_workspace_tpl', tpl);
    this.closeCustomizeModal();
    // Re-apply the newly saved template
    this.afterRender();
    State.showToast('Greeting updated successfully.', 'check_circle');
  },

  resetTemplate() {
    const input = document.getElementById('workspace-tpl-input');
    if (input) {
      input.value = PortalTemplate.DEFAULT_TPL;
      this._updatePreview();
    }
  }
};

window.PortalTemplate  = PortalTemplate;
window.WorkspaceView   = WorkspaceView;
