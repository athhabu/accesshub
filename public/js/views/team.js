// Team View Component matching 4._team_accesshub/screen.png
const TeamView = {
  activeTab: 'employees',
  searchQuery: '',
  selectedDept: 'all',
  selectedOffice: 'all',
  selectedStatus: 'active',
  currentPage: 1,
  pageSize: 8,

  // Maps a department name to its URL slug for the department endpoint
  deptSlug(deptName) {
    return (deptName || '').toLowerCase().replace(/[&\s]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  },

  switchTab(tab) {
    this.activeTab = tab;
    AppRouter.renderCurrentRoute();
  },

  async render(currentUser) {
    const user = currentUser || State.user;

    let users = [];
    try {
      const queryParams = new URLSearchParams();
      if (this.searchQuery) queryParams.set('q', this.searchQuery);
      if (this.selectedDept !== 'all') queryParams.set('department', this.selectedDept);
      if (this.selectedOffice !== 'all') queryParams.set('office', this.selectedOffice);
      if (this.selectedStatus !== 'all') queryParams.set('status', this.selectedStatus);

      const res = await State.apiFetch(`/api/users?${queryParams.toString()}`);
      users = res.users;
    } catch (err) {
      console.warn('Failed to load users:', err);
    }

    const totalEmployees = users.length;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const displayedUsers = users.slice(startIndex, startIndex + this.pageSize);

    // Load teams when on teams tab
    let teams = [];
    if (this.activeTab === 'teams') {
      try {
        const teamsRes = await State.apiFetch('/api/teams');
        teams = teamsRes.teams || [];
      } catch (err) {
        console.warn('Failed to load teams:', err);
      }
    }

    // Load this user's department roster when on department tab
    let deptData = null;
    if (this.activeTab === 'department') {
      try {
        const slug = this.deptSlug(user.department);
        const deptRes = await State.apiFetch(`/api/departments/${slug}/employees`);
        deptData = deptRes;
      } catch (err) {
        console.warn('Failed to load department data:', err);
      }
    }

    return `
      <div class="flex flex-col w-full pb-12">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">Team Directory</h1>
              <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm font-semibold">
                <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                48 Active Employees
              </span>
            </div>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Browse colleagues, departments, functional squads, and directory records across Acme Corp.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button 
              class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30" 
              onclick="TeamView.exportCSV()" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
              <span>Export CSV</span>
            </button>
            <button 
              class="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm" 
              onclick="TeamView.openInviteModal()" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px]">person_add</span>
              <span>Invite Colleague</span>
            </button>
          </div>
        </div>

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-6">
          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">HEADCOUNT</span>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">52</span>
                <span class="text-xs text-on-surface-variant">/ 60 Cap</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[20px]">groups</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">ENGINEERING & TECH</span>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">28</span>
                <span class="text-xs text-secondary font-semibold">58%</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
              <span class="material-symbols-outlined text-[20px]">terminal</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">REMOTE DISTRIBUTED</span>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">14</span>
                <span class="text-xs text-on-surface-variant">in 6 regions</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[20px]">public</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">OFFICE PRESENCE</span>
              <div class="flex items-baseline gap-1 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">34</span>
                <span class="text-xs text-on-surface-variant">On-site today</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant">
              <span class="material-symbols-outlined text-[20px]">corporate_fare</span>
            </div>
          </div>
        </div>

        <!-- Directory Tabs -->
        <div class="flex items-center gap-6 border-b border-outline-variant/30 mb-6">
          <button 
            onclick="TeamView.switchTab('employees')" 
            class="pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${this.activeTab === 'employees' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}"
          >
            <span class="material-symbols-outlined text-[18px]">badge</span>
            <span>All Employees</span>
          </button>
          <button 
            onclick="TeamView.switchTab('department')" 
            class="pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${this.activeTab === 'department' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}"
          >
            <span class="material-symbols-outlined text-[18px]">domain</span>
            <span>My Department</span>
          </button>
          <button 
            onclick="TeamView.switchTab('teams')" 
            class="pb-3 text-sm font-semibold transition-colors flex items-center gap-2 ${this.activeTab === 'teams' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-on-surface'}"
          >
            <span class="material-symbols-outlined text-[18px]">groups</span>
            <span>Squads & Functional Teams</span>
          </button>
        </div>

        ${this.activeTab === 'teams' ? this.renderTeamsTab(user, teams) : this.activeTab === 'department' ? this.renderDepartmentTab(user, deptData) : this.renderEmployeesTab(user, displayedUsers, totalEmployees, startIndex)}

        <!-- Employee Quick Detail Modal -->
        <div id="team-detail-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-md overflow-hidden" id="team-detail-content">
          </div>
        </div>

        <!-- Add Team Member Modal (Only exposed in UI to team manager / administrator) -->
        <div id="team-add-member-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-md overflow-hidden" id="team-add-member-content">
          </div>
        </div>
      </div>
    `;
  },

  renderTeamsTab(currentUser, teams) {
    if (!teams || teams.length === 0) {
      return `
        <div class="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-on-surface-variant">
          No functional teams currently configured.
        </div>
      `;
    }

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md mb-8">
        ${teams.map(team => {
          const isManager = team.managerId === currentUser.id;
          const isAdmin = currentUser.role === 'Administrator';
          const canManage = isManager || isAdmin;

          return `
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <!-- Team Header -->
                <div class="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 class="font-title-md text-title-md font-bold text-on-surface">${team.name}</h3>
                    <span class="font-mono text-[11px] text-primary font-medium">${team.id}</span>
                  </div>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">
                    ${team.department}
                  </span>
                </div>

                <p class="text-xs text-on-surface-variant line-clamp-2 mb-4">
                  ${team.description || 'Enterprise operational team and project unit.'}
                </p>

                <!-- Manager Section -->
                <div class="p-3 rounded-lg bg-surface-container-low border border-outline-variant/20 mb-4">
                  <span class="block text-[10px] uppercase tracking-wider text-on-surface-variant font-bold mb-1.5">TEAM MANAGER / LEAD</span>
                  ${team.manager ? `
                    <div class="flex items-center gap-2.5">
                      <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center font-bold text-primary text-xs shrink-0">
                        ${team.manager.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div class="overflow-hidden">
                        <div class="flex items-center gap-1.5">
                          <p class="font-body-sm text-body-sm font-semibold text-on-surface truncate">${team.manager.name}</p>
                          ${isManager ? `<span class="px-1 py-0.2 rounded bg-primary/20 text-primary text-[9px] font-bold">You</span>` : ''}
                        </div>
                        <p class="text-[11px] text-on-surface-variant truncate">${team.manager.jobTitle || 'Team Lead'}</p>
                      </div>
                    </div>
                  ` : `
                    <span class="text-xs text-on-surface-variant italic">Unassigned</span>
                  `}
                </div>

                <!-- Members Roster -->
                <div class="mb-4">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">ROSTER (${team.memberCount} MEMBERS)</span>
                  </div>
                  <div class="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    ${team.members && team.members.length > 0 ? team.members.map(m => `
                      <div class="flex items-center justify-between py-1 px-2 rounded bg-surface-container-low/50 text-xs">
                        <div class="flex items-center gap-2 truncate">
                          <span class="font-mono text-[10px] text-outline">${m.empId}</span>
                          <span class="font-medium text-on-surface truncate">${m.name}</span>
                          ${m.id === currentUser.id ? `<span class="px-1 text-[9px] bg-secondary/15 text-secondary font-bold rounded">You</span>` : ''}
                        </div>
                        <span class="text-[11px] text-on-surface-variant truncate max-w-[100px] text-right">${m.jobTitle}</span>
                      </div>
                    `).join('') : `
                      <p class="text-xs text-on-surface-variant italic">No members added yet.</p>
                    `}
                  </div>
                </div>
              </div>

              <!-- Action Area -->
              <div class="pt-3 border-t border-outline-variant/20">
                ${canManage ? `
                  <button 
                    onclick="TeamView.openAddMemberModal('${team.id}')"
                    class="w-full py-2 px-3 rounded-lg bg-primary text-on-primary font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-on-primary-fixed-variant transition-colors shadow-sm"
                  >
                    <span class="material-symbols-outlined text-[16px]">person_add</span>
                    <span>Add Team Member</span>
                  </button>
                ` : `
                  <div class="flex items-center justify-between text-xs text-on-surface-variant py-1">
                    <span class="inline-flex items-center gap-1">
                      <span class="material-symbols-outlined text-[14px] text-outline">shield</span>
                      Standard Member View
                    </span>
                    <span class="font-mono text-[11px] text-outline">${team.memberCount} members</span>
                  </div>
                `}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderEmployeesTab(user, displayedUsers, totalEmployees, startIndex) {
    return `
      <!-- Filter Bar -->
      <div class="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm mb-4">
        <div class="flex flex-col lg:flex-row items-center gap-3">
          <!-- Search -->
          <div class="relative flex-1 w-full">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
            <input 
              id="team-search-input"
              class="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" 
              placeholder="Search employee by name, ID, or job title..."
              type="text"
              value="${this.searchQuery}"
              oninput="TeamView.handleSearch(this.value)"
            />
          </div>

          <!-- Dropdown Filters -->
          <div class="flex items-center gap-2.5 w-full lg:w-auto overflow-x-auto">
            <select 
              class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary"
              onchange="TeamView.handleDeptFilter(this.value)"
            >
              <option value="all" ${this.selectedDept === 'all' ? 'selected' : ''}>All Departments</option>
              <option value="Engineering" ${this.selectedDept === 'Engineering' ? 'selected' : ''}>Engineering</option>
              <option value="Product" ${this.selectedDept === 'Product' ? 'selected' : ''}>Product</option>
              <option value="People Operations" ${this.selectedDept === 'People Operations' ? 'selected' : ''}>People Ops</option>
              <option value="DevOps" ${this.selectedDept === 'DevOps' ? 'selected' : ''}>DevOps</option>
              <option value="Finance" ${this.selectedDept === 'Finance' ? 'selected' : ''}>Finance</option>
              <option value="Operations" ${this.selectedDept === 'Operations' ? 'selected' : ''}>Operations</option>
            </select>

            <select 
              class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary"
              onchange="TeamView.handleOfficeFilter(this.value)"
            >
              <option value="all" ${this.selectedOffice === 'all' ? 'selected' : ''}>All Offices</option>
              <option value="San Francisco HQ" ${this.selectedOffice === 'San Francisco HQ' ? 'selected' : ''}>San Francisco HQ</option>
              <option value="Remote (US)" ${this.selectedOffice === 'Remote (US)' ? 'selected' : ''}>Remote (US)</option>
              <option value="New York Office" ${this.selectedOffice === 'New York Office' ? 'selected' : ''}>New York Office</option>
              <option value="London Office" ${this.selectedOffice === 'London Office' ? 'selected' : ''}>London Office</option>
            </select>

            <select 
              class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary"
              onchange="TeamView.handleStatusFilter(this.value)"
            >
              <option value="active" ${this.selectedStatus === 'active' ? 'selected' : ''}>Active</option>
              <option value="suspended" ${this.selectedStatus === 'suspended' ? 'selected' : ''}>Suspended</option>
              <option value="all" ${this.selectedStatus === 'all' ? 'selected' : ''}>All Statuses</option>
            </select>

            <!-- View Toggles -->
            <div class="flex items-center border border-outline-variant/40 rounded-lg overflow-hidden bg-surface-container-low">
              <button class="p-2 bg-surface-container text-primary" title="Grid View">
                <span class="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button class="p-2 text-on-surface-variant hover:text-on-surface" title="Table View" onclick="State.showToast('Switching view layout...')">
                <span class="material-symbols-outlined text-[18px]">table_rows</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Filter Pills -->
      <div class="flex items-center gap-2 mb-6 flex-wrap text-xs">
        <span class="text-on-surface-variant font-medium">Active filters:</span>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-medium">
          Status: ${this.selectedStatus === 'all' ? 'All' : this.selectedStatus.toUpperCase()}
          <button onclick="TeamView.handleStatusFilter('all')" class="hover:text-error">×</button>
        </span>
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container text-on-surface font-medium">
          Acme Corp (Primary Tenant)
          <button onclick="State.showToast('Tenant lock active')" class="hover:text-error">×</button>
        </span>
        <button onclick="TeamView.resetFilters()" class="text-primary font-semibold hover:underline ml-2">Reset all</button>
      </div>

      <!-- Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-8">
        ${displayedUsers.map(emp => {
          const isMe = emp.id === user.id;
          const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2);
          return `
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-md shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <!-- Card Header: Avatar, Name, You badge, Status -->
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="relative shrink-0">
                      ${emp.avatar ? `
                        <img class="w-12 h-12 rounded-xl object-cover" src="${emp.avatar}" alt="${emp.name}" onerror="this.outerHTML='<div class=\\'w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary\\'>${initials}</div>'"/>
                      ` : `
                        <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center font-bold text-primary">
                          ${initials}
                        </div>
                      `}
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <h3 class="font-title-md text-title-md font-bold text-on-surface">${emp.name}</h3>
                        ${isMe ? `
                          <span class="px-1.5 py-0.2 rounded bg-primary-container/20 text-primary font-label-sm text-[10px] font-bold">You</span>
                        ` : ''}
                      </div>
                      <p class="text-xs text-on-surface-variant line-clamp-1">${emp.jobTitle}</p>
                      <span class="font-mono text-[11px] text-primary font-medium">${emp.empId}</span>
                    </div>
                  </div>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-container/20 text-secondary text-[11px] font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    ${emp.status}
                  </span>
                </div>

                <!-- Details -->
                <div class="space-y-1.5 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant">
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-primary">domain</span>
                    <span>${emp.department}</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px] text-outline">location_on</span>
                    <span>${emp.location || emp.office || 'San Francisco HQ'}</span>
                  </div>
                  <div class="flex items-center gap-2 truncate">
                    <span class="material-symbols-outlined text-[16px] text-outline">mail</span>
                    <span class="truncate">${emp.email}</span>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex items-center gap-2 mt-4 pt-3 border-t border-outline-variant/20">
                <button 
                  class="flex-1 py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors"
                  onclick="TeamView.viewEmployeeDetails('${emp.id}')"
                >
                  View Profile
                </button>
                <button 
                  class="p-1.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors"
                  onclick="State.showToast('Opened Slack direct message with ${emp.name}', 'chat')"
                  title="Send Message"
                >
                  <span class="material-symbols-outlined text-[18px]">chat</span>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Pagination -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <span class="font-body-sm text-body-sm text-on-surface-variant">
          Showing <strong class="text-on-surface">${displayedUsers.length > 0 ? startIndex + 1 : 0}-${Math.min(startIndex + this.pageSize, totalEmployees)}</strong> of <strong class="text-on-surface">${totalEmployees}</strong> employees
        </span>

        <div class="flex items-center gap-1">
          <button class="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low" onclick="TeamView.prevPage()">
            <span class="material-symbols-outlined text-[16px]">chevron_left</span>
          </button>
          <button class="w-8 h-8 rounded-lg bg-primary text-on-primary font-bold text-xs">1</button>
          <button class="w-8 h-8 rounded-lg hover:bg-surface-container-low text-xs font-semibold" onclick="State.showToast('Page 2')">2</button>
          <button class="w-8 h-8 rounded-lg hover:bg-surface-container-low text-xs font-semibold" onclick="State.showToast('Page 3')">3</button>
          <span class="px-1 text-on-surface-variant">...</span>
          <button class="w-8 h-8 rounded-lg hover:bg-surface-container-low text-xs font-semibold" onclick="State.showToast('Page 6')">6</button>
          <button class="w-8 h-8 rounded-lg border border-outline-variant/40 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low" onclick="TeamView.nextPage()">
            <span class="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>
    `;
  },

  handleSearch(query) {
    this.searchQuery = query;
    this.currentPage = 1;
    AppRouter.renderCurrentRoute();
  },

  handleDeptFilter(dept) {
    this.selectedDept = dept;
    this.currentPage = 1;
    AppRouter.renderCurrentRoute();
  },

  handleOfficeFilter(office) {
    this.selectedOffice = office;
    this.currentPage = 1;
    AppRouter.renderCurrentRoute();
  },

  handleStatusFilter(status) {
    this.selectedStatus = status;
    this.currentPage = 1;
    AppRouter.renderCurrentRoute();
  },

  resetFilters() {
    this.searchQuery = '';
    this.selectedDept = 'all';
    this.selectedOffice = 'all';
    this.selectedStatus = 'active';
    this.currentPage = 1;
    AppRouter.renderCurrentRoute();
  },

  exportCSV() {
    State.showToast('Exporting team directory CSV...', 'download');
  },

  openInviteModal() {
    State.showToast('Opening SCIM directory invitation console...', 'person_add');
  },

  async viewEmployeeDetails(id) {
    try {
      const res = await State.apiFetch(`/api/users/${id}`);
      const emp = res.user;
      const modal = document.getElementById('team-detail-modal');
      const content = document.getElementById('team-detail-content');

      content.innerHTML = `
        <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <h3 class="font-title-md text-title-md font-bold text-on-surface">${emp.name}</h3>
          <button onclick="TeamView.closeDetailModal()" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-6 space-y-3 text-sm">
          <div class="flex items-center gap-3 mb-4">
            <img class="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/20" src="${emp.avatar || '/assets/alex_mercer.png'}" alt="${emp.name}" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=3525cd&color=fff'"/>
            <div>
              <p class="font-bold text-base text-on-surface">${emp.name}</p>
              <p class="text-xs text-on-surface-variant">${emp.jobTitle}</p>
              <span class="font-mono text-xs text-primary font-semibold">${emp.empId}</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div class="p-2 rounded bg-surface-container-low">
              <span class="text-outline block font-bold">DEPARTMENT</span>
              <span class="font-semibold text-on-surface">${emp.department}</span>
            </div>
            <div class="p-2 rounded bg-surface-container-low">
              <span class="text-outline block font-bold">LOCATION</span>
              <span class="font-semibold text-on-surface">${emp.location || emp.office}</span>
            </div>
            <div class="p-2 rounded bg-surface-container-low">
              <span class="text-outline block font-bold">EMAIL</span>
              <span class="font-semibold text-on-surface truncate block">${emp.email}</span>
            </div>
            <div class="p-2 rounded bg-surface-container-low">
              <span class="text-outline block font-bold">PHONE</span>
              <span class="font-semibold text-on-surface">${emp.phone || 'N/A'}</span>
            </div>
          </div>
        </div>
        <div class="px-6 py-3 bg-surface-container-low border-t border-outline-variant/20 flex justify-end">
          <button onclick="TeamView.closeDetailModal()" class="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-xs">Close</button>
        </div>
      `;

      modal.classList.remove('hidden');
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  closeDetailModal() {
    const modal = document.getElementById('team-detail-modal');
    if (modal) modal.classList.add('hidden');
  },

  async openAddMemberModal(teamId) {
    try {
      const [teamRes, usersRes] = await Promise.all([
        State.apiFetch(`/api/teams/${teamId}`),
        State.apiFetch('/api/users')
      ]);

      const team = teamRes.team;
      const currentMemberIds = team.memberIds || [];
      const eligibleEmployees = (usersRes.users || []).filter(u => !currentMemberIds.includes(u.id));

      const modal = document.getElementById('team-add-member-modal');
      const content = document.getElementById('team-add-member-content');

      content.innerHTML = `
        <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
          <div>
            <h3 class="font-title-md text-title-md font-bold text-on-surface">Add Team Member</h3>
            <span class="text-xs text-on-surface-variant">${team.name} (${team.id})</span>
          </div>
          <button onclick="TeamView.closeAddMemberModal()" class="text-on-surface-variant hover:text-on-surface">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="p-6 space-y-4 text-sm">
          <div>
            <label class="block text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
              Select Employee
            </label>
            ${eligibleEmployees.length > 0 ? `
              <select id="new-member-select" class="w-full h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-on-surface focus:outline-none focus:border-primary">
                ${eligibleEmployees.map(e => `
                  <option value="${e.id}">${e.name} (${e.empId}) — ${e.jobTitle}</option>
                `).join('')}
              </select>
            ` : `
              <p class="text-xs text-on-surface-variant italic">All enterprise employees are already members of this team.</p>
            `}
          </div>

          <div class="p-3 rounded-lg bg-surface-container-low text-xs text-on-surface-variant space-y-1">
            <p class="font-semibold text-on-surface">Team Management Policy:</p>
            <p>New team members will receive workspace notifications, project sync calendar invites, and squad directory assignment.</p>
          </div>
        </div>
        <div class="px-6 py-3 bg-surface-container-low border-t border-outline-variant/20 flex justify-end gap-2">
          <button onclick="TeamView.closeAddMemberModal()" class="px-4 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface text-xs font-semibold hover:bg-surface-container">
            Cancel
          </button>
          ${eligibleEmployees.length > 0 ? `
            <button onclick="TeamView.submitAddMember('${team.id}')" class="px-4 py-1.5 rounded-lg bg-primary text-on-primary font-semibold text-xs shadow-sm hover:bg-on-primary-fixed-variant transition-colors">
              Add to Team
            </button>
          ` : ''}
        </div>
      `;

      modal.classList.remove('hidden');
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  closeAddMemberModal() {
    const modal = document.getElementById('team-add-member-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitAddMember(teamId) {
    const select = document.getElementById('new-member-select');
    if (!select || !select.value) {
      State.showToast('Please select an employee to add', 'error');
      return;
    }

    const employeeId = parseInt(select.value, 10);
    try {
      const res = await State.apiFetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        body: JSON.stringify({ employeeId })
      });

      this.closeAddMemberModal();
      State.showToast(res.message || 'Team member added successfully', 'check_circle');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message || 'Failed to add team member', 'error');
    }
  },

  renderDepartmentTab(currentUser, deptData) {
    if (!deptData) {
      return `
        <div class="p-8 text-center bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-on-surface-variant">
          <span class="material-symbols-outlined text-[36px] text-outline mb-2 block">domain</span>
          <p class="font-bold text-on-surface">Department directory unavailable</p>
          <p class="text-xs mt-1">Please try again or contact IT support.</p>
        </div>
      `;
    }

    const { department, employees } = deptData;

    return `
      <div class="space-y-4">
        <!-- Department Header Card -->
        <div class="p-5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
          <div>
            <div class="flex items-center gap-3 mb-1">
              <span class="material-symbols-outlined text-primary text-[22px]">domain</span>
              <h2 class="font-title-md text-title-md font-bold text-on-surface">${department} Department</h2>
            </div>
            <p class="text-xs text-on-surface-variant pl-8">
              Internal employee roster for the <strong>${department}</strong> department — Acme Corp
            </p>
          </div>
          <div class="text-right">
            <span class="font-headline-md text-headline-md font-bold text-primary">${employees.length}</span>
            <span class="block text-xs text-on-surface-variant">Employees</span>
          </div>
        </div>

        <!-- Employee Roster Table -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden">
          <div class="px-5 py-3 border-b border-outline-variant/20 bg-surface-container-low flex items-center justify-between">
            <span class="text-[11px] uppercase tracking-wider font-bold text-on-surface-variant">DEPARTMENT ROSTER</span>
            <span class="text-xs text-on-surface-variant font-mono">${department.toLowerCase().replace(/[&\s]+/g, '-')}</span>
          </div>
          <div class="divide-y divide-outline-variant/15">
            ${employees.map(emp => {
              const isMe = emp.id === currentUser.id;
              const initials = emp.name.split(' ').map(n => n[0]).join('').substring(0, 2);
              return `
                <div class="flex items-center justify-between px-5 py-3 hover:bg-surface-container-low/50 transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      ${initials}
                    </div>
                    <div>
                      <div class="flex items-center gap-1.5">
                        <p class="font-semibold text-sm text-on-surface">${emp.name}</p>
                        ${isMe ? `<span class="px-1.5 rounded bg-primary/20 text-primary text-[10px] font-bold">You</span>` : ''}
                      </div>
                      <p class="text-xs text-on-surface-variant">${emp.jobTitle}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <span class="font-mono text-[11px] text-primary font-medium block">${emp.empId}</span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      emp.status === 'Active' ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'
                    }">
                      <span class="w-1.5 h-1.5 rounded-full ${emp.status === 'Active' ? 'bg-secondary' : 'bg-error'}"></span>
                      ${emp.status}
                    </span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  },

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      AppRouter.renderCurrentRoute();
    }
  },

  nextPage() {
    this.currentPage++;
    AppRouter.renderCurrentRoute();
  }
};

window.TeamView = TeamView;
