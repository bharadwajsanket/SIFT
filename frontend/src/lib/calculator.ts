/**
 * SIFT Inline Calculator Engine
 * 
 * Provides fast, local, deterministic arithmetic evaluation directly in the browser.
 * Zero network requests. Evaluates mathematical expressions using a recursive-descent
 * parser (no eval, no Function constructor).
 * 
 * Percentage Semantics:
 * 1. Postfix `%`: Evaluates as division by 100 (e.g. `50%` -> `0.5`, `200 * 15%` -> `30`).
 * 2. `<expr>% of <expr>`: Evaluates as `(expr / 100) * expr` (e.g. `25% of 800` -> `200`).
 * 
 * Precedence Order:
 * 1. Parentheses `(...)`
 * 2. Postfix `%`
 * 3. Unary `+`, `-`
 * 4. Exponents `^`, `**` (right-associative)
 * 5. Multiplication & Division `*`, `×`, `/`, `÷`, `of` (left-associative)
 * 6. Addition & Subtraction `+`, `-` (left-associative)
 */

export interface CalculatorResult {
  rawExpression: string;
  formattedExpression: string;
  result: number;
  formattedResult: string;
}

// Token Types
type TokenType = 
  | 'NUMBER'
  | 'PLUS'
  | 'MINUS'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'POWER'
  | 'PERCENT'
  | 'OF'
  | 'LPAREN'
  | 'RPAREN'
  | 'EOF';

interface Token {
  type: TokenType;
  value: string;
  numValue?: number;
}

/**
 * Tokenize an input arithmetic string.
 * Returns null if unexpected/illegal characters are encountered.
 */
function tokenize(input: string): Token[] | null {
  const tokens: Token[] = [];
  let i = 0;
  const len = input.length;

  while (i < len) {
    const ch = input[i];

    // Skip whitespace
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    // Number (integer or decimal like 12.5 or .5)
    if (/[0-9]/.test(ch) || (ch === '.' && i + 1 < len && /[0-9]/.test(input[i + 1]))) {
      let numStr = '';
      let hasDot = false;
      while (i < len) {
        const c = input[i];
        if (/[0-9]/.test(c)) {
          numStr += c;
          i++;
        } else if (c === '.' && !hasDot) {
          hasDot = true;
          numStr += c;
          i++;
        } else {
          break;
        }
      }
      const val = parseFloat(numStr);
      if (isNaN(val)) return null;
      tokens.push({ type: 'NUMBER', value: numStr, numValue: val });
      continue;
    }

    // Keyword 'of' (case-insensitive)
    if ((ch === 'o' || ch === 'O') && i + 1 < len && (input[i + 1] === 'f' || input[i + 1] === 'F')) {
      // Must not be part of a larger word
      const nextChar = i + 2 < len ? input[i + 2] : '';
      if (!/[a-zA-Z0-9_]/.test(nextChar)) {
        tokens.push({ type: 'OF', value: 'of' });
        i += 2;
        continue;
      } else {
        return null; // Word like 'often' -> not arithmetic
      }
    }

    // Operators
    if (ch === '+') {
      tokens.push({ type: 'PLUS', value: '+' });
      i++;
    } else if (ch === '-') {
      tokens.push({ type: 'MINUS', value: '-' });
      i++;
    } else if (ch === '*' || ch === '×') {
      if (ch === '*' && i + 1 < len && input[i + 1] === '*') {
        tokens.push({ type: 'POWER', value: '**' });
        i += 2;
      } else {
        tokens.push({ type: 'MULTIPLY', value: ch === '×' ? '×' : '*' });
        i++;
      }
    } else if (ch === '/' || ch === '÷') {
      tokens.push({ type: 'DIVIDE', value: ch === '÷' ? '÷' : '/' });
      i++;
    } else if (ch === '^') {
      tokens.push({ type: 'POWER', value: '^' });
      i++;
    } else if (ch === '%') {
      tokens.push({ type: 'PERCENT', value: '%' });
      i++;
    } else if (ch === '(') {
      tokens.push({ type: 'LPAREN', value: '(' });
      i++;
    } else if (ch === ')') {
      tokens.push({ type: 'RPAREN', value: ')' });
      i++;
    } else {
      // Any other character (e.g. letters, symbols) disqualifies the expression
      return null;
    }
  }

  tokens.push({ type: 'EOF', value: '' });
  return tokens;
}

