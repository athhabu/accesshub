'use strict';

// =============================================================================
// xpathLab.js — Synthetic XML Document Store & XPath Query Engine for Check #40
// =============================================================================
// Simulates an internal corporate document repository backed by XML data.
// Vulnerability: XPath Injection.
// When querying documents, user input (title query) is concatenated directly
// into an XPath expression without sanitization. An attacker can inject boolean
// operators (' or '1'='1, or status='restricted', etc.) or union expressions (|)
// to bypass normal document filters and expose confidential or restricted documents.
// =============================================================================

// Synthetic corporate XML document dataset
const RAW_XML = `<?xml version="1.0" encoding="UTF-8"?>
<documents>
  <document>
    <id>DOC-1001</id>
    <title>Quarterly Operations Report</title>
    <owner>Alex Mercer</owner>
    <department>Engineering</department>
    <category>Operations</category>
    <status>active</status>
    <classification>Internal</classification>
    <createdDate>2026-01-15</createdDate>
  </document>
  <document>
    <id>DOC-1002</id>
    <title>Infrastructure Architecture Overview</title>
    <owner>Sarah Jenkins</owner>
    <department>Engineering</department>
    <category>Engineering</category>
    <status>active</status>
    <classification>Internal</classification>
    <createdDate>2026-02-10</createdDate>
  </document>
  <document>
    <id>DOC-1003</id>
    <title>Q1 Budget Allocation and Expense Forecast</title>
    <owner>Chloe Bennett</owner>
    <department>Finance</department>
    <category>Finance</category>
    <status>active</status>
    <classification>Confidential</classification>
    <createdDate>2026-03-01</createdDate>
  </document>
  <document>
    <id>DOC-1004</id>
    <title>Cybersecurity Incident Response Playbook</title>
    <owner>Elena Rodriguez</owner>
    <department>Security</department>
    <category>Security</category>
    <status>active</status>
    <classification>Confidential</classification>
    <createdDate>2026-03-14</createdDate>
  </document>
  <document>
    <id>DOC-1005</id>
    <title>Annual Executive Compensation Review</title>
    <owner>Maya Patel</owner>
    <department>People Ops</department>
    <category>Human Resources</category>
    <status>restricted</status>
    <classification>Restricted</classification>
    <createdDate>2026-04-02</createdDate>
  </document>
  <document>
    <id>DOC-1006</id>
    <title>Cloud Migration &amp; Kubernetes Runbook</title>
    <owner>Priya Nair</owner>
    <department>Engineering</department>
    <category>Engineering</category>
    <status>active</status>
    <classification>Internal</classification>
    <createdDate>2026-04-18</createdDate>
  </document>
  <document>
    <id>DOC-1007</id>
    <title>Vendor Master Services Agreement (MSA)</title>
    <owner>James Holbrook</owner>
    <department>Legal</department>
    <category>Legal</category>
    <status>active</status>
    <classification>Confidential</classification>
    <createdDate>2026-05-11</createdDate>
  </document>
  <document>
    <id>DOC-1008</id>
    <title>Executive Merger &amp; Acquisition Strategy</title>
    <owner>Marcus Vance</owner>
    <department>Executive</department>
    <category>Strategy</category>
    <status>restricted</status>
    <classification>Restricted</classification>
    <createdDate>2026-05-29</createdDate>
  </document>
  <document>
    <id>DOC-1009</id>
    <title>Hardware Asset Disposition Policy</title>
    <owner>Thomas Reed</owner>
    <department>Operations</department>
    <category>Operations</category>
    <status>active</status>
    <classification>Internal</classification>
    <createdDate>2026-06-08</createdDate>
  </document>
  <document>
    <id>DOC-1010</id>
    <title>Product Roadmap &amp; Feature Backlog</title>
    <owner>David Chen</owner>
    <department>Product</department>
    <category>Product</category>
    <status>active</status>
    <classification>Internal</classification>
    <createdDate>2026-07-01</createdDate>
  </document>
  <document>
    <id>DOC-1011</id>
    <title>Legacy Backup Procedures (Archived)</title>
    <owner>Thomas Reed</owner>
    <department>Operations</department>
    <category>Operations</category>
    <status>archived</status>
    <classification>Internal</classification>
    <createdDate>2025-11-20</createdDate>
  </document>
  <document>
    <id>DOC-1012</id>
    <title>Internal Security Assessment &amp; Findings</title>
    <owner>Elena Rodriguez</owner>
    <department>Security</department>
    <category>Security</category>
    <status>restricted</status>
    <classification>Restricted</classification>
    <createdDate>2026-08-15</createdDate>
  </document>
</documents>`;

// ---------------------------------------------------------------------------
// XML Document Node Structure & Parser
// ---------------------------------------------------------------------------

class XMLNode {
  constructor(tag, parent = null) {
    this.tag = tag;
    this.parent = parent;
    this.children = [];
    this.text = '';
  }

