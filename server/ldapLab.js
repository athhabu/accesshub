'use strict';

// =============================================================================
// ldapLab.js — Synthetic LDAP Directory for Security Training Check #37
// =============================================================================
// This module simulates a corporate LDAP/Active Directory directory query
// entirely in memory.  No actual LDAP server is involved.
//
// Vulnerability: The searchDirectory() function builds an LDAP-style filter
// string by concatenating user-supplied input without escaping special
// characters (parentheses, asterisks, backslashes, null bytes).  A tester
// can escape the (cn=*<input>*) context and inject arbitrary filter logic,
// e.g. "*)(|(cn=*" → filter becomes (cn=**)(|(cn=*)), which matches all
// entries regardless of the intended predicate.
// =============================================================================

// Synthetic corporate directory entries
const DIRECTORY = [
  { cn: 'Alex Mercer',       uid: 'amercer',    mail: 'alex.mercer@accesshub.internal',    dept: 'Engineering',  title: 'Senior Full-Stack Engineer',      office: 'San Francisco HQ', phone: '+1-415-555-0182', status: 'active',   objectClass: 'person' },
  { cn: 'Sarah Jenkins',     uid: 'sjenkins',   mail: 'sarah.jenkins@accesshub.internal',  dept: 'Engineering',  title: 'Principal Product Architect',     office: 'San Francisco HQ', phone: '+1-415-555-0144', status: 'active',   objectClass: 'person' },
  { cn: 'Marcus Vance',      uid: 'mvance',     mail: 'marcus.vance@accesshub.internal',   dept: 'Engineering',  title: 'VP of Engineering',               office: 'San Francisco HQ', phone: '+1-415-555-0100', status: 'active',   objectClass: 'person' },
  { cn: 'David Chen',        uid: 'dchen',      mail: 'david.chen@accesshub.internal',     dept: 'Product',      title: 'Lead Product Manager',            office: 'New York Office',  phone: '+1-212-555-0133', status: 'active',   objectClass: 'person' },
  { cn: 'Elena Rodriguez',   uid: 'erodriguez', mail: 'elena.rodriguez@accesshub.internal',dept: 'Security',     title: 'Senior Security Engineer',        office: 'Austin Hub',       phone: '+1-512-555-0177', status: 'active',   objectClass: 'person' },
  { cn: 'Chloe Bennett',     uid: 'cbennett',   mail: 'chloe.bennett@accesshub.internal',  dept: 'Finance',      title: 'Senior Financial Analyst',        office: 'Chicago Office',   phone: '+1-312-555-0199', status: 'active',   objectClass: 'person' },
  { cn: 'Thomas Reed',       uid: 'treed',      mail: 'thomas.reed@accesshub.internal',    dept: 'Operations',   title: 'IT Systems Administrator',        office: 'San Francisco HQ', phone: '+1-415-555-0165', status: 'active',   objectClass: 'person' },
  { cn: 'Maya Patel',        uid: 'mpatel',     mail: 'maya.patel@accesshub.internal',     dept: 'People Ops',   title: 'HR Operations Lead',              office: 'New York Office',  phone: '+1-212-555-0188', status: 'active',   objectClass: 'person' },
  { cn: 'James Holbrook',    uid: 'jholbrook',  mail: 'j.holbrook@accesshub.internal',     dept: 'Legal',        title: 'General Counsel',                 office: 'Chicago Office',   phone: '+1-312-555-0211', status: 'active',   objectClass: 'person' },
  { cn: 'Priya Nair',        uid: 'pnair',      mail: 'priya.nair@accesshub.internal',     dept: 'Engineering',  title: 'Cloud Infrastructure Engineer',   office: 'Austin Hub',       phone: '+1-512-555-0254', status: 'active',   objectClass: 'person' },
  { cn: 'SVC_BackupAgent',   uid: 'svc_backup', mail: 'svc-backup@accesshub.internal',     dept: 'Operations',   title: 'Service Account — Backup Agent',  office: 'Internal Systems', phone: 'N/A',             status: 'service',  objectClass: 'person' },
  { cn: 'SVC_ReportRunner',  uid: 'svc_report', mail: 'svc-report@accesshub.internal',     dept: 'Operations',   title: 'Service Account — Report Runner', office: 'Internal Systems', phone: 'N/A',             status: 'service',  objectClass: 'person' },
  { cn: 'Admin_TempAccess',  uid: 'tmp_admin',  mail: 'tmp-admin@accesshub.internal',      dept: 'IT',           title: 'Temp Admin — Provisioning',       office: 'San Francisco HQ', phone: '+1-415-555-0001', status: 'disabled', objectClass: 'person' }
];

