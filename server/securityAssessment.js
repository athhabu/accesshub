'use strict';

// Server-side authority for all 20 Security Assessment check metadata.
// Vulnerability names are NEVER sent to the client for pending checks.
// This module is the single source of truth — do not duplicate in frontend code.

const CHECKS = {
  1:  { title: 'Document Access',          vulnerability: 'IDOR / BOLA' },
  2:  { title: 'Employee Information',      vulnerability: 'Horizontal Privilege Escalation' },
  3:  { title: 'Administrative Functions',  vulnerability: 'Vertical Privilege Escalation' },
  4:  { title: 'Audit Records',             vulnerability: 'Forced Browsing / Unprotected Endpoint' },
  5:  { title: 'Order Actions',             vulnerability: 'Unauthorized Order Cancellation' },
  6:  { title: 'File Operations',           vulnerability: 'Unauthorized File Download' },
  7:  { title: 'Document Management',       vulnerability: 'Unauthorized File Deletion' },
  8:  { title: 'Employee Preferences',      vulnerability: 'Cross-User API Modification' },
  9:  { title: 'Order Status',              vulnerability: 'HTTP Method Authorization Bypass' },
  10: { title: 'Report Access',             vulnerability: 'Parameter-Based Authorization Flaw' },
  11: { title: 'Team Membership',           vulnerability: 'Unauthorized Team Membership Modification' },
  12: { title: 'Request Notes',             vulnerability: 'Unauthorized Comment / Note Modification' },
  13: { title: 'Department Access',         vulnerability: 'Cross-Department Access Control Flaw' },
  14: { title: 'Request Approval',          vulnerability: 'Unauthorized Approval Action' },
  15: { title: 'Asset Assignment',          vulnerability: 'Resource Ownership Transfer Flaw' },
  16: { title: 'Account Security',          vulnerability: 'Unauthorized Password Change' },
  17: { title: 'Access Profile',            vulnerability: 'Unauthorized Role / Permission Assignment' },
  18: { title: 'Expense Records',           vulnerability: 'Unauthorized Expense / Invoice Access' },
  19: { title: 'Request Decisions',         vulnerability: 'Unauthorized Request Rejection' },
  20: { title: 'Calendar Events',           vulnerability: 'Unauthorized Calendar / Event Modification' }
};

module.exports = { CHECKS };
