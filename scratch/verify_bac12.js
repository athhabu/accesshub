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
  console.log('=== STARTING BAC #12 & REGRESSION VERIFICATION ===\n');

  // Save database snapshot for restoration
  const dbSnapshot = JSON.parse(JSON.stringify(readDB()));

  try {
    // 1. Authenticate users
    console.log('1. Authenticating test personas...');
    const alexToken = await login('employee1@accesshub.local', 'Employee123!'); // ID: 101, Role: Employee
    const sarahToken = await login('employee2@accesshub.local', 'Employee123!'); // ID: 102, Role: Employee
    const adminToken = await login('admin@accesshub.local', 'Admin123!'); // ID: 1, Role: Administrator
    console.log('   Alex, Sarah, and James authenticated successfully.');

    // 2. Unauthenticated request -> 401
    console.log('\n2. Testing unauthenticated access to PUT /api/requests/:requestId/notes/:noteId...');
    const unauthRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-2001/notes/NOTE-3001',
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }, { content: 'Unauthenticated modification attempt.' });
    console.log(`   Status: ${unauthRes.status} (Expected 401)`);
    if (unauthRes.status !== 401) throw new Error('Failed: Expected 401 for unauthenticated request');

    // 3. Invalid Request ID -> 404
    console.log('\n3. Testing invalid Request ID...');
    const invalidReqRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-9999/notes/NOTE-3001',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { content: 'Valid content' });
    console.log(`   Status: ${invalidReqRes.status} (Expected 404)`);
    if (invalidReqRes.status !== 404) throw new Error('Failed: Expected 404 for nonexistent request');

    // 4. Invalid Note ID -> 404
    console.log('\n4. Testing invalid Note ID...');
    const invalidNoteRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-2001/notes/NOTE-9999',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { content: 'Valid content' });
    console.log(`   Status: ${invalidNoteRes.status} (Expected 404)`);
    if (invalidNoteRes.status !== 404) throw new Error('Failed: Expected 404 for nonexistent note');

    // 5. Content Validation: Missing content -> 400
    console.log('\n5. Testing missing content...');
    const missingContentRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-2001/notes/NOTE-3001',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, {});
    console.log(`   Status: ${missingContentRes.status}, Error: ${missingContentRes.data.error} (Expected 400)`);
    if (missingContentRes.status !== 400) throw new Error('Failed: Expected 400 for missing content');

    // 6. Content Validation: Whitespace-only -> 400
    console.log('\n6. Testing whitespace-only content...');
    const emptyContentRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-2001/notes/NOTE-3001',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { content: '     ' });
    console.log(`   Status: ${emptyContentRes.status}, Error: ${emptyContentRes.data.error} (Expected 400)`);
    if (emptyContentRes.status !== 400) throw new Error('Failed: Expected 400 for empty content');

    // 7. Content Validation: Excessively long (> 2000 chars) -> 400
    console.log('\n7. Testing excessively long content (>2000 chars)...');
    const longContent = 'A'.repeat(2500);
    const longContentRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-2001/notes/NOTE-3001',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { content: longContent });
    console.log(`   Status: ${longContentRes.status}, Error: ${longContentRes.data.error} (Expected 400)`);
    if (longContentRes.status !== 400) throw new Error('Failed: Expected 400 for long content');

    // 8. Legitimate owner modification -> 200
    console.log('\n8. Testing legitimate owner modifying their own request note...');
    // Alex Mercer (101) owns REQ-2001
    const ownerModRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-2001/notes/NOTE-3001',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { content: 'Legitimate update: Confirmed M3 Max RAM spec with Marcus.' });
    console.log(`   Status: ${ownerModRes.status}, Message: ${ownerModRes.data.message} (Expected 200)`);
    if (ownerModRes.status !== 200) throw new Error('Failed: Expected 200 for owner modification');

    // 9. Legitimate administrator modification -> 200
    console.log('\n9. Testing administrator modifying a request note...');
    const adminModRes = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-2002/notes/NOTE-3002',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    }, { content: 'Admin update: Requisition verified with enterprise finance.' });
    console.log(`   Status: ${adminModRes.status}, Message: ${adminModRes.data.message} (Expected 200)`);
    if (adminModRes.status !== 200) throw new Error('Failed: Expected 200 for admin modification');

    // 10. VULNERABLE BEHAVIOR (BAC #12):
    // Authenticated non-owner employee Alex Mercer (101) modifying Sarah Jenkins's (102) request note (NOTE-3002 on REQ-2002).
    console.log('\n10. Testing BAC #12: Non-owner employee modifying another employee\'s request note...');
    const bac12Content = 'Vulnerable cross-user edit: Updated procurement justification by non-owner.';
    const bac12Res = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/requests/REQ-2002/notes/NOTE-3002',
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, {
      content: bac12Content,
      // Attempting to modify immutable fields (should be ignored by backend):
      id: 'NOTE-HACKED',
      authorId: 999,
      ownerId: 999,
      status: 'Hacked'
    });
    console.log(`   Status: ${bac12Res.status} (Expected 200 - Vulnerable Authorization Omission)`);
    console.log(`   Response:`, bac12Res.data);
    if (bac12Res.status !== 200) throw new Error('Failed: Expected 200 demonstrating BAC #12');

    // Verify note content in DB
    const checkDb = readDB();
    const targetReq = checkDb.requests.find(r => r.id === 'REQ-2002');
    const targetNote = targetReq.notes.find(n => n.id === 'NOTE-3002');
    console.log(`   Confirmed note content updated: "${targetNote.content}"`);
    console.log(`   Confirmed note ID remained NOTE-3002: ${targetNote.id === 'NOTE-3002'}`);
    console.log(`   Confirmed authorId remained 102: ${targetNote.authorId === 102}`);
    console.log(`   Confirmed request ownerId remained 102: ${targetReq.ownerId === 102}`);

    if (targetNote.content !== bac12Content) throw new Error('Note content was not updated');
    if (targetNote.id !== 'NOTE-3002' || targetNote.authorId !== 102 || targetReq.ownerId !== 102) {
      throw new Error('Immutable fields were modified!');
    }

    // Verify audit log entry was created
    const latestAudit = (checkDb.auditLog || [])[0];
    console.log(`   Audit log entry: ${latestAudit ? `${latestAudit.action} by ${latestAudit.actor} (${latestAudit.status})` : 'None'}`);
    if (!latestAudit || latestAudit.action !== 'Request Note Modification') {
      throw new Error('Audit log entry missing');
    }

    // 11. Confirm Alex's role has NOT changed
    const alexUser = checkDb.users.find(u => u.id === 101);
    console.log(`\n11. Alex Mercer DB Role verification: '${alexUser.role}' (Unchanged: ${alexUser.role === 'Employee'})`);
    if (alexUser.role !== 'Employee') throw new Error('Alex role modified!');

    // 12. Regression Testing: BAC #1 - BAC #11
    console.log('\n12. Running Regression Tests for BAC #1 through BAC #11...');

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
    console.log(`   BAC #9 (PUT 403 / PATCH 200): PUT ${bac9Put.status}, PATCH ${bac9Patch.status}`);
    if (bac9Put.status !== 403 || bac9Patch.status !== 200) throw new Error('BAC #9 regression failed');

    // BAC #10 (Parameter-Based Authorization Flaw)
    const bac10Default = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/employee-summary',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });

    const bac10Param = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/reports/employee-summary?accessLevel=admin',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${alexToken}` }
    });
    console.log(`   BAC #10 (Default 403 / ?accessLevel=admin 200): Default ${bac10Default.status}, Param ${bac10Param.status}`);
    if (bac10Default.status !== 403 || bac10Param.status !== 200) throw new Error('BAC #10 regression failed');

    // BAC #11 (Unauthorized team membership modification)
    const bac11 = await requestWithRetry({
      hostname: 'localhost',
      port: 3000,
      path: '/api/teams/TEAM-1004/members',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${alexToken}`
      }
    }, { employeeId: 102 });
    console.log(`   BAC #11 (Alex adding Sarah to TEAM-1004): Status ${bac11.status} (Expected 200)`);
    if (bac11.status !== 200) throw new Error('BAC #11 regression failed');

    console.log('\n=== ALL BAC #1 THROUGH BAC #12 TESTS PASSED SUCCESSFULLY! ===');

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
