const http = require('http');
const path = require('path');
const fs = require('fs');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
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
}

async function runTests() {
  console.log('--- STARTING BAC #8 VERIFICATION SUITE ---');

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

  // Test 1: Alex updates own preferences
  const alexOwnPref = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/101/preferences', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, {
    emailNotifications: true,
    securityAlerts: true,
    weeklyDigest: true,
    desktopNotifications: false
  });
  console.log('1. Alex updates own preferences:',
    alexOwnPref.statusCode === 200 &&
    alexOwnPref.body.preferences?.weeklyDigest === true &&
    alexOwnPref.body.preferences?.desktopNotifications === false ? 'PASS' : 'FAIL',
    `(Status: ${alexOwnPref.statusCode}, Response: ${JSON.stringify(alexOwnPref.body?.preferences)})`
  );

  // Restore Alex's original preferences
  await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/101/preferences', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, {
    emailNotifications: true,
    securityAlerts: true,
    weeklyDigest: false,
    desktopNotifications: true
  });

  // Test 2: Sarah updates own preferences
  const sarahOwnPref = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/preferences', method: 'PUT',
    headers: { 'Authorization': `Bearer ${sarahToken}`, 'Content-Type': 'application/json' }
  }, {
    emailNotifications: true,
    securityAlerts: false,
    weeklyDigest: true,
    desktopNotifications: false
  });
  console.log('2. Sarah updates own preferences:',
    sarahOwnPref.statusCode === 200 &&
    sarahOwnPref.body.preferences?.emailNotifications === true &&
    sarahOwnPref.body.preferences?.securityAlerts === false ? 'PASS' : 'FAIL',
    `(Status: ${sarahOwnPref.statusCode}, Response: ${JSON.stringify(sarahOwnPref.body?.preferences)})`
  );

  // Restore Sarah's original preferences
  await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/preferences', method: 'PUT',
    headers: { 'Authorization': `Bearer ${sarahToken}`, 'Content-Type': 'application/json' }
  }, {
    emailNotifications: false,
    securityAlerts: true,
    weeklyDigest: true,
    desktopNotifications: false
  });

  // Test 3: Administrator functionality continues working (Admin updates an employee's preferences)
  const adminPref = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/preferences', method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, {
    securityAlerts: true
  });
  console.log('3. Administrator updates employee preferences:',
    adminPref.statusCode === 200 ? 'PASS' : 'FAIL',
    `(Status: ${adminPref.statusCode})`
  );

  // Test 4: Unauthenticated requests return 401
  const unauthPref = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/101/preferences', method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, {
    emailNotifications: false
  });
  console.log('4. Unauthenticated request returns 401:',
    unauthPref.statusCode === 401 ? 'PASS' : 'FAIL',
    `(Status: ${unauthPref.statusCode})`
  );

  // Test 5: Nonexistent employee IDs return 404
  const notFoundPref = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/9999/preferences', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, {
    emailNotifications: false
  });
  console.log('5. Nonexistent employee ID returns 404:',
    notFoundPref.statusCode === 404 ? 'PASS' : 'FAIL',
    `(Status: ${notFoundPref.statusCode})`
  );

  // Test 6: Confirm endpoint intentionally lacks target-user authorization check
  // (Code inspection verified: req.user.id !== targetId check is omitted)
  const serverCode = fs.readFileSync(path.join(__dirname, '..', 'server', 'routes', 'api.js'), 'utf8');
  const hasPrefRoute = serverCode.includes('/employees/:id/preferences');
  const hasAuthCheck = serverCode.includes("req.user.id !== targetId") || serverCode.includes("req.user.id !== req.params.id");
  console.log('6. Route present and lacks authorization check:',
    hasPrefRoute && !hasAuthCheck ? 'PASS (INTENTIONALLY VULNERABLE)' : 'FAIL'
  );

  // Test 7: Confirm BAC #1–#7 remain unchanged
  // BAC #1: Document preview IDOR
  const bac1 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5520', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7a. BAC #1 (Document IDOR):', bac1.statusCode === 200 && bac1.body.document.ownerId === 102 ? 'PASS' : 'FAIL');

  // BAC #2: Horizontal PE Contact Info
  const bac2 = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/contact-info', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { workPhone: '+1 (415) 555-0144' });
  console.log('7b. BAC #2 (Horizontal PE Contact Info):', bac2.statusCode === 200 && bac2.body.employee.id === 102 ? 'PASS' : 'FAIL');

  // BAC #3: Vertical PE User Update
  const bac3 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users/102', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { department: 'Product' });
  console.log('7c. BAC #3 (Vertical PE Admin User Update):', bac3.statusCode === 200 && bac3.body.user.department === 'Product' ? 'PASS' : 'FAIL');

  // BAC #4: Forced Browsing Audit Log
  const bac4 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/audit-log', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7d. BAC #4 (Unprotected Audit Log):', bac4.statusCode === 200 && Array.isArray(bac4.body.auditLog) ? 'PASS' : 'FAIL');

  // BAC #5: Requisition Cancellation
  const bac5 = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7e. BAC #5 (Order Cancellation):', bac5.statusCode === 200 && bac5.body.order.status === 'Cancelled' ? 'PASS' : 'FAIL');

  // Reset ORD-7940
  const dbPath = path.join(__dirname, '..', 'data', 'database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
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
  console.log('7f. BAC #6 (Document Download):', bac6.statusCode === 200 && bac6.raw.includes('Q3 Architecture Review') ? 'PASS' : 'FAIL');

  // BAC #7: File Deletion endpoint exists and unauth rejected
  const bac7 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-9999', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7g. BAC #7 (File Deletion 404 for invalid):', bac7.statusCode === 404 ? 'PASS' : 'FAIL');

  // Test 8: Profile page endpoint works
  const profileMe = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('8. Profile /api/auth/me works:',
    profileMe.statusCode === 200 &&
    profileMe.body.user.preferences !== undefined ? 'PASS' : 'FAIL'
  );

  console.log('--- ALL BAC #8 VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(console.error);
