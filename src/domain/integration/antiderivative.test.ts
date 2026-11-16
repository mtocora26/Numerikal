import { describe, expect, it } from 'vitest';
import { findAntiderivative } from './antiderivative';
import { compareWithExact } from './quadrature';
import { TrapezoidRule } from './Trapezoid';

const PI = Math.PI;
const E = Math.E;

/** Valor exacto de ∫ₐᵇ f dx según Numerikal, con n = 4 (el n solo afecta a la aproximación, no al valor exacto). */
const exact = (expression: string, a: number, b: number): number | null =>
  new TrapezoidRule().execute({ expression, a, b, n: 4 }).exactValue;

/** F(b) − F(a) directo con la primitiva: la tabla de reglas no necesita pasar por el resto del cálculo. */
const barrow = (expression: string, a: number, b: number): number | null => {
  const F = findAntiderivative(expression);
  return F ? F.evaluate(b) - F.evaluate(a) : null;
};

describe('findAntiderivative: integrales con valor exacto conocido (calculado a mano)', () => {
  const cases: [string, string, number, number, number][] = [
    ['polinomio', 'x^2', 0, 1, 1 / 3],
    ['recta', '2*x + 1', 0, 3, 12],
    ['constante', '5', 1, 4, 15],
    ['x', 'x', 0, 4, 8],
    ['polinomio completo', 'x^3 - 2*x^2 + x - 5', -1, 3, -44 / 3],
    ['producto de polinomios', '(x + 1)*(x - 2)', 0, 3, -1.5],
    ['potencia de un binomio', '(2*x + 1)^3', 0, 1, 10],
    ['polinomio por constante', '3*x^2 - x/2', 0, 2, 7],
    ['sen', 'sin(x)', 0, PI, 2],
    ['sen en español', 'sen(x)', 0, PI, 2],
    ['cos con argumento lineal', 'cos(2*x)', 0, PI / 4, 1 / 2],
    ['exp', 'exp(x)', 0, 1, E - 1],
    ['e^(2x)', 'e^(2*x)', 0, 1, (E * E - 1) / 2],
    ['1/x', '1/x', 1, E, 1],
    ['x^(-2)', 'x^(-2)', 1, 2, 1 / 2],
    ['1/(2x + 1)', '1/(2*x + 1)', 0, 1, Math.log(3) / 2],
    ['raíz', 'sqrt(x)', 0, 4, 16 / 3],
    ['raíz de un binomio', 'sqrt(2*x + 1)', 0, 4, 26 / 3],
    ['raíz cúbica', 'cbrt(x)', 0, 8, 12],
    ['base distinta de e', '2^x', 0, 3, 7 / Math.LN2],
    ['logaritmo natural', 'ln(x)', 1, E, 1],
    ['tangente', 'tan(x)', 0, 1, -Math.log(Math.cos(1))],
    ['senh', 'sinh(x)', 0, 1, Math.cosh(1) - 1],
    ['combinación lineal', '3*sin(x) - x^2/2', 0, PI, 6 - PI ** 3 / 6],
    ['π como coeficiente', 'pi*x', 0, 1, PI / 2],
    ['x·eˣ (por partes)', 'x*exp(x)', 0, 1, 1],
    ['x²·eˣ (por partes dos veces)', 'x^2*exp(x)', 0, 1, E - 2],
    ['x·sen x', 'x*sin(x)', 0, PI, PI],
    ['x·cos x', 'x*cos(x)', 0, PI, -2],
    ['x²·sen x', 'x^2*sin(x)', 0, PI, PI ** 2 - 4],
    ['(x + 1)·cos(2x)', '(x + 1)*cos(2*x)', 0, PI / 2, -1 / 2],
    ['2x·e^(−x)', '2*x*exp(-x)', 0, 1, 2 - 4 / E],
  ];

  it.each(cases)('%s: ∫ %s', (_name, expression, a, b, expected) => {
    const value = barrow(expression, a, b);
    expect(value).not.toBeNull();
    expect(value!).toBeCloseTo(expected, 10);
  });

  it('la primitiva derivada vuelve a dar f (comprobación independiente con diferencias centrales)', () => {
    const f = (x: number) => x * Math.exp(-x) + Math.cos(x);
    const F = findAntiderivative('x*exp(-x) + cos(x)')!;
    [0.3, 1.1, 2.7].forEach((x) => {
      const d = 1e-5;
      expect((F.evaluate(x + d) - F.evaluate(x - d)) / (2 * d)).toBeCloseTo(f(x), 6);
    });
  });

  it('escribe la primitiva en LaTeX de forma compacta', () => {
    expect(findAntiderivative('x^2')!.latex).toBe('\\frac{{ x}^{3}}{3}');
    expect(findAntiderivative('sin(2*x)')!.latex).toContain('\\cos');
  });
});

