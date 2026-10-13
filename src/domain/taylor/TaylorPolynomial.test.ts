import { describe, expect, it } from 'vitest';
import { MAX_TAYLOR_DEGREE, TaylorPolynomial } from './TaylorPolynomial';
import { evaluatePolynomial } from '../interpolation/polynomial';

const taylor = new TaylorPolynomial();
const run = (expression: string, a: number, degree: number, xStar: number) =>
  taylor.execute({ expression, a, degree, xStar });

describe('TaylorPolynomial: Maclaurin de referencia', () => {
  it('eˣ: coeficientes 1/k! y P(0.5) a mano', () => {
    const r = run('exp(x)', 0, 4, 0.5);
    expect(r.isMaclaurin).toBe(true);
    [1, 1, 1 / 2, 1 / 6, 1 / 24].forEach((c, k) => expect(r.terms[k].coefficient).toBeCloseTo(c, 12));
    // 1 + 0.5 + 0.125 + 0.0208333… + 0.0026041666…
    expect(r.valueAtXStar).toBeCloseTo(1.6484375, 10);
    expect(r.exactValue).toBeCloseTo(Math.exp(0.5), 12);
    expect(r.absoluteError).toBeCloseTo(Math.abs(Math.exp(0.5) - 1.6484375), 10);
  });

  it('sen x: solo potencias impares con signo alterno', () => {
    const r = run('sin(x)', 0, 5, 0.3);
    expect(r.terms.map((t) => t.derivativeAtA)).toEqual([0, 1, 0, -1, 0, 1]);
    expect(r.terms[3].coefficient).toBeCloseTo(-1 / 6, 12);
    expect(r.terms[5].coefficient).toBeCloseTo(1 / 120, 12);
    expect(r.expandedLatex).toBe('P_{5}(x) = 0.00833333x^{5} - 0.166667x^{3} + x');
  });

  it('acepta la notación en español: sen y e^x', () => {
    const r = run('sen(x)', 0, 3, 0.1);
    expect(r.terms[1].derivativeAtA).toBe(1);
    expect(run('e^x', 0, 2, 0).valueAtXStar).toBeCloseTo(1, 12);
  });
});

describe('TaylorPolynomial: a ≠ 0', () => {
  it('ln(x) en a = 1: coeficientes (−1)^(k+1)/k', () => {
    const r = run('ln(x)', 1, 4, 1.2);
    expect(r.isMaclaurin).toBe(false);
    expect(r.terms.map((t) => t.coefficient)).toEqual([0, 1, -0.5, 1 / 3, -0.25]);
    const expected = 0.2 - 0.02 + 0.008 / 3 - 0.0016 / 4;
    expect(r.valueAtXStar).toBeCloseTo(expected, 10);
  });

  it('P⁽ᵏ⁾(a) = f⁽ᵏ⁾(a): el polinomio expandido reproduce f(a) y sus derivadas', () => {
    const r = run('x^3 + 2*x^2 - 6*x + 7', 2, 3, 0);
    // Un polinomio de grado 3 se reproduce exactamente con n = 3, en cualquier a
    [-3, 0, 1.7, 5].forEach((x) => expect(evaluatePolynomial(r.coefficients, x)).toBeCloseTo(x ** 3 + 2 * x ** 2 - 6 * x + 7, 8));
    expect(r.coefficients[0]).toBeCloseTo(7, 8);
    expect(r.coefficients[1]).toBeCloseTo(-6, 8);
    expect(r.coefficients[2]).toBeCloseTo(2, 8);
    expect(r.coefficients[3]).toBeCloseTo(1, 8);
    expect(r.absoluteError).toBeCloseTo(0, 8);
  });

  it('el coeficiente de cada término es f⁽ᵏ⁾(a)/k!', () => {
    const r = run('x^3 + 2*x^2 - 6*x + 7', 2, 3, 0);
    // f(2)=11, f'(2)=14, f''(2)=16, f'''(2)=6
    expect(r.terms.map((t) => t.derivativeAtA)).toEqual([11, 14, 16, 6]);
    expect(r.terms.map((t) => t.coefficient)).toEqual([11, 14, 8, 1]);
    expect(r.substitutedLatex).toBe('P_{3}(x) = 11 + 14(x - 2) + 8(x - 2)^{2} + (x - 2)^{3}');
  });

  it('usa el signo correcto cuando a es negativo', () => {
    const r = run('x^2', -1, 2, 0);
    expect(r.substitutedLatex).toBe('P_{2}(x) = 1 - 2(x + 1) + (x + 1)^{2}');
  });
});

