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
  console.log('--- STARTING BAC #7 VERIFICATION SUITE ---');

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

  // Test 1: Alex can delete one of his own documents (DOC-7011)
  const alexDeleteOwn = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-7011', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('1. Alex deletes own document (DOC-7011):',
    alexDeleteOwn.statusCode === 200 && alexDeleteOwn.body.documentId === 'DOC-7011' ? 'PASS' : 'FAIL',
    `(Status: ${alexDeleteOwn.statusCode}, Response: ${JSON.stringify(alexDeleteOwn.body)})`
  );

  // Test 2: Sarah can delete one of her own documents (DOC-5101)
  const sarahDeleteOwn = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5101', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${sarahToken}` }
  });
  console.log('2. Sarah deletes own document (DOC-5101):',
    sarahDeleteOwn.statusCode === 200 && sarahDeleteOwn.body.documentId === 'DOC-5101' ? 'PASS' : 'FAIL',
    `(Status: ${sarahDeleteOwn.statusCode}, Response: ${JSON.stringify(sarahDeleteOwn.body)})`
  );

  // Test 3: Administrator can delete a document (DOC-1099)
  const adminDelete = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-1099', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  console.log('3. Administrator deletes document (DOC-1099):',
    adminDelete.statusCode === 200 && adminDelete.body.documentId === 'DOC-1099' ? 'PASS' : 'FAIL',
    `(Status: ${adminDelete.statusCode})`
  );

  // Test 4: Unauthenticated deletion returns 401
  const unauthDelete = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-8821', method: 'DELETE'
  });
  console.log('4. Unauthenticated deletion returns 401:',
    unauthDelete.statusCode === 401 ? 'PASS' : 'FAIL',
    `(Status: ${unauthDelete.statusCode})`
  );

  // Test 5: Nonexistent document returns 404 (and already deleted document returns 404)
  const notFoundDelete = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-9999', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  const alreadyDeleted = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-7011', method: 'DELETE',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('5. Nonexistent / already-deleted returns 404:');
  console.log('   - DOC-9999:', notFoundDelete.statusCode === 404 ? 'PASS' : 'FAIL', `(Status: ${notFoundDelete.statusCode})`);
  console.log('   - Already deleted DOC-7011:', alreadyDeleted.statusCode === 404 ? 'PASS' : 'FAIL', `(Status: ${alreadyDeleted.statusCode})`);

  // Test 6: Application starts and responds correctly
  const healthCheck = await request({
    hostname: 'localhost', port: 3000, path: '/api/auth/me', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('6. Application responds correctly (/api/auth/me):', healthCheck.statusCode === 200 ? 'PASS' : 'FAIL');

  // Test 7: BAC #1–#6 remain unchanged
  const bac1 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-5520', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7a. BAC #1 (Document IDOR):', bac1.statusCode === 200 && bac1.body.document.ownerId === 102 ? 'PASS' : 'FAIL');

  const bac2 = await request({
    hostname: 'localhost', port: 3000, path: '/api/employees/102/contact-info', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { workPhone: '+1 (415) 555-0144' });
  console.log('7b. BAC #2 (Horizontal PE):', bac2.statusCode === 200 && bac2.body.employee.id === 102 ? 'PASS' : 'FAIL');

  const bac3 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/users/102', method: 'PUT',
    headers: { 'Authorization': `Bearer ${alexToken}`, 'Content-Type': 'application/json' }
  }, { department: 'Product' });
  console.log('7c. BAC #3 (Vertical PE):', bac3.statusCode === 200 && bac3.body.user.department === 'Product' ? 'PASS' : 'FAIL');

  const bac4 = await request({
    hostname: 'localhost', port: 3000, path: '/api/admin/audit-log', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7d. BAC #4 (Audit Log Unprotected):', bac4.statusCode === 200 && Array.isArray(bac4.body.auditLog) ? 'PASS' : 'FAIL');

  const bac5 = await request({
    hostname: 'localhost', port: 3000, path: '/api/orders/ORD-7940/cancel', method: 'POST',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7e. BAC #5 (Sensitive Action Cancel):', bac5.statusCode === 200 && bac5.body.order.status === 'Cancelled' ? 'PASS' : 'FAIL');

  const bac6 = await request({
    hostname: 'localhost', port: 3000, path: '/api/documents/DOC-8821/download', method: 'GET',
    headers: { 'Authorization': `Bearer ${alexToken}` }
  });
  console.log('7f. BAC #6 (Document Download):', bac6.statusCode === 200 && bac6.raw.includes('Q3 Architecture Review') ? 'PASS' : 'FAIL');

  // Restore DB state: restore the deleted documents & order status
  const dbPath = path.join(__dirname, '..', 'data', 'database.json');
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

  // Restore order ORD-7940
  const o = db.orders.find(item => item.id === 'ORD-7940');
  if (o) {
    o.status = 'Pending Approval';
    o.progress = 'Ordered';
    o.progressStep = 1;
    delete o.cancelledAt;
    delete o.cancelledBy;
  }

  // Restore deleted test documents if missing
  const docAlex = {
    id: 'DOC-7011',
    name: 'Kubernetes_Service_Mesh_Notes.md',
    ownerId: 101,
    ownerName: 'Alex Mercer',
    ownerEmpId: 'EMP-10482',
    type: 'MD',
    size: '1.1 MB',
    category: 'Engineering',
    status: 'Approved',
    version: 'Draft v0.9',
    uploadedAt: 'Oct 23, 2024',
    description: 'Internal engineering scratch notes on Istio service mesh latency benchmarks.',
    content: 'Kubernetes Service Mesh Benchmark Notes\n\nIstio sidecar latency measurements show p99 < 4ms across internal microservice pods.'
  };
  const docSarah = {
    id: 'DOC-5101',
    name: 'Q3_Customer_Feedback_Summary.docx',
    ownerId: 102,
    ownerName: 'Sarah Jenkins',
    ownerEmpId: 'EMP-10401',
    type: 'DOCX',
    size: '2.3 MB',
    category: 'Product',
    status: 'Approved',
    version: 'v1.0',
    uploadedAt: 'Oct 21, 2024',
    description: 'Aggregated user interview insights and feature request prioritization.',
    content: 'Q3 Customer Feedback & Usability Summary\n\nTop user requested improvements: single sign-on federation and automated hardware approval workflows.'
  };
  const docAdmin = {
    id: 'DOC-1099',
    name: 'IT_Asset_Depreciation_Q3.pdf',
    ownerId: 1,
    ownerName: 'James Thornton',
    ownerEmpId: 'EMP-10640',
    type: 'PDF',
    size: '1.8 MB',
    category: 'Security',
    status: 'Approved',
    version: 'Audit v1',
    uploadedAt: 'Oct 19, 2024',
    description: 'Quarterly IT asset depreciation and lifecycle audit schedule.',
    content: 'IT Infrastructure Asset Lifecycle Schedule - All Tier 1 equipment fully compliant with 3-year refresh cycle.'
  };

  if (!db.documents.find(d => d.id === 'DOC-7011')) db.documents.push(docAlex);
  if (!db.documents.find(d => d.id === 'DOC-5101')) db.documents.push(docSarah);
  if (!db.documents.find(d => d.id === 'DOC-1099')) db.documents.push(docAdmin);

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
  console.log('Database restored for future lab testing');

  console.log('--- ALL BAC #7 VERIFICATION TESTS COMPLETED ---');
}

runTests().catch(console.error);
