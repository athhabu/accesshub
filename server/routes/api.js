const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { readDB, writeDB } = require('../db');
const { generateToken, authenticateToken, requireAdmin } = require('../auth');

function sanitizeUser(user) {
  if (!user) return null;
  const { passwordHash, plainPasswordForLab, ...safeUser } = user;
  return safeUser;
}

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide both work email and password.' });
  }

  const db = readDB();
  const normalizedEmail = email.trim().toLowerCase();

  const user = db.users.find(u =>
    u.email.toLowerCase() === normalizedEmail ||
    (u.secondaryEmail && u.secondaryEmail.toLowerCase() === normalizedEmail)
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password. Access denied.' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash) || password === user.plainPasswordForLab;

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid email or password. Access denied.' });
  }

  if (user.status === 'Suspended') {
    return res.status(403).json({ error: 'Account suspended. Please contact Enterprise Security.' });
  }

  user.lastActive = 'Just now';
  writeDB(db);

  const token = generateToken(user);

  res.cookie('accesshub_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });

  res.json({
    token,
    user: sanitizeUser(user)
  });
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie('accesshub_token');
  res.json({ success: true, message: 'Signed out successfully.' });
});

router.get('/auth/me', authenticateToken, (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
});

// -------------------------------------------------------------
// User & Profile Endpoints
// -------------------------------------------------------------
router.get('/users', authenticateToken, (req, res) => {
  const db = readDB();
  const { q, department, office, status } = req.query;

  let list = db.users.map(sanitizeUser);

  if (q) {
    const query = q.toLowerCase();
    list = list.filter(u =>
      u.name.toLowerCase().includes(query) ||
      u.empId.toLowerCase().includes(query) ||
      u.jobTitle.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query)
    );
  }

  if (department && department !== 'all') {
    list = list.filter(u => u.department.toLowerCase() === department.toLowerCase());
  }

  if (office && office !== 'all') {
    list = list.filter(u => (u.office || u.location || '').toLowerCase().includes(office.toLowerCase()));
  }

  if (status && status !== 'all') {
    list = list.filter(u => u.status.toLowerCase() === status.toLowerCase());
  }

  res.json({
    total: list.length,
    users: list
  });
});

router.get('/users/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const userId = parseInt(req.params.id, 10);
  const user = db.users.find(u => u.id === userId || u.empId.toLowerCase() === req.params.id.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user: sanitizeUser(user) });
});

router.get('/employees/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const userId = parseInt(req.params.id, 10);
  const user = db.users.find(u =>
    (!isNaN(userId) && u.id === userId) ||
    (u.empId && u.empId.toLowerCase() === req.params.id.toLowerCase())
  );

  if (!user) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  res.json({ employee: sanitizeUser(user), user: sanitizeUser(user) });
});

// Update Profile (Authenticated user updating their own profile)
router.put('/users/profile', authenticateToken, (req, res) => {
  const db = readDB();
  const user = db.users.find(u => u.id === req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const {
    name,
    phone,
    jobTitle,
    department,
    teamGroup,
    seating,
    emergencyContact,
    emergencyPhone
  } = req.body;

  if (name && name.trim()) user.name = name.trim();
  if (phone && phone.trim()) user.phone = phone.trim();
  if (jobTitle && jobTitle.trim()) user.jobTitle = jobTitle.trim();
  if (department && department.trim()) user.department = department.trim();
  if (teamGroup && teamGroup.trim()) user.teamGroup = teamGroup.trim();
  if (seating && seating.trim()) user.seating = seating.trim();
  if (emergencyContact && emergencyContact.trim()) user.emergencyContact = emergencyContact.trim();
  if (emergencyPhone && emergencyPhone.trim()) user.emergencyPhone = emergencyPhone.trim();

  writeDB(db);

  res.json({
    message: 'Profile updated successfully',
    user: sanitizeUser(user)
  });
});

// -------------------------------------------------------------
// Employee Contact Info Endpoint
// -------------------------------------------------------------
// Allows an authenticated employee to update their own contact details.
// Accepts the target employee's numeric ID as a URL parameter.
//
// INTENTIONAL VULNERABILITY (BAC #2 — Horizontal Privilege Escalation):
// Authentication is enforced, but the endpoint trusts the caller-supplied
// :id without verifying it matches the authenticated user's own ID.
// Any authenticated employee can therefore overwrite another employee's
// contact information by changing :id in the request.
router.put('/employees/:id/contact-info', authenticateToken, (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid employee ID.' });
  }

  const db = readDB();
  const target = db.users.find(u => u.id === targetId);

  if (!target) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  // Admins may legitimately update any employee's contact info.
  // NOTE: For regular employees the ownership check
  //   (targetId !== req.user.id) is intentionally NOT performed here.
  const { workPhone, deskLocation } = req.body;

  if (workPhone  !== undefined) target.workPhone  = String(workPhone).trim();
  if (deskLocation !== undefined) target.deskLocation = String(deskLocation).trim();

  writeDB(db);

  res.json({
    message: 'Contact information updated.',
    employee: {
      id:          target.id,
      empId:       target.empId,
      name:        target.name,
      workPhone:   target.workPhone,
      deskLocation: target.deskLocation
    }
  });
});

// -------------------------------------------------------------
// Employee Notification Preferences Endpoint
// -------------------------------------------------------------
// Allows an employee to update their notification preferences.
//
// INTENTIONAL VULNERABILITY (BAC #8 — Cross-User API Modification):
// In a secure implementation, the server verifies that the target ID matches the caller:
//   if (req.user.role !== 'Administrator' && req.user.id !== targetId) {
//     return res.status(403).json({ error: 'You are not authorized to modify these preferences.' });
//   }
// Here, the authorization check is intentionally omitted while `authenticateToken` is retained.
// Any authenticated employee can modify another employee's notification preferences by changing :id.
router.put('/employees/:id/preferences', authenticateToken, (req, res) => {
  const targetId = parseInt(req.params.id, 10);

  if (isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid employee ID.' });
  }

  const db = readDB();
  const target = db.users.find(u => u.id === targetId);

  if (!target) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  // INTENTIONAL VULNERABILITY: Missing ownership check!
  // Neither `req.user.id === targetId` nor `req.user.role === 'Administrator'` is validated.

  if (!target.preferences) {
    target.preferences = {
      emailNotifications: true,
      securityAlerts: true,
      weeklyDigest: false,
      desktopNotifications: true
    };
  }

  const { emailNotifications, securityAlerts, weeklyDigest, desktopNotifications } = req.body;

  if (emailNotifications !== undefined) target.preferences.emailNotifications = Boolean(emailNotifications);
  if (securityAlerts !== undefined) target.preferences.securityAlerts = Boolean(securityAlerts);
  if (weeklyDigest !== undefined) target.preferences.weeklyDigest = Boolean(weeklyDigest);
  if (desktopNotifications !== undefined) target.preferences.desktopNotifications = Boolean(desktopNotifications);

  writeDB(db);

  res.json({
    message: 'Notification preferences updated successfully',
    preferences: target.preferences
  });
});

// -------------------------------------------------------------
// Documents Endpoints
// -------------------------------------------------------------
router.get('/documents', authenticateToken, (req, res) => {
  const db = readDB();
  const { category, type, ownerId, q } = req.query;

  let docs = [...db.documents];

  if (req.user.role !== 'Administrator') {
    docs = docs.filter(d => d.ownerId === req.user.id || d.category === 'General');
  } else if (ownerId && ownerId !== 'all') {
    docs = docs.filter(d => d.ownerId === parseInt(ownerId, 10));
  }

  if (q) {
    const query = q.toLowerCase();
    docs = docs.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.id.toLowerCase().includes(query) ||
      d.ownerName.toLowerCase().includes(query) ||
      d.category.toLowerCase().includes(query)
    );
  }

  if (category && category !== 'all') {
    docs = docs.filter(d => d.category.toLowerCase() === category.toLowerCase());
  }

  if (type && type !== 'all') {
    docs = docs.filter(d => d.type.toLowerCase() === type.toLowerCase());
  }

  res.json({
    total: docs.length,
    documents: docs
  });
});

