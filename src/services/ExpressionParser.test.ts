import { describe, expect, it } from 'vitest';
import { ExpressionParser } from './ExpressionParser';

const evaluate = (expression: string, x = 0): number => ExpressionParser.parse(expression).evaluate(x);

describe('ExpressionParser: operaciones básicas', () => {
  it('suma, resta, multiplicación y división', () => {
    expect(evaluate('2 + 3')).toBe(5);
    expect(evaluate('10 - 4')).toBe(6);
    expect(evaluate('6 * 7')).toBe(42);
    expect(evaluate('20 / 8')).toBe(2.5);
  });

  it('respeta la precedencia y los paréntesis', () => {
    expect(evaluate('2 + 3 * 4')).toBe(14);
    expect(evaluate('(2 + 3) * 4')).toBe(20);
    expect(evaluate('2^3^2')).toBe(512);
  });

  it('evalúa la variable x', () => {
    expect(evaluate('x^3 - 4*x - 1', 2)).toBe(-1);
    expect(evaluate('x^3 - 4*x - 1', 3)).toBe(14);
  });

  it('acepta decimales y negativos', () => {
    expect(evaluate('0.1 + 0.2')).toBeCloseTo(0.3, 12);
    expect(evaluate('-2.5 * x', 2)).toBe(-5);
    expect(evaluate('x - 5', -3)).toBe(-8);
  });

  it('acepta la notación en español: multiplicación implícita, sen, π y signos unicode', () => {
    expect(evaluate('2x', 3)).toBe(6);
    expect(evaluate('3(x+1)', 1)).toBe(6);
    expect(evaluate('sen(x)', Math.PI / 2)).toBeCloseTo(1, 12);
    expect(evaluate('π')).toBeCloseTo(Math.PI, 12);
    expect(evaluate('8 − 3 × 2')).toBe(2);
  });

  it('calcula la raíz cúbica de valores negativos', () => {
    expect(evaluate('cbrt(x)', -8)).toBeCloseTo(-2, 12);
  });
});

describe('ExpressionParser: errores', () => {
  it('rechaza una expresión vacía', () => {
    const parsed = ExpressionParser.parse('   ');
    expect(parsed.isValid).toBe(false);
    expect(parsed.errorMessage).toBeTruthy();
  });

  it.each(['2 +', '(x + 1', 'x +* 2', 'foo(x)'])('rechaza la expresión inválida "%s"', (expression) => {
    const parsed = ExpressionParser.parse(expression);
    expect(parsed.isValid).toBe(false);
    expect(parsed.errorMessage).toBeTruthy();
  });

  it('devuelve NaN (no Infinity) al dividir entre cero', () => {
    expect(evaluate('1 / x', 0)).toBeNaN();
    expect(evaluate('1 / 0')).toBeNaN();
  });

  it('devuelve NaN fuera del dominio', () => {
    expect(evaluate('log(x)', -1)).toBeNaN();
  });
});

describe('ExpressionParser: derivadas', () => {
  it('deriva simbólicamente', () => {
    const parsed = ExpressionParser.parse('x^3 - 4*x - 1');
    expect(parsed.derivative?.(2)).toBe(8);
    expect(parsed.derivativeLatex).toBeTruthy();
    expect(parsed.secondDerivativeLatex).toBeTruthy();
  });
});
