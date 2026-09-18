// Client-side Router
const AppRouter = {
  routes: {
    'login': LoginView,
    'dashboard': DashboardView,
    'profile': ProfileView,
    'team': TeamView,
    'documents': DocumentsView,
    'orders': OrdersView,
    'expenses': ExpensesView,
    'calendar': CalendarView,
    'admin': AdminView,
    'settings': {
      async render(user) {
        return `
          <div class="p-8 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm max-w-2xl">
            <div class="flex items-center gap-3 mb-4">
              <span class="material-symbols-outlined text-[28px] text-primary">settings</span>
              <h1 class="font-headline-md text-headline-md font-bold text-on-surface">Portal Preferences & Settings</h1>
            </div>
            <p class="text-sm text-on-surface-variant mb-6">Manage session security preferences, local telemetry, and notification channels.</p>
            <div class="space-y-4 text-sm">
              <div class="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                <div>
                  <p class="font-semibold text-on-surface">Hardware Key 2FA</p>
                  <p class="text-xs text-on-surface-variant">FIDO2 / WebAuthn token authentication</p>
                </div>
                <span class="px-2.5 py-0.5 rounded-full bg-secondary-container/30 text-secondary text-xs font-bold">Enabled</span>
              </div>
              <div class="flex items-center justify-between p-3 rounded-lg bg-surface-container-low">
                <div>
                  <p class="font-semibold text-on-surface">Session Inactivity Timeout</p>
                  <p class="text-xs text-on-surface-variant">Automatically sign out after 30 minutes of idle time</p>
                </div>
                <span class="text-xs text-on-surface-variant font-mono">30 mins</span>
              </div>
            </div>

            <!-- Password & Credential Security Card -->
            <div class="mt-6 pt-6 border-t border-outline-variant/30">
              <div class="flex items-center gap-2 mb-2">
                <span class="material-symbols-outlined text-primary text-[20px]">lock_reset</span>
                <h2 class="font-title-md text-title-md font-bold text-on-surface">Change Password</h2>
              </div>
              <p class="text-xs text-on-surface-variant mb-4">Update your corporate access password. Must be at least 6 characters in length.</p>
              <form onsubmit="AppRouter.handleChangePassword(event)" class="space-y-3 max-w-md">
                <div>
                  <label class="block font-bold text-on-surface-variant text-xs uppercase mb-1">New Password</label>
                  <input id="settings-new-password" type="password" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary" placeholder="Enter new password" required />
                </div>
                <div>
                  <label class="block font-bold text-on-surface-variant text-xs uppercase mb-1">Confirm New Password</label>
                  <input id="settings-confirm-password" type="password" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary" placeholder="Re-enter new password" required />
                </div>
                <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant text-xs font-semibold shadow-sm transition-all">
                  Update Password
                </button>
              </form>
            </div>
          </div>
        `;
      }
    }
  },

  async init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    await State.init();
    this.handleRoute();
  },

  async handleRoute() {
    let hash = window.location.hash.slice(2); // Remove '#/'
    const [pathWithQuery] = hash.split('?');
    const path = pathWithQuery || 'dashboard';

    // Parse URL query params if any
    const queryString = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
    const params = new URLSearchParams(queryString);

    // Handle actions from URL parameters
    if (params.get('action') === 'new' && path === 'orders') {
      setTimeout(() => OrdersView.openNewOrderModal(), 100);
    }
    if (params.get('action') === 'upload' && path === 'documents') {
      setTimeout(() => DocumentsView.openUploadModal(), 100);
    }
    if (params.get('id') && path === 'orders') {
      OrdersView.selectedOrderId = params.get('id');
    }

    const user = State.user;

    // Authentication guards
    if (!user && path !== 'login') {
      window.location.hash = '#/login';
      return;
    }

    if (user && path === 'login') {
      window.location.hash = '#/dashboard';
      return;
    }

    if (path === 'admin' && user && user.role !== 'Administrator') {
      State.showToast('Access restricted to Administrators', 'lock');
      window.location.hash = '#/dashboard';
      return;
    }

    this.renderCurrentRoute(path, user);
  },

  async renderCurrentRoute(routePath, currentUser) {
    let hash = window.location.hash.slice(2);
    const [pathWithQuery] = hash.split('?');
    const path = routePath || pathWithQuery || 'dashboard';
    const user = currentUser || State.user;

    const appContainer = document.getElementById('app');
    if (!appContainer) return;

    if (path === 'login' || !user) {
      appContainer.innerHTML = LoginView.render();
      return;
    }

    const View = this.routes[path] || this.routes['dashboard'];
    const viewContentHtml = await View.render(user);

    appContainer.innerHTML = `
      ${SidebarComponent.render(path, user)}
      <div class="pl-64">
        ${HeaderComponent.render(user)}
        <main class="w-full pt-16 bg-surface min-h-screen px-space-lg py-space-lg">
          ${viewContentHtml}
        </main>
      </div>
    `;

    // Global click listener to close popups
    document.addEventListener('click', (e) => {
      const trigger = document.getElementById('user-profile-menu-trigger');
      const menu = document.getElementById('user-profile-menu');
      if (menu && !menu.contains(e.target) && trigger && !trigger.contains(e.target)) {
        menu.classList.add('hidden');
      }

      const notifBtn = document.getElementById('notification-btn');
      const notifPopover = document.getElementById('notifications-popover');
      if (notifPopover && !notifPopover.contains(e.target) && notifBtn && !notifBtn.contains(e.target)) {
        notifPopover.classList.add('hidden');
      }
    });
  },

  async handleChangePassword(event) {
    event.preventDefault();
    const newPassInput = document.getElementById('settings-new-password');
    const confirmPassInput = document.getElementById('settings-confirm-password');
    const newPass = newPassInput ? newPassInput.value : '';
    const confirmPass = confirmPassInput ? confirmPassInput.value : '';

    if (!newPass || newPass.length < 6) {
      State.showToast('Password must be at least 6 characters in length.', 'error');
      return;
    }
    if (newPass !== confirmPass) {
      State.showToast('Passwords do not match.', 'error');
      return;
    }

    try {
      const res = await State.apiFetch('/api/account/password', {
        method: 'PUT',
        body: JSON.stringify({ newPassword: newPass })
      });
      State.showToast(res.message || 'Password updated successfully', 'check_circle');
      if (newPassInput) newPassInput.value = '';
      if (confirmPassInput) confirmPassInput.value = '';
    } catch (err) {
      State.showToast(err.message || 'Failed to update password', 'error');
    }
  }
};

window.AppRouter = AppRouter;
