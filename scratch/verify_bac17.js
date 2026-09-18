/**
 * verify_bac17.js — BAC #17 verification + BAC #1–#16 regression
 * Idempotent: restores consumed DB resources before each run and after run.
 */
const http = require('http');
const path = require('path');

function restoreTestFixtures() {
  const dbModule = 'C:\\Users\\athha\\OneDrive\\Desktop\\workhub\\server\\db';
  delete require.cache[require.resolve(dbModule)];
  const { readDB, writeDB } = require(dbModule);
  const bcrypt = require('C:\\Users\\athha\\OneDrive\\Desktop\\workhub\\node_modules\\bcryptjs');
  const db = readDB();

  // Restore passwords & roles
  const defaultEmpHash = bcrypt.hashSync('Employee123!', 8);
  const defaultAdminHash = bcrypt.hashSync('Admin123!', 8);
  db.users.forEach(u => {
    if (u.role === 'Administrator') {
      u.passwordHash = defaultAdminHash;
      u.plainPasswordForLab = 'Admin123!';
      u.assignedRole = 'Administrator';
    } else {
      u.passwordHash = defaultEmpHash;
      u.plainPasswordForLab = 'Employee123!';
      if (u.id === 103) u.assignedRole = 'Department Director';
      else if (u.id === 106) u.assignedRole = 'HR Administrator';
      else if (u.id === 107) u.assignedRole = 'Contractor (External)';
      else u.assignedRole = 'Standard Employee';
    }
  });

  // Restore orders
  ['ORD-7935', 'ORD-7940', 'ORD-9055', 'ORD-9118'].forEach(function(id) {
    var o = db.orders.find(function(x) { return x.id === id; });
    if (o) { o.status = 'Pending Approval'; o.progress = 'Pending Approval'; o.progressStep = 0; }
  });

  // Re-add documents that may have been deleted
  var docsToRestore = [
    { id: 'DOC-5520', name: 'Product_Roadmap_2025_Confidential.pdf', ownerId: 102, ownerName: 'Sarah Jenkins', category: 'Confidential', type: 'pdf', size: '2.4 MB', status: 'Approved', uploadedAt: '2024-10-01T09:00:00Z' },
    { id: 'DOC-6104', name: 'Annual_Compensation_Review_2024.xlsx',    ownerId: 102, ownerName: 'Sarah Jenkins', category: 'HR',          type: 'xlsx', size: '1.1 MB', status: 'Approved', uploadedAt: '2024-09-15T10:00:00Z' },
    { id: 'DOC-5101', name: 'Q3_Customer_Feedback_Summary.docx',       ownerId: 102, ownerName: 'Sarah Jenkins', category: 'Reports',     type: 'docx', size: '0.9 MB', status: 'Approved', uploadedAt: '2024-09-01T10:00:00Z' }
  ];
  docsToRestore.forEach(function(d) {
    if (!db.documents.find(function(x) { return x.id === d.id; })) db.documents.push(d);
  });

  // Reset requests state
  db.requests = [
    {
      id: "REQ-2001",
      ownerId: 101,
      approverId: 103,
      title: "MacBook Pro M3 Max Engineering Workstation",
      department: "Engineering",
      status: "Pending Approval",
      priority: "High",
      createdAt: "2026-09-15T09:00:00.000Z",
      notes: [
        {
          id: "NOTE-3001",
          authorId: 101,
          authorName: "Alex Mercer",
          content: "Waiting for IT confirmation on RAM upgrade to 64GB.",
          createdAt: "2026-09-15T09:30:00.000Z",
          updatedAt: "2026-09-15T09:30:00.000Z"
        }
      ]
    },
    {
      id: "REQ-2002",
      ownerId: 102,
      approverId: 107,
      title: "Figma Enterprise Team Annual Subscription",
      department: "Product",
      status: "Pending Approval",
      priority: "Medium",
      createdAt: "2026-09-16T11:00:00.000Z",
      notes: [
        {
          id: "NOTE-3002",
          authorId: 102,
          authorName: "Sarah Jenkins",
          content: "Procurement clarification: includes 10 product design editor seats.",
          createdAt: "2026-09-16T11:20:00.000Z",
          updatedAt: "2026-09-16T11:20:00.000Z"
        }
      ]
    },
    {
      id: "REQ-2003",
      ownerId: 1,
      approverId: 107,
      title: "SOC 2 Type II Security Assessment Appliance",
      department: "IT & Security",
      status: "Approved",
      approvedBy: 1,
      approvedAt: "2026-09-14T09:15:00.000Z",
      priority: "High",
      createdAt: "2026-09-14T08:00:00.000Z",
      notes: [
        {
          id: "NOTE-3003",
          authorId: 1,
          authorName: "James Thornton",
          content: "Hardware token provisioning authorized under security Q4 grant.",
          createdAt: "2026-09-14T08:45:00.000Z",
          updatedAt: "2026-09-14T08:45:00.000Z"
        }
      ]
    },
    {
      id: "REQ-2004",
      ownerId: 105,
      approverId: 1,
      title: "Cloud Bastion Multi-Region Gateway Upgrade",
      department: "DevOps",
      status: "Pending Approval",
      priority: "Medium",
      createdAt: "2026-09-17T14:00:00.000Z",
      notes: [
        {
          id: "NOTE-3004",
          authorId: 105,
          authorName: "Elena Rostova",
          content: "Awaiting architecture board review for production rollout.",
          createdAt: "2026-09-17T14:15:00.000Z",
          updatedAt: "2026-09-17T14:15:00.000Z"
        }
      ]
    },
    {
      id: "REQ-2005",
      ownerId: 104,
      approverId: 103,
      title: "AWS GPU Inference Cluster Reserve Instance",
      department: "Engineering",
      status: "Completed",
      approvedBy: 103,
      approvedAt: "2026-09-10T10:00:00.000Z",
      priority: "Critical",
      createdAt: "2026-09-08T11:00:00.000Z",
      notes: []
    }
  ];

  // Reset assets state
  db.assets = [
    {
      id: "AST-5001",
      assetTag: "AH-LT-00421",
      type: "Laptop",
      model: "Dell Latitude 7450",
      serialNumber: "DL7450-AH-00421",
      assignedTo: 101,
      managerId: 106,
      status: "Assigned",
      location: "San Francisco HQ",
      assignedAt: "2026-08-20T09:00:00.000Z",
      reassignedBy: null,
      reassignedAt: null
    },
    {
      id: "AST-5002",
      assetTag: "AH-MN-00812",
      type: "Monitor",
      model: "LG UltraFine 27-inch 4K",
      serialNumber: "LG27UF-AH-00812",
      assignedTo: 102,
      managerId: 106,
      status: "Assigned",
      location: "San Francisco HQ",
      assignedAt: "2026-07-15T11:30:00.000Z",
      reassignedBy: null,
      reassignedAt: null
    },
    {
      id: "AST-5003",
      assetTag: "AH-WS-00109",
      type: "Workstation",
      model: "Mac Studio M2 Ultra (64GB)",
      serialNumber: "MSM2U-AH-00109",
      assignedTo: 105,
      managerId: 106,
      status: "Assigned",
      location: "New York Hub",
      assignedAt: "2026-06-10T08:15:00.000Z",
      reassignedBy: null,
      reassignedAt: null
    },
    {
      id: "AST-5004",
      assetTag: "AH-SEC-00005",
      type: "Hardware Appliance",
      model: "YubiKey 5C NFC Enterprise Batch",
      serialNumber: "YK5C-AH-00005",
      assignedTo: 1,
      managerId: 106,
      status: "Assigned",
      location: "San Francisco Executive DMZ",
      assignedAt: "2026-05-01T10:00:00.000Z",
      reassignedBy: null,
      reassignedAt: null
    },
    {
      id: "AST-5005",
      assetTag: "AH-MB-00331",
      type: "Mobile",
      model: "iPhone 15 Pro 256GB Corporate",
      serialNumber: "IP15P-AH-00331",
      assignedTo: null,
      managerId: 106,
      status: "Available",
      location: "IT Hardware Vault",
      assignedAt: null,
      reassignedBy: null,
      reassignedAt: null
    },
    {
      id: "AST-5006",
      assetTag: "AH-LT-00190",
      type: "Laptop",
      model: "ThinkPad X1 Carbon Gen 9",
      serialNumber: "TPX1C-AH-00190",
      assignedTo: null,
      managerId: 106,
      status: "Retired",
      location: "Decommission Depot",
      assignedAt: null,
      reassignedBy: null,
      reassignedAt: null
    }
  ];

  // Reset teams state
  db.teams = [
    { id: "TEAM-1001", name: "Engineering Operations", department: "Engineering", description: "Core platform, microservices, and backend infrastructure reliability.", managerId: 103, memberIds: [101, 104], createdAt: "2024-01-15T09:00:00.000Z" },
    { id: "TEAM-1002", name: "Product Strategy", department: "Product", description: "Product management, user workflows, and customer roadmap coordination.", managerId: 102, memberIds: [102], createdAt: "2024-02-01T09:00:00.000Z" },
    { id: "TEAM-1003", name: "Security Operations", department: "IT & Security", description: "SOC tier 2 investigations, perimeter access control, and identity governance.", managerId: 1, memberIds: [1, 105], createdAt: "2023-11-10T09:00:00.000Z" },
    { id: "TEAM-1004", name: "Procurement & Logistics", department: "Operations", description: "Hardware asset procurement, vendor contract approvals, and facilities logistics.", managerId: 107, memberIds: [107, 108], createdAt: "2024-03-01T09:00:00.000Z" },
    { id: "TEAM-1005", name: "Corporate IT", department: "IT & Security", description: "End-user compute support, enterprise credentials, and workstation deployments.", managerId: 1, memberIds: [1, 106], createdAt: "2023-10-05T09:00:00.000Z" }
  ];

  writeDB(db);
  console.log('[setup] DB fixtures restored');
}

