import { describe, expect, it } from 'vitest';
import { TrapezoidRule } from './Trapezoid';
import { MAX_SUBINTERVALS } from './quadrature';

const trapezoid = new TrapezoidRule();
const run = (expression: string, a: number, b: number, n: number) => trapezoid.execute({ expression, a, b, n });

describe('TrapezoidRule: valores de referencia a mano', () => {
  it('∫₀^π sen x dx con n = 4 es π(1 + √2)/4 ≈ 1.896119', () => {
    const r = run('sin(x)', 0, Math.PI, 4);
    expect(r.h).toBeCloseTo(Math.PI / 4, 12);
    // h/2 · [0 + 2(√2/2 + 1 + √2/2) + 0]
    expect(r.value).toBeCloseTo((Math.PI * (1 + Math.SQRT2)) / 4, 10);
    expect(r.value).toBeCloseTo(1.896119, 6);
    expect(r.exactValue).toBeCloseTo(2, 12);
    expect(r.absoluteError).toBeCloseTo(2 - (Math.PI * (1 + Math.SQRT2)) / 4, 12);
    expect(r.relativeError).toBeCloseTo((2 - 1.896119) / 2, 6);
  });

  it('∫₀¹ x² dx con n = 2 da 0.375 (exacto: 1/3)', () => {
    const r = run('x^2', 0, 1, 2);
    expect(r.value).toBeCloseTo(0.375, 12);
    expect(r.absoluteError).toBeCloseTo(0.375 - 1 / 3, 8);
  });

  it('es exacta con rectas: ∫₀³ (2x + 1) dx = 12 con un solo trapecio', () => {
    const r = run('2*x + 1', 0, 3, 1);
    expect(r.value).toBeCloseTo(12, 12);
    expect(r.absoluteError).toBeCloseTo(0, 8);
  });

  it('acepta la notación en español y las constantes e y π', () => {
    expect(run('sen(x)', 0, Math.PI, 4).value).toBeCloseTo(1.896119, 6);
    expect(run('e^x', 0, 1, 1).value).toBeCloseTo((1 + Math.E) / 2, 12);
    expect(run('cos(pi*x)', 0, 1, 2).value).toBeCloseTo(0, 12);
  });
});

describe('TrapezoidRule: estructura del cálculo', () => {
  it('los coeficientes son 1, 2, …, 2, 1 y las sumas cuadran con la tabla', () => {
    const r = run('x^2', 0, 2, 4);
    expect(r.nodes.map((node) => node.coefficient)).toEqual([1, 2, 2, 2, 1]);
    expect(r.nodes.map((node) => node.x)).toEqual([0, 0.5, 1, 1.5, 2]);
    expect(r.nodes.map((node) => node.fx)).toEqual([0, 0.25, 1, 2.25, 4]);
    expect(r.endsSum).toBe(4);
    expect(r.innerSum).toBe(3.5);
    expect(r.weightedSum).toBe(r.endsSum + 2 * r.innerSum);
    expect(r.value).toBeCloseTo((0.5 / 2) * 11, 12);
  });

  it('el último nodo cae exactamente en b aunque h no sea exacto', () => {
    const r = run('x', 0, 1, 3);
    expect(r.nodes[3].x).toBe(1);
  });

  it('con n = 1 (regla simple) no escribe el término de nodos interiores', () => {
    const r = run('x', 0, 2, 1);
    expect(r.nodes).toHaveLength(2);
    expect(r.innerSum).toBe(0);
    expect(r.substitutedLatex).toBe('I \\approx \\frac{2}{2}\\left[0 + 2\\right] = 2');
  });

  it('pone entre paréntesis los valores negativos de la suma', () => {
    const r = run('-x', 0, 2, 2);
    expect(r.substitutedLatex).toBe('I \\approx \\frac{1}{2}\\left[0 + 2(-1) + (-2)\\right] = -2');
  });
});

describe('TrapezoidRule: el error baja con n', () => {
  it('es de orden h²: al duplicar n el error se divide entre ~4 (eˣ en [0, 1])', () => {
    const e10 = run('exp(x)', 0, 1, 10).absoluteError!;
    const e20 = run('exp(x)', 0, 1, 20).absoluteError!;
    expect(e10 / e20).toBeGreaterThan(3.9);
    expect(e10 / e20).toBeLessThan(4.1);
  });

  it('sin error relativo cuando la integral exacta vale 0 (no un residuo de 1e-16)', () => {
    const r = run('sin(x)', 0, 2 * Math.PI, 8);
    expect(r.exactValue).toBe(0);
    // La suma de valores simétricos cancela a mano; en punto flotante dejaba 1.7e-16
    expect(r.value).toBe(0);
    expect(r.absoluteError).toBe(0);
    expect(r.relativeError).toBeNull();
  });
});

describe('TrapezoidRule: validaciones', () => {
  const valid = { expression: 'x', a: 0, b: 1, n: 4 };

  it('acepta n = 1 y n = 100, rechaza fuera de rango o no entero', () => {
    expect(trapezoid.validate({ ...valid, n: 1 }).isValid).toBe(true);
    expect(trapezoid.validate({ ...valid, n: MAX_SUBINTERVALS }).isValid).toBe(true);
    expect(trapezoid.validate({ ...valid, n: 0 }).isValid).toBe(false);
    expect(trapezoid.validate({ ...valid, n: MAX_SUBINTERVALS + 1 }).isValid).toBe(false);
    expect(trapezoid.validate({ ...valid, n: 2.5 }).isValid).toBe(false);
    expect(trapezoid.validate({ ...valid, n: NaN }).isValid).toBe(false);
  });

  it('acepta n impar (no necesita par)', () => {
    expect(trapezoid.validate({ ...valid, n: 3 }).isValid).toBe(true);
  });

  it('exige a < b', () => {
    const equal = trapezoid.validate({ ...valid, a: 1, b: 1 });
    expect(equal.isValid).toBe(false);
    expect(equal.errors.join(' ')).toMatch(/debe ser menor/);
    expect(trapezoid.validate({ ...valid, a: 2, b: 1 }).isValid).toBe(false);
  });

  it('rechaza límites no numéricos', () => {
    expect(trapezoid.validate({ ...valid, a: NaN }).errors.join(' ')).toMatch(/límite inferior a válido/);
    expect(trapezoid.validate({ ...valid, b: NaN }).errors.join(' ')).toMatch(/límite superior b válido/);
  });

  it('rechaza una función inválida o vacía', () => {
    expect(trapezoid.validate({ ...valid, expression: '' }).isValid).toBe(false);
    expect(trapezoid.validate({ ...valid, expression: 'x +* 2' }).isValid).toBe(false);
    expect(() => run('', 0, 1, 4)).toThrow();
  });

  it('rechaza una f no definida en algún nodo', () => {
    const atEdge = trapezoid.validate({ expression: 'ln(x)', a: 0, b: 1, n: 4 });
    expect(atEdge.isValid).toBe(false);
    expect(atEdge.errors.join(' ')).toMatch(/no está definida en x = 0/);
    // 1/x con n = 2 en [−1, 1] tiene un nodo en 0, pero con n = 3 no
    expect(trapezoid.validate({ expression: '1/x', a: -1, b: 1, n: 2 }).isValid).toBe(false);
    expect(trapezoid.validate({ expression: '1/x', a: -1, b: 1, n: 3 }).isValid).toBe(true);
    expect(() => run('sqrt(x)', -1, 1, 2)).toThrow(/no está definida/);
  });
});
