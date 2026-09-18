const http = require('http');

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
  console.log('--- STARTING BAC #6 VERIFICATION SUITE ---');

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

  console.log('Logins:', alexToken && sarahToken && adminToken ? 'PASS' : 'FAIL');

  // Test 1: Alex can download his own document (DOC-8821)
  const alexOwnDoc = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-8821/download', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('1. Alex downloads own document (DOC-8821):',
    alexOwnDoc.statusCode === 200 &&
    alexOwnDoc.headers['content-disposition']?.includes('Q3_Architecture_Review.pdf') &&
    alexOwnDoc.raw.includes('Q3 Architecture Review') ? 'PASS' : 'FAIL',
    `(Status: ${alexOwnDoc.statusCode}, Disposition: ${alexOwnDoc.headers['content-disposition']})`
  );

  // Test 2: Sarah can download her own document (DOC-5520)
  const sarahOwnDoc = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5520/download', method: 'GET',
    headers: { 'Authorization': `Bearer ${sarahToken}` }
  });
  console.log('2. Sarah downloads own document (DOC-5520):',
    sarahOwnDoc.statusCode === 200 &&
    sarahOwnDoc.headers['content-disposition']?.includes('Product_Roadmap_2025_Confidential.pdf') &&
    sarahOwnDoc.raw.includes('Product Roadmap 2025') ? 'PASS' : 'FAIL',
    `(Status: ${sarahOwnDoc.statusCode}, Disposition: ${sarahOwnDoc.headers['content-disposition']})`
  );

  // Test 3: Unauthenticated request is rejected (401)
  const unauthDoc = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-8821/download', method: 'GET'
  });
  console.log('3. Unauthenticated request rejected (401):', unauthDoc.statusCode === 401 ? 'PASS' : 'FAIL', `(Status: ${unauthDoc.statusCode})`);

  // Nonexistent document returns 404
  const notFoundDoc = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-9999/download', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('   Nonexistent document returns 404:', notFoundDoc.statusCode === 404 ? 'PASS' : 'FAIL', `(Status: ${notFoundDoc.statusCode})`);

  // Test 4: Download endpoint does not perform an ownership check
  // Alex (101) downloads Sarah's (102) document DOC-5520
  const alexDownloadSarahDoc = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5520/download', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('4. Download lacks ownership check (Alex downloads Sarah DOC-5520):',
    alexDownloadSarahDoc.statusCode === 200 &&
    alexDownloadSarahDoc.raw.includes('Product Roadmap 2025') ? 'PASS (VULNERABLE)' : 'FAIL',
    `(Status: ${alexDownloadSarahDoc.statusCode})`
  );

  // Sarah (102) downloads Alex's (101) document DOC-8821
  const sarahDownloadAlexDoc = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-8821/download', method: 'GET',
    headers: { 'Authorization': `Bearer ${sarahToken}` }
  });
  console.log('   Download lacks ownership check (Sarah downloads Alex DOC-8821):',
    sarahDownloadAlexDoc.statusCode === 200 &&
    sarahDownloadAlexDoc.raw.includes('Q3 Architecture Review') ? 'PASS (VULNERABLE)' : 'FAIL',
    `(Status: ${sarahDownloadAlexDoc.statusCode})`
  );

  // Test 5: Existing BAC #1–#5 implementations remain unchanged
  // BAC #1: Document IDOR preview
  const bac1 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5520', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('5a. BAC #1 (Document IDOR):', bac1.statusCode === 200 && bac1.body.document.ownerId === 102 ? 'PASS' : 'FAIL');

  // BAC #2: Horizontal PE contact-info
  const bac2 = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/contact-info', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { workPhone: '+1 (415) 555-0144' });
  console.log('5b. BAC #2 (Horizontal PE):', bac2.statusCode === 200 && bac2.body.employee.id === 102 ? 'PASS' : 'FAIL');

  // BAC #3: Vertical PE user modification
  const bac3 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users/102', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { department: 'Product' });
  console.log('5c. BAC #3 (Vertical PE):', bac3.statusCode === 200 && bac3.body.user.department === 'Product' ? 'PASS' : 'FAIL');

  // BAC #4: Forced browsing audit-log
  const bac4 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/audit-log', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('5d. BAC #4 (Audit Log Unprotected):', bac4.statusCode === 200 && Array.isArray(bac4.body.auditLog) ? 'PASS' : 'FAIL');

  // BAC #5: Sensitive business action cancel order
  const bac5 = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('5e. BAC #5 (Sensitive Action Cancel):', bac5.statusCode === 200 && bac5.body.order.status === 'Cancelled' ? 'PASS' : 'FAIL');

  // Restore Sarah's test order status to Pending Approval
  const path = require('path');
  const dbPath = path.join(__dirname, '..', 'data', 'database.json');
  const db = JSON.parse(require('fs').readFileSync(dbPath, 'utf8'));
  const o = db.orders.find(item => item.id === 'ORD-7940');
  if (o) {
    o.status = 'Pending Approval';
    o.progress = 'Ordered';
    o.progressStep = 1;
    require('fs').writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  }

  // Test 6: Existing portal functions work
  const userList = await request({
    hostname: 'localhost', port: 3000, path: '/api/users', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  const orderList = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  const protectedAdmin = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('6. Portal functionality:');
  console.log('   - Directory listing (/api/users):', userList.statusCode === 200 ? 'PASS' : 'FAIL');
  console.log('   - Orders listing (/api/orders):', orderList.statusCode === 200 ? 'PASS' : 'FAIL');
  console.log('   - Protected admin route (/api/admin/users) returns 403 for employee:', protectedAdmin.statusCode === 403 ? 'PASS' : 'FAIL');

  console.log('--- ALL BAC #6 VERIFICATION TESTS COMPLETE ---');
}

runTests().catch(console.error);
