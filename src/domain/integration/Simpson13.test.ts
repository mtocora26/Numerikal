import { describe, expect, it } from 'vitest';
import { Simpson13Rule } from './Simpson13';
import { TrapezoidRule } from './Trapezoid';
import { MAX_SUBINTERVALS } from './quadrature';

const simpson = new Simpson13Rule();
const run = (expression: string, a: number, b: number, n: number) => simpson.execute({ expression, a, b, n });

describe('Simpson13Rule: valores de referencia a mano', () => {
  it('∫₀^π sen x dx con n = 4 es π(2 + 4√2)/12 ≈ 2.004560', () => {
    const r = run('sin(x)', 0, Math.PI, 4);
    // h/3 · [0 + 4(√2/2 + √2/2) + 2(1) + 0]
    expect(r.value).toBeCloseTo((Math.PI * (2 + 4 * Math.SQRT2)) / 12, 10);
    expect(r.value).toBeCloseTo(2.00456, 5);
    expect(r.exactValue).toBeCloseTo(2, 12);
    expect(r.trueError).toBeCloseTo(2 - (Math.PI * (2 + 4 * Math.SQRT2)) / 12, 12);
  });

  it('es exacta con polinomios de grado ≤ 3 usando solo n = 2', () => {
    expect(run('x^2', 0, 1, 2).value).toBeCloseTo(1 / 3, 12);
    expect(run('x^3', 0, 2, 2).value).toBeCloseTo(4, 12);
    // F(x) = x⁴/4 − 2x³/3 + x²/2 − 5x → F(3) − F(−1) = −8.25 − 6.41666… = −44/3
    expect(run('x^3 - 2*x^2 + x - 5', -1, 3, 2).value).toBeCloseTo(-44 / 3, 10);
  });

  it('con x⁴ ya no es exacta: ∫₀¹ x⁴ dx con n = 2 da 0.208333 (exacto: 0.2)', () => {
    const r = run('x^4', 0, 1, 2);
    expect(r.value).toBeCloseTo(1.25 / 6, 12);
    expect(r.absoluteError).toBeCloseTo(1.25 / 6 - 0.2, 8);
  });

  it('acepta la notación en español', () => {
    expect(run('sen(x)', 0, Math.PI, 4).value).toBeCloseTo(2.00456, 5);
  });

  it('el ruido de redondeo de sen(π) se toma como 0 en los nodos, pero un valor pequeño real se respeta', () => {
    const r = run('sin(x)', 0, Math.PI, 4);
    expect(r.nodes[4].fx).toBe(0);
    expect(r.substitutedLatex).toBe('I \\approx \\frac{0.785398}{3}\\left[0 + 4(1.41421) + 2(1) + 0\\right] = 2.0045598');
    // Una función uniformemente pequeña no se borra: el umbral es relativo a su propia escala
    expect(run('0.000000000000001*x', 0, 1, 2).nodes.map((node) => node.fx)).toEqual([0, 5e-16, 1e-15]);
  });
});

describe('Simpson13Rule: estructura del cálculo', () => {
  it('los coeficientes son 1, 4, 2, 4, …, 4, 1 y las sumas cuadran', () => {
    const r = run('x^2', 0, 3, 6);
    expect(r.nodes.map((node) => node.coefficient)).toEqual([1, 4, 2, 4, 2, 4, 1]);
    expect(r.nodes.map((node) => node.fx)).toEqual([0, 0.25, 1, 2.25, 4, 6.25, 9]);
    expect(r.endsSum).toBe(9);
    expect(r.oddSum).toBe(0.25 + 2.25 + 6.25);
    expect(r.evenSum).toBe(1 + 4);
    expect(r.weightedSum).toBe(r.endsSum + 4 * r.oddSum + 2 * r.evenSum);
    expect(r.value).toBeCloseTo((0.5 / 3) * (9 + 4 * 8.75 + 2 * 5), 12);
    expect(r.value).toBeCloseTo(9, 12);
  });

  it('con n = 2 (regla simple) no hay nodos pares interiores ni término 2·Σ', () => {
    const r = run('x^2', 0, 1, 2);
    expect(r.nodes.map((node) => node.coefficient)).toEqual([1, 4, 1]);
    expect(r.evenSum).toBe(0);
    expect(r.substitutedLatex).toBe('I \\approx \\frac{0.5}{3}\\left[0 + 4(0.25) + 1\\right] = 0.33333333');
  });

  it('con n = 4 aparece el término 2·Σ', () => {
    // impares: 0.25² + 0.75² = 0.625; pares interiores: 0.5² = 0.25
    expect(run('x^2', 0, 1, 4).substitutedLatex).toContain('\\left[0 + 4(0.625) + 2(0.25) + 1\\right]');
  });
});