  // Returns child text by child tag name
  getChildText(tagName) {
    const child = this.children.find(c => c.tag.toLowerCase() === tagName.toLowerCase());
    return child ? child.text : '';
  }

  // Converts document node to JSON object
  toObject() {
    const obj = {};
    for (const c of this.children) {
      obj[c.tag] = c.text;
    }
    return obj;
  }
}

// Parses raw XML string into a tree of XMLNode instances
function parseXML(xmlString) {
  // Remove XML declaration and comments
  let cleanXml = xmlString.replace(/<\?xml.*?\?>/gs, '').replace(/<!--.*?-->/gs, '').trim();

  // Tokenize tags and text
  const tagRegex = /<(\/)?([a-zA-Z0-9_\-]+)([^>]*)>|([^<]+)/g;
  let root = null;
  let current = null;
  let match;

  while ((match = tagRegex.exec(cleanXml)) !== null) {
    const isClosing = match[1] === '/';
    const tagName = match[2];
    const textContent = match[4];

    if (tagName) {
      if (isClosing) {
        if (current && current.parent) {
          current = current.parent;
        }
      } else {
        const node = new XMLNode(tagName, current);
        if (!root) root = node;
        if (current) current.children.push(node);
        current = node;
      }
    } else if (textContent && current) {
      const decoded = textContent
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .trim();
      if (decoded) {
        current.text += (current.text ? ' ' : '') + decoded;
      }
    }
  }

  return root;
}

const PARSED_ROOT = parseXML(RAW_XML);

// ---------------------------------------------------------------------------
// Genuine XPath Expression Parser & Evaluator
// ---------------------------------------------------------------------------

