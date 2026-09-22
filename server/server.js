const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { initDB, readDB } = require('./db');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize persistent database
initDB();

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// API Routes
app.use('/api', apiRouter);

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Serve static frontend assets
app.use(express.static(path.join(__dirname, '..', 'public')));

// Enterprise Search Results Route (XSS-01 — Reflected Search Results)
app.get('/search', (req, res) => {
  const db = readDB();
  const rawQuery = (req.query.q !== undefined ? req.query.q : (req.query.query !== undefined ? req.query.query : (req.query.term !== undefined ? req.query.term : ''))).toString();
  const searchTerm = rawQuery.trim().toLowerCase();

  let matchedUsers = [];
  let matchedDocs = [];
  let matchedOrders = [];

  if (searchTerm) {
    matchedUsers = (db.users || []).filter(u =>
      (u.name && u.name.toLowerCase().includes(searchTerm)) ||
      (u.email && u.email.toLowerCase().includes(searchTerm)) ||
      (u.jobTitle && u.jobTitle.toLowerCase().includes(searchTerm)) ||
      (u.department && u.department.toLowerCase().includes(searchTerm)) ||
      (u.empId && u.empId.toLowerCase().includes(searchTerm))
    );

    matchedDocs = (db.documents || []).filter(d =>
      (d.name && d.name.toLowerCase().includes(searchTerm)) ||
      (d.category && d.category.toLowerCase().includes(searchTerm)) ||
      (d.ownerName && d.ownerName.toLowerCase().includes(searchTerm)) ||
      (d.id && d.id.toLowerCase().includes(searchTerm))
    );

    matchedOrders = (db.orders || []).filter(o =>
      (o.id && o.id.toLowerCase().includes(searchTerm)) ||
      (o.title && o.title.toLowerCase().includes(searchTerm)) ||
      (o.department && o.department.toLowerCase().includes(searchTerm)) ||
      (o.status && o.status.toLowerCase().includes(searchTerm))
    );
  }

  const totalMatches = matchedUsers.length + matchedDocs.length + matchedOrders.length;

  // Server-rendered Search Results page matching AccessHub design system
  // NOTE: rawQuery is reflected directly into HTML output without HTML entity encoding
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Search Results — AccessHub Enterprise</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/css/custom.css" />
</head>
<body class="bg-[#f8f9ff] font-['Inter',sans-serif] text-[#0b1c30] min-h-screen">
  <!-- Top Navigation Bar -->
  <header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
    <div class="flex items-center gap-6 flex-1 max-w-3xl">
      <a href="/#/dashboard" class="flex items-center gap-2 text-slate-800 font-bold tracking-tight text-lg hover:opacity-90">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-base">
          <span class="material-symbols-outlined text-[20px]">hub</span>
        </div>
        <span>AccessHub</span>
      </a>

      <form action="/search" method="GET" class="relative flex-1">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
        <input 
          type="text" 
          name="q" 
          id="search-query-input"
          value="${rawQuery}" 
          placeholder="Search personnel, documents, requisitions..." 
          class="w-full h-10 pl-9 pr-24 rounded-lg bg-slate-100 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition-all"
        />
        <button type="submit" class="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-md transition-colors">
          Search
        </button>
      </form>
    </div>

    <div class="flex items-center gap-4">
      <a href="/#/dashboard" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 py-1.5 px-3 rounded-lg hover:bg-indigo-50 transition-colors">
        <span class="material-symbols-outlined text-[16px]">arrow_back</span>
        Return to Portal
      </a>
    </div>
  </header>

  <!-- Main Results Container -->
  <main class="max-w-5xl mx-auto px-6 py-8">
    <!-- Breadcrumb Context -->
    <div class="flex items-center gap-2 text-xs text-slate-500 mb-4">
      <a href="/#/dashboard" class="hover:text-slate-800">Enterprise Workspace</a>
      <span>/</span>
      <span class="text-slate-700 font-medium">Search Results</span>
    </div>

    <!-- Header / Reflection Block -->
    <div class="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm mb-6">
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-bold text-slate-900 tracking-tight" id="search-title">Search Results</h1>
          ${rawQuery ? `
            <p class="text-sm text-slate-600 mt-1" id="search-reflection-msg">
              Showing ${totalMatches} record${totalMatches === 1 ? '' : 's'} matching: <span class="font-semibold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">${rawQuery}</span>
            </p>
          ` : `
            <p class="text-sm text-slate-500 mt-1">
              Enter keywords in the search bar above to query enterprise records.
            </p>
          `}
        </div>
        ${rawQuery ? `
          <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200 self-start sm:self-auto">
            ${totalMatches} result${totalMatches === 1 ? '' : 's'} found
          </span>
        ` : ''}
      </div>
    </div>

    ${!rawQuery ? `
      <!-- Empty query state -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div class="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-[24px]">search</span>
        </div>
        <h3 class="text-base font-bold text-slate-800">Enterprise Universal Search</h3>
        <p class="text-xs text-slate-500 mt-1 max-w-md mx-auto">Query company personnel, compliance files, policies, and procurement orders across all departments.</p>
        <div class="flex items-center justify-center gap-2 mt-4 text-xs">
          <span class="text-slate-400">Try searching:</span>
          <a href="/search?q=Engineering" class="text-indigo-600 hover:underline">Engineering</a>
          <span class="text-slate-300">•</span>
          <a href="/search?q=Policy" class="text-indigo-600 hover:underline">Policy</a>
          <span class="text-slate-300">•</span>
          <a href="/search?q=MacBook" class="text-indigo-600 hover:underline">MacBook</a>
        </div>
      </div>
    ` : totalMatches === 0 ? `
      <!-- No records matched -->
      <div class="bg-white rounded-xl border border-slate-200/80 p-12 text-center shadow-sm">
        <div class="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-[24px]">manage_search</span>
        </div>
        <h3 class="text-base font-bold text-slate-800">No records found</h3>
        <p class="text-xs text-slate-500 mt-1">No personnel, documents, or purchase orders matched the search query.</p>
      </div>
    ` : `
      <!-- Results lists -->
      <div class="space-y-6">
        ${matchedUsers.length > 0 ? `
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-indigo-600 text-[18px]">group</span>
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600">Personnel (${matchedUsers.length})</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${matchedUsers.map(u => `
                <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center gap-3">
                  <img src="${u.avatar || '/assets/alex_mercer.png'}" alt="${u.name}" class="w-11 h-11 rounded-lg object-cover bg-slate-100 border border-slate-200" onerror="this.src='https://ui-avatars.com/api/?name=' + encodeURIComponent('${u.name}')" />
                  <div class="min-w-0 flex-1">
                    <p class="font-bold text-sm text-slate-900 truncate">${u.name}</p>
                    <p class="text-xs text-slate-500 truncate">${u.jobTitle || 'Staff Member'} • ${u.department}</p>
                    <span class="font-mono text-[10px] text-indigo-600">${u.empId || ''}</span>
                  </div>
                  <a href="/#/team?q=${encodeURIComponent(u.name)}" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold shrink-0">View</a>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${matchedDocs.length > 0 ? `
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-indigo-600 text-[18px]">description</span>
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600">Documents (${matchedDocs.length})</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${matchedDocs.map(d => `
                <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <div class="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <span class="material-symbols-outlined text-[18px]">article</span>
                    </div>
                    <div class="min-w-0">
                      <p class="font-semibold text-sm text-slate-900 truncate">${d.name}</p>
                      <p class="text-xs text-slate-500 truncate">${d.category} • Owned by ${d.ownerName}</p>
                    </div>
                  </div>
                  <a href="/#/documents" class="text-xs text-indigo-600 hover:text-indigo-800 font-semibold shrink-0">Open</a>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        ${matchedOrders.length > 0 ? `
          <div>
            <div class="flex items-center gap-2 mb-3">
              <span class="material-symbols-outlined text-indigo-600 text-[18px]">shopping_cart</span>
              <h2 class="text-sm font-bold uppercase tracking-wider text-slate-600">Purchase Orders (${matchedOrders.length})</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              ${matchedOrders.map(o => `
                <div class="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm flex items-center justify-between gap-3">
                  <div class="min-w-0">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs font-bold text-indigo-600">${o.id}</span>
                      <span class="text-xs text-slate-500">• ${o.department}</span>
                    </div>
                    <p class="font-semibold text-sm text-slate-900 truncate mt-0.5">${o.title}</p>
                  </div>
                  <span class="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">${o.status}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `}
  </main>
</body>
</html>`;

  res.send(html);
});

// Search Preview Route (XSS-03 — DOM XSS via URL Query Parameter)
// The server delivers static HTML; all query parsing and DOM injection is client-side
app.get('/search-preview', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'search-preview.html'));
});