router.get('/documents/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const doc = db.documents.find(d => d.id.toLowerCase() === req.params.id.toLowerCase());

  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  res.json({ document: doc });
});

// -------------------------------------------------------------
// Document Download Endpoint
// -------------------------------------------------------------
// Allows an authenticated user to download a document file binary.
//
// INTENTIONAL VULNERABILITY (BAC #6 — Unauthorized File Download):
// In a secure implementation, the server verifies file ownership:
//   if (req.user.role !== 'Administrator' && doc.ownerId !== req.user.id && doc.category !== 'General') {
//     return res.status(403).json({ error: 'You are not authorized to download this file.' });
//   }
// Here, ownership/authorization is intentionally omitted while `authenticateToken` is retained.
// Any authenticated employee who knows or discovers another employee's document ID can directly
// download that employee's synthetic file payload without restriction.
router.get('/documents/:id/download', authenticateToken, (req, res) => {
  const db = readDB();
  const doc = db.documents.find(d => d.id.toLowerCase() === req.params.id.toLowerCase());

  if (!doc) {
    return res.status(404).json({ error: 'Document not found.' });
  }

  // INTENTIONAL VULNERABILITY: Missing ownership verification!
  // Neither `doc.ownerId === req.user.id` nor `req.user.role === 'Administrator'` is checked.

  const mimeTypes = {
    'PDF': 'application/pdf',
    'DOCX': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'XLSX': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'TXT': 'text/plain',
    'MD': 'text/markdown'
  };

  const contentType = mimeTypes[doc.type] || 'application/octet-stream';
  const filename = doc.name || `${doc.id}.pdf`;
  const fileContent = doc.content || `AccessHub Document Vault\nID: ${doc.id}\nTitle: ${doc.name}\nOwner: ${doc.ownerName}\nCategory: ${doc.category}\n\n${doc.description || 'Internal synthetic corporate record.'}`;

  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', contentType);
  res.send(fileContent);
});

router.post('/documents', authenticateToken, (req, res) => {
  const { name, type, category, description, content } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Document name is required.' });
  }

  const db = readDB();
  const docNum = Math.floor(1000 + Math.random() * 9000);
  const newDocId = `DOC-${docNum}`;

  const extension = name.includes('.') ? name.split('.').pop().toUpperCase() : (type || 'PDF');

  const newDoc = {
    id: newDocId,
    name: name.trim(),
    ownerId: req.user.id,
    ownerName: req.user.name,
    ownerEmpId: req.user.empId,
    type: extension,
    size: '1.2 MB',
    category: category || 'Engineering',
    status: 'Approved',
    version: 'v1.0 Initial',
    uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    description: description || 'Uploaded via AccessHub Document Portal',
    content: content || `Sample content for ${name}. Stored securely in vault.`
  };

  db.documents.unshift(newDoc);

  db.activity.unshift({
    id: Date.now(),
    type: 'document',
    icon: 'description',
    iconColor: 'text-primary',
    iconBg: 'bg-surface-container',
    title: `${req.user.name} uploaded document ${newDoc.id} (${newDoc.name}).`,
    timestamp: 'Just now',
    meta: `${newDoc.category} Repository`
  });

  writeDB(db);

  res.status(201).json({
    message: 'Document uploaded successfully',
    document: newDoc
  });
});

// -------------------------------------------------------------
// Document Deletion Endpoint
// -------------------------------------------------------------
// Allows an employee to delete a document.
//
// INTENTIONAL VULNERABILITY (BAC #7 — Unauthorized File Deletion):
// In a secure implementation, the server verifies that the user owns the document or is an admin:
//   if (req.user.role !== 'Administrator' && doc.ownerId !== req.user.id) {
//     return res.status(403).json({ error: 'You do not have permission to delete this document.' });
//   }
// Here, the authorization check is intentionally omitted while `authenticateToken` is retained.
// Any authenticated employee can issue a direct DELETE request targeting another employee's document ID.
router.delete('/documents/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const docId = (req.params.id || '').trim();
  const docIndex = db.documents.findIndex(d => d.id.toLowerCase() === docId.toLowerCase());

  if (docIndex === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const doc = db.documents[docIndex];

  // INTENTIONAL VULNERABILITY: Missing ownership check!
  // Neither `doc.ownerId === req.user.id` nor `req.user.role === 'Administrator'` is checked.

  db.documents.splice(docIndex, 1);

  db.activity.unshift({
    id: Date.now(),
    type: 'document',
    icon: 'delete',
    iconColor: 'text-error',
    iconBg: 'bg-error-container/30',
    title: `${req.user.name} deleted document ${doc.id} (${doc.name}).`,
    timestamp: 'Just now',
    meta: `${doc.category} Repository`
  });

  writeDB(db);

  res.json({
    success: true,
    message: 'Document deleted successfully',
    documentId: doc.id
  });
});

// -------------------------------------------------------------
// Orders Endpoints
// -------------------------------------------------------------
router.get('/orders', authenticateToken, (req, res) => {
  const db = readDB();
  const { status, q } = req.query;

  // Regular employee sees their own orders; admin can see all
  let orders = db.orders.filter(o => req.user.role === 'Administrator' || o.ownerId === req.user.id);

  if (q) {
    const query = q.toLowerCase();
    orders = orders.filter(o =>
      o.id.toLowerCase().includes(query) ||
      o.product.toLowerCase().includes(query) ||
      o.category.toLowerCase().includes(query)
    );
  }

  if (status && status !== 'all') {
    orders = orders.filter(o => o.status.toLowerCase() === status.toLowerCase());
  }

  res.json({
    total: orders.length,
    orders
  });
});

router.get('/orders/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const order = db.orders.find(o => o.id.toLowerCase() === req.params.id.toLowerCase());

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  if (req.user.role !== 'Administrator' && order.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied to this order.' });
  }

  res.json({ order });
});

router.post('/orders', authenticateToken, (req, res) => {
  const { product, category, amount, description, items } = req.body;

  if (!product || !product.trim()) {
    return res.status(400).json({ error: 'Product name or description is required.' });
  }

  const db = readDB();
  const orderNum = Math.floor(1000 + Math.random() * 9000);
  const newOrderId = `ORD-${orderNum}`;
  const cost = parseFloat(amount) || 199.00;

  const newOrder = {
    id: newOrderId,
    ownerId: req.user.id,
    requisitioner: req.user.name,
    requisitionerEmpId: req.user.empId,
    requisitionerEmail: req.user.email,
    product: product.trim(),
    category: category || 'Peripherals',
    amount: cost,
    date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
    status: 'Pending Approval',
    grant: 'Standard Hardware Grant',
    poToken: `PO-2024-REQ-${orderNum}`,
    approver: req.user.reportsTo ? req.user.reportsTo.name : 'Marcus Vance',
    approverEmpId: req.user.reportsTo ? req.user.reportsTo.id : 'EMP-10024',
    approverTitle: 'VP of Eng',
    autoCleared: 'Awaiting sign-off',
    courier: 'FedEx Priority',
    trackingNumber: `7892-${orderNum}-0011`,
    progress: 'Ordered',
    progressStep: 1,
    eta: 'Awaiting Manager Review',
    destinationFacility: req.user.seating || 'San Francisco HQ, Floor 3 Desk 34B',
    destinationDetails: `${req.user.office || 'San Francisco HQ'} • Attention: ${req.user.name}`,
    items: items && items.length > 0 ? items : [
      { name: product.trim(), sku: `REQ-${orderNum}`, qty: 1, price: cost }
    ],
    subtotal: cost,
    taxExemption: '-$0.00 (Exempt)',
    totalCost: cost,
    description: description || 'New equipment requisition'
  };

  db.orders.unshift(newOrder);

  db.activity.unshift({
    id: Date.now(),
    type: 'order',
    icon: 'shopping_cart',
    iconColor: 'text-primary',
    iconBg: 'bg-surface-container',
    title: `${req.user.name} submitted Order #${newOrder.id} (${newOrder.product}).`,
    timestamp: 'Just now',
    meta: `${newOrder.category} Requisition`
  });

  writeDB(db);

  res.status(201).json({
    message: 'Requisition submitted successfully',
    order: newOrder
  });
});