/**
 * Format a number for clean, human-readable display.
 * - Eliminates IEEE 754 precision artifacts (e.g. 0.30000000000000004 -> 0.3)
 * - Adds thousands commas for integer parts
 * - Preserves sensible decimal precision
 */
export function formatResultNumber(val: number): string {
  if (!isFinite(val) || isNaN(val)) return '';

  // Clean precision noise
  const precisionCleaned = parseFloat(val.toPrecision(12));

  // Scientific notation for extreme magnitude numbers
  if (Math.abs(precisionCleaned) >= 1e15 || (Math.abs(precisionCleaned) > 0 && Math.abs(precisionCleaned) < 1e-6)) {
    return precisionCleaned.toExponential(6).replace(/\.?0+e/, 'e');
  }

  const parts = precisionCleaned.toString().split('.');
  const integerPart = parseFloat(parts[0]);
  const formattedInteger = new Intl.NumberFormat('en-US').format(integerPart);

  if (parts.length > 1) {
    return `${formattedInteger}.${parts[1]}`;
  }
  return formattedInteger;
}

/**
 * Deterministic recursive-descent parser and evaluator.
 */
class ExpressionParser {
  private tokens: Token[];
  private pos = 0;
  private hasOperation = false;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  private current(): Token {
    return this.tokens[this.pos] || { type: 'EOF', value: '' };
  }

  private match(type: TokenType): boolean {
    if (this.current().type === type) {
      this.pos++;
      return true;
    }
    return false;
  }

  public parse(): { result: number; formattedExpr: string } | null {
    const val = this.parseAdditive();
    if (val === null) return null;

    // Must consume all tokens until EOF
    if (this.current().type !== 'EOF') return null;

    // Must contain at least one operation to be treated as a calculation
    if (!this.hasOperation) return null;

    if (!isFinite(val.val) || isNaN(val.val)) return null;

    return {
      result: val.val,
      formattedExpr: val.repr,
    };
  }

  // Additive: + and -
  private parseAdditive(): { val: number; repr: string } | null {
    let left = this.parseMultiplicative();
    if (left === null) return null;

    while (this.current().type === 'PLUS' || this.current().type === 'MINUS') {
      const op = this.current().type;
      this.pos++;
      this.hasOperation = true;

      const right = this.parseMultiplicative();
      if (right === null) return null;

      if (op === 'PLUS') {
        left = {
          val: left.val + right.val,
          repr: `${left.repr} + ${right.repr}`,
        };
      } else {
        left = {
          val: left.val - right.val,
          repr: `${left.repr} - ${right.repr}`,
        };
      }
    }

    return left;
  }

  // Multiplicative: *, ×, /, ÷, and 'of'
  private parseMultiplicative(): { val: number; repr: string } | null {
    let left = this.parsePower();
    if (left === null) return null;

    while (
      this.current().type === 'MULTIPLY' ||
      this.current().type === 'DIVIDE' ||
      this.current().type === 'OF'
    ) {
      const opToken = this.current();
      this.pos++;
      this.hasOperation = true;

      const right = this.parsePower();
      if (right === null) return null;

      if (opToken.type === 'DIVIDE') {
        // Guard against division by zero
        if (Math.abs(right.val) < 1e-15) {
          return null; // Division by zero invalidates preview
        }
        left = {
          val: left.val / right.val,
          repr: `${left.repr} ÷ ${right.repr}`,
        };
      } else if (opToken.type === 'OF') {
        left = {
          val: left.val * right.val,
          repr: `${left.repr} of ${right.repr}`,
        };
      } else {
        // MULTIPLY
        left = {
          val: left.val * right.val,
          repr: `${left.repr} × ${right.repr}`,
        };
      }
    }

    return left;
  }

