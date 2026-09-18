const http = require('http');

async function request(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch(e) {}
        resolve({ statusCode: res.statusCode, headers: res.headers, body: json || data });
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
  console.log('--- STARTING BAC #5 VERIFICATION SUITE ---');

  // Test 1: Alex login
  const alexLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'employee1@accesshub.local', password: 'Employee123!' });
  const alexToken = alexLogin.body.token;
  console.log('1. Alex login:', alexLogin.statusCode === 200 && alexLogin.body.user.role === 'Employee' ? 'PASS' : 'FAIL');

  // Test 2: Sarah login
  const sarahLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'employee2@accesshub.local', password: 'Employee123!' });
  const sarahToken = sarahLogin.body.token;
  console.log('2. Sarah login:', sarahLogin.statusCode === 200 && sarahLogin.body.user.role === 'Employee' ? 'PASS' : 'FAIL');

  // Test 3: James login
  const adminLogin = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'admin@accesshub.local', password: 'Admin123!' });
  const adminToken = adminLogin.body.token;
  console.log('3. James admin login:', adminLogin.statusCode === 200 && adminLogin.body.user.role === 'Administrator' ? 'PASS' : 'FAIL');

  // Test 4: Alex cancels his own eligible order (ORD-9118)
  const alexOwnCancel = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('4. Alex cancels own order (ORD-9118):', alexOwnCancel.statusCode === 200 && alexOwnCancel.body.order.status === 'Cancelled' ? 'PASS' : 'FAIL', `(status: ${alexOwnCancel.statusCode}, orderStatus: ${alexOwnCancel.body?.order?.status})`);

  // Test 5: Sarah cancels her own eligible order (ORD-7935)
  const sarahOwnCancel = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7935/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${sarahToken}` }
  });
  console.log('5. Sarah cancels own order (ORD-7935):', sarahOwnCancel.statusCode === 200 && sarahOwnCancel.body.order.status === 'Cancelled' ? 'PASS' : 'FAIL', `(status: ${sarahOwnCancel.statusCode}, orderStatus: ${sarahOwnCancel.body?.order?.status})`);

  // Test 6: Alex intentionally cancels Sarah's eligible order (ORD-7940)
  const alexCancelSarahOrder = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('6. Alex cancels Sarah order (ORD-7940):', alexCancelSarahOrder.statusCode === 200 && alexCancelSarahOrder.body.order.status === 'Cancelled' && alexCancelSarahOrder.body.order.ownerId === 102 ? 'PASS (VULNERABLE)' : 'FAIL', `(status: ${alexCancelSarahOrder.statusCode}, ownerId: ${alexCancelSarahOrder.body?.order?.ownerId}, orderStatus: ${alexCancelSarahOrder.body?.order?.status})`);

  // Test 7: Sarah intentionally cancels Alex's eligible order (ORD-9055)
  const sarahCancelAlexOrder = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9055/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${sarahToken}` }
  });
  console.log('7. Sarah cancels Alex order (ORD-9055):', sarahCancelAlexOrder.statusCode === 200 && sarahCancelAlexOrder.body.order.status === 'Cancelled' && sarahCancelAlexOrder.body.order.ownerId === 101 ? 'PASS (VULNERABLE)' : 'FAIL', `(status: ${sarahCancelAlexOrder.statusCode}, ownerId: ${sarahCancelAlexOrder.body?.order?.ownerId}, orderStatus: ${sarahCancelAlexOrder.body?.order?.status})`);

  // Test 8: Unauthenticated access returns 401
  const unauthCancel = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9204/cancel', method: 'POST'
  });
  console.log('8. Unauthenticated request rejected:', unauthCancel.statusCode === 401 ? 'PASS' : 'FAIL', `(status: ${unauthCancel.statusCode})`);

  // Test 9: Invalid order ID returns 404
  const notFoundCancel = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9999/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('9. Invalid order ID returns 404:', notFoundCancel.statusCode === 404 ? 'PASS' : 'FAIL', `(status: ${notFoundCancel.statusCode})`);

  // Test 10: Non-cancellable orders return 400 (e.g. Delivered ORD-7811 or already Cancelled ORD-9118)
  const deliveredCancel = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7811/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  const alreadyCancelled = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-9118/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('10. Non-cancellable orders return 400:');
  console.log('    - Delivered order (ORD-7811):', deliveredCancel.statusCode === 400 ? 'PASS' : 'FAIL', `(status: ${deliveredCancel.statusCode}, msg: ${deliveredCancel.body?.error})`);
  console.log('    - Already cancelled (ORD-9118):', alreadyCancelled.statusCode === 400 ? 'PASS' : 'FAIL', `(status: ${alreadyCancelled.statusCode}, msg: ${alreadyCancelled.body?.error})`);

  // Test 11: BAC #1 remains unchanged (Document IDOR)
  const alexDoc = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5520', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('11. BAC #1 (Document IDOR):', alexDoc.statusCode === 200 && alexDoc.body.document.ownerId === 102 ? 'PASS (EXPLOITABLE)' : 'FAIL');

  // Test 12: BAC #2 remains unchanged (Horizontal PE via contact-info)
  const alexContact = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/contact-info', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { workPhone: '+1 (415) 555-0144', deskLocation: 'Floor 2, Pod C - Desk 12' });
  console.log('12. BAC #2 (Horizontal PE):', alexContact.statusCode === 200 && alexContact.body.employee.id === 102 ? 'PASS (EXPLOITABLE)' : 'FAIL');

  // Test 13: BAC #3 remains unchanged (Vertical PE via PUT /api/admin/users/:id)
  const alexAdminPut = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users/102', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { department: 'Product' });
  console.log('13. BAC #3 (Vertical PE):', alexAdminPut.statusCode === 200 && alexAdminPut.body.user.department === 'Product' ? 'PASS (EXPLOITABLE)' : 'FAIL');

  // Test 14: BAC #4 remains unchanged (Forced Browsing / Unprotected Audit Log)
  const alexAudit = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/audit-log', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('14. BAC #4 (Unprotected Audit Log):', alexAudit.statusCode === 200 && Array.isArray(alexAudit.body.auditLog) ? 'PASS (EXPLOITABLE)' : 'FAIL');

  // Test 15: Other Admin endpoints remain protected
  const alexAdminList = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('15. Other admin endpoints protected:', alexAdminList.statusCode === 403 ? 'PASS' : 'FAIL', `(status: ${alexAdminList.statusCode})`);

  console.log('--- ALL BAC #5 VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(console.error);