describe('TaylorPolynomial: error de la aproximación', () => {
  it('el error baja al subir el grado (eˣ en x* = 1)', () => {
    const errors = [1, 2, 3, 4, 5, 6].map((n) => run('exp(x)', 0, n, 1).absoluteError!);
    for (let i = 1; i < errors.length; i++) expect(errors[i]).toBeLessThan(errors[i - 1]);
  });

  it('error nulo en x* = a', () => {
    const r = run('cos(x)', 0, 4, 0);
    expect(r.valueAtXStar).toBe(1);
    expect(r.absoluteError).toBe(0);
  });

  it('el ruido de redondeo de sen(π) se toma como 0', () => {
    const r = run('sin(x)', Math.PI, 2, 3);
    expect(r.terms[0].derivativeAtA).toBe(0);
    expect(r.terms[1].derivativeAtA).toBeCloseTo(-1, 12);
  });
});

describe('TaylorPolynomial: derivadas muy largas', () => {
  it('1/(1+x²) en grado bajo da 1 − x² + x⁴', () => {
    const r = run('1/(1+x^2)', 0, 4, 0.2);
    expect(r.terms.map((t) => t.coefficient)).toEqual([1, 0, -1, 0, 1]);
    expect(r.expandedLatex).toBe('P_{4}(x) = x^{4} - x^{2} + 1');
  });

  it('corta con un mensaje claro en vez de bloquear cuando la derivada crece demasiado', () => {
    const started = performance.now();
    expect(() => run('1/(1+x^2)', 0, 10, 0.2)).toThrow(/demasiado larga/);
    expect(performance.now() - started).toBeLessThan(3000);
  });
});

describe('TaylorPolynomial: validaciones', () => {
  it('rechaza grado fuera de rango o no entero', () => {
    expect(taylor.validate({ expression: 'x', a: 0, degree: 0, xStar: 1 }).isValid).toBe(false);
    expect(taylor.validate({ expression: 'x', a: 0, degree: MAX_TAYLOR_DEGREE + 1, xStar: 1 }).isValid).toBe(false);
    expect(taylor.validate({ expression: 'x', a: 0, degree: 2.5, xStar: 1 }).isValid).toBe(false);
    expect(taylor.validate({ expression: 'x', a: 0, degree: MAX_TAYLOR_DEGREE, xStar: 1 }).isValid).toBe(true);
  });

  it('rechaza a o x* no numéricos', () => {
    expect(taylor.validate({ expression: 'x', a: NaN, degree: 2, xStar: 1 }).isValid).toBe(false);
    expect(taylor.validate({ expression: 'x', a: 0, degree: 2, xStar: NaN }).isValid).toBe(false);
  });

  it('rechaza una función inválida o vacía', () => {
    expect(taylor.validate({ expression: '', a: 0, degree: 2, xStar: 1 }).isValid).toBe(false);
    expect(taylor.validate({ expression: 'x +* 2', a: 0, degree: 2, xStar: 1 }).isValid).toBe(false);
    expect(() => run('', 0, 2, 1)).toThrow();
  });

  it('rechaza f no definida en a', () => {
    const v = taylor.validate({ expression: '1/x', a: 0, degree: 2, xStar: 1 });
    expect(v.isValid).toBe(false);
    expect(v.errors.join(' ')).toMatch(/no está definida en el punto a/);
    expect(() => run('ln(x)', 0, 3, 1)).toThrow();
  });

  it('avisa si f(x*) no está definida pero deja calcular P(x*)', () => {
    const r = taylor.validate({ expression: 'ln(x)', a: 1, degree: 3, xStar: -1 });
    expect(r.isValid).toBe(true);
    expect(r.warnings.join(' ')).toMatch(/f\(x\*\)/);
    const result = run('ln(x)', 1, 3, -1);
    expect(result.exactValue).toBeNull();
    expect(result.absoluteError).toBeNull();
    expect(Number.isFinite(result.valueAtXStar)).toBe(true);
  });
});
