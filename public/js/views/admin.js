// Admin Panel View Component matching 7._admin_panel_accesshub/screen.png
const AdminView = {
  searchQuery: '',
  selectedRole: 'all',
  selectedDept: 'all',
  selectedStatus: 'all',

  async render(currentUser) {
    const user = currentUser || State.user;

    // Strict access control: only Administrator
    if (user.role !== 'Administrator') {
      return `
        <div class="p-12 text-center">
          <span class="material-symbols-outlined text-[48px] text-error mb-3">lock</span>
          <h2 class="font-headline-md text-headline-md text-on-surface font-bold">Access Restricted</h2>
          <p class="text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
            Administrative privileges are required to access the Identity & Access Governance console.
          </p>
          <a href="#/dashboard" class="inline-block mt-4 px-4 py-2 rounded-lg bg-primary text-on-primary font-semibold text-xs">
            Return to Dashboard
          </a>
        </div>
      `;
    }

    let users = [];
    try {
      const res = await State.apiFetch('/api/users');
      users = res.users;
    } catch (err) {
      console.warn('Failed to load users:', err);
    }

    // Apply client filters
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      users = users.filter(u =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.empId.toLowerCase().includes(q)
      );
    }

    if (this.selectedRole !== 'all') {
      users = users.filter(u => (u.assignedRole || u.role).toLowerCase() === this.selectedRole.toLowerCase());
    }

    if (this.selectedDept !== 'all') {
      users = users.filter(u => u.department.toLowerCase() === this.selectedDept.toLowerCase());
    }

    if (this.selectedStatus !== 'all') {
      users = users.filter(u => u.status.toLowerCase() === this.selectedStatus.toLowerCase());
    }

    return `
      <div class="flex flex-col w-full pb-12">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div class="flex items-center gap-2 text-xs font-semibold text-primary mb-1 uppercase tracking-wider">
              <span>IDENTITY & ACCESS GOVERNANCE</span>
              <span>•</span>
              <span class="text-on-surface-variant">Tenant: Acme Global Systems (Prod)</span>
            </div>
            <h1 class="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
              User Management & Enterprise Directory
            </h1>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
              Provision, modify permissions, and manage corporate employee accounts across all organizational units.
            </p>
          </div>

          <div class="flex items-center gap-3 flex-wrap">
            <button 
              class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30" 
              onclick="AdminView.exportCSV()" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
              <span>Export CSV Directory</span>
            </button>
            <button 
              class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30" 
              onclick="State.showToast('Batch Role Assignment wizard opened', 'group_add')" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">manage_accounts</span>
              <span>Batch Role Assignment</span>
            </button>
            <button 
              class="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-on-primary-fixed-variant transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm" 
              onclick="AdminView.openAddModal()" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px]">person_add</span>
              <span>+ Add New Employee</span>
            </button>
          </div>
        </div>

        <!-- 4 Metric Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-6">
          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">TOTAL SYSTEM USERS</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">48</span>
                <span class="text-xs text-on-surface-variant">Accounts</span>
              </div>
              <div class="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                <span class="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span>3 Admins</span>
                <span>•</span>
                <span>45 Employees</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary">
              <span class="material-symbols-outlined text-[20px]">badge</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">ACTIVE SESSIONS</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">19</span>
                <span class="text-xs text-secondary font-semibold">Connected</span>
              </div>
              <div class="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                <span>16 Web Portal</span>
                <span>•</span>
                <span>3 API / SSO</span>
              </div>
            </div>
            <div class="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
              <span class="material-symbols-outlined text-[20px]">sensors</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">PENDING ACCESS REQUESTS</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-tertiary">5</span>
                <span class="px-1.5 py-0.2 rounded bg-tertiary-fixed-dim/30 text-tertiary text-[10px] font-bold">Requires Review</span>
              </div>
              <span class="text-[11px] text-on-surface-variant mt-1 block">3 Role elevation • 2 App entitlements</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-tertiary/15 flex items-center justify-center text-tertiary">
              <span class="material-symbols-outlined text-[20px]">assignment</span>
            </div>
          </div>

          <div class="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm flex items-center justify-between">
            <div>
              <span class="block text-[11px] uppercase tracking-wider text-on-surface-variant font-semibold">SECURITY / AUDIT EVENTS</span>
              <div class="flex items-baseline gap-2 mt-1">
                <span class="font-headline-md text-headline-md font-bold text-secondary">0</span>
                <span class="text-xs text-secondary font-semibold">Alerts</span>
              </div>
              <span class="text-[11px] text-on-surface-variant mt-1 block">2,419 logs captured today • Zero anomalies</span>
            </div>
            <div class="w-10 h-10 rounded-lg bg-secondary/15 flex items-center justify-center text-secondary">
              <span class="material-symbols-outlined text-[20px]">security</span>
            </div>
          </div>
        </div>

        <!-- Filters Bar -->
        <div class="p-3.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm mb-4">
          <div class="flex flex-col lg:flex-row items-center gap-3">
            <!-- Search -->
            <div class="relative flex-1 w-full">
              <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input 
                id="admin-search-input"
                class="w-full h-10 pl-9 pr-4 rounded-lg bg-surface-container-low border border-outline-variant/40 font-body-sm text-body-sm text-on-surface placeholder:text-on-surface-variant/70 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all" 
                placeholder="Search by employee name, email, or employee ID..." 
                type="text"
                value="${this.searchQuery}"
                oninput="AdminView.handleSearch(this.value)"
              />
            </div>

            <!-- Dropdowns -->
            <div class="flex items-center gap-2.5 w-full lg:w-auto overflow-x-auto">
              <select 
                class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary text-xs"
                onchange="AdminView.handleRoleFilter(this.value)"
              >
                <option value="all" ${this.selectedRole === 'all' ? 'selected' : ''}>All Roles</option>
                <option value="Standard Employee" ${this.selectedRole === 'Standard Employee' ? 'selected' : ''}>Standard Employee</option>
                <option value="Administrator" ${this.selectedRole === 'Administrator' ? 'selected' : ''}>Administrator</option>
                <option value="Department Director" ${this.selectedRole === 'Department Director' ? 'selected' : ''}>Department Director</option>
                <option value="HR Administrator" ${this.selectedRole === 'HR Administrator' ? 'selected' : ''}>HR Administrator</option>
                <option value="Contractor (External)" ${this.selectedRole === 'Contractor (External)' ? 'selected' : ''}>Contractor (External)</option>
              </select>

              <select 
                class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary text-xs"
                onchange="AdminView.handleDeptFilter(this.value)"
              >
                <option value="all" ${this.selectedDept === 'all' ? 'selected' : ''}>All Departments</option>
                <option value="Engineering" ${this.selectedDept === 'Engineering' ? 'selected' : ''}>Engineering</option>
                <option value="Product" ${this.selectedDept === 'Product' ? 'selected' : ''}>Product</option>
                <option value="IT & Security" ${this.selectedDept === 'IT & Security' ? 'selected' : ''}>IT & Security</option>
                <option value="People Operations" ${this.selectedDept === 'People Operations' ? 'selected' : ''}>People Operations</option>
                <option value="Operations" ${this.selectedDept === 'Operations' ? 'selected' : ''}>Operations</option>
                <option value="DevOps" ${this.selectedDept === 'DevOps' ? 'selected' : ''}>DevOps</option>
                <option value="Finance" ${this.selectedDept === 'Finance' ? 'selected' : ''}>Finance</option>
              </select>

              <select 
                class="h-10 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 font-label-md text-label-md text-on-surface focus:outline-none focus:border-primary text-xs"
                onchange="AdminView.handleStatusFilter(this.value)"
              >
                <option value="all" ${this.selectedStatus === 'all' ? 'selected' : ''}>All Statuses</option>
                <option value="Active" ${this.selectedStatus === 'Active' ? 'selected' : ''}>Active</option>
                <option value="Suspended" ${this.selectedStatus === 'Suspended' ? 'selected' : ''}>Suspended</option>
              </select>

              <button 
                class="h-10 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/40 text-on-surface flex items-center gap-1 text-xs font-semibold"
                onclick="AdminView.resetFilters()"
              >
                <span class="material-symbols-outlined text-[16px]">refresh</span>
                <span>Reset</span>
              </button>
            </div>
          </div>
        </div>

        <!-- User Management Table Card -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 shadow-sm overflow-hidden mb-6">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-surface-container-low/60 border-b border-outline-variant/20 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th class="py-3 px-4 w-10 text-center">
                    <input type="checkbox" class="rounded w-4 h-4 text-primary focus:ring-0 cursor-pointer"/>
                  </th>
                  <th class="py-3 px-4">EMPLOYEE</th>
                  <th class="py-3 px-4">EMPLOYEE ID</th>
                  <th class="py-3 px-4">DEPARTMENT</th>
                  <th class="py-3 px-4">ASSIGNED ROLE</th>
                  <th class="py-3 px-4">ACCOUNT STATUS</th>
                  <th class="py-3 px-4">LAST ACTIVE</th>
                  <th class="py-3 px-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-outline-variant/15 font-body-sm text-body-sm">
                ${users.map(u => {
                  const isMe = u.id === user.id;
                  const initials = u.name.split(' ').map(n=>n[0]).join('').substring(0, 2);
                  const isSuspended = u.status === 'Suspended';
                  const isAdminRole = u.role === 'Administrator';
                  return `
                    <tr class="hover:bg-surface-container-low/50 transition-colors group">
                      <td class="py-3.5 px-4 text-center">
                        <input type="checkbox" class="rounded w-4 h-4 text-primary focus:ring-0 cursor-pointer"/>
                      </td>
                      <td class="py-3.5 px-4">
                        <div class="flex items-center gap-3">
                          <div class="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary shrink-0 overflow-hidden">
                            ${u.avatar ? `
                              <img src="${u.avatar}" alt="${u.name}" class="w-full h-full object-cover" onerror="this.outerHTML='<span>${initials}</span>'"/>
                            ` : `<span>${initials}</span>`}
                          </div>
                          <div>
                            <div class="flex items-center gap-1.5">
                              <p class="font-title-md text-title-md font-bold text-on-surface leading-tight">${u.name}</p>
                              ${isMe ? `<span class="text-primary text-[11px] font-bold">(You)</span>` : ''}
                            </div>
                            <span class="text-xs text-on-surface-variant block">${u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td class="py-3.5 px-4 font-mono text-xs text-on-surface-variant font-medium">${u.empId}</td>
                      <td class="py-3.5 px-4">
                        <span class="px-2.5 py-1 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface">
                          ${u.department}
                        </span>
                      </td>
                      <td class="py-3.5 px-4">
                        ${isAdminRole ? `
                          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-on-primary font-label-sm text-[11px] font-bold">
                            <span class="material-symbols-outlined text-[14px]">shield</span>
                            Administrator
                          </span>
                        ` : `
                          <span class="font-body-md text-body-md text-on-surface font-medium">
                            ${u.assignedRole || u.role}
                          </span>
                        `}
                      </td>
                      <td class="py-3.5 px-4">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isSuspended ? 'bg-tertiary-fixed-dim/30 text-tertiary' : 'bg-secondary-container/20 text-secondary'
                        }">
                          <span class="w-1.5 h-1.5 rounded-full ${isSuspended ? 'bg-tertiary' : 'bg-secondary'}"></span>
                          ${u.status}
                        </span>
                      </td>
                      <td class="py-3.5 px-4 text-xs text-on-surface-variant">${u.lastActive || 'Just now'}</td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="inline-flex items-center gap-1">
                          <button 
                            class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" 
                            onclick="AdminView.openEditModal('${u.id}', '${encodeURIComponent(u.name)}', '${u.department}', '${u.role}', '${u.assignedRole || u.role}', '${u.status}', '${encodeURIComponent(u.jobTitle || '')}')" 
                            title="Edit Permissions & Role"
                          >
                            <span class="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          ${!isMe ? `
                            <button 
                              class="p-1.5 rounded hover:bg-error-container/20 text-on-surface-variant hover:text-error transition-colors" 
                              onclick="AdminView.deleteUser('${u.id}', '${encodeURIComponent(u.name)}')" 
                              title="Delete or Deactivate Employee"
                            >
                              <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          ` : ''}
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination / Rows info -->
          <div class="px-6 py-3.5 bg-surface-container-low/40 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
            <div class="flex items-center gap-2">
              <span>Showing <strong>1-${users.length}</strong> of <strong>48</strong> users</span>
              <span>•</span>
              <span>Rows per page: </span>
              <select class="bg-surface-container-low border border-outline-variant/30 rounded px-1.5 py-0.5 text-xs">
                <option>10</option>
                <option>25</option>
              </select>
            </div>

            <div class="flex items-center gap-1">
              <button class="w-7 h-7 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container">
                <span class="material-symbols-outlined text-[16px]">first_page</span>
              </button>
              <button class="w-7 h-7 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container">
                <span class="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button class="w-7 h-7 rounded bg-primary text-on-primary font-bold">1</button>
              <button class="w-7 h-7 rounded hover:bg-surface-container font-semibold" onclick="State.showToast('Page 2')">2</button>
              <button class="w-7 h-7 rounded hover:bg-surface-container font-semibold" onclick="State.showToast('Page 3')">3</button>
              <span>...</span>
              <button class="w-7 h-7 rounded hover:bg-surface-container font-semibold" onclick="State.showToast('Page 5')">5</button>
              <button class="w-7 h-7 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container">
                <span class="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
              <button class="w-7 h-7 rounded border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container">
                <span class="material-symbols-outlined text-[16px]">last_page</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Edit User Modal -->
        <div id="admin-edit-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-md overflow-hidden">
            <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">admin_panel_settings</span>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">Edit Permissions & Account</h3>
              </div>
              <button onclick="AdminView.closeEditModal()" class="text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onsubmit="AdminView.submitEdit(event)" class="p-6 space-y-4">
              <input type="hidden" id="edit-user-id"/>
              
              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface">Employee Name</label>
                <input id="admin-user-name" required class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary"/>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface">Assigned Role & Privileges</label>
                <select id="admin-user-role" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary">
                  <option value="Standard Employee">Standard Employee</option>
                  <option value="Administrator">Administrator</option>
                  <option value="Department Director">Department Director</option>
                  <option value="HR Administrator">HR Administrator</option>
                  <option value="Contractor (External)">Contractor (External)</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface">Department</label>
                <select id="admin-user-dept" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary">
                  <option value="Engineering">Engineering</option>
                  <option value="Product">Product</option>
                  <option value="IT & Security">IT & Security</option>
                  <option value="People Operations">People Operations</option>
                  <option value="Operations">Operations</option>
                  <option value="DevOps">DevOps</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface">Account Status</label>
                <select id="admin-user-status" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary">
                  <option value="Active">Active (Provisioned)</option>
                  <option value="Suspended">Suspended (Access Revoked)</option>
                </select>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button type="button" onclick="AdminView.closeEditModal()" class="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high">
                  Cancel
                </button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-sm">
                  Save Permissions
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Add Employee Modal -->
        <div id="admin-add-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-md overflow-hidden">
            <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-primary text-[22px]">person_add</span>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">Onboard New Employee</h3>
              </div>
              <button onclick="AdminView.closeAddModal()" class="text-on-surface-variant hover:text-on-surface">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onsubmit="AdminView.submitAdd(event)" class="p-6 space-y-4">
              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface">Full Name</label>
                <input id="add-user-name" required placeholder="e.g. Jordan Hayes" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary"/>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface">Corporate Email</label>
                <input id="add-user-email" type="email" required placeholder="jordan.hayes@accesshub.local" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary"/>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-label-md text-label-md font-semibold text-on-surface">Role</label>
                  <select id="add-user-role" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary">
                    <option value="Employee">Employee</option>
                    <option value="Administrator">Administrator</option>
                  </select>
                </div>
                <div class="space-y-1">
                  <label class="font-label-md text-label-md font-semibold text-on-surface">Department</label>
                  <select id="add-user-dept" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary">
                    <option value="Engineering">Engineering</option>
                    <option value="Product">Product</option>
                    <option value="IT & Security">IT & Security</option>
                    <option value="People Operations">People Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="DevOps">DevOps</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md font-semibold text-on-surface">Job Title</label>
                <input id="add-user-title" placeholder="e.g. Cloud Infrastructure Engineer" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 text-sm focus:outline-none focus:border-primary"/>
              </div>

              <div class="flex items-center justify-end gap-2 pt-3 border-t border-outline-variant/20">
                <button type="button" onclick="AdminView.closeAddModal()" class="px-4 py-2 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high">
                  Cancel
                </button>
                <button type="submit" class="px-4 py-2 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-sm">
                  Provision Account
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
  },

  handleSearch(query) {
    this.searchQuery = query;
    AppRouter.renderCurrentRoute();
  },

  handleRoleFilter(role) {
    this.selectedRole = role;
    AppRouter.renderCurrentRoute();
  },

  handleDeptFilter(dept) {
    this.selectedDept = dept;
    AppRouter.renderCurrentRoute();
  },

  handleStatusFilter(status) {
    this.selectedStatus = status;
    AppRouter.renderCurrentRoute();
  },

  resetFilters() {
    this.searchQuery = '';
    this.selectedRole = 'all';
    this.selectedDept = 'all';
    this.selectedStatus = 'all';
    AppRouter.renderCurrentRoute();
  },

  async exportCSV() {
    try {
      const res = await State.apiFetch('/api/reports/employee-summary?accessLevel=admin');
      const rows = [
        ['Employee ID', 'Full Name', 'Work Email', 'Department', 'Job Title', 'Status', 'Role', 'Location', 'Hire Date'],
        ...res.report.map(u => [u.empId, u.name, u.email, u.department, u.jobTitle, u.status, u.assignedRole, u.location, u.hireDate])
      ];
      const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.map(f => `"${f || ''}"`).join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'employee_summary_report.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      State.showToast('Employee summary report exported successfully', 'download');
    } catch (err) {
      State.showToast(err.message || 'Failed to export report', 'error');
    }
  },

  openEditModal(id, nameEnc, dept, role, assignedRole, status, titleEnc) {
    const name = decodeURIComponent(nameEnc);
    const title = decodeURIComponent(titleEnc);

    document.getElementById('edit-user-id').value = id;
    document.getElementById('admin-user-name').value = name;
    document.getElementById('admin-user-dept').value = dept;
    document.getElementById('admin-user-role').value = assignedRole || role;
    document.getElementById('admin-user-status').value = status;

    const modal = document.getElementById('admin-edit-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeEditModal() {
    const modal = document.getElementById('admin-edit-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitEdit(event) {
    event.preventDefault();
    const id = document.getElementById('edit-user-id').value;
    const name = document.getElementById('admin-user-name').value;
    const department = document.getElementById('admin-user-dept').value;
    const assignedRole = document.getElementById('admin-user-role').value;
    const status = document.getElementById('admin-user-status').value;
    const role = assignedRole === 'Administrator' ? 'Administrator' : 'Employee';

    try {
      await State.apiFetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, department, role, assignedRole, status })
      });

      this.closeEditModal();
      State.showToast(`User permissions updated for ${name}`, 'check_circle');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  openAddModal() {
    const modal = document.getElementById('admin-add-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeAddModal() {
    const modal = document.getElementById('admin-add-modal');
    if (modal) modal.classList.add('hidden');
  },

  async submitAdd(event) {
    event.preventDefault();
    const name = document.getElementById('add-user-name').value;
    const email = document.getElementById('add-user-email').value;
    const role = document.getElementById('add-user-role').value;
    const department = document.getElementById('add-user-dept').value;
    const jobTitle = document.getElementById('add-user-title').value;

    try {
      const res = await State.apiFetch('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify({ name, email, role, department, jobTitle })
      });

      this.closeAddModal();
      State.showToast(`Employee ${res.user.name} provisioned!`, 'person_add');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  async deleteUser(id, nameEnc) {
    const name = decodeURIComponent(nameEnc);
    if (!confirm(`Are you sure you want to deactivate and remove ${name} from the directory?`)) return;

    try {
      await State.apiFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      State.showToast(`User ${name} removed from enterprise directory`, 'delete');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  }
};

window.AdminView = AdminView;