// Evaluates a single predicate expression string against an XMLNode
function evaluatePredicate(predStr, node) {
  predStr = predStr.trim();
  if (!predStr) return true;

  // Handle outer parentheses: (expr)
  if (predStr.startsWith('(') && predStr.endsWith(')')) {
    // Verify balanced parens
    let depth = 0;
    let balanced = true;
    for (let i = 0; i < predStr.length - 1; i++) {
      if (predStr[i] === '(') depth++;
      else if (predStr[i] === ')') {
        depth--;
        if (depth === 0) { balanced = false; break; }
      }
    }
    if (balanced) {
      return evaluatePredicate(predStr.slice(1, -1), node);
    }
  }

  // Split top-level ' or ' operators (respecting parens and quotes)
  const orParts = splitByOperator(predStr, 'or');
  if (orParts.length > 1) {
    return orParts.some(p => evaluatePredicate(p, node));
  }

  // Split top-level ' and ' operators
  const andParts = splitByOperator(predStr, 'and');
  if (andParts.length > 1) {
    return andParts.every(p => evaluatePredicate(p, node));
  }

  // Handle not(...)
  const notMatch = predStr.match(/^not\((.+)\)$/);
  if (notMatch) {
    return !evaluatePredicate(notMatch[1], node);
  }

  // Handle contains(...) function
  // contains(tag, 'substr') or contains(text(), 'substr') or contains(., 'substr')
  const containsMatch = predStr.match(/^contains\(\s*([a-zA-Z0-9_\-\.\(\)]+)\s*,\s*(['"])(.*?)\2\s*\)$/i);
  if (containsMatch) {
    const target = containsMatch[1].trim();
    const substr = containsMatch[3].toLowerCase();

    let targetValue = '';
    if (target === 'text()' || target === '.') {
      targetValue = (node.text + ' ' + node.children.map(c => c.text).join(' ')).toLowerCase();
    } else {
      targetValue = node.getChildText(target).toLowerCase();
    }
    return targetValue.includes(substr);
  }

  // Comparison: left = right or left != right
  const compMatch = predStr.match(/^(.+?)\s*(=|!=)\s*(.+)$/);
  if (compMatch) {
    const rawLeft = compMatch[1].trim();
    const op = compMatch[2];
    const rawRight = compMatch[3].trim();

    const leftVal = resolveOperand(rawLeft, node);
    const rightVal = resolveOperand(rawRight, node);

    return op === '=' ? leftVal == rightVal : leftVal != rightVal;
  }

  // Standalone truthy checks (e.g. true(), 1, 0, '1')
  if (predStr === 'true()' || predStr === '1') return true;
  if (predStr === 'false()' || predStr === '0') return false;

  return Boolean(predStr);
}

// Resolves an operand: string literal, number literal, or node tag text
function resolveOperand(opStr, node) {
  opStr = opStr.trim();
  // Strip outer parens
  while (opStr.startsWith('(') && opStr.endsWith(')')) {
    opStr = opStr.slice(1, -1).trim();
  }

  // String literal 'val' or "val"
  const strMatch = opStr.match(/^(['"])(.*)\1$/);
  if (strMatch) return strMatch[2];

  // Number literal
  if (/^-?\d+(\.\d+)?$/.test(opStr)) return Number(opStr);

  // Function: text()
  if (opStr === 'text()') return node.text;

  // Node child text (e.g. status, category, title, owner)
  const childVal = node.getChildText(opStr);
  if (childVal) return childVal;

  return opStr;
}

// Splits a predicate string by a boolean keyword ('and' or 'or') only at depth 0
function splitByOperator(str, opKeyword) {
  const parts = [];
  let depth = 0;
  let inQuote = null;
  let start = 0;
  const opLen = opKeyword.length;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inQuote = ch;
      continue;
    }
    if (ch === '(') depth++;
    else if (ch === ')') depth--;

    if (depth === 0) {
      const candidate = str.slice(i, i + opLen + 2);
      const isMatch = candidate.toLowerCase() === ` ${opKeyword} `;
      if (isMatch) {
        parts.push(str.slice(start, i).trim());
        start = i + opLen + 2;
        i = start - 1;
      }
    }
  }
  parts.push(str.slice(start).trim());
  return parts.filter(p => p.length > 0);
}

// Evaluates an XPath expression against an XML root node
function evaluateXPath(xpath, rootNode) {
  if (!xpath || typeof xpath !== 'string') return [];
  xpath = xpath.trim();

  // Handle union operator: xpath1 | xpath2
  if (xpath.includes('|')) {
    const branches = splitUnion(xpath);
    if (branches.length > 1) {
      const combined = new Map();
      for (const branch of branches) {
        const res = evaluateXPath(branch, rootNode);
        for (const doc of res) {
          combined.set(doc.id, doc);
        }
      }
      return Array.from(combined.values());
    }
  }

  // Parse path and predicate:
  // e.g. /documents/document[pred] or //document[pred] or /documents/document
  const match = xpath.match(/^(?:\/documents)?\/(?:\/)?document(?:\[([\s\S]*)\])?$/i);
  if (!match) {
    // Malformed XPath syntax or unsupported root
    return [];
  }

  const predicate = match[1];

  // Candidate nodes are all <document> elements
  const documents = (rootNode && rootNode.children) ? rootNode.children.filter(c => c.tag.toLowerCase() === 'document') : [];

  if (!predicate) {
    return documents.map(d => d.toObject());
  }

  const matched = [];
  for (const docNode of documents) {
    try {
      if (evaluatePredicate(predicate, docNode)) {
        matched.push(docNode.toObject());
      }
    } catch (_) {
      // Ignore evaluation errors on bad branches
    }
  }

  return matched;
}

function splitUnion(str) {
  const parts = [];
  let depth = 0;
  let inQuote = null;
  let start = 0;

  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inQuote = ch;
      continue;
    }
    if (ch === '[' || ch === '(') depth++;
    else if (ch === ']' || ch === ')') depth--;

    if (depth === 0 && ch === '|') {
      parts.push(str.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(str.slice(start).trim());
  return parts.filter(p => p.length > 0);
}

// ---------------------------------------------------------------------------
// Check #40: Vulnerable Document Lookup
// ---------------------------------------------------------------------------
// When querying documents, the title parameter is concatenated directly into
// the XPath expression without sanitization.
//
// Normal query:
//   /documents/document[status='active' and contains(title, 'Quarterly')]
//
// Injected query:
//   /documents/document[status='active' and contains(title, '') or ('1'='1')]
//   by supplying: ') or ('1'='1
//
// Bypasses the status='active' predicate and reveals restricted documents.
// ---------------------------------------------------------------------------
function lookupDocuments(category, owner, titleQuery) {
  const cleanCat = (category && category !== 'all') ? category.replace(/['"\\()\[\]]/g, '') : null;
  const cleanOwner = (owner && owner !== 'all') ? owner.replace(/['"\\()\[\]]/g, '') : null;

  // Unsanitized title query — vulnerable injection point
  const rawTitle = titleQuery !== undefined && titleQuery !== null ? String(titleQuery) : '';

  let xpathExpr;
  if (cleanCat && cleanOwner) {
    xpathExpr = `/documents/document[status='active' and category='${cleanCat}' and owner='${cleanOwner}' and contains(title, '${rawTitle}')]`;
  } else if (cleanCat) {
    xpathExpr = `/documents/document[status='active' and category='${cleanCat}' and contains(title, '${rawTitle}')]`;
  } else if (cleanOwner) {
    xpathExpr = `/documents/document[status='active' and owner='${cleanOwner}' and contains(title, '${rawTitle}')]`;
  } else {
    xpathExpr = `/documents/document[status='active' and contains(title, '${rawTitle}')]`;
  }

  let results = [];
  try {
    results = evaluateXPath(xpathExpr, PARSED_ROOT);
  } catch (_) {
    results = [];
  }

  return {
    query: xpathExpr,
    count: results.length,
    documents: results
  };
}

module.exports = {
  RAW_XML,
  PARSED_ROOT,
  parseXML,
  evaluateXPath,
  lookupDocuments
};
