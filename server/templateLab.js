'use strict';

// =============================================================================
// templateLab.js — Server-Side Template Engine for Training Check #39
// =============================================================================
// Simulates an internal corporate report generation engine.
// Vulnerability: Server-Side Template Injection (SSTI).
// When constructing reports, user-supplied values (e.g. summary, title, or
// custom report blocks) are interpolated directly into the template definition
// before server-side compilation, rather than passed as isolated data variables.
//
// Template expressions: {{ expression }}
// Safe synthetic context only. No process, fs, require, or command execution.
// =============================================================================

// Evaluates a single template expression against a safe synthetic context
function evaluateExpression(expr, context) {
  expr = expr.trim();
  if (!expr) return '';

  // 1. Literal numbers
  if (/^-?\d+(\.\d+)?$/.test(expr)) {
    return Number(expr);
  }

  // 2. Literal strings: 'hello' or "hello"
  const strMatch = expr.match(/^(['"])(.*)\1$/);
  if (strMatch) {
    return strMatch[2];
  }

  // 3. Literal booleans
  if (expr === 'true') return true;
  if (expr === 'false') return false;
  if (expr === 'null') return null;

  // Security guardrails: reject prototype pollution or sandbox escapes
  const forbiddenPatterns = [
    'process', 'require', 'global', 'globalThis', 'window',
    'constructor', '__proto__', 'prototype', 'eval', 'Function',
    'import', 'child_process', 'fs', 'env', 'exec', 'spawn'
  ];
  for (const word of forbiddenPatterns) {
    const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
    if (wordRegex.test(expr)) {
      return `[Blocked: access to '${word}' is restricted]`;
    }
  }

  // 4. Safe arithmetic expressions: e.g. 7 * 7, 40 + 2, 100 / 5, 2026 - 1
  const mathRegex = /^(-?\d+(?:\.\d+)?)\s*([\+\-\*\/%])\s*(-?\d+(?:\.\d+)?)$/;
  const mathMatch = expr.match(mathRegex);
  if (mathMatch) {
    const left = parseFloat(mathMatch[1]);
    const op = mathMatch[2];
    const right = parseFloat(mathMatch[3]);
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right !== 0 ? left / right : 0;
      case '%': return left % right;
    }
  }

  // 5. String concatenation with numbers or context variables: e.g. companyName + ' Hub'
  if (expr.includes('+')) {
    const parts = expr.split('+').map(p => evaluateExpression(p.trim(), context));
    return parts.join('');
  }

  // 6. Ternary conditional: cond ? val1 : val2
  const ternaryMatch = expr.match(/^([^?]+)\?([^:]+):(.+)$/);
  if (ternaryMatch) {
    const cond = evaluateExpression(ternaryMatch[1], context);
    return cond ? evaluateExpression(ternaryMatch[2], context) : evaluateExpression(ternaryMatch[3], context);
  }

  // 7. Comparison: a == b, a === b, a != b
  const compMatch = expr.match(/^(.+?)\s*(===?|!==?)\s*(.+)$/);
  if (compMatch) {
    const lVal = evaluateExpression(compMatch[1], context);
    const op = compMatch[2];
    const rVal = evaluateExpression(compMatch[3], context);
    return op.startsWith('!') ? lVal != rVal : lVal == rVal;
  }

  // 8. String methods on context variables: e.g. companyName.toUpperCase()
  const methodMatch = expr.match(/^([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\(\)$/);
  if (methodMatch) {
    const varName = methodMatch[1];
    const methodName = methodMatch[2];
    if (varName in context && typeof context[varName] === 'string') {
      const str = context[varName];
      if (methodName === 'toUpperCase') return str.toUpperCase();
      if (methodName === 'toLowerCase') return str.toLowerCase();
      if (methodName === 'trim') return str.trim();
    }
    return '';
  }

  // 9. Context variable lookup (with optional dotted property)
  const parts = expr.split('.');
  let current = context;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return '';
    }
  }
  return current !== undefined ? current : '';
}

// Compiles and renders a template string with {{ expression }} syntax
function renderTemplate(templateString, context) {
  if (typeof templateString !== 'string') return '';

  // Replace each {{ ... }} with its evaluated output
  return templateString.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, expr) => {
    try {
      const result = evaluateExpression(expr, context);
      return result !== undefined && result !== null ? String(result) : '';
    } catch (_) {
      return '';
    }
  });
}

