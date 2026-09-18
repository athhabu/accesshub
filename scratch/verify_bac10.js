const http = require('http');
const path = require('path');
const fs = require('fs');

async function request(options, postData, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => data += chunk);
          res.on('end', () => {
            let json = null;
            try { json = JSON.parse(data); } catch(e) {}
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: json || data,
              raw: data
            });
          });
        });
        req.on('error', reject);
        if (postData) {
          req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
        }
        req.end();
      });
    } catch (err) {
      if (attempt === retries || (err.code !== 'ECONNRESET' && err.code !== 'ECONNREFUSED')) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }
}

async function runTests() {
  console.log('--- STARTING BAC #10 VERIFICATION SUITE ---');

  // Test 0: Logins
  const alexLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'employee1@accesshub.local', password: 'Employee123!' });
  const alexToken = alexLogin.body.token;

  const sarahLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'employee2@accesshub.local', password: 'Employee123!' });
  const sarahToken = sarahLogin.body.token;

  const adminLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@accesshub.local', password: 'Admin123!' });
  const adminToken = adminLogin.body.token;

  console.log('Logins valid:', alexToken && sarahToken && adminToken ? 'PASS' : 'FAIL');

  // Test 1: Administrator accesses report normally
  const adminReport = await request({
    hostname: 'localhost', port: 3000, path: '/api/reports/employee-summary?accessLevel=admin', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('1. Administrator report access:',
    adminReport.statusCode === 200 && Array.isArray(adminReport.body?.report) ? 'PASS' : 'FAIL',
    `(Status: ${adminReport.statusCode}, Total: ${adminReport.body?.totalEmployees})`
  );

  // Test 2: Unauthenticated access returns 401
  const unauthReport = await request({
    hostname: 'localhost', port: 3000, path: '/api/reports/employee-summary?accessLevel=admin', method: 'GET'
  });
  console.log('2. Unauthenticated access returns 401:',
    unauthReport.statusCode === 401 ? 'PASS' : 'FAIL',
    `(Status: ${unauthReport.statusCode})`
  );

  // Test 3: Invalid / non-admin accessLevel values return 403
  const missingLevel = await request({
    hostname: 'localhost', port: 3000, path: '/api/reports/employee-summary', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  const employeeLevel = await request({
    hostname: 'localhost', port: 3000, path: '/api/reports/employee-summary?accessLevel=employee', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  const randomLevel = await request({
    hostname: 'localhost', port: 3000, path: '/api/reports/employee-summary?accessLevel=user', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('3. Non-admin accessLevel returns 403:');
  console.log('   - Omitted accessLevel:', missingLevel.statusCode === 403 ? 'PASS (403)' : 'FAIL');
  console.log('   - accessLevel=employee:', employeeLevel.statusCode === 403 ? 'PASS (403)' : 'FAIL');
  console.log('   - accessLevel=user:', randomLevel.statusCode === 403 ? 'PASS (403)' : 'FAIL');

  // Test 4: Confirm authorization decision trusts client parameter (Alex with accessLevel=admin)
  const alexBypassReport = await request({
    hostname: 'localhost', port: 3000, path: '/api/reports/employee-summary?accessLevel=admin', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('4. Parameter-based authorization bypass (Alex with accessLevel=admin):',
    alexBypassReport.statusCode === 200 && Array.isArray(alexBypassReport.body?.report) ? 'PASS (VULNERABLE)' : 'FAIL',
    `(Status: ${alexBypassReport.statusCode}, Total: ${alexBypassReport.body?.totalEmployees})`
  );

  // Test 5: Confirm actual database role of employees has NOT changed
  const dbPath = path.join(__dirname, '..', 'data', 'database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const alexInDb = db.users.find(u => u.id === 101);
  const sarahInDb = db.users.find(u => u.id === 102);
  console.log('5. Actual employee database roles unchanged:');
  console.log('   - Alex role in DB:', alexInDb.role === 'Employee' ? 'PASS (Employee)' : 'FAIL');
  console.log('   - Sarah role in DB:', sarahInDb.role === 'Employee' ? 'PASS (Employee)' : 'FAIL');

  // Test 6: Confirm BAC #1–#9 remain unchanged
  // BAC #1: Document preview IDOR
  const bac1 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5520', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('6a. BAC #1 (Document IDOR):', bac1.statusCode === 200 && bac1.body.document.ownerId === 102 ? 'PASS' : 'FAIL');

  // BAC #2: Horizontal PE Contact Info
  const bac2 = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/contact-info', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { workPhone: '+1 (415) 555-0144' });
  console.log('6b. BAC #2 (Horizontal PE Contact Info):', bac2.statusCode === 200 && bac2.body.employee.id === 102 ? 'PASS' : 'FAIL');

  // BAC #3: Vertical PE User Update
  const bac3 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users/102', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { department: 'Product' });
  console.log('6c. BAC #3 (Vertical PE Admin User Update):', bac3.statusCode === 200 && bac3.body.user.department === 'Product' ? 'PASS' : 'FAIL');

  // BAC #4: Forced Browsing Audit Log
  const bac4 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/audit-log', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('6d. BAC #4 (Unprotected Audit Log):', bac4.statusCode === 200 && Array.isArray(bac4.body.auditLog) ? 'PASS' : 'FAIL');

  // BAC #5: Requisition Cancellation
  const bac5 = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('6e. BAC #5 (Order Cancellation):', bac5.statusCode === 200 && bac5.body.order.status === 'Cancelled' ? 'PASS' : 'FAIL');

  // Reset ORD-7940
  const o = db.orders.find(item => item.id === 'ORD-7940');
  if (o) {
    o.status = 'Pending Approval';
    o.progress = 'Ordered';
    o.progressStep = 1;
    delete o.cancelledAt;
    delete o.cancelledBy;
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  }

  // BAC #6: File Download
  const bac6 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-8821/download', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('6f. BAC #6 (Document Download):', bac6.statusCode === 200 && bac6.raw.includes('Q3 Architecture Review') ? 'PASS' : 'FAIL');

  // BAC #7: File Deletion 404 for nonexistent
  const bac7 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-9999', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('6g. BAC #7 (File Deletion 404 for invalid):', bac7.statusCode === 404 ? 'PASS' : 'FAIL');

  // BAC #8: Preferences Update
  const bac8 = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/101/preferences', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { weeklyDigest: false });
  console.log('6h. BAC #8 (Preferences Update):', bac8.statusCode === 200 && bac8.body.preferences?.weeklyDigest === false ? 'PASS' : 'FAIL');

  // BAC #9: Method Authorization Difference
  const bac9Put = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Delivered' });
  const bac9Patch = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/status', method: 'PATCH',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Approved' });
  console.log('6i. BAC #9 (HTTP Method Authorization Difference):');
  console.log('    - PUT Sarah order (Protected):', bac9Put.statusCode === 403 ? 'PASS (403)' : 'FAIL');
  console.log('    - PATCH Sarah order (Bypass):', bac9Patch.statusCode === 200 ? 'PASS (200)' : 'FAIL');

  // Reset ORD-7940 back to Pending Approval
  await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Pending Approval' });

  // Test 7 & 8: App starts and admin/employee pages respond
  const authMe = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  const adminUsers = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users', method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('7 & 8. Core application & Admin Panel health:');
  console.log('       - Employee session (/api/auth/me):', authMe.statusCode === 200 ? 'PASS' : 'FAIL');
  console.log('       - Admin panel data (/api/admin/users):', adminUsers.statusCode === 200 ? 'PASS' : 'FAIL');

  console.log('--- ALL BAC #10 VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(console.error);