// -------------------------------------------------------------
// Order Cancellation Endpoint
// -------------------------------------------------------------
// Allows an employee to cancel an eligible order/requisition.
//
// INTENTIONAL VULNERABILITY (BAC #5 — Missing Authorization on Sensitive Action):
// In a secure implementation, the server verifies that the user owns the order:
//   if (req.user.role !== 'Administrator' && order.ownerId !== req.user.id) {
//     return res.status(403).json({ error: 'You are not authorized to cancel this requisition.' });
//   }
// Here, ownership/authorization is intentionally omitted while `authenticateToken` is retained.
// Any authenticated employee can issue a cancellation request targeting another employee's order ID.
const handleOrderCancel = (req, res) => {
  const db = readDB();
  const orderId = (req.params.id || '').trim();
  const order = db.orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());

  if (!order) {
    return res.status(404).json({ error: 'Requisition order not found.' });
  }

  // Business rule: only requisitions in pending/submitted states can be cancelled
  const cancellableStatuses = ['Pending', 'Pending Approval', 'Submitted', 'Under Review'];
  if (!cancellableStatuses.includes(order.status)) {
    return res.status(400).json({
      error: `Requisition #${order.id} cannot be cancelled in its current status: ${order.status}.`
    });
  }

  // INTENTIONAL VULNERABILITY: Missing ownership check!
  // Neither `order.ownerId === req.user.id` nor `req.user.role === 'Administrator'` is verified.

  order.status = 'Cancelled';
  order.progress = 'Cancelled';
  order.progressStep = 0;
  order.eta = 'Requisition Voided / Cancelled';
  order.cancelledAt = new Date().toISOString();
  order.cancelledBy = req.user.name;

  db.activity.unshift({
    id: Date.now(),
    type: 'order',
    icon: 'cancel',
    iconColor: 'text-error',
    iconBg: 'bg-error-container/30',
    title: `${req.user.name} cancelled Requisition #${order.id} (${order.product}).`,
    timestamp: 'Just now',
    meta: `${order.category} Requisition Voided`
  });

  writeDB(db);

  res.json({
    message: `Requisition #${order.id} has been cancelled successfully.`,
    order
  });
};

router.post('/orders/:id/cancel', authenticateToken, handleOrderCancel);
router.put('/orders/:id/cancel', authenticateToken, handleOrderCancel);

// -------------------------------------------------------------
// Order Status Update Endpoints (Protected PUT vs. Vulnerable PATCH — BAC #9)
// -------------------------------------------------------------
// Protected PUT endpoint: Enforces strict ownership & role authorization
router.put('/orders/:id/status', authenticateToken, (req, res) => {
  const db = readDB();
  const orderId = (req.params.id || '').trim();
  const order = db.orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // PROPER AUTHORIZATION CHECK:
  if (req.user.role !== 'Administrator' && order.ownerId !== req.user.id) {
    return res.status(403).json({ error: 'You are not authorized to modify this order.' });
  }

  const { status } = req.body;
  const allowedStatuses = ['Pending Approval', 'Approved', 'Processing', 'Delivered', 'Cancelled'];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status. Allowed: ' + allowedStatuses.join(', ') });
  }

  order.status = status;
  if (status === 'Approved') {
    order.progress = 'Approved';
    order.progressStep = 1;
  } else if (status === 'Processing') {
    order.progress = 'Processing';
    order.progressStep = 2;
  } else if (status === 'Delivered') {
    order.progress = 'Delivered';
    order.progressStep = 3;
  } else if (status === 'Cancelled') {
    order.progress = 'Cancelled';
    order.progressStep = 0;
  }

  writeDB(db);

  res.json({
    message: 'Order status updated successfully',
    order
  });
});

// INTENTIONAL VULNERABILITY (BAC #9 — HTTP Method Authorization Bypass):
// While PUT /api/orders/:id/status strictly verifies that the user owns the order
// or is an Administrator, this PATCH endpoint performs the same state change
// but INTENTIONALLY OMITS the ownership/role check while retaining authenticateToken.
// An authenticated employee can modify another employee's order status by using PATCH.
router.patch('/orders/:id/status', authenticateToken, (req, res) => {
  const db = readDB();
  const orderId = (req.params.id || '').trim();
  const order = db.orders.find(o => o.id.toLowerCase() === orderId.toLowerCase());

  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }

  // INTENTIONAL VULNERABILITY: Missing ownership check!
  // Neither `order.ownerId === req.user.id` nor `req.user.role === 'Administrator'` is verified here.

  const { status } = req.body;
  const allowedStatuses = ['Pending Approval', 'Approved', 'Processing', 'Delivered', 'Cancelled'];

  if (!status || !allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid order status. Allowed: ' + allowedStatuses.join(', ') });
  }

  order.status = status;
  if (status === 'Approved') {
    order.progress = 'Approved';
    order.progressStep = 1;
  } else if (status === 'Processing') {
    order.progress = 'Processing';
    order.progressStep = 2;
  } else if (status === 'Delivered') {
    order.progress = 'Delivered';
    order.progressStep = 3;
  } else if (status === 'Cancelled') {
    order.progress = 'Cancelled';
    order.progressStep = 0;
  }

  writeDB(db);

  res.json({
    message: 'Order status updated successfully',
    order
  });
});

// -------------------------------------------------------------
// Dashboard Stats Endpoint
// -------------------------------------------------------------
router.get('/stats/dashboard', authenticateToken, (req, res) => {
  const db = readDB();

  const userDocs = db.documents.filter(d => d.ownerId === req.user.id);
  const userOrders = db.orders.filter(o => o.ownerId === req.user.id);
  const pendingOrders = userOrders.filter(o => o.status === 'Pending Approval');
  const pendingDocs = userDocs.filter(d => d.status === 'Under Review' || d.status === 'Pending');

  const pendingAmount = pendingOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  res.json({
    user: sanitizeUser(req.user),
    myDocumentsCount: userDocs.length,
    pendingDocsCount: pendingDocs.length,
    myOrdersCount: userOrders.length,
    pendingOrdersAmount: pendingAmount,
    activePeersCount: db.users.length,
    assignedDocuments: userDocs.slice(0, 5),
    recentOrders: userOrders.slice(0, 5),
    teamMembers: db.users.filter(u => u.id !== req.user.id).slice(0, 3).map(sanitizeUser),
    recentActivity: db.activity.slice(0, 5)
  });
});

// -------------------------------------------------------------
// Admin Management Endpoints
// -------------------------------------------------------------
router.get('/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const db = readDB();
  res.json({
    total: db.users.length,
    users: db.users.map(sanitizeUser)
  });
});

