import { describe, it } from 'node:test';
import assert from 'node:assert';
import { evaluateCalculatorExpression, isCalculatorQuery, formatResultNumber } from './calculator.ts';

describe('Calculator Parser & Evaluator', () => {
  it('evaluates basic arithmetic expressions correctly', () => {
    // 2+2 = 4
    const r1 = evaluateCalculatorExpression('2+2');
    assert.ok(r1 !== null);
    assert.strictEqual(r1.result, 4);
    assert.strictEqual(r1.formattedResult, '4');
    assert.strictEqual(r1.formattedExpression, '2 + 2');

    // 127*48 = 6096
    const r2 = evaluateCalculatorExpression('127*48');
    assert.ok(r2 !== null);
    assert.strictEqual(r2.result, 6096);
    assert.strictEqual(r2.formattedResult, '6,096');

    // (50+30)/2 = 40
    const r3 = evaluateCalculatorExpression('(50+30)/2');
    assert.ok(r3 !== null);
    assert.strictEqual(r3.result, 40);
    assert.strictEqual(r3.formattedResult, '40');

    // 2^10 = 1024
    const r4 = evaluateCalculatorExpression('2^10');
    assert.ok(r4 !== null);
    assert.strictEqual(r4.result, 1024);
    assert.strictEqual(r4.formattedResult, '1,024');

    // -12.5+8 = -4.5
    const r5 = evaluateCalculatorExpression('-12.5+8');
    assert.ok(r5 !== null);
    assert.strictEqual(r5.result, -4.5);
    assert.strictEqual(r5.formattedResult, '-4.5');

    // 12.5 * 8 = 100
    const r6 = evaluateCalculatorExpression('12.5 * 8');
    assert.ok(r6 !== null);
    assert.strictEqual(r6.result, 100);
    assert.strictEqual(r6.formattedResult, '100');

    // 240 * 18 = 4320
    const r7 = evaluateCalculatorExpression('240 * 18');
    assert.ok(r7 !== null);
    assert.strictEqual(r7.result, 4320);
    assert.strictEqual(r7.formattedResult, '4,320');
    assert.strictEqual(r7.formattedExpression, '240 × 18');
  });

  it('evaluates percentage expressions with documented semantics', () => {
    // 25% of 800 = 200
    const p1 = evaluateCalculatorExpression('25% of 800');
    assert.ok(p1 !== null);
    assert.strictEqual(p1.result, 200);
    assert.strictEqual(p1.formattedResult, '200');

    // 15% of 240 = 36
    const p2 = evaluateCalculatorExpression('15% of 240');
    assert.ok(p2 !== null);
    assert.strictEqual(p2.result, 36);
    assert.strictEqual(p2.formattedResult, '36');

    // 200 * 1.18 = 236
    const p3 = evaluateCalculatorExpression('200 * 1.18');
    assert.ok(p3 !== null);
    assert.strictEqual(p3.result, 236);
    assert.strictEqual(p3.formattedResult, '236');

    // 200 * 15% = 30
    const p4 = evaluateCalculatorExpression('200 * 15%');
    assert.ok(p4 !== null);
    assert.strictEqual(p4.result, 30);
    assert.strictEqual(p4.formattedResult, '30');

    // 50% = 0.5
    const p5 = evaluateCalculatorExpression('50%');
    assert.ok(p5 !== null);
    assert.strictEqual(p5.result, 0.5);
    assert.strictEqual(p5.formattedResult, '0.5');
  });

  it('respects standard mathematical operator precedence', () => {
    // 2+3*4 = 14 (multiplication before addition)
    const op1 = evaluateCalculatorExpression('2+3*4');
    assert.ok(op1 !== null);
    assert.strictEqual(op1.result, 14);

    // (2+3)*4 = 20 (parentheses override precedence)
    const op2 = evaluateCalculatorExpression('(2+3)*4');
    assert.ok(op2 !== null);
    assert.strictEqual(op2.result, 20);

    // 2^3^2 = 512 (right-associative exponents)
    const op3 = evaluateCalculatorExpression('2^3^2');
    assert.ok(op3 !== null);
    assert.strictEqual(op3.result, 512);

    // 2 ** 3 = 8
    const op4 = evaluateCalculatorExpression('2 ** 3');
    assert.ok(op4 !== null);
    assert.strictEqual(op4.result, 8);
  });

  it('eliminates floating-point precision artifacts', () => {
    // 0.1 + 0.2 = 0.3 (not 0.30000000000000004)
    const fp1 = evaluateCalculatorExpression('0.1 + 0.2');
    assert.ok(fp1 !== null);
    assert.strictEqual(fp1.formattedResult, '0.3');

    // 0.3 - 0.1 = 0.2
    const fp2 = evaluateCalculatorExpression('0.3 - 0.1');
    assert.ok(fp2 !== null);
    assert.strictEqual(fp2.formattedResult, '0.2');

    // direct formatResultNumber checks
    assert.strictEqual(formatResultNumber(4320), '4,320');
    assert.strictEqual(formatResultNumber(1000000), '1,000,000');
    assert.strictEqual(formatResultNumber(-4.5), '-4.5');
    assert.strictEqual(formatResultNumber(0), '0');
  });

  it('rejects invalid or incomplete syntax gracefully', () => {
    // Incomplete while typing
    assert.strictEqual(evaluateCalculatorExpression('2+'), null);
    assert.strictEqual(evaluateCalculatorExpression('2*'), null);
    assert.strictEqual(evaluateCalculatorExpression('2/'), null);
    assert.strictEqual(evaluateCalculatorExpression('2^'), null);
    assert.strictEqual(evaluateCalculatorExpression('('), null);

    // Malformed operators
    assert.strictEqual(evaluateCalculatorExpression('2/**'), null);
    assert.strictEqual(evaluateCalculatorExpression('2++'), null);
    assert.strictEqual(evaluateCalculatorExpression('2/*3'), null);

    // Unbalanced parentheses
    assert.strictEqual(evaluateCalculatorExpression('(50+30'), null);
    assert.strictEqual(evaluateCalculatorExpression('50+30)'), null);
    assert.strictEqual(evaluateCalculatorExpression('((2+3)'), null);

    // Division by zero
    assert.strictEqual(evaluateCalculatorExpression('5/0'), null);
    assert.strictEqual(evaluateCalculatorExpression('10 ÷ 0'), null);
    assert.strictEqual(evaluateCalculatorExpression('10 / (5 - 5)'), null);

    // Excessively long expressions
    const longExpr = '1+' + '1+'.repeat(50) + '1';
    assert.strictEqual(evaluateCalculatorExpression(longExpr), null);
  });

  it('does NOT hijack natural language or ordinary web searches', () => {
    // Ordinary questions containing numbers or math terms
    assert.strictEqual(isCalculatorQuery('what is 2+2'), false);
    assert.strictEqual(isCalculatorQuery('how does multiplication work'), false);
    assert.strictEqual(isCalculatorQuery('2+2 in Python'), false);
    assert.strictEqual(isCalculatorQuery('calculate compound interest'), false);
    assert.strictEqual(isCalculatorQuery('iPhone 16 x 2'), false);
    assert.strictEqual(isCalculatorQuery('100% Cotton'), false);
    assert.strictEqual(isCalculatorQuery('king of pop'), false);
    assert.strictEqual(isCalculatorQuery('5 of 10'), false);

    // Plain numbers without operations are searches
    assert.strictEqual(isCalculatorQuery('42'), false);
    assert.strictEqual(isCalculatorQuery('12.5'), false);
    assert.strictEqual(isCalculatorQuery('-42'), false);

    // Recognised math expressions
    assert.strictEqual(isCalculatorQuery('2+2'), true);
    assert.strictEqual(isCalculatorQuery('240 * 18'), true);
    assert.strictEqual(isCalculatorQuery('(50 + 30) / 2'), true);
    assert.strictEqual(isCalculatorQuery('2^10'), true);
    assert.strictEqual(isCalculatorQuery('69^69'), true);
    assert.strictEqual(isCalculatorQuery('0.1+0.2'), true);
    assert.strictEqual(isCalculatorQuery('25% of 800'), true);
    assert.strictEqual(isCalculatorQuery('-12.5 + 8'), true);
  });

  it('formats large numbers in scientific notation without silent precision loss', () => {
    // 69^69 produces approximately 7.59604e+126
    const res = evaluateCalculatorExpression('69^69');
    assert.ok(res !== null);
    assert.strictEqual(res.rawExpression, '69^69');
    assert.strictEqual(res.formattedExpression, '69^69');
    assert.strictEqual(res.formattedResult, '7.59604e+126');
    assert.ok(typeof res.result === 'number' && Number.isFinite(res.result));

    // Numbers above 1e15 must format in scientific notation to avoid deceptive false precision
    const large1 = evaluateCalculatorExpression('10^16');
    assert.ok(large1 !== null);
    assert.strictEqual(large1.formattedResult, '1e+16');

    // Numbers below 1e15 preserve exact integer formatting with commas
    const safeInt = evaluateCalculatorExpression('10^12');
    assert.ok(safeInt !== null);
    assert.strictEqual(safeInt.formattedResult, '1,000,000,000,000');
  });
});