// Built-in report layout definitions
const TEMPLATES = {
  standard: `
<div class="report-document">
  <div class="report-header">
    <div class="report-title-badge">INTERNAL COMPLIANCE &amp; AUDIT</div>
    <h2 class="report-title">{{ reportTitle }}</h2>
    <div class="report-meta-grid">
      <div><strong>Author:</strong> {{ employeeName }}</div>
      <div><strong>Department:</strong> {{ department }}</div>
      <div><strong>Entity:</strong> {{ companyName }}</div>
      <div><strong>Classification:</strong> {{ classification }}</div>
      <div><strong>Report ID:</strong> {{ reportId }}</div>
      <div><strong>Fiscal Quarter:</strong> {{ fiscalYear }} {{ quarter }}</div>
    </div>
  </div>
  <div class="report-divider"></div>
  <div class="report-section">
    <h3>1. Executive Summary</h3>
    <div class="report-content">{{ summary }}</div>
  </div>
  <div class="report-section">
    <h3>2. Operational Status</h3>
    <p>Operational health is currently recorded as <strong>{{ systemStatus }}</strong> across all cluster zones.</p>
  </div>
  <div class="report-footer">
    <p>Generated at {{ generatedAt }} &bull; Reference: {{ portalName }}</p>
  </div>
</div>
`.trim(),

  executive: `
<div class="report-document executive">
  <div class="report-header">
    <div class="report-title-badge">EXECUTIVE BRIEFING</div>
    <h2 class="report-title">{{ reportTitle }}</h2>
    <p class="report-subtitle">{{ companyName }} &bull; {{ department }} Leadership Brief</p>
  </div>
  <div class="report-divider"></div>
  <div class="report-section">
    <h3>Overview</h3>
    <div class="report-content">{{ summary }}</div>
  </div>
  <div class="report-meta-footer">
    <span>Prepared by: {{ employeeName }}</span>
    <span>Date: {{ generatedAt }}</span>
    <span>ID: {{ reportId }}</span>
  </div>
</div>
`.trim(),

  operational: `
<div class="report-document operational">
  <div class="report-header">
    <div class="report-title-badge">OPERATIONS LOG</div>
    <h2 class="report-title">{{ reportTitle }}</h2>
    <p>Dept: {{ department }} &bull; Author: {{ employeeName }} &bull; System: {{ systemStatus }}</p>
  </div>
  <div class="report-section">
    <h3>Operations Summary</h3>
    <div class="report-content">{{ summary }}</div>
  </div>
  <div class="report-footer">
    <small>{{ companyName }} &bull; Generated {{ serverTime }} &bull; {{ reportId }}</small>
  </div>
</div>
`.trim()
};

// Generates a report — SSTI vulnerability:
// User input (summary / title) is concatenated directly into the template
// string before compilation, allowing expression evaluation like {{ 7 * 7 }}.
function generateReport({ title, employee, department, summary, templateFormat }) {
  const reportId = 'RPT-' + Math.floor(10000 + Math.random() * 90000);
  const now = new Date();

  // Safe synthetic context — per requirements:
  // No environment variables, no process, no real secrets.
  const context = {
    companyName: 'Acme Corporation',
    portalName: 'AccessHub Enterprise Portal',
    employeeName: (employee && employee.trim()) || 'Alex Mercer',
    department: (department && department.trim()) || 'Engineering',
    reportTitle: (title && title.trim()) || 'Quarterly Operations Report',
    generatedAt: now.toISOString().slice(0, 10),
    serverTime: now.toUTCString(),
    fiscalYear: 'FY2026',
    quarter: 'Q3',
    systemStatus: 'Operational',
    classification: 'Confidential — Internal Use Only',
    reportId: reportId,
    metrics: {
      uptime: '99.98%',
      activeNodes: 14,
      incidents: 0
    }
  };

  const chosenFormat = TEMPLATES[templateFormat] ? templateFormat : 'standard';
  const baseLayout = TEMPLATES[chosenFormat];

  // VULNERABLE STEP:
  // User-supplied summary and title are interpolated into the template source
  // rather than treated strictly as passive context data.
  // When baseLayout contains {{ summary }} and {{ reportTitle }}, replacing them
  // directly with user input allows the template compiler to evaluate any
  // {{ expression }} tags contained in the user input.
  const rawSummary = summary !== undefined && summary !== null ? String(summary) : 'Standard review completed with no pending anomalies.';
  const rawTitle = title !== undefined && title !== null ? String(title) : 'Quarterly Operations Report';

  const compiledTemplate = baseLayout
    .replace('{{ summary }}', rawSummary)
    .replace('{{ reportTitle }}', rawTitle);

  // Server-side template compilation and evaluation
  const renderedContent = renderTemplate(compiledTemplate, context);

  return {
    reportId,
    title: rawTitle,
    employee: context.employeeName,
    department: context.department,
    templateFormat: chosenFormat,
    generatedAt: context.generatedAt,
    renderedContent
  };
}

module.exports = {
  renderTemplate,
  generateReport,
  evaluateExpression,
  TEMPLATES
};