router.post('/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const { name, email, role, department, jobTitle, phone, location } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  const db = readDB();
  const existing = db.users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'A user with this email address already exists.' });
  }

  const newId = Math.max(...db.users.map(u => u.id), 100) + 1;
  const empId = `EMP-${Math.floor(10000 + Math.random() * 9000)}`;

  const newUser = {
    id: newId,
    empId,
    name: name.trim(),
    email: email.trim(),
    secondaryEmail: `${name.toLowerCase().replace(/\s+/g, '.')}@accesshub.internal`,
    passwordHash: bcrypt.hashSync('Employee123!', 8),
    plainPasswordForLab: 'Employee123!',
    role: role || 'Employee',
    assignedRole: role === 'Administrator' ? 'Administrator' : 'Standard Employee',
    department: department || 'Engineering',
    teamGroup: `${department || 'Engineering'} Core`,
    jobTitle: jobTitle || 'Team Member',
    leadTitle: jobTitle || 'Team Member',
    phone: phone || '+1 (415) 555-0100',
    location: location || 'San Francisco HQ',
    office: location || 'San Francisco HQ',
    building: 'San Francisco, CA (HQ - Building 4)',
    seating: 'San Francisco Office',
    timezone: 'PST / UTC-8',
    reportsTo: { name: 'James Thornton', id: 'EMP-10640' },
    workAuthorization: 'Active / Full-Time (W-2)',
    tier: role === 'Administrator' ? 'Tier 1 Access' : 'Tier 2 Access',
    tenure: '0m',
    complianceScore: '100%',
    ownedAssetsCount: 1,
    hardwareDevice: 'Standard Provisioned Laptop',
    assetTag: `ASSET-${Math.floor(1000 + Math.random() * 9000)}`,
    physicalBadge: `BDG-${Math.floor(10000 + Math.random() * 90000)}`,
    badgeAuth: 'All Facilities Authorized',
    subnetIp: '10.24.110.99',
    vlan: 'VLAN: Standard-Static',
    emergencyContact: 'Not specified',
    emergencyPhone: 'N/A',
    hireDate: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    nextReview: 'Q1 2025',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'Active',
    lastActive: 'Just registered',
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  writeDB(db);

  res.status(201).json({
    message: 'New employee onboarded successfully.',
    user: sanitizeUser(newUser)
  });
});

// INTENTIONAL VULNERABILITY (BAC #3 — Vertical Privilege Escalation):
// Modifying employee accounts (status, role, department, etc.) is an administrative action
// normally protected by `requireAdmin`.
// Here, `requireAdmin` is intentionally omitted while `authenticateToken` is retained:
// any authenticated user with the 'Employee' role (e.g., Alex Mercer) can directly send a
// PUT request to /api/admin/users/:id and modify employee accounts without admin rights.
router.put('/admin/users/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const userId = parseInt(req.params.id, 10);
  const user = db.users.find(u => u.id === userId || u.empId.toLowerCase() === req.params.id.toLowerCase());

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, department, role, assignedRole, status, jobTitle } = req.body;

  if (name) user.name = name.trim();
  if (department) user.department = department.trim();
  if (role) {
    user.role = role;
    if (role === 'Administrator') user.assignedRole = 'Administrator';
  }
  if (assignedRole) user.assignedRole = assignedRole;
  if (status) user.status = status;
  if (jobTitle) user.jobTitle = jobTitle;

  writeDB(db);

  res.json({
    message: 'User updated successfully',
    user: sanitizeUser(user)
  });
});

// -------------------------------------------------------------
// Admin Audit Log Endpoint
// -------------------------------------------------------------
// Returns system administrative audit trail logs.
//
// INTENTIONAL VULNERABILITY (BAC #4 — Forced Browsing / Unprotected Endpoint):
// In a secure implementation, accessing the administrative audit log requires `requireAdmin`:
//   router.get('/admin/audit-log', authenticateToken, requireAdmin, (req, res) => ...);
// Here, `requireAdmin` is intentionally omitted while `authenticateToken` is retained.
// While the Employee UI provides no link or navigation to this resource, an authenticated
// user with the 'Employee' role (e.g., Alex Mercer or Sarah Jenkins) can directly navigate or request
// GET /api/admin/audit-log and inspect internal administrative audit trails without authorization.
router.get('/admin/audit-log', authenticateToken, (req, res) => {
  const db = readDB();
  const auditLogs = db.auditLog || [];
  res.json({
    total: auditLogs.length,
    auditLog: auditLogs
  });
});

router.delete('/admin/users/:id', authenticateToken, requireAdmin, (req, res) => {
  const db = readDB();
  const userId = parseInt(req.params.id, 10);
  const userIndex = db.users.findIndex(u => u.id === userId || u.empId.toLowerCase() === req.params.id.toLowerCase());

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const targetUser = db.users[userIndex];
  if (targetUser.id === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own administrator account.' });
  }

  db.users.splice(userIndex, 1);
  writeDB(db);

  res.json({ success: true, message: `Employee ${targetUser.name} (${targetUser.empId}) removed successfully.` });
});

// -------------------------------------------------------------
// Administrative Reports Endpoints (BAC #10 — Parameter-Based Authorization Flaw)
// -------------------------------------------------------------
// Generates enterprise employee summary reporting.
//
// INTENTIONAL VULNERABILITY (BAC #10 — Parameter-Based Authorization Flaw):
// In a secure implementation, authorization must be derived from the authenticated user's server-side session:
//   if (req.user.role !== 'Administrator') {
//     return res.status(403).json({ error: 'Administrator access required.' });
//   }
// Here, the endpoint checks a client-controlled parameter (`req.query.accessLevel`)
// to make the authorization decision instead of verifying `req.user.role`.
// An authenticated employee who supplies `?accessLevel=admin` is granted access to the report.
router.get('/reports/employee-summary', authenticateToken, (req, res) => {
  const accessLevel = String(req.query.accessLevel || '').trim().toLowerCase();

  // VULNERABLE AUTHORIZATION DECISION:
  // Trusts client-controlled `accessLevel` parameter instead of `req.user.role`
  if (accessLevel !== 'admin') {
    return res.status(403).json({
      error: 'Administrator access required. Invalid or insufficient accessLevel parameter.'
    });
  }

  const db = readDB();

  const report = db.users.map(u => ({
    empId: u.empId,
    name: u.name,
    email: u.email,
    department: u.department,
    jobTitle: u.jobTitle,
    status: u.status,
    assignedRole: u.assignedRole || u.role,
    location: u.office || u.location,
    hireDate: u.hireDate
  }));

  res.json({
    generatedAt: new Date().toISOString(),
    totalEmployees: report.length,
    accessLevelGranted: accessLevel,
    report
  });
});

// -------------------------------------------------------------
// Team Directory & Membership Endpoints (BAC #11 — Unauthorized Team Membership Modification)
// -------------------------------------------------------------

function enrichTeam(team, users) {
  const manager = users.find(u => u.id === team.managerId);
  const members = (team.memberIds || []).map(mId => {
    const u = users.find(user => user.id === mId);
    return u ? {
      id: u.id,
      empId: u.empId,
      name: u.name,
      jobTitle: u.jobTitle,
      department: u.department,
      avatar: u.avatar,
      email: u.email
    } : null;
  }).filter(Boolean);

  return {
    id: team.id,
    name: team.name,
    department: team.department,
    description: team.description,
    managerId: team.managerId,
    manager: manager ? {
      id: manager.id,
      empId: manager.empId,
      name: manager.name,
      jobTitle: manager.jobTitle,
      email: manager.email
    } : null,
    memberIds: team.memberIds || [],
    members,
    memberCount: (team.memberIds || []).length,
    createdAt: team.createdAt
  };
}

