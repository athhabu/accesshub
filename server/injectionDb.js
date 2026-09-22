'use strict';

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

// Path to the isolated synthetic SQLite database for Injection training checks
const DB_PATH = path.join(__dirname, '../data/injection-lab.sqlite');

const injectionDb = new DatabaseSync(DB_PATH);

// Initialize schema and seed data
function initInjectionDb() {
  // Employees table for Check #33 (Employee Search — SQL Injection)
  injectionDb.exec(`
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      emp_id TEXT NOT NULL,
      name TEXT NOT NULL,
      department TEXT NOT NULL,
      role TEXT NOT NULL,
      location TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL
    );
  `);

  // Orders table for Check #34 (Order Lookup — SQL Injection)
  injectionDb.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      requester_name TEXT NOT NULL,
      requester_email TEXT NOT NULL,
      department TEXT NOT NULL,
      amount REAL NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      description TEXT NOT NULL
    );
  `);

  // Seed employees if empty
  const empCount = injectionDb.prepare('SELECT COUNT(*) AS count FROM employees').get();
  if (empCount.count === 0) {
    const insertEmp = injectionDb.prepare(`
      INSERT INTO employees (emp_id, name, department, role, location, email, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const employees = [
      ['EMP-10482', 'Alex Mercer',      'Engineering', 'Senior Full-Stack Engineer', 'San Francisco HQ', 'alex.mercer@accesshub.internal',   '+1 (415) 555-0182'],
      ['EMP-10401', 'Sarah Jenkins',    'Engineering', 'Principal Product Architect', 'San Francisco HQ', 'sarah.jenkins@accesshub.internal', '+1 (415) 555-0144'],
      ['EMP-10024', 'Marcus Vance',     'Engineering', 'VP of Engineering',           'San Francisco HQ', 'marcus.vance@accesshub.internal',   '+1 (415) 555-0100'],
      ['EMP-10311', 'David Chen',       'Product',     'Lead Product Manager',        'New York Office',  'david.chen@accesshub.internal',     '+1 (212) 555-0133'],
      ['EMP-10550', 'Elena Rodriguez',  'Security',    'Senior Security Engineer',    'Austin Hub',       'elena.rodriguez@accesshub.internal', '+1 (512) 555-0177'],
      ['EMP-10620', 'Chloe Bennett',    'Finance',     'Senior Financial Analyst',    'Chicago Office',   'chloe.bennett@accesshub.internal',   '+1 (312) 555-0199'],
      ['EMP-10705', 'Thomas Reed',      'Operations',  'IT Systems Administrator',    'San Francisco HQ', 'thomas.reed@accesshub.internal',     '+1 (415) 555-0165'],
      ['EMP-10812', 'Maya Patel',       'People Ops',  'HR Operations Lead',          'New York Office',  'maya.patel@accesshub.internal',      '+1 (212) 555-0188']
    ];

    for (const emp of employees) {
      insertEmp.run(...emp);
    }
  }

  // Seed orders if empty
  const orderCount = injectionDb.prepare('SELECT COUNT(*) AS count FROM orders').get();
  if (orderCount.count === 0) {
    const insertOrder = injectionDb.prepare(`
      INSERT INTO orders (order_number, title, requester_name, requester_email, department, amount, status, created_at, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const orders = [
      ['ORD-7920', 'Enterprise Cloud Workstation Cluster',          'Alex Mercer',   'alex.mercer@accesshub.internal',   'Engineering', 4850.00,  'Approved',         '2026-08-14', 'High-performance compute node for platform stress testing.'],
      ['ORD-7811', 'Annual Financial Forecasting Software License', 'Chloe Bennett', 'chloe.bennett@accesshub.internal', 'Finance',     12400.00, 'Approved',         '2026-07-20', 'Multi-user enterprise license for FP&A department.'],
      ['ORD-7935', 'Development Workstation Hardware Refresh',      'Sarah Jenkins', 'sarah.jenkins@accesshub.internal', 'Engineering', 2499.00,  'Pending Approval', '2026-09-15', 'Ergonomic peripherals and dual 4K monitors for engineering workstation.'],
      ['ORD-7940', 'Infrastructure Network Security Appliances',     'Marcus Vance',  'marcus.vance@accesshub.internal',  'Engineering', 8750.00,  'Under Review',     '2026-09-18', 'Redundant switchgear and hardware security modules for server room rack 3.'],
      ['ORD-9118', 'Human Resources Management Portal Expansion',    'Maya Patel',    'maya.patel@accesshub.internal',   'People Ops',  3100.00,  'Approved',         '2026-09-02', 'Onboarding module licenses and compliance tracking tools.']
    ];

    for (const ord of orders) {
      insertOrder.run(...ord);
    }
  }

  // Employee Activity table for Check #35 (Report Filtering — Blind SQL Injection)
  injectionDb.exec(`
    CREATE TABLE IF NOT EXISTS employee_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_name TEXT NOT NULL,
      department TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      status TEXT NOT NULL,
      project TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      impact_score INTEGER NOT NULL
    );
  `);

  // Seed employee activity if empty
  const actCount = injectionDb.prepare('SELECT COUNT(*) AS count FROM employee_activity').get();
  if (actCount.count === 0) {
    const insertAct = injectionDb.prepare(`
      INSERT INTO employee_activity (employee_name, department, activity_type, status, project, timestamp, impact_score)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const activities = [
      ['Alex Mercer',     'Engineering', 'Code Review & Merge',       'Completed',   'Identity Gateway v3',     '2026-09-18 14:22', 92],
      ['Sarah Jenkins',   'Engineering', 'Architecture RFC Review',   'Completed',   'Zero-Trust Proxy',        '2026-09-17 11:05', 95],
      ['Marcus Vance',    'Engineering', 'Sprint Planning & Signoff', 'Completed',   'Core Platform Infra',     '2026-09-16 09:30', 88],
      ['Alex Mercer',     'Engineering', 'Load Testing Automation',   'In Progress', 'VPC Edge Microservices',  '2026-09-19 16:45', 85],
      ['Sarah Jenkins',   'Engineering', 'API Spec Audit',            'Completed',   'Developer SDK 2.0',       '2026-09-15 13:10', 90],
      ['Elena Rodriguez', 'Security',    'Vulnerability Triage',      'Completed',   'SOC-2 Compliance Scan',   '2026-09-18 10:15', 96],
      ['Elena Rodriguez', 'Security',    'Firewall Rule Policy Sync', 'Completed',   'Internal Bastion Host',   '2026-09-16 15:40', 94],
      ['Elena Rodriguez', 'Security',    'Certificate Rotation',      'In Progress', 'Wildcard TLS Upgrades',   '2026-09-19 11:20', 89],
      ['Chloe Bennett',   'Finance',     'Quarterly Ledger Audit',    'Completed',   'Q3 Fiscal Close',         '2026-09-18 17:00', 91],
      ['Chloe Bennett',   'Finance',     'Vendor Invoice Review',     'Completed',   'Cloud Infra Invoicing',   '2026-09-15 14:30', 87],
      ['David Chen',      'Product',     'Roadmap Feature Prioritize','Completed',   'AccessHub Web Portal',    '2026-09-17 10:00', 88],
      ['David Chen',      'Product',     'Customer Feedback Triage',  'In Progress', 'User Experience Pulse',   '2026-09-19 14:15', 84],
      ['Thomas Reed',     'Operations',  'Server Firmware Patching',  'Completed',   'San Francisco Rack 4',    '2026-09-16 18:00', 93],
      ['Maya Patel',      'People Ops',  'New Hire Security Briefing','Completed',   'Engineering Cohort Sept', '2026-09-15 09:00', 90]
    ];

    for (const act of activities) {
      insertAct.run(...act);
    }
  }
}

