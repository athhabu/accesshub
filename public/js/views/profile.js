// Profile View Component matching 3._my_profile_accesshub/screen.png
const ProfileView = {
  activeTab: 'Overview',
  resourceFilter: 'all',

  async render(currentUser) {
    const user = currentUser || State.user;
    const avatarSrc = user.avatar || '/assets/alex_mercer.png';
    const isAdmin = user.role === 'Administrator';

    return `
      <div class="flex flex-col w-full pb-12">
        <!-- Header / Breadcrumb Context Bar -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">Personnel Directory</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-medium">${user.empId}</span>
            <span class="text-outline-variant font-semibold">/</span>
            <span class="font-label-sm text-label-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              Synced via Okta SCIM
            </span>
          </div>
          
          <div class="flex items-center gap-3">
            <button 
              class="h-[38px] px-4 rounded-lg bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm border border-outline-variant/30" 
              onclick="ProfileView.exportRecord('${user.empId}')" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px] text-on-surface-variant">download</span>
              <span>Export Employee Record</span>
            </button>
            <button 
              class="h-[38px] px-4 rounded-lg bg-primary text-on-primary hover:bg-primary-container transition-all duration-150 flex items-center gap-2 font-label-lg text-label-lg shadow-sm shadow-primary/20" 
              onclick="ProfileView.openEditModal()" 
              type="button"
            >
              <span class="material-symbols-outlined text-[18px]">edit</span>
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        <!-- Hero Profile Header Banner Card -->
        <div class="relative w-full rounded-xl bg-surface-container-lowest shadow-sm border border-outline-variant/30 overflow-hidden mb-6">
          <!-- Top Ambient Geometric Accent Strip -->
          <div class="h-32 w-full bg-gradient-to-r from-primary via-primary-container to-surface-container-high relative overflow-hidden">
            <div class="absolute inset-0 opacity-15 mix-blend-overlay">
              <svg class="w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                <polygon fill="currentColor" points="0,0 100,0 80,100 0,100"></polygon>
              </svg>
            </div>
            <div class="absolute right-6 bottom-4 flex items-center gap-2 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-on-surface font-label-sm text-label-sm shadow-sm border border-outline-variant/20">
              <span class="material-symbols-outlined text-[16px] text-primary">verified_user</span>
              <span>Single Sign-On Verified</span>
            </div>
          </div>

          <!-- Main Profile Identity Block -->
          <div class="px-6 pb-6 pt-0 -mt-12 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div class="flex flex-col sm:flex-row sm:items-end gap-5">
              <!-- Avatar Frame with Status Indicator -->
              <div class="relative shrink-0">
                <div class="w-28 h-28 rounded-2xl bg-surface-container-lowest p-1 shadow-md">
                  <img 
                    class="w-full h-full object-cover rounded-xl" 
                    src="${avatarSrc}" 
                    alt="${user.name}"
                    onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3525cd&color=fff'"
                  />
                </div>
                <span class="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-secondary ring-2 ring-surface-container-lowest shadow-sm" title="Active Directory Session"></span>
              </div>

              <!-- Identity Details -->
              <div class="flex flex-col pb-1">
                <div class="flex flex-wrap items-center gap-3 mb-1">
                  <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">${user.name}</h1>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant font-label-sm text-label-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    Active Employee
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm">
                    ${user.assignedRole || user.role}
                  </span>
                </div>
                <p class="font-body-lg text-body-lg text-on-surface-variant font-medium">
                  ${user.jobTitle || 'Senior Full-Stack Engineer'} <span class="text-outline-variant font-normal">|</span> ${user.department} / ${user.teamGroup || 'Platform'}
                </p>
                <div class="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 font-label-md text-label-md text-on-surface-variant">
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-primary">domain</span>
                    ${user.building || 'San Francisco, CA (HQ - Building 4)'}
                  </span>
                  <span class="text-outline-variant">•</span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                    ${user.timezone || 'PST / UTC-8 (Local 02:45 PM)'}
                  </span>
                  <span class="text-outline-variant">•</span>
                  <span class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px] text-on-surface-variant">fingerprint</span>
                    ${user.empId}
                  </span>
                </div>
                <div class="mt-3 flex items-center gap-2">
                  <a id="employee-profile-link" href="${user.profileLink || '#'}" target="_blank" class="px-3 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-primary font-semibold text-xs transition-colors inline-flex items-center gap-1.5 border border-outline-variant/30 shadow-sm">
                    <span class="material-symbols-outlined text-[15px]">link</span>
                    <span>Professional Profile</span>
                  </a>
                </div>
              </div>
            </div>

            <!-- Stats Block -->
            <div class="flex items-center gap-4 sm:gap-6 bg-surface-container-low px-4 py-3 rounded-xl border border-outline-variant/30">
              <div class="text-center">
                <span class="font-headline-md text-headline-md font-bold text-on-surface">${user.tenure || '2y 7m'}</span>
                <span class="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">TENURE</span>
              </div>
              <div class="h-8 w-[1px] bg-outline-variant/40"></div>
              <div class="text-center">
                <span class="font-headline-md text-headline-md font-bold text-secondary">${user.complianceScore || '100%'}</span>
                <span class="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">COMPLIANCE</span>
              </div>
              <div class="h-8 w-[1px] bg-outline-variant/40"></div>
              <div class="text-center">
                <span class="font-headline-md text-headline-md font-bold text-primary">${user.ownedAssetsCount || 14}</span>
                <span class="block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">OWNED ASSETS</span>
              </div>
            </div>
          </div>

          <!-- Profile Nav Tabs -->
          <div class="flex items-center gap-2 px-6 border-t border-outline-variant/20 bg-surface-container-low/40 overflow-x-auto">
            ${['Overview', 'Personal Info', 'Work & Organization', 'Security & Credentials', 'Audit Log'].map(tab => `
              <button 
                class="profile-tab py-3 px-3 font-label-lg text-label-lg transition-colors border-b-2 ${
                  ProfileView.activeTab === tab ? 'text-primary font-semibold border-primary bg-surface-container-lowest' : 'text-on-surface-variant font-medium border-transparent hover:text-on-surface'
                }"
                onclick="ProfileView.switchTab('${tab}')"
              >
                ${tab}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Professional Bio / About Section -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm mb-6">
          <div class="flex items-center justify-between mb-3 pb-3 border-b border-outline-variant/20">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-[18px]">person_book</span>
              </div>
              <div>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">About & Professional Bio</h3>
                <p class="text-xs text-on-surface-variant">Employee summary, core competencies, and team focus</p>
              </div>
            </div>
            <button onclick="ProfileView.openEditModal()" class="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px]">edit</span>
              Edit
            </button>
          </div>
          <div class="font-body-md text-body-md text-on-surface-variant leading-relaxed" id="profile-bio-text">
            ${user.bio || 'Senior Full-Stack Engineer working across platform infrastructure, identity services, and internal tooling.'}
          </div>
        </div>

        <!-- Content Grid (Overview Tab) -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-space-lg mb-6">
          <!-- Card 1: Core Employee Details -->
          <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/20">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                  <span class="material-symbols-outlined text-[18px]">badge</span>
                </div>
                <div>
                  <h3 class="font-title-md text-title-md font-bold text-on-surface">Core Employee Details</h3>
                  <p class="text-xs text-on-surface-variant">Primary enterprise identity and contractual records</p>
                </div>
              </div>
              <span class="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold">
                ${user.tier || 'Tier 2 Access'}
              </span>
            </div>

            <!-- Details Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Employee ID Box -->
              <div class="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div>
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">EMPLOYEE ID</span>
                  <span class="font-mono font-bold text-on-surface">${user.empId}</span>
                </div>
                <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" onclick="ProfileView.copyValue('${user.empId}', 'Employee ID')">
                  <span class="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>

              <!-- Work Email Box -->
              <div class="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div class="overflow-hidden mr-2">
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">WORK EMAIL</span>
                  <span class="font-mono text-xs font-semibold text-on-surface truncate block">${user.email}</span>
                </div>
                <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary shrink-0" onclick="ProfileView.copyValue('${user.email}', 'Work Email')">
                  <span class="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>

              <div>
                <span class="block text-xs text-on-surface-variant font-medium">DIRECT PHONE</span>
                <span class="font-body-md text-body-md text-on-surface font-semibold">${user.phone || '+1 (415) 555-0182'}</span>
              </div>

              <div>
                <span class="block text-xs text-on-surface-variant font-medium">WORK AUTHORIZATION</span>
                <span class="font-body-md text-body-md text-secondary font-semibold flex items-center gap-1">
                  <span class="material-symbols-outlined text-[16px]">verified</span>
                  ${user.workAuthorization || 'Active / Full-Time (W-2)'}
                </span>
              </div>

              <div>
                <span class="block text-xs text-on-surface-variant font-medium">DEPARTMENT</span>
                <span class="font-body-md text-body-md text-on-surface font-semibold">${user.department}</span>
              </div>

              <div>
                <span class="block text-xs text-on-surface-variant font-medium">TEAM GROUP</span>
                <span class="font-body-md text-body-md text-on-surface font-semibold">${user.teamGroup || 'Core Services & Infrastructure'}</span>
              </div>

              <div>
                <span class="block text-xs text-on-surface-variant font-medium">REPORTS TO</span>
                <div class="flex items-center gap-1.5 mt-0.5">
                  <span class="w-6 h-6 rounded-full bg-surface-container text-primary font-bold text-[10px] flex items-center justify-center">MV</span>
                  <span class="font-body-md text-body-md text-on-surface font-semibold">${user.reportsTo ? user.reportsTo.name : 'Marcus Vance'}</span>
                  <span class="text-xs text-on-surface-variant">(${user.reportsTo ? user.reportsTo.id : 'EMP-10024'})</span>
                </div>
              </div>

              <div>
                <span class="block text-xs text-on-surface-variant font-medium">ASSIGNED SEATING</span>
                <span class="font-body-md text-body-md text-on-surface font-semibold">${user.seating || 'San Francisco Office, Floor 3, Desk 34B'}</span>
              </div>

              <!-- Work Contact (inline editable) -->
              <div class="sm:col-span-2">
                <div class="flex items-center justify-between mb-1">
                  <span class="block text-xs text-on-surface-variant font-medium">WORK CONTACT</span>
                  <button
                    id="contact-edit-btn"
                    class="text-[11px] text-primary font-semibold flex items-center gap-0.5 hover:underline"
                    onclick="ProfileView.toggleContactEdit(${user.id})"
                  >
                    <span class="material-symbols-outlined text-[14px]">edit</span>
                    Edit
                  </button>
                </div>

                <!-- Display row -->
                <div id="contact-display-${user.id}" class="flex items-center gap-4 text-sm text-on-surface font-semibold">
                  <span class="flex items-center gap-1 text-on-surface-variant font-normal">
                    <span class="material-symbols-outlined text-[15px]">phone_in_talk</span>
                    <span id="contact-phone-display-${user.id}">${user.workPhone || 'x0000'}</span>
                  </span>
                  <span class="text-outline-variant">•</span>
                  <span class="flex items-center gap-1 text-on-surface-variant font-normal">
                    <span class="material-symbols-outlined text-[15px]">location_on</span>
                    <span id="contact-desk-display-${user.id}">${user.deskLocation || user.seating || 'Not set'}</span>
                  </span>
                </div>

                <!-- Inline edit form (hidden by default) -->
                <div id="contact-edit-form-${user.id}" class="hidden mt-2 flex flex-col sm:flex-row gap-2 items-end">
                  <div class="flex-1">
                    <label class="block text-[10px] uppercase font-bold text-on-surface-variant mb-0.5" for="contact-phone-input-${user.id}">Extension</label>
                    <input
                      id="contact-phone-input-${user.id}"
                      class="w-full h-9 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. x4182"
                      value="${user.workPhone || ''}"
                    />
                  </div>
                  <div class="flex-1">
                    <label class="block text-[10px] uppercase font-bold text-on-surface-variant mb-0.5" for="contact-desk-input-${user.id}">Desk Location</label>
                    <input
                      id="contact-desk-input-${user.id}"
                      class="w-full h-9 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. Floor 3, Desk 34B"
                      value="${user.deskLocation || ''}"
                    />
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      class="h-9 px-3 rounded-lg bg-surface-container text-on-surface text-xs font-semibold hover:bg-surface-container-high"
                      onclick="ProfileView.cancelContactEdit(${user.id})"
                    >Cancel</button>
                    <button
                      type="button"
                      class="h-9 px-3 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container shadow-sm"
                      onclick="ProfileView.saveContactInfo(${user.id})"
                    >Save</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-5 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">calendar_today</span>
                Hire Date: <strong class="text-on-surface">${user.hireDate || 'March 14, 2022'}</strong> (${user.tenure || '2 years 7 months'})
              </span>
              <span>Next Review: <strong class="text-on-surface">${user.nextReview || 'Q4 2024'}</strong></span>
            </div>
          </div>

          <!-- Card 2: Workstation & IT Fleet -->
          <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-outline-variant/20">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary">
                  <span class="material-symbols-outlined text-[18px]">devices</span>
                </div>
                <div>
                  <h3 class="font-title-md text-title-md font-bold text-on-surface">Workstation & IT Fleet</h3>
                  <p class="text-xs text-on-surface-variant">Hardware, credentials, and local security</p>
                </div>
              </div>
              <span class="w-2.5 h-2.5 rounded-full bg-secondary" title="Online and compliant"></span>
            </div>

            <!-- Laptop Device Box -->
            <div class="p-3.5 rounded-lg bg-surface-container-low mb-4 border border-outline-variant/20">
              <div class="flex items-start justify-between">
                <div class="flex items-center gap-3">
                  <span class="material-symbols-outlined text-primary text-[28px]">laptop_mac</span>
                  <div>
                    <p class="font-label-lg text-label-lg font-bold text-on-surface">${user.hardwareDevice || 'MacBook Pro 16" M2 Max'}</p>
                    <p class="text-xs text-on-surface-variant font-mono">Asset Tag: ${user.assetTag || 'ASSET-9941'}</p>
                  </div>
                </div>
                <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" onclick="ProfileView.copyValue('${user.assetTag || 'ASSET-9941'}', 'Asset Tag')">
                  <span class="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
              <div class="flex items-center gap-3 mt-2.5 text-xs text-on-surface-variant">
                <span class="px-2 py-0.5 rounded bg-surface-container text-primary font-semibold">Jamf Pro Protected</span>
                <span>FileVault Active</span>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <!-- Physical Badge -->
              <div class="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div>
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">PHYSICAL BADGE</span>
                  <span class="font-mono font-bold text-on-surface">${user.physicalBadge || 'BDG-48102'}</span>
                  <span class="block text-[11px] text-secondary font-medium mt-0.5">${user.badgeAuth || 'Bldgs 1-4 Authorized'}</span>
                </div>
                <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" onclick="ProfileView.copyValue('${user.physicalBadge || 'BDG-48102'}', 'Badge ID')">
                  <span class="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>

              <!-- Subnet IP -->
              <div class="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
                <div>
                  <span class="block text-[10px] uppercase font-bold text-on-surface-variant">ASSIGNED SUBNET IP</span>
                  <span class="font-mono font-bold text-on-surface">${user.subnetIp || '10.24.110.45'}</span>
                  <span class="block text-[11px] text-on-surface-variant font-medium mt-0.5">${user.vlan || 'VLAN: Eng-Static'}</span>
                </div>
                <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" onclick="ProfileView.copyValue('${user.subnetIp || '10.24.110.45'}', 'Subnet IP')">
                  <span class="material-symbols-outlined text-[18px]">content_copy</span>
                </button>
              </div>
            </div>

            <!-- Emergency Contact Box -->
            <div class="p-3 rounded-lg bg-surface-container-low flex items-center justify-between">
              <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-outline text-[22px]">contact_emergency</span>
                <div>
                  <div class="flex items-center gap-2">
                    <span class="text-[10px] uppercase font-bold text-on-surface-variant">EMERGENCY CONTACT</span>
                    <span class="px-1.5 py-0.2 rounded bg-surface-container text-on-surface font-label-sm text-[10px]">Primary</span>
                  </div>
                  <p class="font-label-lg text-label-lg font-semibold text-on-surface mt-0.5">${user.emergencyContact || 'Rachel Mercer (Spouse)'}</p>
                  <p class="text-xs text-on-surface-variant font-mono">${user.emergencyPhone || '+1 (415) 555-0199'}</p>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
              <a href="javascript:void(0)" onclick="State.showToast('Hardware ticket dispatched to IT Desk', 'support')" class="text-primary font-semibold hover:underline flex items-center gap-1">
                <span class="material-symbols-outlined text-[16px]">speed</span>
                Report hardware issue to IT Desk
              </a>
              <span>Last ping: 4m ago</span>
            </div>
          </div>
        </div>

        <!-- Notification Preferences Card -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm mb-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-outline-variant/20">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary">
                <span class="material-symbols-outlined text-[18px]">notifications_active</span>
              </div>
              <div>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">Notification Preferences</h3>
                <p class="text-xs text-on-surface-variant">Configure communication channels, digest intervals, and system alerts</p>
              </div>
            </div>
            <button 
              type="button"
              onclick="ProfileView.savePreferences('${user.id}')" 
              class="px-3.5 py-1.5 rounded-lg bg-primary text-on-primary text-xs font-semibold hover:bg-on-primary-fixed-variant transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span class="material-symbols-outlined text-[16px]">save</span>
              <span>Save Preferences</span>
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <!-- Email Notifications -->
            <label class="flex items-start gap-3 p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container/70 transition-colors">
              <input type="checkbox" id="pref-emailNotifications-${user.id}" class="mt-0.5 rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer" ${(user.preferences && user.preferences.emailNotifications) ? 'checked' : ''}/>
              <div>
                <span class="block font-semibold text-xs text-on-surface">Email Notifications</span>
                <span class="text-[11px] text-on-surface-variant leading-relaxed">Deliver notices for document approvals, order statuses, and team notices to work inbox.</span>
              </div>
            </label>

            <!-- Security Alerts -->
            <label class="flex items-start gap-3 p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container/70 transition-colors">
              <input type="checkbox" id="pref-securityAlerts-${user.id}" class="mt-0.5 rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer" ${(user.preferences && user.preferences.securityAlerts) ? 'checked' : ''}/>
              <div>
                <span class="block font-semibold text-xs text-on-surface">Security & Compliance Alerts</span>
                <span class="text-[11px] text-on-surface-variant leading-relaxed">Mandatory security attestations, session alerts, and compliance score monitoring.</span>
              </div>
            </label>

            <!-- Weekly Digest -->
            <label class="flex items-start gap-3 p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container/70 transition-colors">
              <input type="checkbox" id="pref-weeklyDigest-${user.id}" class="mt-0.5 rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer" ${(user.preferences && user.preferences.weeklyDigest) ? 'checked' : ''}/>
              <div>
                <span class="block font-semibold text-xs text-on-surface">Weekly Procurement Digest</span>
                <span class="text-[11px] text-on-surface-variant leading-relaxed">Weekly summary of departmental budget expenditures and newly requisitioned assets.</span>
              </div>
            </label>

            <!-- Desktop Notifications -->
            <label class="flex items-start gap-3 p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/20 cursor-pointer hover:bg-surface-container/70 transition-colors">
              <input type="checkbox" id="pref-desktopNotifications-${user.id}" class="mt-0.5 rounded text-primary focus:ring-0 w-4 h-4 cursor-pointer" ${(user.preferences && user.preferences.desktopNotifications) ? 'checked' : ''}/>
              <div>
                <span class="block font-semibold text-xs text-on-surface">Desktop Push Banners</span>
                <span class="text-[11px] text-on-surface-variant leading-relaxed">Display real-time desktop notifications when hardware couriers dispatch orders.</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Bottom Card: Recent Resources Owned by User -->
        <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-space-md">
            <div>
              <h2 class="font-headline-md text-headline-md text-on-surface font-bold">Recent Resources Owned by ${user.name}</h2>
              <p class="text-xs text-on-surface-variant">Latest compliance documents, internal architecture specs, and hardware procurement logs</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-on-surface-variant mr-1">Filter by:</span>
              <button class="px-3 py-1 rounded-full text-xs font-semibold ${ProfileView.resourceFilter === 'all' ? 'bg-surface-container text-primary' : 'bg-surface-container-low text-on-surface-variant'}" onclick="ProfileView.filterResources('all')">All (3)</button>
              <button class="px-3 py-1 rounded-full text-xs font-semibold ${ProfileView.resourceFilter === 'docs' ? 'bg-surface-container text-primary' : 'bg-surface-container-low text-on-surface-variant'}" onclick="ProfileView.filterResources('docs')">Docs</button>
              <button class="px-3 py-1 rounded-full text-xs font-semibold ${ProfileView.resourceFilter === 'orders' ? 'bg-surface-container text-primary' : 'bg-surface-container-low text-on-surface-variant'}" onclick="ProfileView.filterResources('orders')">Orders</button>
            </div>
          </div>

          <!-- Cards Grid -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Resource 1 -->
            <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-xs font-semibold text-primary">DOC-8821</span>
                  <span class="px-2 py-0.5 rounded-full bg-secondary-container/30 text-on-secondary-fixed-variant text-[11px] font-semibold">Published</span>
                </div>
                <h4 class="font-title-md text-title-md font-bold text-on-surface line-clamp-1">Q3 Cloud Infrastructure...</h4>
                <p class="text-xs text-on-surface-variant mt-1 line-clamp-2">Multi-region failover specification and Kubernetes cluster modernization roadmap...</p>
              </div>
              <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                <span>Updated Oct 12, 2024</span>
                <a href="#/documents" class="text-primary font-semibold hover:underline">View Spec</a>
              </div>
            </div>

            <!-- Resource 2 -->
            <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-xs font-semibold text-primary">DOC-7419</span>
                  <span class="px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/30 text-tertiary text-[11px] font-semibold">Internal Review</span>
                </div>
                <h4 class="font-title-md text-title-md font-bold text-on-surface line-clamp-1">SOC 2 Type II Annual Security...</h4>
                <p class="text-xs text-on-surface-variant mt-1 line-clamp-2">Engineering personnel cryptographic key management attestations and code approval...</p>
              </div>
              <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                <span>Updated Sep 28, 2024</span>
                <a href="#/documents" class="text-primary font-semibold hover:underline">Audit Docs</a>
              </div>
            </div>

            <!-- Resource 3 -->
            <div class="p-4 rounded-xl bg-surface-container-low border border-outline-variant/30 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between mb-2">
                  <span class="font-mono text-xs font-semibold text-secondary">ORD-9204</span>
                  <span class="px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-[11px] font-semibold">Delivered</span>
                </div>
                <h4 class="font-title-md text-title-md font-bold text-on-surface line-clamp-1">Ergonomic Sit-Stand Desk &...</h4>
                <p class="text-xs text-on-surface-variant mt-1 line-clamp-2">Hardware Procurement Order approved by Marcus Vance. Assigned directly to Floor 3,...</p>
              </div>
              <div class="mt-4 pt-3 border-t border-outline-variant/20 flex items-center justify-between text-xs text-on-surface-variant">
                <span>Received Aug 19, 2024</span>
                <a href="#/orders?id=ORD-9204" class="text-primary font-semibold hover:underline">Receipt & PO</a>
              </div>
            </div>
          </div>
        </div>

        <!-- Edit Profile Modal -->
        <div id="edit-profile-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
          <div class="bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/30 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between bg-surface-container-low">
              <div class="flex items-center gap-2.5">
                <span class="material-symbols-outlined text-primary text-[22px]">manage_accounts</span>
                <h3 class="font-title-md text-title-md font-bold text-on-surface">Edit Employee Profile</h3>
              </div>
              <button onclick="ProfileView.closeEditModal()" class="text-on-surface-variant hover:text-on-surface p-1 rounded">
                <span class="material-symbols-outlined">close</span>
              </button>
            </div>

            <!-- Modal Form Body -->
            <form id="profile-edit-form" onsubmit="ProfileView.saveProfile(event)" class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div class="space-y-1">
                <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-name">Full Name</label>
                <input id="edit-name" required class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value="${user.name}"/>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-title">Job Title</label>
                  <input id="edit-title" required class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value="${user.jobTitle || ''}"/>
                </div>
                <div class="space-y-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-dept">Department</label>
                  <input id="edit-dept" required class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value="${user.department || ''}"/>
                </div>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-bio">Professional Bio / Summary</label>
                <textarea id="edit-bio" rows="2" class="w-full px-3 py-2 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="Brief statement of responsibilities, skills, or team focus...">${user.bio || ''}</textarea>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-phone">Direct Phone</label>
                <input id="edit-phone" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value="${user.phone || ''}"/>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-profile-link">Professional Profile URL / Link</label>
                <input id="edit-profile-link" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="https://github.com/username or internal link..." value="${user.profileLink || ''}"/>
              </div>

              <div class="space-y-1">
                <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-seating">Assigned Seating Location</label>
                <input id="edit-seating" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value="${user.seating || ''}"/>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-emergency-contact">Emergency Contact</label>
                  <input id="edit-emergency-contact" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value="${user.emergencyContact || ''}"/>
                </div>
                <div class="space-y-1">
                  <label class="font-label-md text-label-md text-on-surface font-semibold" for="edit-emergency-phone">Emergency Phone</label>
                  <input id="edit-emergency-phone" class="w-full h-10 px-3 rounded-lg border border-outline-variant/50 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" value="${user.emergencyPhone || ''}"/>
                </div>
              </div>
            </form>

            <!-- Modal Footer -->
            <div class="px-6 py-3.5 bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between">
              <span class="font-label-sm text-label-sm text-on-surface-variant">SOC-2 compliant profile audit logging</span>
              <div class="flex items-center gap-2">
                <button type="button" onclick="ProfileView.closeEditModal()" class="h-9 px-4 rounded-lg bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors">
                  Cancel
                </button>
                <button type="submit" form="profile-edit-form" class="h-9 px-4 rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container transition-colors shadow-sm">
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  copyValue(text, label) {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const temp = document.createElement('textarea');
      temp.value = text;
      document.body.appendChild(temp);
      temp.select();
      document.execCommand('copy');
      document.body.removeChild(temp);
    }
    State.showToast(`${label} copied to clipboard`, 'content_copy');
  },

  exportRecord(empId) {
    State.showToast(`Generating signed PDF employee record for ${empId}...`, 'download');
  },

  switchTab(tab) {
    this.activeTab = tab;
    State.showToast(`Viewing ${tab}`, 'tab');
    AppRouter.renderCurrentRoute();
  },

  filterResources(filter) {
    this.resourceFilter = filter;
    State.showToast(`Filtered resources: ${filter.toUpperCase()}`);
    AppRouter.renderCurrentRoute();
  },

  openEditModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.classList.remove('hidden');
  },

  closeEditModal() {
    const modal = document.getElementById('edit-profile-modal');
    if (modal) modal.classList.add('hidden');
  },

  async saveProfile(event) {
    event.preventDefault();
    const name = document.getElementById('edit-name').value;
    const jobTitle = document.getElementById('edit-title').value;
    const department = document.getElementById('edit-dept').value;
    const phone = document.getElementById('edit-phone').value;
    const seating = document.getElementById('edit-seating').value;
    const emergencyContact = document.getElementById('edit-emergency-contact').value;
    const emergencyPhone = document.getElementById('edit-emergency-phone').value;
    const bio = document.getElementById('edit-bio') ? document.getElementById('edit-bio').value : undefined;
    const profileLink = document.getElementById('edit-profile-link') ? document.getElementById('edit-profile-link').value : undefined;

    try {
      const res = await State.apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          name,
          jobTitle,
          department,
          phone,
          seating,
          emergencyContact,
          emergencyPhone,
          bio,
          profileLink
        })
      });

      State.setUser(res.user);
      this.closeEditModal();
      State.showToast('Employee profile updated successfully', 'check_circle');
      AppRouter.renderCurrentRoute();
    } catch (err) {
      State.showToast(err.message, 'error');
    }
  },

  toggleContactEdit(userId) {
    const form = document.getElementById(`contact-edit-form-${userId}`);
    const display = document.getElementById(`contact-display-${userId}`);
    if (!form || !display) return;
    const isHidden = form.classList.contains('hidden');
    form.classList.toggle('hidden', !isHidden);
    display.classList.toggle('hidden', isHidden);
  },

  cancelContactEdit(userId) {
    const form = document.getElementById(`contact-edit-form-${userId}`);
    const display = document.getElementById(`contact-display-${userId}`);
    if (form) form.classList.add('hidden');
    if (display) display.classList.remove('hidden');
  },

  async saveContactInfo(userId) {
    const phoneInput = document.getElementById(`contact-phone-input-${userId}`);
    const deskInput  = document.getElementById(`contact-desk-input-${userId}`);
    if (!phoneInput || !deskInput) return;

    const workPhone   = phoneInput.value.trim();
    const deskLocation = deskInput.value.trim();

    try {
      // PUT /api/employees/:id/contact-info
      // The UI always passes the logged-in user's own numeric ID here.
      const res = await State.apiFetch(`/api/employees/${userId}/contact-info`, {
        method: 'PUT',
        body: JSON.stringify({ workPhone, deskLocation })
      });

      // Update the display values inline without a full re-render
      const phoneDisplay = document.getElementById(`contact-phone-display-${userId}`);
      const deskDisplay  = document.getElementById(`contact-desk-display-${userId}`);
      if (phoneDisplay) phoneDisplay.textContent = res.employee.workPhone || workPhone;
      if (deskDisplay)  deskDisplay.textContent  = res.employee.deskLocation || deskLocation;

      this.cancelContactEdit(userId);
      State.showToast('Contact information updated', 'check_circle');
    } catch (err) {
      State.showToast(err.message || 'Failed to update contact info', 'error');
    }
  },

  async savePreferences(userId) {
    const emailNotifications = document.getElementById(`pref-emailNotifications-${userId}`)?.checked ?? false;
    const securityAlerts = document.getElementById(`pref-securityAlerts-${userId}`)?.checked ?? false;
    const weeklyDigest = document.getElementById(`pref-weeklyDigest-${userId}`)?.checked ?? false;
    const desktopNotifications = document.getElementById(`pref-desktopNotifications-${userId}`)?.checked ?? false;

    try {
      const res = await State.apiFetch(`/api/employees/${userId}/preferences`, {
        method: 'PUT',
        body: JSON.stringify({
          emailNotifications,
          securityAlerts,
          weeklyDigest,
          desktopNotifications
        })
      });

      if (State.user && State.user.id === parseInt(userId, 10)) {
        State.user.preferences = res.preferences;
      }
      State.showToast(res.message || 'Notification preferences updated successfully', 'check_circle');
    } catch (err) {
      State.showToast(err.message || 'Failed to update preferences', 'error');
    }
  }
};

window.ProfileView = ProfileView;
