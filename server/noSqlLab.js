'use strict';

// =============================================================================
// noSqlLab.js — Synthetic NoSQL Document Store for Security Training Check #38
// =============================================================================
// This module emulates a lightweight MongoDB-style JSON document store in
// memory.  No external database or network service is involved.
//
// Vulnerability: The filterUsers() function accepts a raw JSON body from the
// client and passes the "status" field directly into the query engine without
// validation.  A tester can replace a normal string value with a MongoDB-style
// operator object such as { "$ne": "inactive" } or { "$regex": ".*" } to
// bypass the intended filter and enumerate all records — including those with
// status "admin_reserved" that should not be visible.
// =============================================================================

// Synthetic employee document store
const USER_STORE = [
  { _id: 'u001', name: 'Alex Mercer',      department: 'Engineering', role: 'Senior Full-Stack Engineer',    status: 'active',        clearance: 'standard',  hiredYear: 2021 },
  { _id: 'u002', name: 'Sarah Jenkins',    department: 'Engineering', role: 'Principal Product Architect',  status: 'active',        clearance: 'standard',  hiredYear: 2019 },
  { _id: 'u003', name: 'Marcus Vance',     department: 'Engineering', role: 'VP of Engineering',            status: 'active',        clearance: 'elevated',  hiredYear: 2018 },
  { _id: 'u004', name: 'David Chen',       department: 'Product',     role: 'Lead Product Manager',         status: 'active',        clearance: 'standard',  hiredYear: 2020 },
  { _id: 'u005', name: 'Elena Rodriguez',  department: 'Security',    role: 'Senior Security Engineer',     status: 'active',        clearance: 'elevated',  hiredYear: 2020 },
  { _id: 'u006', name: 'Chloe Bennett',    department: 'Finance',     role: 'Senior Financial Analyst',     status: 'active',        clearance: 'standard',  hiredYear: 2022 },
  { _id: 'u007', name: 'Thomas Reed',      department: 'Operations',  role: 'IT Systems Administrator',     status: 'active',        clearance: 'standard',  hiredYear: 2019 },
  { _id: 'u008', name: 'Maya Patel',       department: 'People Ops',  role: 'HR Operations Lead',           status: 'active',        clearance: 'standard',  hiredYear: 2021 },
  { _id: 'u009', name: 'James Holbrook',   department: 'Legal',       role: 'General Counsel',              status: 'on_leave',      clearance: 'elevated',  hiredYear: 2017 },
  { _id: 'u010', name: 'Priya Nair',       department: 'Engineering', role: 'Cloud Infrastructure Engineer', status: 'on_leave',     clearance: 'standard',  hiredYear: 2023 },
  { _id: 'u011', name: 'SVC_BackupAgent',  department: 'Operations',  role: 'Service Account',              status: 'service',       clearance: 'none',      hiredYear: 2020 },
  { _id: 'u012', name: 'SVC_ReportRunner', department: 'Operations',  role: 'Service Account',              status: 'service',       clearance: 'none',      hiredYear: 2020 },
  { _id: 'u013', name: 'Audit_Admin',      department: 'IT',          role: 'Privileged Admin Account',     status: 'admin_reserved', clearance: 'privileged', hiredYear: 2016 },
  { _id: 'u014', name: 'Break_Glass_Admin',department: 'IT',          role: 'Emergency Break-Glass Account',status: 'admin_reserved', clearance: 'privileged', hiredYear: 2016 }
];

// ---------------------------------------------------------------------------
// Minimal NoSQL-style query evaluator
// ---------------------------------------------------------------------------
// Supported operators:  $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $regex
// ---------------------------------------------------------------------------
function matchValue(docVal, queryVal) {
  if (queryVal !== null && typeof queryVal === 'object' && !Array.isArray(queryVal)) {
    // Operator object
    return Object.entries(queryVal).every(([op, operand]) => {
      switch (op) {
        case '$eq':    return docVal === operand;
        case '$ne':    return docVal !== operand;
        case '$gt':    return docVal > operand;
        case '$gte':   return docVal >= operand;
        case '$lt':    return docVal < operand;
        case '$lte':   return docVal <= operand;
        case '$in':    return Array.isArray(operand) && operand.includes(docVal);
        case '$nin':   return Array.isArray(operand) && !operand.includes(docVal);
        case '$regex': return new RegExp(operand, 'i').test(String(docVal));
        default:       return false;
      }
    });
  }
  // Plain equality
  return docVal === queryVal;
}

function matchDocument(doc, query) {
  return Object.entries(query).every(([field, queryVal]) => matchValue(doc[field], queryVal));
}

// ---------------------------------------------------------------------------
// Check #38: Vulnerable user filter endpoint
// ---------------------------------------------------------------------------
// department is validated against an allowlist (safe), but status comes
// straight from the parsed JSON body without any type or operator check.
// A tester can send { "status": { "$ne": "active" } } to bypass the
// intended equality filter and expose service/admin_reserved accounts.
// ---------------------------------------------------------------------------
function filterUsers(department, status) {
  // Build query
  const query = {};

  // department is safe — string allowlist
  const allowedDepts = ['Engineering', 'Product', 'Security', 'Finance', 'Operations', 'People Ops', 'Legal', 'IT'];
  if (department && department !== 'all' && allowedDepts.includes(department)) {
    query.department = department;
  }

  // status is VULNERABLE — passed directly, no type check, no operator strip
  if (status !== undefined && status !== null && status !== 'all') {
    query.status = status;
  }

  const results = USER_STORE.filter(doc => matchDocument(doc, query));
  return results;
}

module.exports = { filterUsers, USER_STORE };