// Report Preview Route (XSS-06 / Check #26 — JavaScript-Context XSS)
// Embeds user-supplied parameters directly into inline <script> configuration
function handleReportPreview(req, res) {
  const rawTitle = (req.query.title !== undefined ? req.query.title : (req.query.name !== undefined ? req.query.name : 'Executive Access & Compliance Summary')).toString();
  const rawId = (req.query.id !== undefined ? req.query.id : 'RPT-2024-Q3').toString();
  const rawCategory = (req.query.category !== undefined ? req.query.category : 'Quarterly Audit').toString();
  const rawFormat = (req.query.format !== undefined ? req.query.format : 'PDF / Interactive').toString();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Report Preview — AccessHub Enterprise</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="/css/custom.css" />
</head>
<body class="bg-[#f8f9ff] font-['Inter',sans-serif] text-[#0b1c30] min-h-screen">
  <!-- Top Navigation Bar -->
  <header class="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
    <div class="flex items-center gap-6 flex-1 max-w-3xl">
      <a href="/#/dashboard" class="flex items-center gap-2 text-slate-800 font-bold tracking-tight text-lg hover:opacity-90">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-base">
          <span class="material-symbols-outlined text-[20px]">hub</span>
        </div>
        <span>AccessHub</span>
      </a>
      <div class="h-5 w-[1px] bg-slate-200"></div>
      <span class="text-xs font-semibold uppercase tracking-wider text-slate-500">Enterprise Reporting Service</span>
    </div>
    <div class="flex items-center gap-3">
      <a href="/#/dashboard" class="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px]">arrow_back</span>
        <span>Back to Portal</span>
      </a>
      <button onclick="window.print()" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm">
        <span class="material-symbols-outlined text-[16px]">print</span>
        <span>Export Document</span>
      </button>
    </div>
  </header>

  <!-- Main Content Container -->
  <main class="max-w-5xl mx-auto px-6 py-8">
    <div class="mb-6 flex items-center justify-between flex-wrap gap-4">
      <div>
        <div class="flex items-center gap-2 mb-1">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">CONFIDENTIAL</span>
          <span class="text-xs font-mono text-slate-400" id="report-meta-id">${rawId}</span>
        </div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-900" id="report-header-title">Executive Access &amp; Compliance Summary</h1>
        <p class="text-xs text-slate-500 mt-1">Generated for compliance verification and internal enterprise governance.</p>
      </div>
      <div class="flex items-center gap-3 bg-white px-4 py-2.5 rounded-xl border border-slate-200/80 shadow-sm text-xs">
        <div>
          <span class="block text-[10px] uppercase font-bold text-slate-400">FORMAT</span>
          <span class="font-semibold text-slate-700">${rawFormat}</span>
        </div>
        <div class="h-6 w-[1px] bg-slate-200"></div>
        <div>
          <span class="block text-[10px] uppercase font-bold text-slate-400">CATEGORY</span>
          <span class="font-semibold text-slate-700">${rawCategory}</span>
        </div>
      </div>
    </div>

    <!-- Report Preview Document Canvas -->
    <div class="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-sm">
      <div class="border-b border-slate-100 pb-6 mb-6 flex items-start justify-between">
        <div class="space-y-1">
          <h2 class="text-lg font-bold text-slate-900" id="doc-canvas-title">Document Preview Canvas</h2>
          <p class="text-xs text-slate-500">Security Assertion and Access Control Overview</p>
        </div>
        <span class="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Audit Ready
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span class="block text-xs font-semibold text-slate-500 mb-1">Total Audit Scope</span>
          <span class="text-2xl font-bold text-slate-900">26 Checks</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span class="block text-xs font-semibold text-slate-500 mb-1">Authorization Realm</span>
          <span class="text-2xl font-bold text-indigo-600">Enterprise</span>
        </div>
        <div class="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <span class="block text-xs font-semibold text-slate-500 mb-1">Attestation Level</span>
          <span class="text-2xl font-bold text-slate-900">Tier-2 Certified</span>
        </div>
      </div>

      <div class="space-y-4">
        <div class="p-4 rounded-xl border border-slate-200/80 bg-[#fbfcfe]">
          <h3 class="text-sm font-bold text-slate-800 mb-1">Report Parameters &amp; Runtime Config</h3>
          <p class="text-xs text-slate-500 mb-3">The reporting subsystem loads live configuration data directly from the enterprise document coordinator.</p>
          <div class="font-mono text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200/60" id="report-config-display">
            Loading runtime configuration...
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Embedded Report Configuration Script (JavaScript-Context XSS Sink) -->
  <script>
    const reportConfig = {
      id: "${rawId}",
      title: "${rawTitle}",
      category: "${rawCategory}",
      format: "${rawFormat}",
      generatedAt: new Date().toISOString(),
      viewerMode: "interactive"
    };

    document.addEventListener('DOMContentLoaded', function() {
      const headerTitle = document.getElementById('report-header-title');
      const canvasTitle = document.getElementById('doc-canvas-title');
      const configDisplay = document.getElementById('report-config-display');

      if (headerTitle && reportConfig.title) {
        headerTitle.textContent = reportConfig.title;
      }
      if (canvasTitle && reportConfig.title) {
        canvasTitle.textContent = reportConfig.title;
      }
      if (configDisplay) {
        configDisplay.textContent = JSON.stringify(reportConfig, null, 2);
      }
    });
  </script>
</body>
</html>`;

  res.send(html);
}

app.get('/report-preview', handleReportPreview);
app.get('/reports/preview', handleReportPreview);

// Catch-all for SPA client routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error occurred.' });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` AccessHub Enterprise Portal running at http://localhost:${PORT}`);
  console.log(`=======================================================`);
});
