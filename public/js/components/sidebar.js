// Sidebar Navigation Component
const SidebarComponent = {
  render(currentPath, user) {
    if (!user) return '';

    const isAdmin = user.role === 'Administrator';

    const employeeNavItems = [
      { path: 'dashboard',       label: 'Dashboard',        icon: 'grid_view' },
      { path: 'workspace',       label: 'My Workspace',     icon: 'dashboard_customize' },
      { path: 'employee-search', label: 'Employee Search',  icon: 'person_search' },
      { path: 'order-lookup',    label: 'Order Lookup',     icon: 'find_in_page' },
      { path: 'reports',         label: 'Activity Reports', icon: 'assessment' },
      { path: 'diagnostics',     label: 'Diagnostics',      icon: 'lan' },
      { path: 'directory-search', label: 'Corp. Directory',  icon: 'contacts' },
      { path: 'user-filter',     label: 'Employee Roster',  icon: 'badge' },
      { path: 'report-templates', label: 'Report Templates', icon: 'auto_stories' },
      { path: 'document-lookup', label: 'Document Archive', icon: 'folder_open' },
      { path: 'calculation-filter', label: 'Calculation Filter', icon: 'calculate' },
      { path: 'service-requests', label: 'Service Requests', icon: 'confirmation_number' },
      { path: 'activity',        label: 'Activity Feed',    icon: 'history' },
      { path: 'knowledge-base',  label: 'Knowledge Base',   icon: 'menu_book' },
      { path: 'announcements',   label: 'Announcements',    icon: 'campaign' },
      { path: 'help',            label: 'Help Center',      icon: 'help_center' },
      { path: 'profile',         label: 'My Profile',       icon: 'person' },
      { path: 'team',            label: 'Team',             icon: 'groups' },
      { path: 'documents',       label: 'Documents',        icon: 'description' },
      { path: 'orders',          label: 'Orders',           icon: 'shopping_bag' },
      { path: 'expenses',        label: 'Expenses',         icon: 'receipt_long' },
      { path: 'calendar',        label: 'Calendar',         icon: 'calendar_month' },
      { path: 'settings',        label: 'Settings',         icon: 'settings' }
    ];

    const adminNavItems = [
      { path: 'dashboard',       label: 'Admin Dashboard',             icon: 'grid_view' },
      { path: 'admin',           label: 'User Management',              icon: 'manage_accounts' },
      { path: 'workspace',       label: 'My Workspace',                icon: 'dashboard_customize' },
      { path: 'employee-search', label: 'Employee Search',             icon: 'person_search' },
      { path: 'order-lookup',    label: 'Order Lookup',                icon: 'find_in_page' },
      { path: 'reports',         label: 'Activity Reports',            icon: 'assessment' },
      { path: 'diagnostics',     label: 'Diagnostics',                 icon: 'lan' },
      { path: 'directory-search', label: 'Corp. Directory',             icon: 'contacts' },
      { path: 'user-filter',     label: 'Employee Roster',             icon: 'badge' },
      { path: 'report-templates', label: 'Report Templates',            icon: 'auto_stories' },
      { path: 'document-lookup', label: 'Document Archive',            icon: 'folder_open' },
      { path: 'calculation-filter', label: 'Calculation Filter',        icon: 'calculate' },
      { path: 'service-requests', label: 'Service Requests',           icon: 'confirmation_number' },
      { path: 'activity',        label: 'Enterprise Activity',          icon: 'history' },
      { path: 'knowledge-base',  label: 'Knowledge Base',              icon: 'menu_book' },
      { path: 'announcements',   label: 'Announcements',               icon: 'campaign' },
      { path: 'admin-review',    label: 'Content Review',              icon: 'admin_panel_settings' },
      { path: 'help',            label: 'Help Center',                 icon: 'help_center' },
      { path: 'documents',       label: 'Documents Policy & Audits',   icon: 'policy' },
      { path: 'orders',          label: 'Order Approvals',             icon: 'shopping_cart_checkout' },
      { path: 'expenses',        label: 'Company Expenses',            icon: 'receipt_long' },
      { path: 'calendar',        label: 'Corporate Calendar',          icon: 'calendar_month' },
      { path: 'team',            label: 'Enterprise Directory',        icon: 'groups' },
      { path: 'settings',        label: 'Admin Settings & RBAC',       icon: 'admin_panel_settings' }
    ];

    const navItems = isAdmin ? adminNavItems : employeeNavItems;

    const navLinksHtml = navItems.map(item => {
      const isActive = currentPath === item.path;
      if (isActive) {
        return `
          <a aria-current="page" class="flex items-center gap-3 px-3 py-2 transition-colors bg-surface-container text-primary font-semibold rounded-lg" href="#/${item.path}">
            <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `;
      } else {
        return `
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg font-label-lg text-label-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" href="#/${item.path}">
            <span class="material-symbols-outlined text-[20px]">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        `;
      }
    }).join('');

    return `
      <aside class="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest border-r border-outline-variant/30 z-50 flex flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div class="flex flex-col">
          <!-- Logo & Brand -->
          <div class="h-16 px-space-md flex items-center justify-between border-b border-outline-variant/20">
            <a href="#/dashboard" class="flex items-center gap-space-sm">
              <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
                <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 3L4 9V15C4 22.38 9.12 29.22 16 31C22.88 29.22 28 22.38 28 15V9L16 3Z" fill="currentColor" fill-opacity="0.2"/>
                  <path d="M16 6.5L7 11V15.5C7 21.03 10.84 26.16 16 27.5C21.16 26.16 25 21.03 25 15.5V11L16 6.5Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>
                  <path d="M12 16.5L14.8 19.5L20 13.5" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2"/>
                </svg>
              </div>
              <span class="font-title-md text-title-md text-primary tracking-tight font-bold">AccessHub</span>
            </a>
            ${isAdmin ? `
              <span class="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-[10px] uppercase font-bold tracking-wider">
                Admin
              </span>
            ` : ''}
          </div>

          <!-- Section Label -->
          <div class="px-space-md pt-space-md pb-space-xs">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Menu</span>
          </div>

          <!-- Navigation Links -->
          <nav class="flex flex-col gap-1 px-space-sm" id="sidebar-nav">
            ${navLinksHtml}
          </nav>
        </div>

        <!-- Sidebar Footer -->
        <div class="p-space-sm border-t border-outline-variant/20 flex flex-col gap-1">
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg font-label-lg text-label-lg ${currentPath === 'knowledge-base' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'} transition-colors" href="#/knowledge-base">
            <span class="material-symbols-outlined text-[20px]">help_center</span>
            <span>Quick Help &amp; Docs</span>
          </a>
          <!-- Security Assessment Link (training lab) -->
          <a class="flex items-center gap-3 px-3 py-2 rounded-lg font-label-lg text-label-lg ${currentPath === 'lab-progress' ? 'bg-surface-container text-primary font-semibold' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'} transition-colors" href="#/lab-progress">
            <span class="material-symbols-outlined text-[20px]">security</span>
            <span>Security Assessment</span>
          </a>
          <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-container-low text-on-surface mt-1 cursor-pointer" onclick="State.showToast('Connected to Acme Corp (Prod) Tenant Gateway')">
            <div class="flex items-center gap-2 overflow-hidden">
              <span class="w-2 h-2 rounded-full bg-secondary shrink-0 animate-pulse"></span>
              <span class="font-label-sm text-label-sm truncate font-medium">Acme Corp (Prod)</span>
            </div>
            <span class="material-symbols-outlined text-[16px] text-on-surface-variant">unfold_more</span>
          </div>
        </div>
      </aside>
    `;
  }
};

window.SidebarComponent = SidebarComponent;
