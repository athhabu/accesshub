/**
 * AccessHub — Complete Verification of All 20 Broken Access Control Vulnerabilities (BAC #1–#20)
 * 
 * Rules:
 * - Does NOT fix or modify any vulnerabilities or security settings
 * - Tests negative paths (401 unauthenticated, 404 nonexistent, 400 invalid)
 * - Tests legitimate authorized flows
 * - Tests intentional broken access control (vulnerable path -> 200 / intended behavior)
 * - Completely restores database fixtures to clean state and confirms restoration
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { initDB, readDB } = require('../server/db');

const DB_PATH = path.join(__dirname, '..', 'data', 'database.json');

function request(url, method, body, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = body !== undefined && body !== null ? JSON.stringify(body) : null;
    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 3000,
      path: parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {})
      }
    };
    const req = http.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json;
        try { json = JSON.parse(data); } catch { json = { raw: data }; }
        resolve({ status: res.statusCode, body: json, headers: res.headers });
      });
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function login(email, password) {
  const res = await request('http://localhost:3000/api/auth/login', 'POST', { email, password });
  if (res.status !== 200 || !res.body.token) {
    throw new Error(`Login failed for ${email} (${res.status}): ${JSON.stringify(res.body)}`);
  }
  return res.body.token;
}

function resetDatabase() {
  if (fs.existsSync(DB_PATH)) {
    fs.unlinkSync(DB_PATH);
  }
  initDB();
}

const results = [];

function recordTest(bac, name, endpoint, testDesc, expected, actual, condition, details) {
  const isPass = actual === expected && (condition === undefined || condition === true);
  results.push({
    bac,
    name,
    endpoint,
    testDesc,
    expected,
    actual,
    result: isPass ? 'PASS' : 'FAIL',
    details: details || ''
  });
  const symbol = isPass ? '✅ PASS' : '❌ FAIL';
  console.log(`[BAC #${bac}] ${name} | ${testDesc} -> Expected: ${expected}, Actual: ${actual} [${symbol}]`);
  if (!isPass && details) {
    console.log(`       Details: ${details}`);
  }
}

async function runAudit() {
  console.log('======================================================================');
  console.log(' AccessHub Enterprise Security Lab — Full BAC #1–#20 Verification Audit');
  console.log('======================================================================\n');

  // Ensure clean DB before starting
  resetDatabase();

  console.log('Authenticating test identities...');
  const alexToken = await login('employee1@accesshub.local', 'Employee123!');
  const sarahToken = await login('employee2@accesshub.local', 'Employee123!');
  const adminToken = await login('admin@accesshub.local', 'Admin123!');
  const marcusToken = await login('marcus.vance@accesshub.internal', 'Employee123!');
  const chloeToken = await login('chloe.bennett@accesshub.internal', 'Employee123!');
  console.log('All synthetic test accounts authenticated successfully.\n');

  // ==================================================================
  // BAC #1 — IDOR / BOLA: Document Access
  // ==================================================================
  console.log('--- Testing BAC #1: IDOR / BOLA Document Access ---');
  // Negative 1: Unauthenticated
  const b1_unauth = await request('http://localhost:3000/api/documents/DOC-5520', 'GET');
  recordTest('1', 'IDOR: Document Access', 'GET /api/documents/:id', 'Unauthenticated request', 401, b1_unauth.status);

  // Negative 2: Nonexistent
  const b1_404 = await request('http://localhost:3000/api/documents/DOC-99999', 'GET', null, alexToken);
  recordTest('1', 'IDOR: Document Access', 'GET /api/documents/:id', 'Nonexistent document', 404, b1_404.status);

  // Legitimate: Alex accesses own doc
  const b1_own = await request('http://localhost:3000/api/documents/DOC-8821', 'GET', null, alexToken);
  recordTest('1', 'IDOR: Document Access', 'GET /api/documents/:id', 'Alex accesses own document DOC-8821', 200, b1_own.status);

  // Vulnerable: Alex accesses Sarah's doc DOC-5520
  const b1_vuln = await request('http://localhost:3000/api/documents/DOC-5520', 'GET', null, alexToken);
  recordTest('1', 'IDOR: Document Access', 'GET /api/documents/:id', "Alex → another user's document (Sarah's DOC-5520)", 200, b1_vuln.status,
    b1_vuln.body && b1_vuln.body.document && b1_vuln.body.document.id === 'DOC-5520');

  // ==================================================================
  // BAC #2 — Horizontal Privilege Escalation: Contact Information
  // ==================================================================
  console.log('\n--- Testing BAC #2: Horizontal Privilege Escalation: Contact Information ---');
  // Negative 1: Unauthenticated
  const b2_unauth = await request('http://localhost:3000/api/employees/102/contact-info', 'PUT', { phone: '555-0000' });
  recordTest('2', 'Horizontal Priv Escalation: Contact Info', 'PUT /api/employees/:id/contact-info', 'Unauthenticated request', 401, b2_unauth.status);

  // Negative 2: Invalid employee ID
  const b2_404 = await request('http://localhost:3000/api/employees/99999/contact-info', 'PUT', { phone: '555-0000' }, alexToken);
  recordTest('2', 'Horizontal Priv Escalation: Contact Info', 'PUT /api/employees/:id/contact-info', 'Invalid employee ID', 404, b2_404.status);

  // Legitimate: Alex updates own contact info
  const b2_own = await request('http://localhost:3000/api/employees/101/contact-info', 'PUT', { workPhone: '+1 (415) 555-0182', deskLocation: 'Floor 3, Desk 34B' }, alexToken);
  recordTest('2', 'Horizontal Priv Escalation: Contact Info', 'PUT /api/employees/:id/contact-info', 'Alex modifies own contact info', 200, b2_own.status);

  // Vulnerable: Alex updates Sarah's contact info
  const b2_vuln = await request('http://localhost:3000/api/employees/102/contact-info', 'PUT', { workPhone: '+1 (415) 555-9999', deskLocation: 'Floor 2, Desk 99B' }, alexToken);
  recordTest('2', 'Horizontal Priv Escalation: Contact Info', 'PUT /api/employees/:id/contact-info', "Alex → Sarah's contact information", 200, b2_vuln.status,
    b2_vuln.body && b2_vuln.body.employee && b2_vuln.body.employee.workPhone === '+1 (415) 555-9999');

  // ==================================================================
  // BAC #3 — Vertical Privilege Escalation: Admin User Update
  // ==================================================================
  console.log('\n--- Testing BAC #3: Vertical Privilege Escalation: Admin User Update ---');
  // Negative 1: Unauthenticated
  const b3_unauth = await request('http://localhost:3000/api/admin/users/102', 'PUT', { jobTitle: 'Test' });
  recordTest('3', 'Vertical Priv Escalation: Admin User Update', 'PUT /api/admin/users/:id', 'Unauthenticated request', 401, b3_unauth.status);

  // Legitimate: Admin updates employee
  const b3_admin = await request('http://localhost:3000/api/admin/users/102', 'PUT', { jobTitle: 'Principal Product Manager' }, adminToken);
  recordTest('3', 'Vertical Priv Escalation: Admin User Update', 'PUT /api/admin/users/:id', 'Administrator legitimately updates employee', 200, b3_admin.status);

  // Vulnerable: Alex calls admin endpoint to update Sarah
  const b3_vuln = await request('http://localhost:3000/api/admin/users/102', 'PUT', { jobTitle: 'Senior Product Architect' }, alexToken);
  recordTest('3', 'Vertical Priv Escalation: Admin User Update', 'PUT /api/admin/users/:id', 'Alex → admin user-update endpoint', 200, b3_vuln.status,
    b3_vuln.body && b3_vuln.body.user && b3_vuln.body.user.jobTitle === 'Senior Product Architect');

  // ==================================================================
  // BAC #4 — Forced Browsing: Audit Log
  // ==================================================================
  console.log('\n--- Testing BAC #4: Forced Browsing: Audit Log ---');
  // Negative 1: Unauthenticated
  const b4_unauth = await request('http://localhost:3000/api/admin/audit-log', 'GET');
  recordTest('4', 'Forced Browsing: Audit Log', 'GET /api/admin/audit-log', 'Unauthenticated request', 401, b4_unauth.status);

  // Legitimate: Admin accesses audit log
  const b4_admin = await request('http://localhost:3000/api/admin/audit-log', 'GET', null, adminToken);
  recordTest('4', 'Forced Browsing: Audit Log', 'GET /api/admin/audit-log', 'Administrator accesses audit log', 200, b4_admin.status);

  // Vulnerable: Normal employee Alex accesses audit log
  const b4_vuln = await request('http://localhost:3000/api/admin/audit-log', 'GET', null, alexToken);
  recordTest('4', 'Forced Browsing: Audit Log', 'GET /api/admin/audit-log', 'Alex → /api/admin/audit-log', 200, b4_vuln.status,
    b4_vuln.body && Array.isArray(b4_vuln.body.auditLog));

  // ==================================================================
  // BAC #5 — Unauthorized Order Cancellation
  // ==================================================================
  console.log('\n--- Testing BAC #5: Unauthorized Order Cancellation ---');
  // Negative 1: Unauthenticated
  const b5_unauth = await request('http://localhost:3000/api/orders/ORD-7935/cancel', 'POST');
  recordTest('5', 'Unauthorized Order Cancellation', 'POST /api/orders/:id/cancel', 'Unauthenticated request', 401, b5_unauth.status);

  // Negative 2: Delivered order cancellation rejected
  const b5_delivered = await request('http://localhost:3000/api/orders/ORD-8711/cancel', 'POST', {}, alexToken);
  recordTest('5', 'Unauthorized Order Cancellation', 'POST /api/orders/:id/cancel', 'Delivered order cancellation rejected', 400, b5_delivered.status);

  // Legitimate: Alex cancels own cancellable order (ORD-9118)
  const b5_own = await request('http://localhost:3000/api/orders/ORD-9118/cancel', 'POST', {}, alexToken);
  recordTest('5', 'Unauthorized Order Cancellation', 'POST /api/orders/:id/cancel', 'Alex cancels own cancellable order', 200, b5_own.status);

  // Vulnerable: Alex cancels Sarah's cancellable order (ORD-7935)
  const b5_vuln = await request('http://localhost:3000/api/orders/ORD-7935/cancel', 'POST', {}, alexToken);
  recordTest('5', 'Unauthorized Order Cancellation', 'POST /api/orders/:id/cancel', "Alex → Sarah's cancellable order (ORD-7935)", 200, b5_vuln.status,
    b5_vuln.body && b5_vuln.body.order && b5_vuln.body.order.status === 'Cancelled');

  // ==================================================================
  // BAC #6 — Unauthorized File Download
  // ==================================================================
  console.log('\n--- Testing BAC #6: Unauthorized File Download ---');
  // Negative 1: Unauthenticated
  const b6_unauth = await request('http://localhost:3000/api/documents/DOC-5520/download', 'GET');
  recordTest('6', 'Unauthorized File Download', 'GET /api/documents/:id/download', 'Unauthenticated request', 401, b6_unauth.status);

  // Negative 2: Nonexistent
  const b6_404 = await request('http://localhost:3000/api/documents/DOC-99999/download', 'GET', null, alexToken);
  recordTest('6', 'Unauthorized File Download', 'GET /api/documents/:id/download', 'Nonexistent document download', 404, b6_404.status);

  // Legitimate: Alex downloads own document DOC-8821
  const b6_own = await request('http://localhost:3000/api/documents/DOC-8821/download', 'GET', null, alexToken);
  recordTest('6', 'Unauthorized File Download', 'GET /api/documents/:id/download', 'Alex downloads own document DOC-8821', 200, b6_own.status);

  // Vulnerable: Alex downloads Sarah's document DOC-5520
  const b6_vuln = await request('http://localhost:3000/api/documents/DOC-5520/download', 'GET', null, alexToken);
  const hasAttachment = (b6_vuln.headers['content-disposition'] || '').includes('attachment');
  recordTest('6', 'Unauthorized File Download', 'GET /api/documents/:id/download', "Alex → another user's document download (DOC-5520)", 200, b6_vuln.status,
    hasAttachment);

  // ==================================================================
  // BAC #7 — Unauthorized File Deletion
  // ==================================================================
  console.log('\n--- Testing BAC #7: Unauthorized File Deletion ---');
  // Negative 1: Unauthenticated
  const b7_unauth = await request('http://localhost:3000/api/documents/DOC-5101', 'DELETE');
  recordTest('7', 'Unauthorized File Deletion', 'DELETE /api/documents/:id', 'Unauthenticated request', 401, b7_unauth.status);

  // Negative 2: Nonexistent
  const b7_404 = await request('http://localhost:3000/api/documents/DOC-99999', 'DELETE', null, alexToken);
  recordTest('7', 'Unauthorized File Deletion', 'DELETE /api/documents/:id', 'Nonexistent document deletion', 404, b7_404.status);

  // Legitimate: Admin deletes document DOC-1099
  const b7_admin = await request('http://localhost:3000/api/documents/DOC-1099', 'DELETE', null, adminToken);
  recordTest('7', 'Unauthorized File Deletion', 'DELETE /api/documents/:id', 'Admin legitimate document deletion (DOC-1099)', 200, b7_admin.status);

  // Vulnerable: Alex deletes Sarah's document DOC-5101
  const b7_vuln = await request('http://localhost:3000/api/documents/DOC-5101', 'DELETE', null, alexToken);
  recordTest('7', 'Unauthorized File Deletion', 'DELETE /api/documents/:id', "Alex → Sarah's document deletion (DOC-5101)", 200, b7_vuln.status);

  // Confirm deleted document is gone (404 on subsequent get)
  const b7_check = await request('http://localhost:3000/api/documents/DOC-5101', 'GET', null, adminToken);
  recordTest('7', 'Unauthorized File Deletion', 'GET /api/documents/:id', 'Deleted document returns 404', 404, b7_check.status);

  // ==================================================================
  // BAC #8 — Cross-User Preference Modification
  // ==================================================================
  console.log('\n--- Testing BAC #8: Cross-User Preference Modification ---');
  // Negative 1: Unauthenticated
  const b8_unauth = await request('http://localhost:3000/api/employees/102/preferences', 'PUT', { emailNotifications: false });
  recordTest('8', 'Cross-User Preference Modification', 'PUT /api/employees/:id/preferences', 'Unauthenticated request', 401, b8_unauth.status);

  // Negative 2: Nonexistent employee
  const b8_404 = await request('http://localhost:3000/api/employees/99999/preferences', 'PUT', { emailNotifications: false }, alexToken);
  recordTest('8', 'Cross-User Preference Modification', 'PUT /api/employees/:id/preferences', 'Nonexistent employee rejected', 404, b8_404.status);

  // Legitimate: Alex modifies own preferences
  const b8_own = await request('http://localhost:3000/api/employees/101/preferences', 'PUT', { emailNotifications: true }, alexToken);
  recordTest('8', 'Cross-User Preference Modification', 'PUT /api/employees/:id/preferences', 'Alex modifies own preferences', 200, b8_own.status);

  // Vulnerable: Alex modifies Sarah's preferences
  const b8_vuln = await request('http://localhost:3000/api/employees/102/preferences', 'PUT', { emailNotifications: true, desktopNotifications: true }, alexToken);
  recordTest('8', 'Cross-User Preference Modification', 'PUT /api/employees/:id/preferences', "Alex → Sarah's preferences", 200, b8_vuln.status,
    b8_vuln.body && b8_vuln.body.preferences && b8_vuln.body.preferences.desktopNotifications === true);

  // ==================================================================
  // BAC #9 — HTTP Method Authorization Bypass
  // ==================================================================
  console.log('\n--- Testing BAC #9: HTTP Method Authorization Bypass ---');
  // Sarah's order ORD-7940: Alex attempts PUT -> 403 (Protected)
  const b9_put = await request('http://localhost:3000/api/orders/ORD-7940/status', 'PUT', { status: 'Approved' }, alexToken);
  recordTest('9', 'HTTP Method Auth Bypass', 'PUT /api/orders/:id/status', "PUT: Alex modifying Sarah's order", 403, b9_put.status);

  // Alex attempts PATCH -> 200 (Vulnerable)
  const b9_patch = await request('http://localhost:3000/api/orders/ORD-7940/status', 'PATCH', { status: 'Approved' }, alexToken);
  recordTest('9', 'HTTP Method Auth Bypass', 'PATCH /api/orders/:id/status', "PATCH: Alex modifying Sarah's order", 200, b9_patch.status,
    b9_patch.body && b9_patch.body.order && b9_patch.body.order.status === 'Approved');

  // ==================================================================
  // BAC #10 — Parameter-Based Authorization Flaw
  // ==================================================================
  console.log('\n--- Testing BAC #10: Parameter-Based Authorization Flaw ---');
  // Unauthenticated -> 401
  const b10_unauth = await request('http://localhost:3000/api/reports/employee-summary', 'GET');
  recordTest('10', 'Parameter-Based Auth Flaw', 'GET /api/reports/employee-summary', 'Unauthenticated request', 401, b10_unauth.status);

  // Alex requests default (no parameter) -> 403
  const b10_def = await request('http://localhost:3000/api/reports/employee-summary', 'GET', null, alexToken);
  recordTest('10', 'Parameter-Based Auth Flaw', 'GET /api/reports/employee-summary', 'Alex without accessLevel param', 403, b10_def.status);

  // Alex requests with ?accessLevel=admin -> 200 (Vulnerable)
  const b10_vuln = await request('http://localhost:3000/api/reports/employee-summary?accessLevel=admin', 'GET', null, alexToken);
  recordTest('10', 'Parameter-Based Auth Flaw', 'GET /api/reports/employee-summary?accessLevel=admin', 'Alex with ?accessLevel=admin', 200, b10_vuln.status,
    b10_vuln.body && Array.isArray(b10_vuln.body.report));

  // ==================================================================
  // BAC #11 — Unauthorized Team Membership Modification
  // ==================================================================
  console.log('\n--- Testing BAC #11: Unauthorized Team Membership Modification ---');
  // TEAM-1003 manager is James (1). Members initially [1, 105]
  // Negative 1: Unauthenticated
  const b11_unauth = await request('http://localhost:3000/api/teams/TEAM-1003/members', 'POST', { employeeId: 104 });
  recordTest('11', 'Unauthorized Team Membership Mod', 'POST /api/teams/:id/members', 'Unauthenticated request', 401, b11_unauth.status);

  // Negative 2: Nonexistent employee
  const b11_404 = await request('http://localhost:3000/api/teams/TEAM-1003/members', 'POST', { employeeId: 99999 }, sarahToken);
  recordTest('11', 'Unauthorized Team Membership Mod', 'POST /api/teams/:id/members', 'Nonexistent employee rejected', 404, b11_404.status);

  // Legitimate: Manager James adds member 104
  const b11_legit = await request('http://localhost:3000/api/teams/TEAM-1003/members', 'POST', { employeeId: 104 }, adminToken);
  recordTest('11', 'Unauthorized Team Membership Mod', 'POST /api/teams/:id/members', 'Legitimate manager adds member 104', 200, b11_legit.status);

  // Negative 3: Duplicate member
  const b11_dup = await request('http://localhost:3000/api/teams/TEAM-1003/members', 'POST', { employeeId: 104 }, sarahToken);
  recordTest('11', 'Unauthorized Team Membership Mod', 'POST /api/teams/:id/members', 'Duplicate member rejected', 400, b11_dup.status);

  // Vulnerable: Ordinary employee Sarah (102) adds member 103 to TEAM-1003 (not manager)
  const b11_vuln = await request('http://localhost:3000/api/teams/TEAM-1003/members', 'POST', { employeeId: 103 }, sarahToken);
  recordTest('11', 'Unauthorized Team Membership Mod', 'POST /api/teams/:id/members', 'Ordinary employee → unauthorized team membership change', 200, b11_vuln.status,
    b11_vuln.body && b11_vuln.body.employeeId === 103);

  // ==================================================================
  // BAC #12 — Unauthorized Request Note Modification
  // ==================================================================
  console.log('\n--- Testing BAC #12: Unauthorized Request Note Modification ---');
  // REQ-2002 owned by Sarah (102), note NOTE-3002
  // Negative 1: Unauthenticated
  const b12_unauth = await request('http://localhost:3000/api/requests/REQ-2002/notes/NOTE-3002', 'PUT', { content: 'test' });
  recordTest('12', 'Unauthorized Request Note Mod', 'PUT /api/requests/:requestId/notes/:noteId', 'Unauthenticated request', 401, b12_unauth.status);

  // Negative 2: Nonexistent note
  const b12_404 = await request('http://localhost:3000/api/requests/REQ-2002/notes/NOTE-99999', 'PUT', { content: 'test' }, alexToken);
  recordTest('12', 'Unauthorized Request Note Mod', 'PUT /api/requests/:requestId/notes/:noteId', 'Nonexistent note returns 404', 404, b12_404.status);

  // Negative 3: Empty content
  const b12_400 = await request('http://localhost:3000/api/requests/REQ-2002/notes/NOTE-3002', 'PUT', { content: '' }, alexToken);
  recordTest('12', 'Unauthorized Request Note Mod', 'PUT /api/requests/:requestId/notes/:noteId', 'Empty content returns 400', 400, b12_400.status);

  // Legitimate: Owner Sarah edits note
  const b12_legit = await request('http://localhost:3000/api/requests/REQ-2002/notes/NOTE-3002', 'PUT', { content: 'Owner updated procurement note.' }, sarahToken);
  recordTest('12', 'Unauthorized Request Note Mod', 'PUT /api/requests/:requestId/notes/:noteId', 'Owner legitimately edits note', 200, b12_legit.status);

  // Vulnerable: Alex (101) directly modifies Sarah's request note NOTE-3002
  const b12_vuln = await request('http://localhost:3000/api/requests/REQ-2002/notes/NOTE-3002', 'PUT', { content: 'Unauthorized modification by Alex Mercer.' }, alexToken);
  recordTest('12', 'Unauthorized Request Note Mod', 'PUT /api/requests/:requestId/notes/:noteId', "Alex → Sarah's request note", 200, b12_vuln.status,
    b12_vuln.body && b12_vuln.body.note && b12_vuln.body.note.content.includes('Alex Mercer'));

  // ==================================================================
  // BAC #13 — Cross-Department Access Control
  // ==================================================================
  console.log('\n--- Testing BAC #13: Cross-Department Access Control ---');
  // Negative 1: Unauthenticated
  const b13_unauth = await request('http://localhost:3000/api/departments/operations/employees', 'GET');
  recordTest('13', 'Cross-Department Access Control', 'GET /api/departments/:id/employees', 'Unauthenticated request', 401, b13_unauth.status);

  // Negative 2: Invalid department slug
  const b13_404 = await request('http://localhost:3000/api/departments/invalid-dept-slug/employees', 'GET', null, alexToken);
  recordTest('13', 'Cross-Department Access Control', 'GET /api/departments/:id/employees', 'Invalid department slug', 404, b13_404.status);

  // Legitimate: Alex accesses own department (Engineering)
  const b13_own = await request('http://localhost:3000/api/departments/engineering/employees', 'GET', null, alexToken);
  recordTest('13', 'Cross-Department Access Control', 'GET /api/departments/:id/employees', 'Alex accesses own department (Engineering)', 200, b13_own.status);

  // Legitimate: Administrator accesses any department
  const b13_admin = await request('http://localhost:3000/api/departments/finance/employees', 'GET', null, adminToken);
  recordTest('13', 'Cross-Department Access Control', 'GET /api/departments/:id/employees', 'Administrator accesses department', 200, b13_admin.status);

  // Vulnerable: Alex accesses another department (Operations)
  const b13_vuln = await request('http://localhost:3000/api/departments/operations/employees', 'GET', null, alexToken);
  recordTest('13', 'Cross-Department Access Control', 'GET /api/departments/:id/employees', 'Alex → another department (Operations)', 200, b13_vuln.status,
    b13_vuln.body && b13_vuln.body.department === 'Operations' && Array.isArray(b13_vuln.body.employees));

  // ==================================================================
  // BAC #14 — Unauthorized Approval Action
  // ==================================================================
  console.log('\n--- Testing BAC #14: Unauthorized Approval Action ---');
  // REQ-2004 owner is Elena (105), designated approver is James (1).
  // Negative 1: Unauthenticated
  const b14_unauth = await request('http://localhost:3000/api/requests/REQ-2004/approve', 'POST');
  recordTest('14', 'Unauthorized Approval Action', 'POST /api/requests/:requestId/approve', 'Unauthenticated request', 401, b14_unauth.status);

  // Negative 2: Nonexistent request
  const b14_404 = await request('http://localhost:3000/api/requests/REQ-99999/approve', 'POST', {}, alexToken);
  recordTest('14', 'Unauthorized Approval Action', 'POST /api/requests/:requestId/approve', 'Nonexistent request returns 404', 404, b14_404.status);

  // Vulnerable: Alex (101) approves REQ-2004 (designated approver is James 1)
  const b14_vuln = await request('http://localhost:3000/api/requests/REQ-2004/approve', 'POST', {}, alexToken);
  recordTest('14', 'Unauthorized Approval Action', 'POST /api/requests/:requestId/approve', 'Alex → request assigned to another approver (REQ-2004)', 200, b14_vuln.status,
    b14_vuln.body && b14_vuln.body.request && b14_vuln.body.request.status === 'Approved' && b14_vuln.body.request.approvedBy === 101);

  // Negative 3: Re-approving already approved request -> 400
  const b14_reap = await request('http://localhost:3000/api/requests/REQ-2004/approve', 'POST', {}, alexToken);
  recordTest('14', 'Unauthorized Approval Action', 'POST /api/requests/:requestId/approve', 'Already-approved request returns 400', 400, b14_reap.status);

  // ==================================================================
  // BAC #15 — Resource Ownership Transfer
  // ==================================================================
  console.log('\n--- Testing BAC #15: Resource Ownership Transfer ---');
  // AST-5002 managed by Chloe Bennett (106), currently assigned to Sarah (102).
  // Negative 1: Unauthenticated
  const b15_unauth = await request('http://localhost:3000/api/assets/AST-5002/assignment', 'PUT', { assignedTo: 101 });
  recordTest('15', 'Resource Ownership Transfer', 'PUT /api/assets/:assetId/assignment', 'Unauthenticated request', 401, b15_unauth.status);

  // Negative 2: Nonexistent asset
  const b15_404 = await request('http://localhost:3000/api/assets/AST-99999/assignment', 'PUT', { assignedTo: 101 }, alexToken);
  recordTest('15', 'Resource Ownership Transfer', 'PUT /api/assets/:assetId/assignment', 'Nonexistent asset returns 404', 404, b15_404.status);

  // Negative 3: Retired asset cannot be assigned
  const b15_ret = await request('http://localhost:3000/api/assets/AST-5006/assignment', 'PUT', { assignedTo: 101 }, alexToken);
  recordTest('15', 'Resource Ownership Transfer', 'PUT /api/assets/:assetId/assignment', 'Retired asset reassignment rejected', 400, b15_ret.status);

  // Legitimate: Asset Manager Chloe legitimately reassigns AST-5001
  const b15_legit = await request('http://localhost:3000/api/assets/AST-5001/assignment', 'PUT', { assignedTo: 104 }, chloeToken);
  recordTest('15', 'Resource Ownership Transfer', 'PUT /api/assets/:assetId/assignment', 'Legitimate asset manager reassigns asset', 200, b15_legit.status);

  // Vulnerable: Alex (101) reassigns AST-5002 (managed by Chloe) to himself
  const b15_vuln = await request('http://localhost:3000/api/assets/AST-5002/assignment', 'PUT', { assignedTo: 101 }, alexToken);
  recordTest('15', 'Resource Ownership Transfer', 'PUT /api/assets/:assetId/assignment', 'Alex → asset managed by another employee (AST-5002)', 200, b15_vuln.status,
    b15_vuln.body && b15_vuln.body.asset && b15_vuln.body.asset.assignedTo === 101 && b15_vuln.body.asset.reassignedBy === 101);

  // ==================================================================
  // BAC #16 — Unauthorized Password Change
  // ==================================================================
  console.log('\n--- Testing BAC #16: Unauthorized Password Change ---');
  // Negative 1: Unauthenticated
  const b16_unauth = await request('http://localhost:3000/api/account/105/password', 'PUT', { newPassword: 'HackedPassword123!' });
  recordTest('16', 'Unauthorized Password Change', 'PUT /api/account/:employeeId/password', 'Unauthenticated request', 401, b16_unauth.status);

  // Legitimate: Alex changes own password
  const b16_own = await request('http://localhost:3000/api/account/password', 'PUT', {
    currentPassword: 'Employee123!',
    newPassword: 'AlexNewPassword123!'
  }, alexToken);
  recordTest('16', 'Unauthorized Password Change', 'PUT /api/account/password', 'Alex legitimately changes own password', 200, b16_own.status);

  // Vulnerable: Alex changes Elena Rostova\'s (105) password via /api/account/105/password
  const b16_vuln = await request('http://localhost:3000/api/account/105/password', 'PUT', {
    newPassword: 'ElenaNewPassword123!'
  }, alexToken);
  // Confirm no password or hash leaked in response
  const leaksCredentials = b16_vuln.body.password || b16_vuln.body.passwordHash || (b16_vuln.body.user && (b16_vuln.body.user.password || b16_vuln.body.user.passwordHash));
  recordTest('16', 'Unauthorized Password Change', 'PUT /api/account/:employeeId/password', "Alex → another employee's password endpoint (Elena 105)", 200, b16_vuln.status,
    !leaksCredentials);

  // Confirm Elena can now log in with the new password
  const elenaLoginTest = await request('http://localhost:3000/api/auth/login', 'POST', {
    email: 'elena.rostova@accesshub.internal',
    password: 'ElenaNewPassword123!'
  });
  recordTest('16', 'Unauthorized Password Change', 'POST /api/auth/login', 'Target employee authenticates with modified password', 200, elenaLoginTest.status,
    !!elenaLoginTest.body.token);

  // ==================================================================
  // BAC #17 — Unauthorized Role Assignment
  // ==================================================================
  console.log('\n--- Testing BAC #17: Unauthorized Role Assignment ---');
  // Negative 1: Unauthenticated
  const b17_unauth = await request('http://localhost:3000/api/employees/102/access-profile', 'PUT', { assignedRole: 'Department Director' });
  recordTest('17', 'Unauthorized Role Assignment', 'PUT /api/employees/:id/access-profile', 'Unauthenticated request', 401, b17_unauth.status);

  // Negative 2: Invalid role rejected
  const b17_invalid = await request('http://localhost:3000/api/employees/102/access-profile', 'PUT', { assignedRole: 'SuperAdminMaster' }, adminToken);
  recordTest('17', 'Unauthorized Role Assignment', 'PUT /api/employees/:id/access-profile', 'Invalid role values are rejected', 400, b17_invalid.status);

  // Legitimate: Admin assigns role
  const b17_legit = await request('http://localhost:3000/api/employees/102/access-profile', 'PUT', { assignedRole: 'Manager' }, adminToken);
  recordTest('17', 'Unauthorized Role Assignment', 'PUT /api/employees/:id/access-profile', 'Administrator legitimately assigns role', 200, b17_legit.status);

  // Vulnerable: Alex (101) directly modifies Sarah\'s (102) assigned role
  const b17_vuln = await request('http://localhost:3000/api/employees/102/access-profile', 'PUT', { assignedRole: 'Department Director' }, alexToken);
  recordTest('17', 'Unauthorized Role Assignment', 'PUT /api/employees/:id/access-profile', "Alex → Sarah's access profile", 200, b17_vuln.status,
    b17_vuln.body && b17_vuln.body.employee && b17_vuln.body.employee.assignedRole === 'Department Director');

  // ==================================================================
  // BAC #18 — Unauthorized Expense Access
  // ==================================================================
  console.log('\n--- Testing BAC #18: Unauthorized Expense Access ---');
  // Negative 1: Unauthenticated
  const b18_unauth = await request('http://localhost:3000/api/expenses/EXP-7002', 'GET');
  recordTest('18', 'Unauthorized Expense Access', 'GET /api/expenses/:id', 'Unauthenticated request', 401, b18_unauth.status);

  // Negative 2: Nonexistent
  const b18_404 = await request('http://localhost:3000/api/expenses/EXP-99999', 'GET', null, alexToken);
  recordTest('18', 'Unauthorized Expense Access', 'GET /api/expenses/:id', 'Nonexistent expense returns 404', 404, b18_404.status);

  // Legitimate: Alex accesses own expense (EXP-7001)
  const b18_own = await request('http://localhost:3000/api/expenses/EXP-7001', 'GET', null, alexToken);
  recordTest('18', 'Unauthorized Expense Access', 'GET /api/expenses/:id', 'Alex accesses own expense (EXP-7001)', 200, b18_own.status);

  // Legitimate: Admin accesses company expense (EXP-7002)
  const b18_admin = await request('http://localhost:3000/api/expenses/EXP-7002', 'GET', null, adminToken);
  recordTest('18', 'Unauthorized Expense Access', 'GET /api/expenses/:id', 'Administrator accesses company expense', 200, b18_admin.status);

  // Vulnerable: Alex accesses Sarah\'s expense (EXP-7002)
  const b18_vuln1 = await request('http://localhost:3000/api/expenses/EXP-7002', 'GET', null, alexToken);
  const noCredsLeaked = !b18_vuln1.body.password && !b18_vuln1.body.token && !b18_vuln1.body.passwordHash;
  recordTest('18', 'Unauthorized Expense Access', 'GET /api/expenses/:id', "Alex → Sarah's expense (EXP-7002)", 200, b18_vuln1.status,
    b18_vuln1.body && b18_vuln1.body.expense && b18_vuln1.body.expense.id === 'EXP-7002' && noCredsLeaked);

  // Vulnerable: Sarah accesses Alex\'s expense (EXP-7001)
  const b18_vuln2 = await request('http://localhost:3000/api/expenses/EXP-7001', 'GET', null, sarahToken);
  recordTest('18', 'Unauthorized Expense Access', 'GET /api/expenses/:id', "Sarah → Alex's expense (EXP-7001)", 200, b18_vuln2.status,
    b18_vuln2.body && b18_vuln2.body.expense && b18_vuln2.body.expense.id === 'EXP-7001');

  // ==================================================================
  // BAC #19 — Unauthorized Request Rejection
  // ==================================================================
  console.log('\n--- Testing BAC #19: Unauthorized Request Rejection ---');
  // REQ-2002 owned by Sarah (102), approverId is Thomas (107).
  // Negative 1: Unauthenticated
  const b19_unauth = await request('http://localhost:3000/api/requests/REQ-2002/reject', 'POST', { reason: 'No auth' });
  recordTest('19', 'Unauthorized Request Rejection', 'POST /api/requests/:requestId/reject', 'Unauthenticated request', 401, b19_unauth.status);

  // Negative 2: Nonexistent request
  const b19_404 = await request('http://localhost:3000/api/requests/REQ-99999/reject', 'POST', { reason: 'Test' }, alexToken);
  recordTest('19', 'Unauthorized Request Rejection', 'POST /api/requests/:requestId/reject', 'Nonexistent request returns 404', 404, b19_404.status);

  // Vulnerable: Alex (101) directly rejects REQ-2002 (designated approver is Thomas 107)
  const b19_vuln = await request('http://localhost:3000/api/requests/REQ-2002/reject', 'POST', {
    reason: 'Department budgetary allocation exceeded for Q4.'
  }, alexToken);
  recordTest('19', 'Unauthorized Request Rejection', 'POST /api/requests/:requestId/reject', 'Alex → request assigned to another approver (REQ-2002)', 200, b19_vuln.status,
    b19_vuln.body && b19_vuln.body.request && b19_vuln.body.request.status === 'Rejected' && b19_vuln.body.request.rejectedBy === 101);

  // Negative 3: Re-rejection of already completed/rejected request -> 400
  const b19_rereject = await request('http://localhost:3000/api/requests/REQ-2002/reject', 'POST', { reason: 'Repeat' }, alexToken);
  recordTest('19', 'Unauthorized Request Rejection', 'POST /api/requests/:requestId/reject', 'Already-completed request rejection rejected', 400, b19_rereject.status);

  // ==================================================================
  // BAC #20 — Unauthorized Calendar Event Modification
  // ==================================================================
  console.log('\n--- Testing BAC #20: Unauthorized Calendar Event Modification ---');
  // EVT-3001 organized by Marcus Vance (103).
  // Negative 1: Unauthenticated
  const b20_unauth = await request('http://localhost:3000/api/events/EVT-3001', 'PUT', { title: 'No auth edit' });
  recordTest('20', 'Unauthorized Event Modification', 'PUT /api/events/:eventId', 'Unauthenticated request', 401, b20_unauth.status);

  // Negative 2: Nonexistent event
  const b20_404 = await request('http://localhost:3000/api/events/EVT-99999', 'PUT', { title: 'Missing' }, alexToken);
  recordTest('20', 'Unauthorized Event Modification', 'PUT /api/events/:eventId', 'Nonexistent event returns 404', 404, b20_404.status);

  // Negative 3: Invalid input (no valid fields)
  const b20_400 = await request('http://localhost:3000/api/events/EVT-3001', 'PUT', { invalidField: 'test' }, alexToken);
  recordTest('20', 'Unauthorized Event Modification', 'PUT /api/events/:eventId', 'Invalid input (no valid fields) rejected', 400, b20_400.status);

  // Legitimate: Organizer Marcus legitimately modifies event
  const b20_legit = await request('http://localhost:3000/api/events/EVT-3001', 'PUT', {
    title: 'Q3 Engineering All-Hands (Official Agenda)',
    location: 'Building 4, Suite 410'
  }, marcusToken);
  recordTest('20', 'Unauthorized Event Modification', 'PUT /api/events/:eventId', 'Organizer legitimately modifies event', 200, b20_legit.status);

  // Vulnerable: Alex (101, non-organizer) directly modifies Marcus\'s event
  const b20_vuln = await request('http://localhost:3000/api/events/EVT-3001', 'PUT', {
    title: 'Q3 Engineering All-Hands [Unauthorized Reschedule by Alex]',
    location: 'Remote — Zoom Conference Room B'
  }, alexToken);
  recordTest('20', 'Unauthorized Event Modification', 'PUT /api/events/:eventId', "Alex → Marcus's event (EVT-3001)", 200, b20_vuln.status,
    b20_vuln.body && b20_vuln.body.event && b20_vuln.body.event.title.includes('Unauthorized Reschedule by Alex'));

  // ==================================================================
  // Database Restoration & Verification
  // ==================================================================
  console.log('\n======================================================================');
  console.log(' Restoring Database Fixtures to Clean Original State...');
  console.log('======================================================================');

  resetDatabase();

  const restoredDB = readDB();

  // Verification checks for restored state
  const checks = [
    { name: 'DOC-5101 exists in database', ok: (restoredDB.documents || []).some(d => d.id === 'DOC-5101') },
    { name: 'DOC-1099 exists in database', ok: (restoredDB.documents || []).some(d => d.id === 'DOC-1099') },
    { name: 'ORD-7935 status is Pending Approval', ok: (restoredDB.orders || []).find(o => o.id === 'ORD-7935')?.status === 'Pending Approval' },
    { name: 'ORD-7940 status is Pending Approval', ok: (restoredDB.orders || []).find(o => o.id === 'ORD-7940')?.status === 'Pending Approval' },
    { name: 'ORD-9118 status is Pending Approval', ok: (restoredDB.orders || []).find(o => o.id === 'ORD-9118')?.status === 'Pending Approval' },
    { name: 'TEAM-1003 members restored to [1, 105]', ok: JSON.stringify((restoredDB.teams || []).find(t => t.id === 'TEAM-1003')?.memberIds) === JSON.stringify([1, 105]) },
    { name: 'REQ-2002 status is Pending Approval', ok: (restoredDB.requests || []).find(r => r.id === 'REQ-2002')?.status === 'Pending Approval' },
    { name: 'REQ-2004 status is Pending Approval', ok: (restoredDB.requests || []).find(r => r.id === 'REQ-2004')?.status === 'Pending Approval' },
    { name: 'AST-5002 assignedTo is 102 (Sarah)', ok: (restoredDB.assets || []).find(a => a.id === 'AST-5002')?.assignedTo === 102 },
    { name: 'AST-5001 assignedTo is 101 (Alex)', ok: (restoredDB.assets || []).find(a => a.id === 'AST-5001')?.assignedTo === 101 },
    { name: 'User 105 (Elena) password is original Employee123!', ok: (restoredDB.users || []).find(u => u.id === 105)?.plainPasswordForLab === 'Employee123!' },
    { name: 'User 102 (Sarah) assignedRole is Standard Employee', ok: (restoredDB.users || []).find(u => u.id === 102)?.assignedRole === 'Standard Employee' },
    { name: 'EVT-3001 title is Q3 Engineering All-Hands', ok: (restoredDB.events || []).find(e => e.id === 'EVT-3001')?.title === 'Q3 Engineering All-Hands' }
  ];

  let allRestored = true;
  for (const c of checks) {
    console.log(`[Restoration Check] ${c.name}: ${c.ok ? '✅ CONFIRMED' : '❌ FAILED'}`);
    if (!c.ok) allRestored = false;
  }

  // Also verify live login after restoration
  let loginRestored = false;
  try {
    const postResetToken = await login('employee1@accesshub.local', 'Employee123!');
    const elenaResetToken = await login('elena.rostova@accesshub.internal', 'Employee123!');
    loginRestored = !!(postResetToken && elenaResetToken);
  } catch (err) {
    loginRestored = false;
  }
  console.log(`[Restoration Check] Live login test with original credentials: ${loginRestored ? '✅ CONFIRMED' : '❌ FAILED'}`);

  console.log('\n======================================================================');
  console.log(' AUDIT SUMMARY');
  console.log('======================================================================');
  const total = results.length;
  const passed = results.filter(r => r.result === 'PASS').length;
  const failed = results.filter(r => r.result === 'FAIL').length;
  console.log(`Total test assertions: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Database Restoration: ${allRestored && loginRestored ? 'SUCCESSFUL' : 'FAILED'}`);

  // Write JSON results to scratch file for subsequent consumption
  fs.writeFileSync(path.join(__dirname, 'audit_results.json'), JSON.stringify({
    total,
    passed,
    failed,
    databaseRestored: allRestored && loginRestored,
    results
  }, null, 2));

  if (failed > 0 || !allRestored || !loginRestored) {
    process.exit(1);
  }
}

runAudit().catch(err => {
  console.error('Fatal audit execution error:', err);
  process.exit(1);
});