router.get('/teams', authenticateToken, (req, res) => {
  const db = readDB();
  const teams = (db.teams || []).map(t => enrichTeam(t, db.users));
  res.json({ teams });
});

router.get('/teams/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const teamId = String(req.params.id).trim().toLowerCase();
  const team = (db.teams || []).find(t => t.id.toLowerCase() === teamId);

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  res.json({ team: enrichTeam(team, db.users) });
});

// INTENTIONAL VULNERABILITY (BAC #11 — Unauthorized Team Membership Modification):
// In a secure corporate application, modifying team membership requires verifying that
// the authenticated user is either the team's designated manager or an Administrator:
//   if (req.user.role !== 'Administrator' && team.managerId !== req.user.id) {
//     return res.status(403).json({ error: 'You are not authorized to manage this team.' });
//   }
// Here, that manager/administrator authorization check is intentionally omitted.
// Any authenticated employee who knows or guesses a team ID can add arbitrary employees
// to teams they do not own or manage.
router.post('/teams/:id/members', authenticateToken, (req, res) => {
  const db = readDB();
  const teamId = String(req.params.id).trim().toLowerCase();
  const team = (db.teams || []).find(t => t.id.toLowerCase() === teamId);

  if (!team) {
    return res.status(404).json({ error: 'Team not found' });
  }

  const { employeeId } = req.body;
  if (!employeeId && employeeId !== 0) {
    return res.status(400).json({ error: 'employeeId is required' });
  }

  const targetId = parseInt(employeeId, 10);
  const targetUser = db.users.find(u =>
    (!isNaN(targetId) && u.id === targetId) ||
    (u.empId && u.empId.toLowerCase() === String(employeeId).trim().toLowerCase())
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  if (!Array.isArray(team.memberIds)) {
    team.memberIds = [];
  }

  if (team.memberIds.includes(targetUser.id)) {
    return res.status(400).json({ error: 'Employee is already a member of this team' });
  }

  // VULNERABLE LOGIC: The check `if (req.user.role !== 'Administrator' && team.managerId !== req.user.id)`
  // is intentionally omitted here for BAC #11.

  team.memberIds.push(targetUser.id);
  writeDB(db);

  res.json({
    message: 'Team member added successfully',
    team: {
      id: team.id,
      name: team.name
    },
    employeeId: targetUser.id
  });
});

// -------------------------------------------------------------
// Requests & Notes Endpoints (BAC #12 — Unauthorized Comment/Note Modification)
// -------------------------------------------------------------

function enrichRequest(reqItem, users) {
  const owner = users.find(u => u.id === reqItem.ownerId);
  const approver = reqItem.approverId ? users.find(u => u.id === reqItem.approverId) : null;
  const approvedByUser = reqItem.approvedBy ? users.find(u => u.id === reqItem.approvedBy) : null;
  return {
    id: reqItem.id,
    ownerId: reqItem.ownerId,
    approverId: reqItem.approverId || null,
    approvedBy: reqItem.approvedBy || null,
    approvedByName: approvedByUser ? approvedByUser.name : null,
    approvedAt: reqItem.approvedAt || null,
    title: reqItem.title,
    department: reqItem.department,
    status: reqItem.status,
    priority: reqItem.priority || 'Normal',
    createdAt: reqItem.createdAt,
    owner: owner ? {
      id: owner.id,
      empId: owner.empId,
      name: owner.name,
      department: owner.department,
      email: owner.email,
      avatar: owner.avatar
    } : null,
    approver: approver ? {
      id: approver.id,
      empId: approver.empId,
      name: approver.name,
      jobTitle: approver.jobTitle,
      department: approver.department,
      email: approver.email,
      avatar: approver.avatar
    } : null,
    notesCount: (reqItem.notes || []).length,
    notes: reqItem.notes || []
  };
}

router.get('/requests', authenticateToken, (req, res) => {
  const db = readDB();
  const requests = (db.requests || []).map(r => enrichRequest(r, db.users));
  res.json({ requests });
});

router.get('/requests/:requestId', authenticateToken, (req, res) => {
  const db = readDB();
  const reqId = String(req.params.requestId).trim().toLowerCase();
  const requestItem = (db.requests || []).find(r => r.id.toLowerCase() === reqId);

  if (!requestItem) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  res.json({ request: enrichRequest(requestItem, db.users) });
});

// INTENTIONAL VULNERABILITY (BAC #12 — Unauthorized Comment/Note Modification):
// In a secure corporate application, modifying notes attached to a request requires verifying
// that the authenticated user is either the request owner or an Administrator:
//   if (req.user.role !== 'Administrator' && requestItem.ownerId !== req.user.id) {
//     return res.status(403).json({ error: 'You are not authorized to modify this request.' });
//   }
// Here, that parent ownership / administrative role check is intentionally omitted.
// Any authenticated employee can modify notes on requests owned by other employees.
router.put('/requests/:requestId/notes/:noteId', authenticateToken, (req, res) => {
  const db = readDB();
  const reqId = String(req.params.requestId).trim().toLowerCase();
  const noteId = String(req.params.noteId).trim().toLowerCase();

  const requestItem = (db.requests || []).find(r => r.id.toLowerCase() === reqId);
  if (!requestItem) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  if (!Array.isArray(requestItem.notes)) {
    requestItem.notes = [];
  }

  const note = requestItem.notes.find(n => n.id.toLowerCase() === noteId);
  if (!note) {
    return res.status(404).json({ error: 'Note not found.' });
  }

  const { content } = req.body;
  if (content === undefined || content === null || typeof content !== 'string') {
    return res.status(400).json({ error: 'Note content is required.' });
  }

  const trimmed = content.trim();
  if (trimmed.length === 0) {
    return res.status(400).json({ error: 'Note content cannot be empty.' });
  }

  if (trimmed.length > 2000) {
    return res.status(400).json({ error: 'Note content exceeds maximum length (2000 characters).' });
  }

  // VULNERABLE LOGIC: The check `if (req.user.role !== 'Administrator' && requestItem.ownerId !== req.user.id)`
  // is intentionally omitted here for BAC #12.

  note.content = trimmed;
  note.updatedAt = new Date().toISOString();

  // Audit trail logging
  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    actor: req.user.name,
    actorId: req.user.empId,
    action: 'Request Note Modification',
    target: `${requestItem.id} / ${note.id}`,
    targetId: note.id,
    status: 'Success',
    sourceIp: req.ip || '10.10.20.15',
    details: `Updated note on request '${requestItem.title}'`
  });

  writeDB(db);

  res.json({
    message: 'Note updated successfully',
    requestId: requestItem.id,
    note
  });
});