describe('findAntiderivative: ruido de redondeo', () => {
  it('∫₀^2π cos x dx es 0 y no −2.4e-16', () => {
    expect(exact('cos(x)', 0, 2 * PI)).toBe(0);
  });

  it('∫₀^2π sen x dx es 0 y no un residuo de 1e-16', () => {
    expect(exact('sin(x)', 0, 2 * PI)).toBe(0);
  });

  it('un valor pequeño pero real se conserva', () => {
    expect(exact('0.000000001*x', 0, 1)).toBeCloseTo(5e-10, 20);
  });
});

describe('findAntiderivative: sin valor exacto', () => {
  it('no inventa una primitiva donde no existe en forma elemental', () => {
    expect(findAntiderivative('exp(-x^2)')).toBeNull();
    expect(findAntiderivative('sin(x)/x')).toBeNull();
    expect(findAntiderivative('exp(x^2)')).toBeNull();
    expect(findAntiderivative('sqrt(1 + x^3)')).toBeNull();
  });

  it('devuelve null (y no falla) con lo que ninguna regla cubre, aunque tenga solución', () => {
    expect(findAntiderivative('x/(x^2 + 1)')).toBeNull();
    expect(findAntiderivative('sin(x)*cos(x)')).toBeNull();
    expect(findAntiderivative('')).toBeNull();
    expect(findAntiderivative('x +* 2')).toBeNull();
  });

  it('el resultado de la regla queda sin comparación (todo null), sin romper el cálculo', () => {
    const r = new TrapezoidRule().execute({ expression: 'exp(-x^2)', a: 0, b: 1, n: 4 });
    expect(r.value).toBeGreaterThan(0.74);
    expect(r.exactValue).toBeNull();
    expect(r.antiderivativeLatex).toBeNull();
    expect(r.trueError).toBeNull();
    expect(r.absoluteError).toBeNull();
    expect(r.relativeError).toBeNull();
  });

  it('rechaza una primitiva con un polo dentro del intervalo: ∫ 1/x en [−1, 2] diverge', () => {
    // n = 4 pone los nodos en −1, −0.25, 0.5, 1.25, 2: ninguno cae en 0, así que la regla corre,
    // pero F(b) − F(a) = ln 2 no sería la integral
    const r = new TrapezoidRule().execute({ expression: '1/x', a: -1, b: 2, n: 4 });
    expect(r.exactValue).toBeNull();
    expect(compareWithExact('1/x', (x) => 1 / x, { a: 1, b: 2 }, r.nodes, 0.7).exactValue).toBeCloseTo(Math.LN2, 10);
  });
});

describe('compareWithExact: errores', () => {
  it('el error verdadero lleva signo: I − I_aprox', () => {
    // ∫₀¹ x² dx con n = 2 da 0.375 y el valor exacto es 1/3: el trapecio sobrestima
    const r = new TrapezoidRule().execute({ expression: 'x^2', a: 0, b: 1, n: 2 });
    expect(r.exactValue).toBeCloseTo(1 / 3, 12);
    expect(r.trueError).toBeCloseTo(1 / 3 - 0.375, 12);
    expect(r.absoluteError).toBeCloseTo(0.375 - 1 / 3, 12);
    expect(r.relativeError).toBeCloseTo((0.375 - 1 / 3) * 3, 12);
  });

  it('sin error relativo cuando la integral exacta vale 0', () => {
    const r = new TrapezoidRule().execute({ expression: 'sin(x)', a: 0, b: 2 * PI, n: 8 });
    expect(r.exactValue).toBe(0);
    expect(r.relativeError).toBeNull();
    expect(r.absoluteError).not.toBeNull();
  });

  it('F(a) y F(b) quedan disponibles para mostrar el procedimiento', () => {
    const r = new TrapezoidRule().execute({ expression: 'sin(x)', a: 0, b: PI, n: 4 });
    expect(r.antiderivativeAtB! - r.antiderivativeAtA!).toBeCloseTo(2, 12);
    expect(r.antiderivativeAtA).toBeCloseTo(-1, 12);
    expect(r.antiderivativeAtB).toBeCloseTo(1, 12);
  });
});