  // Exponents: ^ or ** (right-associative)
  private parsePower(): { val: number; repr: string } | null {
    const base = this.parseUnary();
    if (base === null) return null;

    if (this.current().type === 'POWER') {
      this.pos++;
      this.hasOperation = true;

      const exp = this.parsePower(); // Right-associative recursion
      if (exp === null) return null;

      // Computational sanity check: avoid extreme exponent computations that freeze or overflow
      if (Math.abs(exp.val) > 1000) return null;

      const result = Math.pow(base.val, exp.val);
      if (!isFinite(result) || isNaN(result)) return null;

      return {
        val: result,
        repr: `${base.repr}^${exp.repr}`,
      };
    }

    return base;
  }

  // Unary operators: + and -
  private parseUnary(): { val: number; repr: string } | null {
    if (this.current().type === 'PLUS') {
      this.pos++;
      const res = this.parseUnary();
      if (res === null) return null;
      return { val: res.val, repr: `+${res.repr}` };
    }

    if (this.current().type === 'MINUS') {
      this.pos++;
      const res = this.parseUnary();
      if (res === null) return null;
      return { val: -res.val, repr: `-${res.repr}` };
    }

    return this.parsePostfix();
  }

  // Postfix operators: %
  private parsePostfix(): { val: number; repr: string } | null {
    let primary = this.parsePrimary();
    if (primary === null) return null;

    while (this.current().type === 'PERCENT') {
      this.pos++;
      this.hasOperation = true;
      primary = {
        val: primary.val / 100,
        repr: `${primary.repr}%`,
      };
    }

    return primary;
  }

  // Primary: Number or Parenthesized expression
  private parsePrimary(): { val: number; repr: string } | null {
    const cur = this.current();

    if (cur.type === 'NUMBER') {
      this.pos++;
      return {
        val: cur.numValue ?? parseFloat(cur.value),
        repr: cur.value,
      };
    }

    if (cur.type === 'LPAREN') {
      this.pos++;
      const inner = this.parseAdditive();
      if (inner === null) return null;

      if (!this.match('RPAREN')) {
        return null; // Unbalanced parenthesis
      }

      return {
        val: inner.val,
        repr: `(${inner.repr})`,
      };
    }

    return null;
  }
}

/**
 * Conservative check & evaluation function.
 * 
 * Rules:
 * 1. String length must be between 2 and 80 characters.
 * 2. Cannot contain natural language words (rejects searches like "what is 2+2", "2+2 in Python").
 * 3. Keyword 'of' is ONLY allowed if directly preceded by '%'.
 * 4. Must contain at least one mathematical operator.
 * 5. Deterministically evaluates without throwing. Returns null if invalid or not a calculation.
 */
export function evaluateCalculatorExpression(rawQuery: string): CalculatorResult | null {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2 || trimmed.length > 80) {
    return null;
  }

  // Safe character check: only digits, spaces, '.', '+', '-', '*', '×', '/', '÷', '^', '%', '(', ')',
  // and the specific keyword 'of' (case-insensitive) are allowed.
  // Check for any unauthorized letters:
  const withoutOf = trimmed.replace(/\bof\b/gi, '');
  if (/[a-zA-Z]/.test(withoutOf)) {
    return null; // Natural language words present -> ordinary search
  }

  // Check 'of': if 'of' is present, it MUST be preceded by '%' (ignoring spaces)
  if (/\bof\b/i.test(trimmed)) {
    if (!/%\s*of\b/i.test(trimmed)) {
      return null;
    }
  }

  // Tokenize
  const tokens = tokenize(trimmed);
  if (!tokens || tokens.length === 0) {
    return null;
  }

  // Parse and evaluate
  const parser = new ExpressionParser(tokens);
  const evaluation = parser.parse();
  if (!evaluation) {
    return null;
  }

  const formattedNum = formatResultNumber(evaluation.result);
  if (!formattedNum) {
    return null;
  }

  return {
    rawExpression: trimmed,
    formattedExpression: evaluation.formattedExpr,
    result: evaluation.result,
    formattedResult: formattedNum,
  };
}

/**
 * Quick predicate to check if a query qualifies as a calculator query.
 */
export function isCalculatorQuery(query: string): boolean {
  return evaluateCalculatorExpression(query) !== null;
}