describe('Simpson13Rule: el error baja con n', () => {
  it('es de orden h⁴: al duplicar n el error se divide entre ~16 (eˣ en [0, 1])', () => {
    const e10 = run('exp(x)', 0, 1, 10).absoluteError!;
    const e20 = run('exp(x)', 0, 1, 20).absoluteError!;
    expect(e10 / e20).toBeGreaterThan(15);
    expect(e10 / e20).toBeLessThan(17);
  });

  it('con los mismos nodos es más precisa que el trapecio en una función suave', () => {
    const t = new TrapezoidRule().execute({ expression: 'exp(x)', a: 0, b: 1, n: 4 });
    const s = run('exp(x)', 0, 1, 4);
    expect(s.absoluteError!).toBeLessThan(t.absoluteError! / 100);
  });

  it('el valor exacto cubre integrales con simetría y con raíz en el borde, sin aproximar', () => {
    expect(run('sin(x)', 0, 2 * Math.PI, 4).exactValue).toBe(0);
    expect(run('exp(x)', 0, 1, 4).exactValue).toBeCloseTo(Math.E - 1, 14);
    expect(run('sqrt(x)', 0, 1, 4).exactValue).toBeCloseTo(2 / 3, 14);
  });
});

describe('Simpson13Rule: validaciones', () => {
  const valid = { expression: 'x', a: 0, b: 1, n: 4 };

  it('acepta n par entre 2 y 100', () => {
    expect(simpson.validate({ ...valid, n: 2 }).isValid).toBe(true);
    expect(simpson.validate({ ...valid, n: MAX_SUBINTERVALS }).isValid).toBe(true);
  });

  it('rechaza n impar con un mensaje que explica por qué', () => {
    const odd = simpson.validate({ ...valid, n: 3 });
    expect(odd.isValid).toBe(false);
    expect(odd.errors.join(' ')).toMatch(/número par de subintervalos/);
    expect(() => run('x', 0, 1, 5)).toThrow(/número par/);
  });

  it('rechaza n = 1, fuera de rango o no entero', () => {
    expect(simpson.validate({ ...valid, n: 1 }).isValid).toBe(false);
    expect(simpson.validate({ ...valid, n: 0 }).isValid).toBe(false);
    expect(simpson.validate({ ...valid, n: MAX_SUBINTERVALS + 2 }).isValid).toBe(false);
    expect(simpson.validate({ ...valid, n: 2.5 }).isValid).toBe(false);
    expect(simpson.validate({ ...valid, n: NaN }).isValid).toBe(false);
  });

  it('exige a < b y una función válida y definida en los nodos', () => {
    expect(simpson.validate({ ...valid, a: 1, b: 0 }).isValid).toBe(false);
    expect(simpson.validate({ ...valid, expression: 'x +* 2' }).isValid).toBe(false);
    expect(simpson.validate({ expression: 'ln(x)', a: 0, b: 1, n: 4 }).errors.join(' ')).toMatch(/no está definida en x = 0/);
  });
});
