import { describe, expect, it } from 'vitest';
import { Simpson13Rule } from './Simpson13';
import { Simpson38Rule } from './Simpson38';
import { MAX_SUBINTERVALS } from './quadrature';

const simpson38 = new Simpson38Rule();
const run = (expression: string, a: number, b: number, n: number) => simpson38.execute({ expression, a, b, n });

describe('Simpson38Rule: valores de referencia a mano', () => {
  it('∫₀^π sen x dx con n = 3 es 3√3·π/8 ≈ 2.040524', () => {
    const r = run('sin(x)', 0, Math.PI, 3);
    expect(r.h).toBeCloseTo(Math.PI / 3, 12);
    // 3h/8 · [0 + 3(√3/2) + 3(√3/2) + 0] = (π/8)·3√3
    expect(r.value).toBeCloseTo((3 * Math.sqrt(3) * Math.PI) / 8, 10);
    expect(r.value).toBeCloseTo(2.040524, 6);
    expect(r.exactValue).toBeCloseTo(2, 12);
    expect(r.absoluteError).toBeCloseTo((3 * Math.sqrt(3) * Math.PI) / 8 - 2, 12);
  });

  it('es exacta con polinomios de grado ≤ 3 usando solo n = 3', () => {
    expect(run('x^2', 0, 3, 3).value).toBeCloseTo(9, 12);
    expect(run('x^3', 0, 3, 3).value).toBeCloseTo(81 / 4, 12);
    // F(x) = x⁴/4 − 2x³/3 + x²/2 − 5x → F(3) − F(−1) = −44/3
    expect(run('x^3 - 2*x^2 + x - 5', -1, 3, 3).value).toBeCloseTo(-44 / 3, 10);
  });

  it('con x⁴ ya no es exacta: ∫₀³ x⁴ dx con n = 3 da 49.5 (exacto: 48.6)', () => {
    // 3/8 · [0 + 3(1) + 3(16) + 81] = 3/8 · 132
    const r = run('x^4', 0, 3, 3);
    expect(r.value).toBeCloseTo(49.5, 12);
    expect(r.absoluteError).toBeCloseTo(0.9, 8);
  });

  it('acepta la notación en español', () => {
    expect(run('sen(x)', 0, Math.PI, 3).value).toBeCloseTo(2.040524, 6);
  });
});

describe('Simpson38Rule: estructura del cálculo', () => {
  it('los coeficientes son 1, 3, 3, 2, 3, 3, 2, …, 3, 3, 1 y las sumas cuadran', () => {
    const r = run('x^2', 0, 6, 6);
    expect(r.nodes.map((node) => node.coefficient)).toEqual([1, 3, 3, 2, 3, 3, 1]);
    expect(r.nodes.map((node) => node.fx)).toEqual([0, 1, 4, 9, 16, 25, 36]);
    expect(r.endsSum).toBe(36);
    expect(r.tripleSum).toBe(1 + 4 + 16 + 25);
    expect(r.sharedSum).toBe(9);
    expect(r.weightedSum).toBe(r.endsSum + 3 * r.tripleSum + 2 * r.sharedSum);
    expect(r.value).toBeCloseTo((3 / 8) * (36 + 3 * 46 + 2 * 9), 12);
    expect(r.value).toBeCloseTo(72, 12);
  });

  it('con n = 9 hay dos nodos compartidos (i = 3 y 6)', () => {
    const r = run('x', 0, 9, 9);
    expect(r.nodes.map((node) => node.coefficient)).toEqual([1, 3, 3, 2, 3, 3, 2, 3, 3, 1]);
    expect(r.sharedSum).toBe(3 + 6);
  });

  it('con n = 3 (regla simple) no hay nodos compartidos ni término 2·Σ', () => {
    const r = run('x^2', 0, 3, 3);
    expect(r.sharedSum).toBe(0);
    expect(r.substitutedLatex).toBe('I \\approx \\frac{3(1)}{8}\\left[0 + 3(5) + 9\\right] = 9');
  });

  it('con n = 6 aparece el término 2·Σ', () => {
    expect(run('x^2', 0, 6, 6).substitutedLatex).toContain('\\left[0 + 3(46) + 2(9) + 36\\right]');
  });
});

describe('Simpson38Rule: el error baja con n', () => {
  it('es de orden h⁴: al duplicar n el error se divide entre ~16 (eˣ en [0, 1])', () => {
    const e12 = run('exp(x)', 0, 1, 12).absoluteError!;
    const e24 = run('exp(x)', 0, 1, 24).absoluteError!;
    expect(e12 / e24).toBeGreaterThan(15);
    expect(e12 / e24).toBeLessThan(17);
  });

  it('con n = 6 es parecida a Simpson 1/3, pero no idéntica (otra figura, otros pesos)', () => {
    const s38 = run('exp(x)', 0, 1, 6);
    const s13 = new Simpson13Rule().execute({ expression: 'exp(x)', a: 0, b: 1, n: 6 });
    expect(s38.value).not.toBe(s13.value);
    expect(Math.abs(s38.value - s13.value)).toBeLessThan(1e-4);
    expect(s38.absoluteError!).toBeLessThan(1e-4);
    // Mismo orden h⁴, pero la constante del error es (b − a)/80 en 3/8 y (b − a)/180 en 1/3: con el mismo h gana 1/3
    expect(s13.absoluteError!).toBeLessThan(s38.absoluteError!);
  });
});

describe('Simpson38Rule: validaciones', () => {
  const valid = { expression: 'x', a: 0, b: 1, n: 6 };

  it('acepta n múltiplo de 3 entre 3 y 99', () => {
    expect(simpson38.validate({ ...valid, n: 3 }).isValid).toBe(true);
    expect(simpson38.validate({ ...valid, n: 99 }).isValid).toBe(true);
  });

  it('rechaza n que no es múltiplo de 3 con un mensaje que explica por qué', () => {
    [4, 5, 8, 10, MAX_SUBINTERVALS].forEach((n) => {
      const v = simpson38.validate({ ...valid, n });
      expect(v.isValid).toBe(false);
      expect(v.errors.join(' ')).toMatch(/múltiplo de 3/);
    });
    expect(() => run('x', 0, 1, 4)).toThrow(/tres en tres/);
  });

  it('rechaza n = 1, 2, 0, fuera de rango o no entero', () => {
    [1, 2, 0, MAX_SUBINTERVALS + 2, 4.5, NaN].forEach((n) => {
      expect(simpson38.validate({ ...valid, n }).isValid).toBe(false);
    });
    expect(simpson38.validate({ ...valid, n: 2 }).errors.join(' ')).toMatch(/entero múltiplo de 3 entre 3 y 100/);
  });

  it('exige a < b y una función válida y definida en los nodos', () => {
    expect(simpson38.validate({ ...valid, a: 1, b: 0 }).isValid).toBe(false);
    expect(simpson38.validate({ ...valid, expression: 'x +* 2' }).isValid).toBe(false);
    expect(simpson38.validate({ expression: 'ln(x)', a: 0, b: 1, n: 3 }).errors.join(' ')).toMatch(/no está definida en x = 0/);
  });
});
