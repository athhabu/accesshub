// Top Header Bar Component
const HeaderComponent = {
  render(user) {
    if (!user) return '';

    const isAdmin = user.role === 'Administrator';
    const avatarSrc = user.avatar || '/assets/alex_mercer.png';

    return `
      <header class="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/20 z-40 px-space-lg flex items-center justify-between shadow-[0_1px_8px_rgba(0,0,0,0.02)]">
        <!-- Breadcrumb & Search -->
        <div class="flex items-center gap-space-lg flex-1 max-w-2xl">
          <div class="hidden md:flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
            ${isAdmin ? `
              <span class="px-2 py-0.5 rounded bg-primary text-on-primary font-label-sm text-[11px] font-bold tracking-wider mr-1">
                ADMIN CONSOLE
              </span>
            ` : ''}
            <a href="#/dashboard" class="hover:text-on-surface cursor-pointer transition-colors">Enterprise</a>
            <span class="text-outline-variant">/</span>
            <span class="text-on-surface font-semibold">Workspace</span>
          </div>

          <!-- Search Input -->
          <div class="relative flex-1">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input 
              id="global-search-input"
              class="w-full h-[38px] pl-9 pr-4 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" 
              placeholder="Search documents, employees, orders..." 
              type="text"
              onkeydown="if(event.key==='Enter'){ HeaderComponent.handleSearch(this.value); }"
            />
          </div>
        </div>

        <!-- Right Utilities & Profile Dropdown -->
        <div class="flex items-center gap-space-md">
          <!-- Notification Bell -->
          <div class="relative">
            <button 
              id="notification-btn"
              class="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors" 
              type="button"
              onclick="HeaderComponent.toggleNotifications()"
            >
              <span class="material-symbols-outlined text-[22px]">notifications</span>
              <span class="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-surface-container-lowest"></span>
            </button>

            <!-- Notifications Dropdown Popover -->
            <div id="notifications-popover" class="hidden absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 py-2 z-50">
              <div class="px-4 py-2 border-b border-outline-variant/20 flex items-center justify-between">
                <span class="font-label-lg text-label-lg font-bold text-on-surface">Notifications</span>
                <span class="font-label-sm text-label-sm text-primary font-medium cursor-pointer" onclick="State.showToast('All notifications marked as read')">Mark all read</span>
              </div>
              <div class="max-h-64 overflow-y-auto divide-y divide-outline-variant/10">
                <div class="px-4 py-3 hover:bg-surface-container-low transition-colors cursor-pointer">
                  <p class="font-body-sm text-body-sm text-on-surface font-medium">New document policy published</p>
                  <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Q4 Data Governance Policy update is ready for review.</p>
                  <span class="font-label-sm text-[10px] text-outline mt-1 block">15 mins ago</span>
                </div>
                <div class="px-4 py-3 hover:bg-surface-container-low transition-colors cursor-pointer">
                  <p class="font-body-sm text-body-sm text-on-surface font-medium">Requisition Status Update</p>
                  <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">Order #ORD-9204 has been dispatched via FedEx Priority.</p>
                  <span class="font-label-sm text-[10px] text-outline mt-1 block">2 hours ago</span>
                </div>
              </div>
            </div>
          </div>

          <div class="h-6 w-[1px] bg-outline-variant/30"></div>

          <!-- User Menu Trigger -->
          <div class="relative">
            <div 
              id="user-profile-menu-trigger"
              class="flex items-center gap-3 pl-1 cursor-pointer group select-none"
              onclick="HeaderComponent.toggleUserMenu()"
            >
              <img 
                alt="${user.name}" 
                class="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant/30" 
                src="${avatarSrc}"
                onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3525cd&color=fff'"
              />
              <div class="hidden sm:flex flex-col text-left">
                <span class="font-label-lg text-label-lg text-on-surface font-semibold group-hover:text-primary transition-colors leading-tight">
                  ${user.name}
                </span>
                <span class="font-label-sm text-label-sm text-on-surface-variant leading-tight">
                  ${user.jobTitle || user.role}
                </span>
              </div>
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant group-hover:text-on-surface transition-colors">
                expand_more
              </span>
            </div>

            <!-- Profile Dropdown Menu -->
            <div id="user-profile-menu" class="hidden absolute right-0 mt-2 w-72 bg-surface-container-lowest rounded-xl shadow-xl border border-outline-variant/30 py-2 z-50">
              <!-- Current User Info -->
              <div class="px-4 py-3 border-b border-outline-variant/20">
                <p class="font-label-lg text-label-lg font-bold text-on-surface">${user.name}</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant truncate">${user.email}</p>
                <div class="flex items-center gap-2 mt-1.5">
                  <span class="px-2 py-0.5 rounded bg-surface-container text-primary font-label-sm text-[11px] font-semibold">
                    ${user.empId}
                  </span>
                  <span class="px-2 py-0.5 rounded bg-secondary-container/20 text-secondary font-label-sm text-[11px] font-semibold">
                    ${user.role}
                  </span>
                </div>
              </div>

              <!-- Navigation links -->
              <div class="py-1">
                <a href="#/profile" class="flex items-center gap-2.5 px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors" onclick="HeaderComponent.closeUserMenu()">
                  <span class="material-symbols-outlined text-[18px] text-on-surface-variant">account_circle</span>
                  <span>My Profile</span>
                </a>
                ${isAdmin ? `
                  <a href="#/admin" class="flex items-center gap-2.5 px-4 py-2 font-body-sm text-body-sm text-on-surface hover:bg-surface-container-low transition-colors" onclick="HeaderComponent.closeUserMenu()">
                    <span class="material-symbols-outlined text-[18px] text-primary">admin_panel_settings</span>
                    <span>Admin Panel</span>
                  </a>
                ` : ''}
              </div>

              <!-- Sign Out -->
              <div class="pt-1 border-t border-outline-variant/20">
                <button 
                  class="w-full text-left flex items-center gap-2.5 px-4 py-2 font-body-sm text-body-sm text-error hover:bg-error-container/20 transition-colors"
                  onclick="State.logout()"
                >
                  <span class="material-symbols-outlined text-[18px]">logout</span>
                  <span>Sign Out of AccessHub</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>
    `;
  },

  handleSearch(query) {
    if (!query || !query.trim()) return;
    const q = encodeURIComponent(query.trim());
    window.location.href = `/search?q=${q}`;
  },

  toggleUserMenu() {
    const menu = document.getElementById('user-profile-menu');
    if (menu) menu.classList.toggle('hidden');
  },

  closeUserMenu() {
    const menu = document.getElementById('user-profile-menu');
    if (menu) menu.classList.add('hidden');
  },

  toggleNotifications() {
    const popover = document.getElementById('notifications-popover');
    if (popover) popover.classList.toggle('hidden');
  },

};

window.HeaderComponent = HeaderComponent;