restoreTestFixtures();

function request(method, path, body, cookieHeader, retries = 2) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'localhost', port: 3000, path, method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(cookieHeader ? { 'Cookie': cookieHeader } : {})
      }
    };
    const req = http.request(options, (res) => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        let json; try { json = JSON.parse(raw); } catch { json = raw; }
        resolve({ status: res.statusCode, body: json, headers: res.headers });
      });
    });
    req.on('error', (err) => {
      if (retries > 0 && (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED')) {
        setTimeout(() => {
          request(method, path, body, cookieHeader, retries - 1).then(resolve).catch(reject);
        }, 500);
      } else {
        reject(err);
      }
    });
    if (data) req.write(data);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function login(email, password) {
  const res = await request('POST', '/api/auth/login', { email, password });
  if (res.status !== 200) throw new Error(`Login failed for ${email}: ${res.status} ${JSON.stringify(res.body)}`);
  const setCookie = res.headers['set-cookie'];
  const cookie = Array.isArray(setCookie)
    ? setCookie.map(c => c.split(';')[0]).join('; ')
    : (setCookie || '').split(';')[0];
  return { cookie, user: res.body.user };
}

let pass = 0, fail = 0;
function check(label, status, expected, extraCheck = true) {
  if (status === expected && extraCheck) { console.log(`  PASS [${status}] ${label}`); pass++; }
  else { console.log(`  FAIL [${status} != ${expected} or extraCheck failed] ${label}`); fail++; }
}

(async () => {
  await sleep(600);
  console.log('\n=== AccessHub BAC #17 + Regression ===\n');

  // Personas
  let alex   = await login('employee1@accesshub.local',       'Employee123!'); // id:101, Engineering
  let sarah  = await login('employee2@accesshub.local',       'Employee123!'); // id:102, Product
  let james  = await login('admin@accesshub.local',           'Admin123!');    // id:1,   Administrator

  // ----------------------------------------------------------------
  // BAC #17 — Unauthorized Role/Permission Assignment
  // ----------------------------------------------------------------
  console.log('BAC #17 — Unauthorized Role/Permission Assignment\n');

  // 1. Unauthenticated -> 401
  const unauth = await request('PUT', '/api/employees/102/access-profile', { assignedRole: 'Manager' });
  check('Unauthenticated role update -> 401', unauth.status, 401);

  // 2. Invalid employee ID -> 404
  const notFound = await request('PUT', '/api/employees/9999/access-profile', { assignedRole: 'Manager' }, alex.cookie);
  check('Nonexistent employee ID -> 404', notFound.status, 404);

  // 3. Missing assignedRole in request body -> 400
  const missingRole = await request('PUT', '/api/employees/102/access-profile', {}, alex.cookie);
  check('Missing assignedRole in body -> 400', missingRole.status, 400);

  // 4. Invalid role value -> 400
  const invalidRole = await request('PUT', '/api/employees/102/access-profile', { assignedRole: 'SuperGodUser' }, alex.cookie);
  check('Invalid role name -> 400', invalidRole.status, 400);

  // 5. Legitimate Administrator assigns role to an employee -> 200
  const adminRes = await request('PUT', '/api/employees/105/access-profile', { assignedRole: 'Team Lead' }, james.cookie);
  check('Administrator assigns role to Elena (105) -> 200', adminRes.status, 200,
    adminRes.body.assignedRole === 'Team Lead' && adminRes.body.employeeId === 105);

  // 6. BAC #17 Flaw: Ordinary authenticated employee assigns role to another employee -> 200
  // Alex Mercer (101) assigns "Manager" to Sarah Jenkins (102)
  const vulnRes = await request('PUT', '/api/employees/102/access-profile', { assignedRole: 'Manager' }, alex.cookie);
  check('BAC #17: Alex (101) assigns Manager role to Sarah (102) -> 200 VULNERABLE', vulnRes.status, 200,
    vulnRes.body.assignedRole === 'Manager' && vulnRes.body.employeeId === 102);

  // 7. Verify Sarah's profile reflects the new assignedRole
  const sarahProfile = await request('GET', '/api/employees/102', null, alex.cookie);
  check('Sarah profile returns updated assignedRole (Manager)', sarahProfile.status, 200,
    sarahProfile.body.employee && sarahProfile.body.employee.assignedRole === 'Manager');

  // 8. Audit log records ACCESS_PROFILE_MODIFIED
  const auditRes = await request('GET', '/api/admin/audit-log', null, james.cookie);
  const auditEntry = (auditRes.body.auditLog || []).find(e => e.action === 'ACCESS_PROFILE_MODIFIED' && e.targetId === '102');
  check('Audit log records ACCESS_PROFILE_MODIFIED for Sarah (102)', auditRes.status, 200, !!auditEntry && auditEntry.actor === 'Alex Mercer');
  if (auditEntry) {
    console.log(`     Audit log entry: actor="${auditEntry.actor}", action="${auditEntry.action}", target="${auditEntry.target}"`);
  }

  // ----------------------------------------------------------------
  // BAC #1–#16 Regression
  // ----------------------------------------------------------------
  console.log('\nBAC #1-16 Regression\n');

  // BAC #1 — IDOR doc read
  const bac1 = await request('GET', '/api/documents/DOC-8821', null, sarah.cookie);
  check('BAC #1 (IDOR doc read — DOC-8821)', bac1.status, 200);

  // BAC #2 — Horizontal privilege escalation: contact info
  const bac2 = await request('PUT', '/api/employees/1/contact-info', { phone: '555-9999' }, sarah.cookie);
  check('BAC #2 (horizontal contact-info modification)', bac2.status, 200);

  // BAC #3 — Vertical privilege escalation: admin user update
  const bac3 = await request('PUT', '/api/admin/users/102', { jobTitle: 'Senior Designer' }, alex.cookie);
  check('BAC #3 (vertical admin user update by non-admin)', bac3.status, 200);

  // BAC #4 — Forced browsing: audit log
  const bac4 = await request('GET', '/api/admin/audit-log', null, alex.cookie);
  check('BAC #4 (forced browsing — audit log accessible by employee)', bac4.status, 200);

  // BAC #5 — Unauthorized order cancellation
  const bac5 = await request('POST', '/api/orders/ORD-7935/cancel', {}, alex.cookie);
  check('BAC #5 (order cancel — no ownership check)', bac5.status, 200);

  // BAC #6 — Unauthorized file download
  const bac6 = await request('GET', '/api/documents/DOC-7419/download', null, sarah.cookie);
  check('BAC #6 (unauthorized file download)', bac6.status, 200);

  // BAC #7 — Unauthorized file deletion
  const bac7 = await request('DELETE', '/api/documents/DOC-5101', null, alex.cookie);
  check('BAC #7 (unauthorized file deletion)', bac7.status, 200);

  // BAC #8 — Cross-user preference modification
  const bac8 = await request('PUT', '/api/employees/102/preferences', { emailNotifications: false }, alex.cookie);
  check('BAC #8 (cross-user preference modification)', bac8.status, 200);

  // BAC #9 — HTTP method bypass
  const bac9put = await request('PUT', '/api/orders/ORD-9204/status', { status: 'Approved' }, sarah.cookie);
  check('BAC #9 — PUT on non-owned order -> 403 (protected)', bac9put.status, 403);
  const bac9patch = await request('PATCH', '/api/orders/ORD-9204/status', { status: 'Approved' }, sarah.cookie);
  check('BAC #9 — PATCH on non-owned order -> 200 (VULNERABLE)', bac9patch.status, 200);

  // BAC #10 — Parameter-based auth
  const bac10def = await request('GET', '/api/reports/employee-summary', null, alex.cookie);
  check('BAC #10 — default (no param) -> 403', bac10def.status, 403);
  const bac10par = await request('GET', '/api/reports/employee-summary?accessLevel=admin', null, alex.cookie);
  check('BAC #10 — ?accessLevel=admin -> 200 (VULNERABLE)', bac10par.status, 200);

  // BAC #11 — Unauthorized team membership
  const teamsRes11 = await request('GET', '/api/teams', null, sarah.cookie);
  const team1003 = (teamsRes11.body.teams || []).find(t => t.id === 'TEAM-1003');
  const nonMember11 = team1003 ? (teamsRes11.body.allUsers || [101,102,103,104,105,106,107,108]).find(uid => !(team1003.memberIds || []).includes(uid)) : null;
  const addId11 = nonMember11 || 103;
  const bac11 = await request('POST', '/api/teams/TEAM-1003/members', { employeeId: addId11 }, sarah.cookie);
  check('BAC #11 (team membership — Sarah adds member to TEAM-1003)', bac11.status, 200);

  // BAC #12 — Note modification by non-owner
  const reqsRes = await request('GET', '/api/requests', null, alex.cookie);
  const crossReq = (reqsRes.body.requests || []).find(r => r.ownerId !== alex.user.id && r.notes && r.notes.length > 0);
  if (crossReq) {
    const bac12 = await request('PUT', `/api/requests/${crossReq.id}/notes/${crossReq.notes[0].id}`,
      { content: 'BAC #12 regression note update' }, alex.cookie);
    check(`BAC #12 (note modification on ${crossReq.id} by non-owner)`, bac12.status, 200);
  }

  // BAC #13 — Cross-department access control
  const bac13 = await request('GET', '/api/departments/operations/employees', null, alex.cookie);
  check('BAC #13 (cross-department employee list by Alex)', bac13.status, 200);

  // BAC #14 — Unauthorized approval action
  const bac14 = await request('POST', '/api/requests/REQ-2002/approve', {}, alex.cookie);
  check('BAC #14 (unauthorized approval on REQ-2002 by Alex 101)', bac14.status, 200);

  // BAC #15 — Resource ownership transfer
  const bac15 = await request('PUT', '/api/assets/AST-5002/assignment', { assignedTo: 101 }, alex.cookie);
  check('BAC #15 (unauthorized asset reassignment by Alex 101)', bac15.status, 200);

  // BAC #16 — Unauthorized password change
  const bac16 = await request('PUT', '/api/account/105/password', { newPassword: 'RegressionPassword123!' }, alex.cookie);
  check('BAC #16 (unauthorized password change by Alex on employee 105)', bac16.status, 200);

  console.log(`\n=== Results: ${pass} passed, ${fail} failed ===\n`);

  // Restore DB fixtures after test run so DB remains clean
  restoreTestFixtures();

  if (fail > 0) process.exit(1);
})().catch(err => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
