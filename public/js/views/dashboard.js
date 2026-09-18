// Dashboard View Component matching 2._dashboard_accesshub/screen.png
const DashboardView = {
  async render(user) {
    let stats = {
      myDocumentsCount: 12,
      pendingDocsCount: 3,
      myOrdersCount: 4,
      pendingOrdersAmount: 1420.00,
      activePeersCount: 48,
      assignedDocuments: [],
      recentOrders: [],
      recentActivity: []
    };

    try {
      stats = await State.apiFetch('/api/stats/dashboard');
    } catch (err) {
      console.warn('Failed to load dashboard stats:', err);
    }

    const firstName = user.name.split(' ')[0];
    const avatarSrc = user.avatar || '/assets/alex_mercer.png';
    const isAdmin = user.role === 'Administrator';

    return `
      <div class="flex flex-col w-full pb-12">
        <!-- Top Profile Welcome & Quick Action Header -->
        <div class="relative w-full rounded-xl bg-surface-container-lowest shadow-sm p-space-lg mb-space-lg overflow-hidden border border-outline-variant/30">
          <div class="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-surface-container-high/40 blur-3xl pointer-events-none"></div>
          
          <div class="relative flex flex-col md:flex-row md:items-center justify-between gap-space-lg">
            <div class="flex items-start gap-space-md">
              <!-- Avatar -->
              <div class="relative shrink-0">
                <img 
                  class="w-16 h-16 rounded-xl object-cover shadow-sm ring-2 ring-surface-container-high" 
                  src="${avatarSrc}"
                  alt="${user.name}"
                  onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3525cd&color=fff'"
                />
                <span class="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full ring-2 ring-surface-container-lowest" title="Active on duty"></span>
              </div>

              <!-- Details -->
              <div class="flex flex-col">
                <div class="flex items-center gap-2 flex-wrap mb-1">
                  <span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-semibold uppercase tracking-wider">
                    ${isAdmin ? 'System Administrator' : 'Full-Time Employee'}
                  </span>
                  <span class="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-medium">
                    ${user.empId}
                  </span>
                  <span class="font-label-sm text-label-sm text-on-surface-variant flex items-center gap-1">
                    <span class="material-symbols-outlined text-[14px]">location_on</span>
                    ${user.department} • ${user.location || 'San Francisco HQ'}
                  </span>
                </div>
                <h1 class="font-headline-md text-headline-md text-on-surface tracking-tight font-bold">
                  Welcome back, ${firstName}
                </h1>
                <p class="font-body-sm text-body-sm text-on-surface-variant">
                  ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} • ${user.leadTitle || user.jobTitle}
                </p>
              </div>
            </div>

            <!-- Header Quick Actions -->
            <div class="flex items-center gap-space-sm self-start md:self-center shrink-0">
              <button 
                class="h-[38px] px-4 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-lg text-label-lg transition-all flex items-center gap-2 shadow-sm" 
                onclick="DashboardView.openOrderModal()" 
                type="button"
              >
                <span class="material-symbols-outlined text-[18px]">shopping_cart_checkout</span>
                <span>Submit Order</span>
              </button>
              <button 
                class="h-[38px] px-4 rounded-lg bg-primary hover:bg-on-primary-fixed-variant text-on-primary font-label-lg text-label-lg shadow-sm transition-all flex items-center gap-2" 
                onclick="DashboardView.openDocModal()" 
                type="button"
              >
                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                <span>New Document Request</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Metric / KPI Summary Cards (4 stats grid) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
          <!-- Stat 1: Documents -->
          <div class="rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">My Documents</span>
              <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span class="material-symbols-outlined text-[18px]">description</span>
              </div>
            </div>
            <div class="mt-space-md">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-bold">${stats.myDocumentsCount}</span>
                <span class="font-label-md text-label-md text-on-surface-variant">files</span>
              </div>
              <div class="mt-2 flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-tertiary-fixed-dim"></span>
                <span class="font-label-sm text-label-sm text-tertiary font-medium">${stats.pendingDocsCount} pending compliance review</span>
              </div>
            </div>
            <div class="mt-space-sm pt-2">
              <div class="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div class="bg-primary h-full rounded-full" style="width: 75%;"></div>
              </div>
            </div>
          </div>

          <!-- Stat 2: Orders -->
          <div class="rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">My Orders</span>
              <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-secondary group-hover:scale-105 transition-transform">
                <span class="material-symbols-outlined text-[18px]">shopping_bag</span>
              </div>
            </div>
            <div class="mt-space-md">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-bold">${stats.myOrdersCount}</span>
                <span class="font-label-md text-label-md text-on-surface-variant">active</span>
              </div>
              <div class="mt-2 flex items-center gap-1.5">
                <span class="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant font-semibold">
                  $${(stats.pendingOrdersAmount || 1420).toFixed(2)} pending
                </span>
              </div>
            </div>
            <div class="mt-space-sm pt-2">
              <div class="w-full bg-surface-container rounded-full h-1.5 overflow-hidden">
                <div class="bg-secondary h-full rounded-full" style="width: 60%;"></div>
              </div>
            </div>
          </div>

          <!-- Stat 3: Team Directory -->
          <div class="rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Team Directory</span>
              <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:scale-105 transition-transform">
                <span class="material-symbols-outlined text-[18px]">group</span>
              </div>
            </div>
            <div class="mt-space-md">
              <div class="flex items-baseline gap-2">
                <span class="font-display-lg text-display-lg text-on-surface font-bold">${stats.activePeersCount || 48}</span>
                <span class="font-label-md text-label-md text-on-surface-variant">active peers</span>
              </div>
              <div class="mt-2 flex items-center gap-1.5">
                <span class="inline-block w-2 h-2 rounded-full bg-secondary"></span>
                <span class="font-label-sm text-label-sm text-secondary font-medium">9 team leads online</span>
              </div>
            </div>
            <div class="mt-space-sm pt-2 flex -space-x-1.5 overflow-hidden">
              <div class="inline-block h-5 w-5 rounded-full ring-2 ring-surface-container-lowest bg-surface-container-high text-[9px] font-bold flex items-center justify-center text-primary">SJ</div>
              <div class="inline-block h-5 w-5 rounded-full ring-2 ring-surface-container-lowest bg-surface-container text-[9px] font-bold flex items-center justify-center text-secondary">DK</div>
              <div class="inline-block h-5 w-5 rounded-full ring-2 ring-surface-container-lowest bg-surface-variant text-[9px] font-bold flex items-center justify-center text-on-surface-variant">ER</div>
              <div class="inline-block h-5 w-5 rounded-full ring-2 ring-surface-container-lowest bg-primary-container text-on-primary text-[9px] font-semibold flex items-center justify-center">+45</div>
            </div>
          </div>

          <!-- Stat 4: System Access Level -->
          <div class="rounded-xl bg-surface-container-lowest p-space-md shadow-sm border border-outline-variant/30 flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div class="flex items-center justify-between">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">System Access</span>
              <div class="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                <span class="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
            </div>
            <div class="mt-space-md">
              <div class="flex items-baseline gap-2">
                <span class="font-headline-md text-headline-md text-on-surface font-bold">
                  ${isAdmin ? 'Level 1' : 'Level 2'}
                </span>
                <span class="font-label-md text-label-md text-on-surface-variant">${isAdmin ? '(Root Admin)' : '(Standard)'}</span>
              </div>
              <div class="mt-2 flex items-center gap-1.5">
                <span class="font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high text-primary font-semibold">
                  ${isAdmin ? 'Root • All Facilities & RBAC' : 'Prod SSH • AWS Read'}
                </span>
              </div>
            </div>
            <div class="mt-space-sm pt-2 flex items-center justify-between text-xs text-on-surface-variant">
              <span>Next Audit: Nov 15</span>
              <span class="material-symbols-outlined text-[14px] text-secondary">lock</span>
            </div>
          </div>
        </div>

        <!-- 4 Quick navigation cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md mb-space-lg">
          <a href="#/documents" class="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span class="material-symbols-outlined text-[22px]">description</span>
              </div>
              <div>
                <p class="font-title-md text-title-md text-on-surface font-semibold group-hover:text-primary transition-colors">My Documents</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Repository & Policies...</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
          </a>

          <a href="#/orders" class="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                <span class="material-symbols-outlined text-[22px]">inventory_2</span>
              </div>
              <div>
                <p class="font-title-md text-title-md text-on-surface font-semibold group-hover:text-primary transition-colors">My Orders</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Hardware & Softw...</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
          </a>

          <a href="#/team" class="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm group">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-on-primary transition-colors">
                <span class="material-symbols-outlined text-[22px]">badge</span>
              </div>
              <div>
                <p class="font-title-md text-title-md text-on-surface font-semibold group-hover:text-primary transition-colors">Team Directory</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Colleagues & Org...</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
          </a>

          <div onclick="State.showToast('IT Helpdesk: Submit ticket to helpdesk@accesshub.internal')" class="flex items-center justify-between p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30 hover:border-primary/50 transition-all shadow-sm group cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                <span class="material-symbols-outlined text-[22px]">support_agent</span>
              </div>
              <div>
                <p class="font-title-md text-title-md text-on-surface font-semibold group-hover:text-primary transition-colors">IT Helpdesk</p>
                <p class="font-body-sm text-body-sm text-on-surface-variant">Benefits & Quick Ti...</p>
              </div>
            </div>
            <span class="material-symbols-outlined text-outline group-hover:translate-x-1 transition-transform">chevron_right</span>
          </div>
        </div>

        <!-- Main Content 2-Column Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
          <!-- Left 2 Columns: Assigned Documents & Live Activity -->
          <div class="lg:col-span-2 flex flex-col gap-space-lg">
            <!-- Assigned Documents Card -->
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
              <div class="flex items-center justify-between mb-space-md">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[20px]">folder_open</span>
                  <h2 class="font-title-md text-title-md text-on-surface font-bold">Assigned Documents</h2>
                </div>
                <a href="#/documents" class="font-label-sm text-label-sm text-primary font-semibold hover:underline flex items-center gap-1">
                  View All Documents
                  <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </a>
              </div>

              <!-- Documents Table -->
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="border-b border-outline-variant/20 text-on-surface-variant font-label-sm text-label-sm uppercase">
                      <th class="py-2.5 px-3">DOCUMENT NAME</th>
                      <th class="py-2.5 px-3">DOC ID</th>
                      <th class="py-2.5 px-3">DATE</th>
                      <th class="py-2.5 px-3">STATUS</th>
                      <th class="py-2.5 px-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-outline-variant/15 font-body-sm text-body-sm">
                    ${(stats.assignedDocuments && stats.assignedDocuments.length > 0 ? stats.assignedDocuments : [
                      { id: 'DOC-8821', name: 'Q3_Architecture_Review.pdf', size: '4.2 MB', category: 'Core Infra', uploadedAt: '2 days ago', status: 'Approved', type: 'PDF' },
                      { id: 'DOC-7419', name: 'Dev_Environment_Setup_v2.docx', size: '1.8 MB', category: 'Onboarding', uploadedAt: 'Oct 19, 2024', status: 'Under Review', type: 'DOCX' },
                      { id: 'DOC-9042', name: 'API_Gateway_Specs.pdf', size: '8.1 MB', category: 'System Specs', uploadedAt: 'Oct 14, 2024', status: 'Approved', type: 'PDF' }
                    ]).map(doc => `
                      <tr class="hover:bg-surface-container-low/50 transition-colors">
                        <td class="py-3 px-3">
                          <div class="flex items-center gap-3">
                            <span class="material-symbols-outlined ${doc.type === 'PDF' ? 'text-error' : doc.type === 'DOCX' ? 'text-primary' : 'text-secondary'} text-[22px]">
                              ${doc.type === 'PDF' ? 'picture_as_pdf' : doc.type === 'DOCX' ? 'article' : 'table_view'}
                            </span>
                            <div>
                              <p class="font-label-lg text-label-lg font-semibold text-on-surface">${doc.name}</p>
                              <p class="text-xs text-on-surface-variant">${doc.category || 'General'} • ${doc.size || '2.0 MB'}</p>
                            </div>
                          </div>
                        </td>
                        <td class="py-3 px-3 font-mono text-xs text-on-surface-variant">${doc.id}</td>
                        <td class="py-3 px-3 text-on-surface-variant">${doc.uploadedAt}</td>
                        <td class="py-3 px-3">
                          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            doc.status === 'Approved' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' : 'bg-surface-container text-on-surface-variant'
                          }">
                            ${doc.status}
                          </span>
                        </td>
                        <td class="py-3 px-3 text-right">
                          <div class="inline-flex items-center gap-1">
                            <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" onclick="DocumentsView.openPreview('${doc.id}', '${encodeURIComponent(doc.name)}', '${encodeURIComponent(doc.description || doc.name)}')" title="Preview">
                              <span class="material-symbols-outlined text-[18px]">visibility</span>
                            </button>
                            <button class="p-1 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors" onclick="DocumentsView.downloadDoc('${doc.id}', '${doc.name}')" title="Download">
                              <span class="material-symbols-outlined text-[18px]">download</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Activity & Approvals Card -->
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
              <div class="flex items-center justify-between mb-space-md">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-on-surface text-[20px]">history</span>
                  <h2 class="font-title-md text-title-md text-on-surface font-bold">Activity & Approvals</h2>
                </div>
                <span class="font-label-sm text-label-sm text-on-surface-variant">Live audit log</span>
              </div>

              <div class="space-y-4">
                ${(stats.recentActivity && stats.recentActivity.length > 0 ? stats.recentActivity : [
                  { icon: 'shopping_cart', title: 'Alex Mercer submitted Order #ORD-9204 (Mechanical Keyboard & Docking Station).', timestamp: 'Today at 10:14 AM • Hardware Requisition', color: 'text-primary' },
                  { icon: 'check_circle', title: 'DevOps Operations approved server access grant for us-west-2-staging.', timestamp: 'Yesterday at 4:32 PM • Access Policy #POL-108', color: 'text-secondary' },
                  { icon: 'update', title: 'Corporate Compliance published mandatory update: Q4 Data Governance Policy.', timestamp: 'Oct 21, 2024 • Acknowledgment pending', color: 'text-tertiary' }
                ]).map(act => `
                  <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container-low transition-colors">
                    <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 mt-0.5">
                      <span class="material-symbols-outlined text-[18px] ${act.color || 'text-primary'}">${act.icon || 'notifications'}</span>
                    </div>
                    <div>
                      <p class="font-body-md text-body-md text-on-surface font-medium">${act.title}</p>
                      <p class="font-label-sm text-label-sm text-on-surface-variant mt-0.5">${act.timestamp || act.meta || ''}</p>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column: Recent Orders, Team Members, Quota -->
          <div class="flex flex-col gap-space-lg">
            <!-- My Recent Orders Card -->
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
              <div class="flex items-center justify-between mb-space-md">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-secondary text-[20px]">shopping_bag</span>
                  <h2 class="font-title-md text-title-md text-on-surface font-bold">My Recent Orders</h2>
                </div>
                <a href="#/orders" class="font-label-sm text-label-sm text-primary font-semibold hover:underline">View All</a>
              </div>

              <div class="space-y-3">
                ${(stats.recentOrders && stats.recentOrders.length > 0 ? stats.recentOrders : [
                  { id: 'ORD-9204', product: 'Logitech MX Master 3S + Anker Hub', category: 'IT Hardware Provisioning', amount: 189.00, status: 'Approved' },
                  { id: 'ORD-8711', product: 'Dell UltraSharp 32" 4K Monitor', category: 'Desk Setup • Serial #D-88204', amount: 780.00, status: 'Delivered' }
                ]).map(order => `
                  <a href="#/orders?id=${order.id}" class="block p-3.5 rounded-lg border border-outline-variant/20 hover:border-primary/40 hover:bg-surface-container-low/50 transition-all">
                    <div class="flex items-center justify-between mb-1">
                      <span class="font-mono text-xs font-semibold text-primary">${order.id}</span>
                      <span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        order.status === 'Approved' ? 'bg-secondary-container/30 text-on-secondary-fixed-variant' :
                        order.status === 'Delivered' ? 'bg-surface-container-high text-on-surface-variant' :
                        'bg-tertiary-fixed-dim/30 text-tertiary'
                      }">
                        ${order.status}
                      </span>
                    </div>
                    <p class="font-label-lg text-label-lg font-medium text-on-surface line-clamp-1">${order.product}</p>
                    <div class="flex items-center justify-between mt-2 text-xs text-on-surface-variant">
                      <span>${order.category || 'General'}</span>
                      <span class="font-bold text-on-surface text-sm">$${parseFloat(order.amount).toFixed(2)}</span>
                    </div>
                  </a>
                `).join('')}
              </div>
            </div>

            <!-- My Team Members Card -->
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
              <div class="flex items-center justify-between mb-space-md">
                <div class="flex items-center gap-2">
                  <span class="material-symbols-outlined text-primary text-[20px]">groups</span>
                  <h2 class="font-title-md text-title-md text-on-surface font-bold">My Team Members</h2>
                </div>
                <span class="font-label-sm text-label-sm text-on-surface-variant">Core Engineering</span>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <img class="w-9 h-9 rounded-full object-cover" src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80" alt="Sarah Jenkins"/>
                      <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest"></span>
                    </div>
                    <div>
                      <p class="font-label-lg text-label-lg font-semibold text-on-surface">Sarah Jenkins</p>
                      <p class="text-xs text-on-surface-variant">Product Manager • EMP-10401</p>
                    </div>
                  </div>
                  <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" onclick="State.showToast('Opened Slack direct message with Sarah Jenkins', 'chat')" title="Message">
                    <span class="material-symbols-outlined text-[18px]">chat</span>
                  </button>
                </div>

                <div class="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <img class="w-9 h-9 rounded-full object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80" alt="David Kim"/>
                      <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-secondary rounded-full ring-2 ring-surface-container-lowest"></span>
                    </div>
                    <div>
                      <p class="font-label-lg text-label-lg font-semibold text-on-surface">David Kim</p>
                      <p class="text-xs text-on-surface-variant">Senior Frontend • EMP-10512</p>
                    </div>
                  </div>
                  <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" onclick="State.showToast('Opened Slack direct message with David Kim', 'chat')" title="Message">
                    <span class="material-symbols-outlined text-[18px]">chat</span>
                  </button>
                </div>

                <div class="flex items-center justify-between p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                  <div class="flex items-center gap-3">
                    <div class="relative">
                      <img class="w-9 h-9 rounded-full object-cover" src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80" alt="Elena Rostova"/>
                      <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-outline-variant rounded-full ring-2 ring-surface-container-lowest"></span>
                    </div>
                    <div>
                      <p class="font-label-lg text-label-lg font-semibold text-on-surface">Elena Rostova</p>
                      <p class="text-xs text-on-surface-variant">DevOps Specialist • EMP-10389</p>
                    </div>
                  </div>
                  <button class="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary" onclick="State.showToast('Opened Slack direct message with Elena Rostova', 'chat')" title="Message">
                    <span class="material-symbols-outlined text-[18px]">chat</span>
                  </button>
                </div>
              </div>

              <div class="mt-4 pt-3 border-t border-outline-variant/20">
                <a href="#/team" class="w-full py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold flex items-center justify-center gap-2 transition-colors">
                  <span class="material-symbols-outlined text-[18px]">account_tree</span>
                  <span>View Organization Hierarchy</span>
                </a>
              </div>
            </div>

            <!-- Repository Quota Card -->
            <div class="rounded-xl bg-surface-container-lowest border border-outline-variant/30 p-space-lg shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">Repository Quota</span>
                <span class="font-mono font-bold text-xs text-on-surface">34.8 / 100 GB</span>
              </div>
              <div class="w-full bg-surface-container rounded-full h-2 overflow-hidden mb-3">
                <div class="bg-primary h-full rounded-full" style="width: 34.8%;"></div>
              </div>
              <div class="flex items-center justify-between text-xs text-on-surface-variant">
                <span>Access tier auto-scales</span>
                <button class="text-primary font-semibold hover:underline" onclick="State.showToast('Storage quota increase request sent to IT Admin', 'check_circle')">Request More</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  openOrderModal() {
    window.location.hash = '#/orders?action=new';
  },

  openDocModal() {
    window.location.hash = '#/documents?action=upload';
  }
};

window.DashboardView = DashboardView;