// ---------------------------------------------------------------------------
// Synthetic LDAP filter evaluator
// ---------------------------------------------------------------------------
// Supported primitives (intentionally minimal to stay realistic):
//   (attr=value)           — equality
//   (attr=*value*)         — substring (contains)
//   (attr=*)               — presence
//   (&(…)(…))              — AND
//   (|(…)(…))              — OR
//   (!(…))                 — NOT
// ---------------------------------------------------------------------------

function evalFilter(filter, entry) {
  filter = filter.trim();

  // Compound filters
  if (filter.startsWith('(&')) {
    const inner = filter.slice(2, -1);
    const children = splitTopLevel(inner);
    return children.every(c => evalFilter(c, entry));
  }
  if (filter.startsWith('(|')) {
    const inner = filter.slice(2, -1);
    const children = splitTopLevel(inner);
    return children.some(c => evalFilter(c, entry));
  }
  if (filter.startsWith('(!')) {
    const inner = filter.slice(2, -1);
    return !evalFilter(inner, entry);
  }

  // Simple assertion  (attr=pattern)
  const match = filter.match(/^\(([^=)]+)=([^)]*)\)$/);
  if (!match) return false;

  const attr  = match[1].toLowerCase();
  const pattern = match[2];
  const entryKey = Object.keys(entry).find(k => k.toLowerCase() === attr);
  const value = entryKey ? String(entry[entryKey] || '') : '';

  // Presence check
  if (pattern === '*') return value !== '';

  // Substring / wildcard (simplified: only leading/trailing *)
  if (pattern.includes('*')) {
    const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp('^' + escaped + '$', 'i').test(value);
  }

  // Equality
  return value.toLowerCase() === pattern.toLowerCase();
}

function splitTopLevel(s) {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < s.length; i++) {
    if (s[i] === '(') { if (depth === 0) start = i; depth++; }
    else if (s[i] === ')') { depth--; if (depth === 0) parts.push(s.slice(start, i + 1)); }
  }
  return parts;
}

// ---------------------------------------------------------------------------
// Check #37: Vulnerable directory search
// ---------------------------------------------------------------------------
// The cn field is directly concatenated into the LDAP filter string without
// escaping parentheses or wildcards.  An attacker can inject filter logic.
//
// Normal query:  (&(objectClass=person)(cn=*Alex*))
// Injected:      (&(objectClass=person)(cn=*Alex*)(|(status=service)))
//                by supplying: Alex*)(|(status=service
// ---------------------------------------------------------------------------
function searchDirectory(cnQuery, deptFilter) {
  let filter;
  const isAll = (cnQuery === '' || cnQuery === undefined || cnQuery === null);
  const safeDept = (deptFilter && deptFilter !== 'all') ? deptFilter.replace(/[()\\*\0]/g, '') : null;

  if (isAll) {
    if (safeDept) {
      filter = `(&(objectClass=person)(status=active)(dept=${safeDept}))`;
    } else {
      filter = `(&(objectClass=person)(status=active))`;
    }
  } else {
    // Build filter — vulnerable: cnQuery not sanitised
    if (safeDept) {
      filter = `(&(objectClass=person)(cn=*${cnQuery}*)(dept=${safeDept}))`;
    } else {
      filter = `(&(objectClass=person)(cn=*${cnQuery}*))`;
    }
  }

  let results;
  try {
    results = DIRECTORY.filter(entry => evalFilter(filter, entry));
  } catch (_) {
    // Malformed filter → empty result (no stack trace leaked)
    results = [];
  }

  return { filter, results };
}

module.exports = { searchDirectory, DIRECTORY };
