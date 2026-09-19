'use strict';

const { writeDB } = require('./db');

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

function recordExploit(db, checkId, req, res) {
  const meta = CHECKS[checkId];
  if (!meta) return null;

  if (!db.securityAssessment || !db.securityAssessment.checks) {
    db.securityAssessment = { checks: {} };
    for (let i = 1; i <= 20; i++) {
      db.securityAssessment.checks[i] = { status: 'pending', verifiedAt: null };
    }
  }

  const check = db.securityAssessment.checks[checkId] || { status: 'pending', verifiedAt: null };
  const isNewlyVerified = check.status !== 'verified';

  // If already verified, do NOT set celebration headers and do not create duplicate event
  if (!isNewlyVerified) {
    return {
      checkId,
      title: meta.title,
      vulnerability: meta.vulnerability,
      verifiedAt: check.verifiedAt,
      isNewlyVerified: false
    };
  }

  // Newly verified
  const verifiedAt = new Date().toISOString();
  check.status = 'verified';
  check.verifiedAt = verifiedAt;
  db.securityAssessment.checks[checkId] = check;
  writeDB(db);

  if (res && !res.headersSent) {
    res.setHeader('X-Lab-Solved', String(checkId));
    res.setHeader('X-Lab-Vulnerability', encodeURIComponent(meta.vulnerability));
    res.setHeader('X-Lab-Title', encodeURIComponent(meta.title));
    res.setHeader('Access-Control-Expose-Headers', 'X-Lab-Solved, X-Lab-Vulnerability, X-Lab-Title');
  }

  return {
    checkId,
    title: meta.title,
    vulnerability: meta.vulnerability,
    verifiedAt,
    isNewlyVerified: true
  };
}

module.exports = { CHECKS, recordExploit };