// Check #33: Employee Search Query Function
// Intentionally vulnerable to SQL injection via unescaped string interpolation
function searchEmployees(q) {
  // Vulnerable SQL query: concatenates user input directly into LIKE expression
  const sql = `SELECT emp_id, name, department, role, location, email, phone FROM employees WHERE name LIKE '%${q}%' OR department LIKE '%${q}%'`;
  return injectionDb.prepare(sql).all();
}

// Check #34: Order Lookup Query Function
// Intentionally vulnerable to SQL injection via unescaped string interpolation
// Enforces department authorization scope independently to avoid IDOR/BAC flaw
function lookupOrder(reference, user) {
  const userDept = user && user.department ? user.department : 'Engineering';
  const isAdmin = user && user.role === 'Administrator';

  // Scope check: an employee can only view orders within their department, unless Administrator
  const authClause = isAdmin ? "1=1" : `department = '${userDept}'`;

  // Vulnerable SQL query: interpolates reference parameter directly into WHERE clause
  const sql = `SELECT order_number, title, requester_name, requester_email, department, amount, status, created_at, description FROM orders WHERE (${authClause}) AND order_number = '${reference}'`;
  return injectionDb.prepare(sql).get();
}

// Check #35: Employee Activity Report Query Function
// Intentionally vulnerable to Blind SQL Injection via department parameter
// Suppresses database errors completely — results vary purely by boolean query outcome
function filterActivityReport(department, status) {
  const dept = department !== undefined ? String(department) : 'Engineering';
  let statusClause = '';
  if (status && status !== 'all') {
    statusClause = ` AND status = '${status.replace(/'/g, "''")}'`;
  }

  // Vulnerable SQL query: interpolates department parameter directly into WHERE clause
  const sql = `SELECT employee_name, department, activity_type, status, project, timestamp, impact_score FROM employee_activity WHERE department = '${dept}'${statusClause} ORDER BY id ASC`;

  try {
    const results = injectionDb.prepare(sql).all();
    return { count: results.length, results };
  } catch (err) {
    // Blind behavior: suppress SQL error details and return empty dataset
    return { count: 0, results: [] };
  }
}

initInjectionDb();

module.exports = {
  injectionDb,
  searchEmployees,
  lookupOrder,
  filterActivityReport
};
