'use strict';

// =============================================================================
// expressionLab.js — Business Expression Evaluator for Check #41
// =============================================================================
// Simulates a corporate expense/finance calculation engine that processes
// configurable business expressions (amount * quantity, subtotal - discount,
// etc.) using a custom expression-language interpreter.
//
// Vulnerability: Expression Language Injection (ELI).
// The evaluator takes a user-supplied adjustment formula string and
// concatenates it directly into a full expression before evaluation.
// An attacker can inject additional EL syntax (e.g. + process.env.JWT_SECRET
// or * (quantity + amount)) to observe how expression context variables are
// accessed and calculations affected.
//
// The expression language is a safe, isolated mini-EL interpreter:
//   - No JS eval(), new Function(), or child_process
//   - No access to process, fs, require, global, or environment
//   - Only approves: arithmetic operators (+, -, *, /, %), named variables,
//     numeric literals, parentheses, comparison operators
// =============================================================================

// Approved synthetic context variables available to the EL evaluator.
// Only business-domain values are exposed — no secrets, env, or OS primitives.
const APPROVED_VARIABLES = new Set([
  'amount',
  'quantity',
  'discount',
  'taxRate',
  'departmentBudget',
  'subtotal',
  'adjustmentRate',
  'unitCost',
  'overhead',
  'margin'
]);

// ─── Tokenizer ───────────────────────────────────────────────────────────────

const TOKEN_TYPES = {
  NUMBER:   'NUMBER',
  IDENT:    'IDENT',
  OP:       'OP',
  LPAREN:   'LPAREN',
  RPAREN:   'RPAREN',
  EOF:      'EOF'
};

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];

    // Skip whitespace
    if (/\s/.test(ch)) { i++; continue; }

    // Number literal (integer or decimal)
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < expr.length && /[0-9.]/.test(expr[i])) num += expr[i++];
      tokens.push({ type: TOKEN_TYPES.NUMBER, value: parseFloat(num) });
      continue;
    }

    // Identifier (variable name)
    if (/[a-zA-Z_]/.test(ch)) {
      let name = '';
      while (i < expr.length && /[a-zA-Z0-9_]/.test(expr[i])) name += expr[i++];
      tokens.push({ type: TOKEN_TYPES.IDENT, value: name });
      continue;
    }

    // Operators
    if (['+', '-', '*', '/', '%'].includes(ch)) {
      tokens.push({ type: TOKEN_TYPES.OP, value: ch });
      i++;
      continue;
    }

    // Parentheses
    if (ch === '(') { tokens.push({ type: TOKEN_TYPES.LPAREN }); i++; continue; }
    if (ch === ')') { tokens.push({ type: TOKEN_TYPES.RPAREN }); i++; continue; }

    // Any other character is disallowed
    throw new Error(`Unexpected character in expression: '${ch}'`);
  }
  tokens.push({ type: TOKEN_TYPES.EOF });
  return tokens;
}