// INTENTIONAL VULNERABILITY (BAC #14 — Unauthorized Approval Action):
// In a secure corporate approval workflow, approving a service or equipment request requires
// verifying that the authenticated user is either an Administrator or the designated approver:
//   const isAdmin = req.user.role === 'Administrator';
//   const isDepartmentApprover = req.user.id === requestItem.approverId;
//   if (!isAdmin && !isDepartmentApprover) {
//     return res.status(403).json({
//       error: 'You are not authorized to approve this request.'
//     });
//   }
// Here, that role/approver authorization check is intentionally omitted.
// Any authenticated employee can approve requests belonging to other employees.
router.post('/requests/:requestId/approve', authenticateToken, (req, res) => {
  const db = readDB();
  const reqId = String(req.params.requestId).trim().toLowerCase();
  const requestItem = (db.requests || []).find(r => r.id.toLowerCase() === reqId);

  if (!requestItem) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  // Request state validation: only requests in 'Pending Approval' can be approved
  if (requestItem.status !== 'Pending Approval') {
    return res.status(400).json({
      error: `Request cannot be approved in its current status: '${requestItem.status}'. Only requests in 'Pending Approval' status can be approved.`
    });
  }

  // VULNERABLE LOGIC: The check `if (req.user.role !== 'Administrator' && req.user.id !== requestItem.approverId)`
  // is intentionally omitted for BAC #14.

  const previousStatus = requestItem.status;
  const approvedAt = new Date().toISOString();

  // The server derives approvedBy exclusively from req.user.id (not req.body)
  requestItem.status = 'Approved';
  requestItem.approvedBy = req.user.id;
  requestItem.approvedAt = approvedAt;

  // Audit logging: record the approval in the audit system
  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: approvedAt,
    actor: req.user.name,
    actorId: req.user.empId || req.user.id,
    action: 'REQUEST_APPROVED',
    target: requestItem.id,
    targetId: requestItem.id,
    previousStatus: previousStatus,
    newStatus: 'Approved',
    status: 'Success',
    sourceIp: req.ip || '10.10.20.15',
    details: `Request '${requestItem.title}' (${requestItem.id}) approved by ${req.user.name}`
  });

  writeDB(db);

  res.json({
    message: 'Request approved successfully',
    request: {
      id: requestItem.id,
      status: requestItem.status,
      approvedBy: requestItem.approvedBy,
      approvedAt: requestItem.approvedAt
    }
  });
});

// -------------------------------------------------------------
// Request Rejection Endpoint (BAC #19 — Unauthorized Record Approval/Rejection Through Alternate Endpoint)
// -------------------------------------------------------------
//
// In a secure corporate approval workflow, rejecting an equipment or service request requires
// verifying that the authenticated user is either an Administrator or the designated approver:
//   const authorized =
//     req.user.role === 'Administrator' ||
//     req.user.id === requestItem.approverId;
//   if (!authorized) {
//     return res.status(403).json({
//       error: 'You are not authorized to reject this request.'
//     });
//   }
// Here, that role/approver authorization check is intentionally omitted.
// Any authenticated employee can reject requests belonging to other employees.
router.post('/requests/:requestId/reject', authenticateToken, (req, res) => {
  const db = readDB();
  const reqId = String(req.params.requestId).trim().toLowerCase();
  const requestItem = (db.requests || []).find(r => r.id.toLowerCase() === reqId);

  if (!requestItem) {
    return res.status(404).json({ error: 'Request not found.' });
  }

  // Request state validation: only requests in 'Pending Approval' can be rejected
  if (requestItem.status !== 'Pending Approval') {
    return res.status(400).json({
      error: `Request cannot be rejected in its current status: '${requestItem.status}'. Only requests in 'Pending Approval' status can be rejected.`
    });
  }

  // VULNERABLE LOGIC (BAC #19):
  // The check:
  // if (req.user.role !== 'Administrator' && req.user.id !== requestItem.approverId)
  // is intentionally omitted!

  const previousStatus = requestItem.status;
  const rejectedAt = new Date().toISOString();
  const { reason } = req.body || {};

  requestItem.status = 'Rejected';
  requestItem.rejectedBy = req.user.id;
  requestItem.rejectedByName = req.user.name;
  requestItem.rejectedAt = rejectedAt;
  if (reason && typeof reason === 'string') {
    requestItem.rejectionReason = reason.trim();
  }

  // Audit logging: record the rejection in the audit log
  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: rejectedAt,
    actor: req.user.name,
    actorId: req.user.empId || req.user.id,
    action: 'REQUEST_REJECTED',
    target: requestItem.id,
    targetId: requestItem.id,
    previousStatus: previousStatus,
    newStatus: 'Rejected',
    status: 'Success',
    sourceIp: req.ip || '10.10.20.15',
    details: `Request '${requestItem.title}' (${requestItem.id}) rejected by ${req.user.name}${requestItem.rejectionReason ? ': ' + requestItem.rejectionReason : ''}`
  });

  writeDB(db);

  res.json({
    message: 'Request rejected successfully',
    request: {
      id: requestItem.id,
      status: requestItem.status,
      rejectedBy: requestItem.rejectedBy,
      rejectedByName: requestItem.rejectedByName,
      rejectedAt: requestItem.rejectedAt,
      rejectionReason: requestItem.rejectionReason || null
    }
  });
});

// -------------------------------------------------------------
// Department Directory Endpoint (BAC #13 — Cross-Department Access Control Flaw)
// -------------------------------------------------------------
// Maps URL-friendly slugs to canonical department names used on user records.
const DEPARTMENT_MAP = {
  'engineering':         'Engineering',
  'product':             'Product',
  'it-security':         'IT & Security',
  'devops':              'DevOps',
  'people-operations':   'People Operations',
  'operations':          'Operations',
  'finance':             'Finance'
};

// INTENTIONAL VULNERABILITY (BAC #13 — Cross-Department Access Control Flaw):
// In a secure corporate directory, employees may only retrieve the roster of their
// own department. Administrators may access any department. The correct guard would be:
//
//   const reqDeptName = DEPARTMENT_MAP[targetSlug];
//   const userDept    = (req.user.department || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
//   if (req.user.role !== 'Administrator' && reqDeptName !== req.user.department) {
//     return res.status(403).json({
//       error: 'You are not authorized to access this department directory.'
//     });
//   }
//
// Here that department-boundary check is intentionally omitted.
// Any authenticated employee can retrieve the full employee list of any department
// simply by supplying a different department slug in the URL.
router.get('/departments/:departmentId/employees', authenticateToken, (req, res) => {
  const slug = String(req.params.departmentId).trim().toLowerCase();
  const deptName = DEPARTMENT_MAP[slug];

  if (!deptName) {
    return res.status(404).json({ error: 'Department not found.' });
  }

  const db = readDB();

  // VULNERABLE LOGIC: The department-boundary ownership check is intentionally omitted here.
  const employees = db.users
    .filter(u => u.department === deptName)
    .map(u => ({
      id: u.id,
      empId: u.empId,
      name: u.name,
      jobTitle: u.jobTitle,
      department: u.department,
      location: u.office || u.location || 'San Francisco HQ',
      status: u.status,
      email: u.email
    }));

  res.json({
    department: deptName,
    departmentId: slug,
    count: employees.length,
    employees
  });
});

// Returns the list of known departments (no sensitive data)
router.get('/departments', authenticateToken, (req, res) => {
  const db = readDB();
  const departments = Object.entries(DEPARTMENT_MAP).map(([slug, name]) => {
    const count = db.users.filter(u => u.department === name).length;
    return { id: slug, name, employeeCount: count };
  });
  res.json({ departments });
});

// -------------------------------------------------------------
// Company Assets Endpoints (BAC #15 — Resource Ownership Transfer Flaw)
// -------------------------------------------------------------

function enrichAsset(assetItem, users) {
  const assignee = assetItem.assignedTo ? users.find(u => u.id === assetItem.assignedTo) : null;
  const manager = assetItem.managerId ? users.find(u => u.id === assetItem.managerId) : null;
  const reassignedByUser = assetItem.reassignedBy ? users.find(u => u.id === assetItem.reassignedBy) : null;

  return {
    id: assetItem.id,
    assetTag: assetItem.assetTag,
    type: assetItem.type,
    model: assetItem.model,
    serialNumber: assetItem.serialNumber,
    assignedTo: assetItem.assignedTo,
    managerId: assetItem.managerId,
    status: assetItem.status,
    location: assetItem.location,
    assignedAt: assetItem.assignedAt,
    reassignedBy: assetItem.reassignedBy,
    reassignedByName: reassignedByUser ? reassignedByUser.name : null,
    reassignedAt: assetItem.reassignedAt,
    assignee: assignee ? {
      id: assignee.id,
      empId: assignee.empId,
      name: assignee.name,
      department: assignee.department,
      jobTitle: assignee.jobTitle,
      email: assignee.email,
      avatar: assignee.avatar
    } : null,
    manager: manager ? {
      id: manager.id,
      empId: manager.empId,
      name: manager.name,
      department: manager.department,
      jobTitle: manager.jobTitle
    } : null
  };
}

