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
  console.log('--- STARTING BAC #9 VERIFICATION SUITE ---');

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

  // Test 1: Own-order status update works normally (Alex updates own order ORD-9118 via PUT)
  const alexOwnUpdate = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Processing' });
  console.log('1. Own-order update via PUT (ORD-9118):',
    alexOwnUpdate.statusCode === 200 && alexOwnUpdate.body.order?.status === 'Processing' ? 'PASS' : 'FAIL',
    `(Status: ${alexOwnUpdate.statusCode})`
  );

  // Restore ORD-9118 to Pending Approval
  await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Pending Approval' });

  // Test 2: Administrator status update works normally
  const adminUpdate = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Approved' });
  console.log('2. Administrator status update via PUT:',
    adminUpdate.statusCode === 200 && adminUpdate.body.order?.status === 'Approved' ? 'PASS' : 'FAIL',
    `(Status: ${adminUpdate.statusCode})`
  );

  // Restore ORD-9118
  await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Pending Approval' });

  // Test 3: Unauthenticated request returns 401
  const unauthPut = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/status', method: 'PUT',
    headers: { 'Content-Type': 'application/json' }
  }, { status: 'Approved' });
  const unauthPatch = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/status', method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, { status: 'Approved' });
  console.log('3. Unauthenticated requests return 401:');
  console.log('   - PUT:', unauthPut.statusCode === 401 ? 'PASS' : 'FAIL', `(Status: ${unauthPut.statusCode})`);
  console.log('   - PATCH:', unauthPatch.statusCode === 401 ? 'PASS' : 'FAIL', `(Status: ${unauthPatch.statusCode})`);

  // Test 4: Invalid status returns 400
  const invalidStatusPut = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'ArbitraryInvalidStatus' });
  const invalidStatusPatch = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/status', method: 'PATCH',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'ArbitraryInvalidStatus' });
  console.log('4. Invalid status returns 400:');
  console.log('   - PUT:', invalidStatusPut.statusCode === 400 ? 'PASS' : 'FAIL', `(Status: ${invalidStatusPut.statusCode})`);
  console.log('   - PATCH:', invalidStatusPatch.statusCode === 400 ? 'PASS' : 'FAIL', `(Status: ${invalidStatusPatch.statusCode})`);

  // Test 5: Nonexistent order returns 404
  const notFoundPut = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9999/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Approved' });
  const notFoundPatch = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9999/status', method: 'PATCH',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Approved' });
  console.log('5. Nonexistent order returns 404:');
  console.log('   - PUT:', notFoundPut.statusCode === 404 ? 'PASS' : 'FAIL', `(Status: ${notFoundPut.statusCode})`);
  console.log('   - PATCH:', notFoundPatch.statusCode === 404 ? 'PASS' : 'FAIL', `(Status: ${notFoundPatch.statusCode})`);

  // Test 6: Method authorization difference (Alex targeting Sarah's order ORD-7940)
  // PUT is properly protected -> 403 Forbidden
  const alexPutSarahOrder = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Delivered' });

  // PATCH intentionally lacks authorization -> 200 OK
  const alexPatchSarahOrder = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/status', method: 'PATCH',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Approved' });

  console.log('6. Method authorization difference:');
  console.log('   - PUT on Sarah order (Protected):', alexPutSarahOrder.statusCode === 403 ? 'PASS (403 Forbidden)' : 'FAIL', `(Status: ${alexPutSarahOrder.statusCode})`);
  console.log('   - PATCH on Sarah order (Bypass):', alexPatchSarahOrder.statusCode === 200 ? 'PASS (200 OK Bypass)' : 'FAIL', `(Status: ${alexPatchSarahOrder.statusCode})`);

  // Restore Sarah's order ORD-7940 to Pending Approval
  await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/status', method: 'PUT',
    headers: { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' }
  }, { status: 'Pending Approval' });

  // Test 7: Confirm BAC #1–#8 remain unchanged
  const bac1 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5520', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7a. BAC #1 (Document IDOR):', bac1.statusCode === 200 && bac1.body.document.ownerId === 102 ? 'PASS' : 'FAIL');

  const bac2 = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/contact-info', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { workPhone: '+1 (415) 555-0144' });
  console.log('7b. BAC #2 (Horizontal PE Contact Info):', bac2.statusCode === 200 && bac2.body.employee.id === 102 ? 'PASS' : 'FAIL');

  const bac3 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users/102', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { department: 'Product' });
  console.log('7c. BAC #3 (Vertical PE Admin User Update):', bac3.statusCode === 200 && bac3.body.user.department === 'Product' ? 'PASS' : 'FAIL');

  const bac4 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/audit-log', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7d. BAC #4 (Unprotected Audit Log):', bac4.statusCode === 200 && Array.isArray(bac4.body.auditLog) ? 'PASS' : 'FAIL');

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

  const bac6 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-8821/download', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7f. BAC #6 (Document Download):', bac6.statusCode === 200 && bac6.raw.includes('Q3 Architecture Review') ? 'PASS' : 'FAIL');

  const bac7 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-9999', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7g. BAC #7 (File Deletion 404 for invalid):', bac7.statusCode === 404 ? 'PASS' : 'FAIL');

  const bac8 = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/101/preferences', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { weeklyDigest: false });
  console.log('7h. BAC #8 (Preferences Update):', bac8.statusCode === 200 && bac8.body.preferences?.weeklyDigest === false ? 'PASS' : 'FAIL');

  // Test 8: Orders & Requisitions still loads correctly
  const ordersList = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('8. Orders list loads correctly:', ordersList.statusCode === 200 && Array.isArray(ordersList.body.orders) ? 'PASS' : 'FAIL');

  console.log('--- ALL BAC #9 VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(console.error);