// ─── Recursive-Descent Parser ────────────────────────────────────────────────
// Grammar:
//   expr   := term  (('+' | '-') term)*
//   term   := factor (('*' | '/' | '%') factor)*
//   factor := ['-'] primary
//   primary:= NUMBER | IDENT | '(' expr ')'

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() { return this.tokens[this.pos]; }
  consume() { return this.tokens[this.pos++]; }

  parseExpr() {
    let left = this.parseTerm();
    while (this.peek().type === TOKEN_TYPES.OP &&
           (this.peek().value === '+' || this.peek().value === '-')) {
      const op = this.consume().value;
      const right = this.parseTerm();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  parseTerm() {
    let left = this.parseFactor();
    while (this.peek().type === TOKEN_TYPES.OP &&
           ['*', '/', '%'].includes(this.peek().value)) {
      const op = this.consume().value;
      const right = this.parseFactor();
      left = { type: 'BinaryOp', op, left, right };
    }
    return left;
  }

  parseFactor() {
    // Unary minus
    if (this.peek().type === TOKEN_TYPES.OP && this.peek().value === '-') {
      this.consume();
      const operand = this.parsePrimary();
      return { type: 'UnaryMinus', operand };
    }
    return this.parsePrimary();
  }

  parsePrimary() {
    const tok = this.peek();

    if (tok.type === TOKEN_TYPES.NUMBER) {
      this.consume();
      return { type: 'Literal', value: tok.value };
    }

    if (tok.type === TOKEN_TYPES.IDENT) {
      this.consume();
      return { type: 'Variable', name: tok.value };
    }

    if (tok.type === TOKEN_TYPES.LPAREN) {
      this.consume(); // consume '('
      const inner = this.parseExpr();
      if (this.peek().type !== TOKEN_TYPES.RPAREN) {
        throw new Error('Expected closing parenthesis');
      }
      this.consume(); // consume ')'
      return inner;
    }

    throw new Error(`Unexpected token: ${tok.type} (${tok.value || ''})`);
  }
}

// ─── AST Evaluator ───────────────────────────────────────────────────────────

function evalAST(node, context) {
  switch (node.type) {
    case 'Literal':
      return node.value;

    case 'Variable': {
      const name = node.name;
      // Security: only approved variable names reach here
      if (!APPROVED_VARIABLES.has(name)) {
        throw new Error(`Undeclared variable: '${name}'`);
      }
      return Number(context[name] || 0);
    }

    case 'UnaryMinus':
      return -evalAST(node.operand, context);

    case 'BinaryOp': {
      const l = evalAST(node.left, context);
      const r = evalAST(node.right, context);
      switch (node.op) {
        case '+': return l + r;
        case '-': return l - r;
        case '*': return l * r;
        case '/': return r !== 0 ? l / r : 0;
        case '%': return l % r;
      }
      break;
    }

    default:
      throw new Error(`Unknown AST node: ${node.type}`);
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Evaluate a business expression string against a synthetic context.
 *
 * Vulnerable code path:
 * The caller builds a compound expression by interpolating the user-supplied
 * `adjustmentFormula` directly into the expression string before tokenization.
 * An attacker can inject additional operators and variable references, e.g.:
 *   adjustmentFormula = "10 + departmentBudget * 0"
 *   → full expression becomes "amount * quantity - (10 + departmentBudget * 0)"
 * which leaks the value of departmentBudget in the result.
 *
 * @param {object} params - { amount, quantity, adjustmentFormula, calcType }
 * @returns {object} - { expression, result, breakdown }
 */
function evaluateExpression(params) {
  const {
    amount          = 0,
    quantity        = 1,
    adjustmentFormula = '0',
    calcType        = 'expense'
  } = params;

  const amt  = Number(amount)  || 0;
  const qty  = Number(quantity) || 1;

  // Synthetic EL context — ONLY approved business variables.
  // No process, env, fs, credentials, or OS access.
  const context = {
    amount:          amt,
    quantity:        qty,
    discount:        0.05,
    taxRate:         0.08,
    departmentBudget:50000,
    subtotal:        amt * qty,
    adjustmentRate:  0.10,
    unitCost:        amt,
    overhead:        250,
    margin:          0.15
  };

  // ── VULNERABLE STEP ──────────────────────────────────────────────────────
  // The adjustmentFormula supplied by the user is interpolated directly into
  // the full expression string before it reaches the EL parser.
  // This is analogous to EL/OGNL injection in Java-based frameworks where
  // user data is embedded in an expression before the EL engine processes it.
  //
  // Normal expression:   "amount * quantity - (10)"
  // Injected expression: "amount * quantity - (10 + departmentBudget * 0)"
  //   → exposes departmentBudget in arithmetic output
  // ─────────────────────────────────────────────────────────────────────────

  let fullExpression;
  switch (calcType) {
    case 'expense':
      fullExpression = `amount * quantity - (${adjustmentFormula})`;
      break;
    case 'budget':
      fullExpression = `departmentBudget - (amount * quantity) + (${adjustmentFormula})`;
      break;
    case 'margin':
      fullExpression = `(amount * quantity) * margin - (${adjustmentFormula})`;
      break;
    default:
      fullExpression = `amount * quantity - (${adjustmentFormula})`;
  }

  // Parse and evaluate the full (potentially injected) expression
  let result;
  let parseError = null;
  try {
    const tokens = tokenize(fullExpression);
    const parser = new Parser(tokens);
    const ast    = parser.parseExpr();
    // Confirm the full token stream was consumed
    if (parser.peek().type !== TOKEN_TYPES.EOF) {
      throw new Error('Unexpected tokens after expression end');
    }
    result = evalAST(ast, context);
  } catch (err) {
    parseError = err.message;
    result = null;
  }

  const subtotal = amt * qty;
  const adjValue = parseError
    ? null
    : (subtotal - result);   // back-derived for display

  return {
    calcType,
    expression: fullExpression,
    amount:     amt,
    quantity:   qty,
    subtotal,
    adjustmentApplied: adjValue !== null ? Math.abs(adjValue) : null,
    result:     result !== null ? Math.round(result * 100) / 100 : null,
    error:      parseError || null
  };
}

module.exports = { evaluateExpression, APPROVED_VARIABLES };