router.get('/assets', authenticateToken, (req, res) => {
  const db = readDB();
  const assets = (db.assets || []).map(a => enrichAsset(a, db.users));
  res.json({ assets });
});

router.get('/assets/:assetId', authenticateToken, (req, res) => {
  const db = readDB();
  const assetId = String(req.params.assetId).trim().toLowerCase();
  const asset = (db.assets || []).find(a => a.id.toLowerCase() === assetId);

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  res.json({ asset: enrichAsset(asset, db.users) });
});

// INTENTIONAL VULNERABILITY (BAC #15 — Resource Ownership Transfer Flaw):
// In a secure corporate asset-management system, reassigning hardware equipment or company
// assets requires verifying that the authenticated user is either an Administrator or the
// designated asset manager:
//   const isAdmin = req.user.role === 'Administrator';
//   const isAssetManager = req.user.id === asset.managerId;
//   if (!isAdmin && !isAssetManager) {
//     return res.status(403).json({
//       error: 'You are not authorized to reassign this asset.'
//     });
//   }
// Here, that role/ownership authorization check is intentionally omitted.
// Any authenticated employee can reassign assets belonging to colleagues without authorization.
router.put('/assets/:assetId/assignment', authenticateToken, (req, res) => {
  const db = readDB();
  const assetId = String(req.params.assetId).trim().toLowerCase();
  const asset = (db.assets || []).find(a => a.id.toLowerCase() === assetId);

  if (!asset) {
    return res.status(404).json({ error: 'Asset not found.' });
  }

  const { assignedTo } = req.body;
  if (assignedTo === undefined || assignedTo === null || assignedTo === '') {
    return res.status(400).json({ error: 'assignedTo is required.' });
  }

  const targetEmpId = parseInt(assignedTo, 10);
  if (isNaN(targetEmpId)) {
    return res.status(400).json({ error: 'assignedTo must be a valid numeric employee ID.' });
  }

  const targetUser = db.users.find(u => u.id === targetEmpId);
  if (!targetUser) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  if (asset.status === 'Retired' || asset.status === 'Maintenance') {
    return res.status(400).json({
      error: `Asset in '${asset.status}' status cannot be reassigned.`
    });
  }

  // VULNERABLE LOGIC: The check `if (req.user.role !== 'Administrator' && req.user.id !== asset.managerId)`
  // is intentionally omitted for BAC #15.

  const previousAssignee = asset.assignedTo;
  const reassignedAt = new Date().toISOString();

  // Server derives the actor from req.user.id (never client body)
  asset.assignedTo = targetUser.id;
  asset.status = 'Assigned';
  asset.reassignedBy = req.user.id;
  asset.reassignedAt = reassignedAt;

  // Audit logging: record asset assignment change
  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: reassignedAt,
    actor: req.user.name,
    actorId: req.user.empId || req.user.id,
    action: 'ASSET_ASSIGNMENT_CHANGED',
    target: asset.id,
    targetId: asset.id,
    previousAssignee: previousAssignee,
    newAssignee: targetUser.id,
    status: 'Success',
    sourceIp: req.ip || '10.10.20.15',
    details: `Asset '${asset.model}' (${asset.id}) reassigned from employee #${previousAssignee} to #${targetUser.id} by ${req.user.name}`
  });

  writeDB(db);

  res.json({
    message: 'Asset assignment updated successfully',
    asset: {
      id: asset.id,
      assignedTo: asset.assignedTo,
      reassignedBy: asset.reassignedBy,
      reassignedAt: asset.reassignedAt
    }
  });
});

// -------------------------------------------------------------
// Account Security & Password Endpoints (BAC #16 — Unauthorized Password Change)
// -------------------------------------------------------------

function handlePasswordChange(targetEmployeeId, req, res) {
  const db = readDB();
  const targetId = parseInt(targetEmployeeId, 10);
  const targetUser = db.users.find(u =>
    (!isNaN(targetId) && u.id === targetId) ||
    (u.empId && u.empId.toLowerCase() === String(targetEmployeeId).trim().toLowerCase())
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const { newPassword, password } = req.body;
  const candidatePassword = newPassword || password;

  if (!candidatePassword || typeof candidatePassword !== 'string') {
    return res.status(400).json({ error: 'New password is required.' });
  }

  const trimmedPassword = candidatePassword.trim();
  if (trimmedPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters in length.' });
  }

  // INTENTIONAL VULNERABILITY (BAC #16 — Unauthorized Password Change):
  // In a secure corporate application, only the account owner or an Administrator
  // performing an authorized credential reset should be allowed to change a password:
  //   if (req.user.id !== targetUser.id && req.user.role !== 'Administrator') {
  //     return res.status(403).json({
  //       error: 'You are not authorized to change this password.'
  //     });
  //   }
  // Here, that identity/role check is intentionally omitted.
  // Any authenticated employee can change another employee's password by specifying their ID.

  targetUser.passwordHash = bcrypt.hashSync(trimmedPassword, 8);
  targetUser.plainPasswordForLab = trimmedPassword;
  targetUser.passwordChangedAt = new Date().toISOString();

  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    actor: req.user.name,
    actorId: req.user.empId || req.user.id,
    action: 'ACCOUNT_PASSWORD_CHANGED',
    target: targetUser.name,
    targetId: String(targetUser.id),
    status: 'Success',
    sourceIp: req.ip || '10.10.20.15',
    details: `Password changed for employee '${targetUser.name}' (${targetUser.empId}) by ${req.user.name}`
  });

  writeDB(db);

  res.json({
    message: 'Password updated successfully',
    employeeId: targetUser.id
  });
}

router.put('/account/password', authenticateToken, (req, res) => {
  handlePasswordChange(req.user.id, req, res);
});

router.put('/account/:employeeId/password', authenticateToken, (req, res) => {
  handlePasswordChange(req.params.employeeId, req, res);
});

// -------------------------------------------------------------
// Employee Access Profile Endpoint (BAC #17 — Unauthorized Role/Permission Assignment)
// -------------------------------------------------------------

const ALLOWED_ASSIGNED_ROLES = [
  'Employee',
  'Team Lead',
  'Manager',
  'Administrator',
  'Standard Employee',
  'Department Director',
  'HR Administrator',
  'Contractor (External)'
];

