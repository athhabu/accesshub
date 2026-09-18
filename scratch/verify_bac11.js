const http = require('http');
const { readDB, writeDB } = require('../server/db');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch (e) {
          parsed = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, data: parsed });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function requestWithRetry(options, data = null, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await request(options, data);
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await wait(300);
    }
  }
}

async function login(email, password) {
  const res = await requestWithRetry({
    hostname: 'localhost',
    port: 3000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });

  if (res.status !== 200 || !res.data.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.token;
}

async function run() {
  console.log('=== STARTING BAC #11 & REGRESSION VERIFICATION ===\n');

  // Save database snapshot for restoration
  const dbSnapshot = JSON.parse(JSON.stringify(readDB()));

  try {
    // 1. Authenticate users
    console.log('1. Authenticating test personas...');
    const alexToken = await login('employee1@accesshub.local', 'Employee123!'); // ID: 101, Role: Employee
    const sarahToken = await login('employee2@accesshub.local', 'Employee123!'); // ID: 102, Role: Employee
    const marcusToken = await login('marcus.vance@accesshub.internal', 'Employee123!'); // ID: 103, Role: Employee (Manager of TEAM-1001)
    const adminToken = await login('admin@accesshub.local', 'Admin123!'); // ID: 1, Role: Administrator
    console.log('   All 4 personas authenticated successfully.');

    // 2. Unauthenticated request -> 401
    console.log('\n2. Testing unauthenticated access to POST /api/teams/:id/members...');
    const unauthRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-1001/members',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { employeeId: 102 });
    console.log(`   Status: ${unauthRes.status} (Expected 401)`);
    if (unauthRes.status !== 401) throw new Error('Failed: Expected 401 for unauthenticated request');

    // 3. Invalid team ID -> 404
    console.log('\n3. Testing invalid team ID...');
    const invalidTeamRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-NONEXISTENT/members',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { employeeId: 102 });
    console.log(`   Status: ${invalidTeamRes.status} (Expected 404)`);
    if (invalidTeamRes.status !== 404) throw new Error('Failed: Expected 404 for nonexistent team');

    // 4. Invalid employee ID -> 404
    console.log('\n4. Testing invalid employee ID...');
    const invalidEmpRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-1001/members',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { employeeId: 99999 });
    console.log(`   Status: ${invalidEmpRes.status} (Expected 404)`);
    if (invalidEmpRes.status !== 404) throw new Error('Failed: Expected 404 for nonexistent employee');

    // 5. Duplicate membership -> 400
    console.log('\n5. Testing duplicate team membership rejection...');
    // Alex Mercer (101) is already in TEAM-1001
    const dupRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-1001/members',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { employeeId: 101 });
    console.log(`   Status: ${dupRes.status}, Error: ${dupRes.data.error} (Expected 400)`);
    if (dupRes.status !== 400) throw new Error('Failed: Expected 400 for duplicate member');

    // 6. Legitimate manager adds a member -> 200
    console.log('\n6. Testing legitimate team manager adding a member...');
    // Marcus Vance (103) is manager of TEAM-1001. Adding Chloe Bennett (106).
    const mgrRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-1001/members',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${marcusToken}`
      }
    }, { employeeId: 106 });
    console.log(`   Status: ${mgrRes.status}, Message: ${mgrRes.data.message} (Expected 200)`);
    if (mgrRes.status !== 200) throw new Error('Failed: Expected 200 for team manager');

    // 7. Legitimate administrator adds a member -> 200
    console.log('\n7. Testing administrator adding a member...');
    // James Thornton (1) is Administrator. Adding Maya Patel (108) to TEAM-1003.
    const adminAddRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-1003/members',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { employeeId: 108 });
    console.log(`   Status: ${adminAddRes.status}, Message: ${adminAddRes.data.message} (Expected 200)`);
    if (adminAddRes.status !== 200) throw new Error('Failed: Expected 200 for administrator');

    // 8. VULNERABLE BEHAVIOR (BAC #11):
    // Authenticated non-manager employee Alex Mercer (101) adding Sarah Jenkins (102)
    // to TEAM-1004 (Procurement & Logistics, managed by Thomas Rivera 107).
    console.log('\n8. Testing BAC #11: Non-manager employee modifying another team membership...');
    const bac11Res = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-1004/members',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { employeeId: 102 });
    console.log(`   Status: ${bac11Res.status} (Expected 200 - Vulnerable Authorization Omission)`);
    console.log(`   Response:`, bac11Res.data);
    if (bac11Res.status !== 200) throw new Error('Failed: Expected 200 demonstrating BAC #11');

    // Confirm Sarah is now listed in TEAM-1004 members
    const checkTeamRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-1004',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });
    const hasSarah = checkTeamRes.data.team.memberIds.includes(102);
    console.log(`   Confirmed Sarah Jenkins (102) added to TEAM-1004: ${hasSarah}`);
    if (!hasSarah) throw new Error('Failed: Member was not added to team');

    // 9. Confirm Alex's role has NOT changed
    const currentDb = readDB();
    const alexUser = currentDb.users.find(u => u.id === 101);
    console.log(`\n9. Alex Mercer DB Role verification: '${alexUser.role}' (Unchanged: ${alexUser.role === 'Employee'})`);
    if (alexUser.role !== 'Employee') throw new Error('Alex role modified!');

    // 10. Regression Testing: BAC #1 - BAC #10
    console.log('\n10. Running Regression Tests for BAC #1 through BAC #10...');

    // BAC #1 (BOLA/IDOR on document)
    const bac1 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/documents/DOC-5520',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });
    console.log(`   BAC #1 (DOC-5520 read by Alex): Status ${bac1.status} (Expected 200)`);
    if (bac1.status !== 200) throw new Error('BAC #1 regression failed');

    // BAC #2 (Horizontal Privilege Escalation on contact info)
    const bac2 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/employees/102/contact-info',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { phone: '+1 (415) 555-9999', deskLocation: 'Test Desk' });
    console.log(`   BAC #2 (Update Sarah contact by Alex): Status ${bac2.status} (Expected 200)`);
    if (bac2.status !== 200) throw new Error('BAC #2 regression failed');

    // BAC #3 (Vertical Privilege Escalation on admin user endpoint)
    const bac3 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/users/102',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { department: 'Product' });
    console.log(`   BAC #3 (Admin user update by Alex): Status ${bac3.status} (Expected 200)`);
    if (bac3.status !== 200) throw new Error('BAC #3 regression failed');

    // BAC #4 (Forced browsing to audit log)
    const bac4 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/admin/audit-log',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });
    console.log(`   BAC #4 (Audit log by Alex): Status ${bac4.status} (Expected 200)`);
    if (bac4.status !== 200) throw new Error('BAC #4 regression failed');

    // BAC #5 (Order cancellation)
    const bac5 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders/ORD-7940/cancel',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { reason: 'Regression test' });
    console.log(`   BAC #5 (Cancel Sarah order by Alex): Status ${bac5.status} (Expected 200)`);
    if (bac5.status !== 200) throw new Error('BAC #5 regression failed');

    // BAC #6 (Unauthorized download)
    const bac6 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/documents/DOC-5520/download',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });
    console.log(`   BAC #6 (Download Sarah document by Alex): Status ${bac6.status} (Expected 200)`);
    if (bac6.status !== 200) throw new Error('BAC #6 regression failed');

    // BAC #7 (Unauthorized delete)
    const bac7 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/documents/DOC-5101',
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });
    console.log(`   BAC #7 (Delete Sarah document by Alex): Status ${bac7.status} (Expected 200)`);
    if (bac7.status !== 200) throw new Error('BAC #7 regression failed');

    // BAC #8 (Cross-user preference modification)
    const bac8 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/employees/102/preferences',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { weeklyDigest: true });
    console.log(`   BAC #8 (Update Sarah preferences by Alex): Status ${bac8.status} (Expected 200)`);
    if (bac8.status !== 200) throw new Error('BAC #8 regression failed');

    // BAC #9 (HTTP Method Authorization Bypass)
    const bac9Put = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders/ORD-7920/status',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { status: 'Approved' });
    console.log(`   BAC #9 PUT (Alex updating Sarah order status): Status ${bac9Put.status} (Expected 403)`);

    const bac9Patch = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/orders/ORD-7920/status',
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { status: 'Approved' });
    console.log(`   BAC #9 PATCH (Alex updating Sarah order status): Status ${bac9Patch.status} (Expected 200)`);
    if (bac9Put.status !== 403 || bac9Patch.status !== 200) throw new Error('BAC #9 regression failed');

    // BAC #10 (Parameter-Based Authorization Flaw)
    const bac10Default = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/employee-summary',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });
    console.log(`   BAC #10 default (No accessLevel query): Status ${bac10Default.status} (Expected 403)`);

    const bac10Param = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/employee-summary?accessLevel=admin',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });
    console.log(`   BAC #10 with ?accessLevel=admin (Alex requesting): Status ${bac10Param.status} (Expected 200)`);
    if (bac10Default.status !== 403 || bac10Param.status !== 200) throw new Error('BAC #10 regression failed');

    console.log('\n=== ALL BAC #1 THROUGH BAC #11 TESTS PASSED SUCCESSFULLY! ===');

  } finally {
    // Restore pristine database state
    console.log('\nRestoring pristine database snapshot...');
    writeDB(dbSnapshot);
    console.log('Database restored successfully.');
  }
}

run().catch(err => {
  console.error('\nVerification FAILED:', err);
  process.exit(1);
});
