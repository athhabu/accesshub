'use strict';

// =============================================================================
// secondOrderSqlLab.js — Service Request System for Check #42
// =============================================================================
// Simulates a two-stage corporate "Service Request" system.
//
// Stage 1 — Submission (safe): User-supplied data is inserted into the
//   `service_requests` table using parameterized SQL with no injection vector.
//
// Stage 2 — Report Generation (vulnerable): When a manager triggers a
//   report, the system reads the stored requestor_name from the database
//   and uses it to build a second, aggregation SQL query via string
//   concatenation. An attacker can register with a crafted name
//   (e.g. "' OR '1'='1") so that the SECOND query at report time is injected.
//
// This is entirely separate from injectionDb.js. It uses its own SQLite file
// so the injection-lab.sqlite data is never polluted by these writes.
// =============================================================================

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '../data/second-order-lab.sqlite');

const db = new DatabaseSync(DB_PATH);

// ─── Schema ──────────────────────────────────────────────────────────────────

function initSecondOrderDb() {
  // Stage 1 storage: requests are inserted safely using parameterized queries
  db.exec(`
    CREATE TABLE IF NOT EXISTS service_requests (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_number     TEXT UNIQUE NOT NULL,
      requestor_name    TEXT NOT NULL,
      requestor_email   TEXT NOT NULL,
      department        TEXT NOT NULL,
      category          TEXT NOT NULL,
      priority          TEXT NOT NULL,
      subject           TEXT NOT NULL,
      description       TEXT NOT NULL,
      status            TEXT NOT NULL DEFAULT 'Pending',
      submitted_at      TEXT NOT NULL
    );
  `);

  // Stage 2 report aggregation table (written by the trigger report action)
  db.exec(`
    CREATE TABLE IF NOT EXISTS request_reports (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      requestor   TEXT NOT NULL,
      department  TEXT NOT NULL,
      period      TEXT NOT NULL,
      total       INTEGER NOT NULL DEFAULT 0,
      generated_at TEXT NOT NULL
    );
  `);

  // Seed realistic starter requests (all safe inputs)
  const count = db.prepare('SELECT COUNT(*) AS n FROM service_requests').get();
  if (count.n === 0) {
    const insert = db.prepare(`
      INSERT INTO service_requests
        (ticket_number, requestor_name, requestor_email, department, category, priority, subject, description, status, submitted_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const seed = [
      [
        'SR-10401',
        'Alex Mercer',
        'alex.mercer@accesshub.internal',
        'Engineering',
        'Hardware',
        'Normal',
        'External Monitor Replacement',
        'Existing external monitor failed. Requesting a replacement 27" 4K display.',
        'Approved',
        '2026-09-10T09:14:00Z'
      ],
      [
        'SR-10314',
        'Chloe Bennett',
        'chloe.bennett@accesshub.internal',
        'Finance',
        'Software License',
        'High',
        'Renewal: FP&A Analytics Suite',
        'The annual subscription for the financial analytics platform is expiring.',
        'Approved',
        '2026-09-08T11:30:00Z'
      ],
      [
        'SR-10519',
        'Maya Patel',
        'maya.patel@accesshub.internal',
        'People Ops',
        'Access Request',
        'Normal',
        'Workday Admin Panel Read Access',
        'Requesting read-only access to the Workday admin panel for onboarding audits.',
        'Pending',
        '2026-09-19T14:05:00Z'
      ],
      [
        'SR-10603',
        'Thomas Reed',
        'thomas.reed@accesshub.internal',
        'Operations',
        'Network',
        'Urgent',
        'VPN Gateway Configuration Reset',
        'The primary VPN gateway is returning intermittent errors. A configuration reset is needed.',
        'In Progress',
        '2026-09-20T08:45:00Z'
      ],
      [
        'SR-10712',
        'Elena Rodriguez',
        'elena.rodriguez@accesshub.internal',
        'Security',
        'Compliance',
        'High',
        'SOC-2 Evidence Collection — Q3',
        'Gathering system log exports and screenshots required for Q3 SOC-2 audit evidence package.',
        'Approved',
        '2026-09-17T16:20:00Z'
      ]
    ];

    for (const row of seed) {
      insert.run(...row);
    }
  }
}

// ─── Stage 1: Submit Service Request (Safe — Parameterized) ──────────────────

/**
 * Stores a new service request. All user values are bound via prepared
 * statement parameters — no injection vector at this stage.
 */
function submitRequest(data) {
  const {
    requestorName,
    requestorEmail,
    department,
    category,
    priority,
    subject,
    description
  } = data;

  if (!requestorName || !subject) {
    throw new Error('requestorName and subject are required');
  }

  // Generate a pseudo-random ticket number
  const ticketNum = `SR-${Math.floor(10000 + Math.random() * 90000)}`;
  const submittedAt = new Date().toISOString();

  // ── SAFE INSERTION — parameterized ──────────────────────────────────────
  // No injection possible here. requestorName is stored as literal data.
  // ────────────────────────────────────────────────────────────────────────
  const stmt = db.prepare(`
    INSERT INTO service_requests
      (ticket_number, requestor_name, requestor_email, department, category, priority, subject, description, status, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', ?)
  `);

  stmt.run(
    ticketNum,
    String(requestorName),
    String(requestorEmail || ''),
    String(department || 'General'),
    String(category || 'General'),
    String(priority || 'Normal'),
    String(subject),
    String(description || ''),
    submittedAt
  );

  return { ticketNumber: ticketNum, submittedAt };
}

// ─── Stage 1: List Service Requests (Safe — Parameterized) ───────────────────

/**
 * Returns a list of service requests filtered by status.
 * Fully parameterized — no injection vector.
 */
function listRequests(statusFilter) {
  if (statusFilter && statusFilter !== 'all') {
    return db.prepare(
      'SELECT id, ticket_number, requestor_name, department, category, priority, subject, status, submitted_at FROM service_requests WHERE status = ? ORDER BY id DESC'
    ).all(statusFilter);
  }
  return db.prepare(
    'SELECT id, ticket_number, requestor_name, department, category, priority, subject, status, submitted_at FROM service_requests ORDER BY id DESC'
  ).all();
}

// ─── Stage 2: Generate Report (VULNERABLE — Second-Order SQL Injection) ───────

/**
 * Generates an aggregated activity report for a stored requestor.
 *
 * VULNERABILITY: The requestor_name is read from the DB (stored in stage 1),
 * then directly concatenated into the aggregation SQL query string below
 * without sanitization. If an attacker submitted a request with a crafted
 * requestorName, the injected payload executes here.
 *
 * Example injected name (stage 1):  ' OR '1'='1
 * Resulting stage-2 SQL:
 *   SELECT COUNT(*) AS total FROM service_requests
 *   WHERE requestor_name = '' OR '1'='1'
 *
 * This is a classic second-order (stored) SQL injection: the payload bypasses
 * the safe insertion point and fires in a separate, later query context.
 */
function generateRequestReport(requestId) {
  // Step A: Read the stored requestor_name using a parameterized lookup
  const row = db.prepare(
    'SELECT * FROM service_requests WHERE id = ?'
  ).get(requestId);

  if (!row) {
    return { error: 'Request not found', requestId };
  }

  const storedName = row.requestor_name;    // retrieved from safe stage-1 write
  const period     = new Date().toISOString().slice(0, 7);  // "YYYY-MM"

  // ── VULNERABLE STEP ─────────────────────────────────────────────────────
  // The stored requestor_name is interpolated directly into the SQL query.
  // If the attacker provided a crafted name at submission time, their payload
  // now executes inside this second query.
  //
  // Normal:   WHERE requestor_name = 'Alex Mercer'
  // Injected: WHERE requestor_name = '' OR '1'='1'
  // ─────────────────────────────────────────────────────────────────────────
  const countSql = `
    SELECT COUNT(*) AS total FROM service_requests
    WHERE requestor_name = '${storedName}'
  `;

  let total = 0;
  let rawCount;
  let sqlError = null;
  try {
    rawCount = db.prepare(countSql).get();
    total    = rawCount ? rawCount.total : 0;
  } catch (err) {
    sqlError = err.message;
  }

  // Log the generated report (safe parameterized insert)
  try {
    db.prepare(`
      INSERT INTO request_reports (requestor, department, period, total, generated_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(storedName, row.department, period, total, new Date().toISOString());
  } catch (_) {
    // Non-critical — report still returned
  }

  return {
    requestId,
    ticketNumber: row.ticket_number,
    requestorName: storedName,
    department: row.department,
    period,
    totalRequests: total,
    generatedSql: countSql.trim(),   // Exposed for lab learning context
    error: sqlError
  };
}

// ─── Init ─────────────────────────────────────────────────────────────────────

initSecondOrderDb();

module.exports = { submitRequest, listRequests, generateRequestReport };