// INTENTIONAL VULNERABILITY (BAC #17 — Unauthorized Role/Permission Assignment):
// In an enterprise IAM governance workflow, modifying an employee's access profile
// or assigned role requires privileged Administrator authority:
//   if (req.user.role !== 'Administrator') {
//     return res.status(403).json({
//       error: 'Administrator authorization required.'
//     });
//   }
// Here, that role check is intentionally omitted.
// Any authenticated employee can modify another employee's access profile role.
router.put('/employees/:id/access-profile', authenticateToken, (req, res) => {
  const db = readDB();
  const targetId = parseInt(req.params.id, 10);
  const targetUser = db.users.find(u =>
    (!isNaN(targetId) && u.id === targetId) ||
    (u.empId && u.empId.toLowerCase() === String(req.params.id).trim().toLowerCase())
  );

  if (!targetUser) {
    return res.status(404).json({ error: 'Employee not found.' });
  }

  const { assignedRole } = req.body;
  if (!assignedRole || typeof assignedRole !== 'string') {
    return res.status(400).json({ error: 'assignedRole is required.' });
  }

  const trimmedRole = assignedRole.trim();
  const matchedRole = ALLOWED_ASSIGNED_ROLES.find(r => r.toLowerCase() === trimmedRole.toLowerCase());
  if (!matchedRole) {
    return res.status(400).json({
      error: `Invalid role specified. Allowed roles: ${ALLOWED_ASSIGNED_ROLES.slice(0, 4).join(', ')}.`
    });
  }

  // VULNERABLE LOGIC:
  // The check `if (req.user.role !== 'Administrator')` is intentionally omitted for BAC #17!

  const previousRole = targetUser.assignedRole || targetUser.role;
  targetUser.assignedRole = matchedRole;

  // Audit logging: record role change
  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString(),
    actor: req.user.name,
    actorId: req.user.empId || req.user.id,
    action: 'ACCESS_PROFILE_MODIFIED',
    target: targetUser.name,
    targetId: String(targetUser.id),
    previousRole: previousRole,
    newRole: matchedRole,
    status: 'Success',
    sourceIp: req.ip || '10.10.20.15',
    details: `Access profile for '${targetUser.name}' (${targetUser.empId}) changed from '${previousRole}' to '${matchedRole}' by ${req.user.name}`
  });

  writeDB(db);

  res.json({
    message: 'Access profile updated successfully',
    employeeId: targetUser.id,
    assignedRole: targetUser.assignedRole
  });
});

// -------------------------------------------------------------
// Corporate Expenses & Invoices Endpoints (BAC #18 — Unauthorized Invoice/Expense Access)
// -------------------------------------------------------------

// GET /api/expenses: List expenses
// Normal employees can only view their own expense records.
// Administrators can view all company expense records.
router.get('/expenses', authenticateToken, (req, res) => {
  const db = readDB();
  const isAdmin = req.user.role === 'Administrator';
  let list = db.expenses || [];

  if (!isAdmin) {
    list = list.filter(e => e.employeeId === req.user.id);
  }

  const { status, category } = req.query;
  if (status && status !== 'all') {
    list = list.filter(e => e.status.toLowerCase() === status.toLowerCase());
  }
  if (category && category !== 'all') {
    list = list.filter(e => e.category.toLowerCase() === category.toLowerCase());
  }

  res.json({
    total: list.length,
    expenses: list
  });
});

// GET /api/expenses/:id: Retrieve individual expense record
//
// INTENTIONAL VULNERABILITY (BAC #18 — Unauthorized Invoice/Expense Access):
// In a secure architecture, an employee must only be allowed to access their own expense record,
// while Administrators or authorized finance auditors may view broader company records:
//   if (req.user.role !== 'Administrator' && expense.employeeId !== req.user.id) {
//     return res.status(403).json({
//       error: 'You are not authorized to view this expense.'
//     });
//   }
// Here, that ownership/role authorization check is intentionally omitted.
// Any authenticated employee can access the full expense details of any other employee.
router.get('/expenses/:id', authenticateToken, (req, res) => {
  const db = readDB();
  const expenseId = String(req.params.id).trim().toLowerCase();
  const expense = (db.expenses || []).find(e => e.id.toLowerCase() === expenseId);

  if (!expense) {
    return res.status(404).json({ error: 'Expense record not found.' });
  }

  // VULNERABLE LOGIC:
  // Missing check:
  // if (req.user.role !== 'Administrator' && expense.employeeId !== req.user.id) {
  //   return res.status(403).json({ error: 'You are not authorized to view this expense.' });
  // }

  res.json({
    expense: {
      id: expense.id,
      employeeId: expense.employeeId,
      employeeName: expense.employeeName,
      department: expense.department,
      title: expense.title,
      category: expense.category,
      amount: expense.amount,
      currency: expense.currency || 'USD',
      submissionDate: expense.submissionDate,
      status: expense.status,
      merchant: expense.merchant,
      description: expense.description,
      receiptUrl: expense.receiptUrl,
      approvedBy: expense.approvedBy,
      approvedAt: expense.approvedAt
    }
  });
});

// -------------------------------------------------------------
// Corporate Calendar / Events Endpoints (BAC #20 — Unauthorized Event Modification)
// -------------------------------------------------------------

// GET /api/events — list all company calendar events (authenticated)
router.get('/events', authenticateToken, (req, res) => {
  const db = readDB();
  const events = db.events || [];

  const { month, year, type } = req.query;

  let filtered = events;

  if (month && year) {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    filtered = filtered.filter(ev => {
      const d = new Date(ev.startDate);
      return d.getUTCMonth() + 1 === m && d.getUTCFullYear() === y;
    });
  }

  if (type && type !== 'all') {
    filtered = filtered.filter(ev => ev.type.toLowerCase() === type.toLowerCase());
  }

  res.json({ events: filtered });
});

// GET /api/events/:eventId — fetch a single event (authenticated)
router.get('/events/:eventId', authenticateToken, (req, res) => {
  const db = readDB();
  const eventId = String(req.params.eventId).trim().toUpperCase();
  const event = (db.events || []).find(ev => ev.id.toUpperCase() === eventId);

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  res.json({ event });
});

// PUT /api/events/:eventId — update a calendar event (BAC #20 — Unauthorized Event Modification)
//
// Intended secure behavior:
//   Only the event organizer (req.user.id === event.organizerId) or an Administrator
//   should be able to modify an event's details. The secure check would be:
//
//   const isOrganizer = req.user.id === event.organizerId;
//   const isAdmin     = req.user.role === 'Administrator';
//   if (!isOrganizer && !isAdmin) {
//     return res.status(403).json({
//       error: 'You are not authorized to modify this event. Only the event organizer can make changes.'
//     });
//   }
//
// VULNERABILITY (BAC #20):
//   The organizer ownership check is intentionally omitted.
//   Any authenticated employee can update any event — including events organized by others.
router.put('/events/:eventId', authenticateToken, (req, res) => {
  const db = readDB();
  const eventId = String(req.params.eventId).trim().toUpperCase();
  const event = (db.events || []).find(ev => ev.id.toUpperCase() === eventId);

  if (!event) {
    return res.status(404).json({ error: 'Event not found.' });
  }

  // VULNERABLE: No ownership check here.
  // A secure implementation would verify req.user.id === event.organizerId
  // or req.user.role === 'Administrator' before allowing any mutation.

  const allowedFields = ['title', 'description', 'location', 'meetingLink', 'startDate', 'endDate', 'status', 'visibility'];
  const { body } = req;

  let changed = false;
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      event[field] = body[field];
      changed = true;
    }
  }

  if (!changed) {
    return res.status(400).json({ error: 'No valid fields provided for update.' });
  }

  event.updatedAt = new Date().toISOString();

  // Audit logging
  if (!db.auditLog) db.auditLog = [];
  db.auditLog.unshift({
    id: `AUD-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: event.updatedAt,
    actor: req.user.name,
    actorId: req.user.empId || req.user.id,
    action: 'EVENT_MODIFIED',
    target: event.id,
    targetId: event.id,
    status: 'Success',
    sourceIp: req.ip || '10.10.20.15',
    details: `Event '${event.title}' (${event.id}) modified by ${req.user.name} (organizer: ${event.organizerName})`
  });

  writeDB(db);

  res.json({
    message: 'Event updated successfully',
    event: {
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      meetingLink: event.meetingLink,
      startDate: event.startDate,
      endDate: event.endDate,
      status: event.status,
      visibility: event.visibility,
      organizerId: event.organizerId,
      organizerName: event.organizerName,
      updatedAt: event.updatedAt
    }
  });
});

module.exports = router;
