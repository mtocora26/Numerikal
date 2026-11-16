import { describe, expect, it } from 'vitest';
import { RombergRule, MAX_ROMBERG_LEVELS } from './Romberg';
import { Simpson13Rule } from './Simpson13';
import { TrapezoidRule } from './Trapezoid';

const romberg = new RombergRule();
const run = (expression: string, a: number, b: number, n: number) => romberg.execute({ expression, a, b, n });

describe('RombergRule: valores de referencia a mano', () => {
  it('∫₀¹ eˣ dx con k = 4 reproduce la tabla clásica y llega a e − 1 con error ~3e-10', () => {
    const r = run('exp(x)', 0, 1, 4);
    // Primera columna: trapecio con 1, 2, 4 y 8 subintervalos
    expect(r.rows[0].entries[0].value).toBeCloseTo((1 + Math.E) / 2, 12);
    expect(r.rows[1].entries[0].value).toBeCloseTo((1 + 2 * Math.sqrt(Math.E) + Math.E) / 4, 12);
    // Extrapolaciones de las primeras filas
    expect(r.rows[1].entries[1].value).toBeCloseTo(1.71886115, 7);
    expect(r.rows[2].entries[1].value).toBeCloseTo(1.71831884, 7);
    expect(r.rows[2].entries[2].value).toBeCloseTo(1.71828269, 7);
    // La esquina inferior derecha es la mejor aproximación
    expect(r.value).toBeCloseTo(1.718281828794531, 12);
    expect(Math.abs(r.value - (Math.E - 1))).toBeLessThan(1e-9);
    expect(r.exactValue).toBeCloseTo(Math.E - 1, 12);
    expect(r.relativeError).not.toBeNull();
  });

  it('la primera columna coincide con el trapecio compuesto de 2^i subintervalos', () => {
    const trapezoid = new TrapezoidRule();
    for (const levels of [1, 2, 3, 4]) {
      const r = run('sin(x)', 0, Math.PI, levels);
      const reference = trapezoid.execute({ expression: 'sin(x)', a: 0, b: Math.PI, n: 2 ** (levels - 1) });
      expect(r.rows[levels - 1].entries[0].value).toBeCloseTo(reference.value, 12);
    }
  });

  it('la segunda columna coincide con Simpson 1/3 (extrapolación con j = 1)', () => {
    const simpson = new Simpson13Rule();
    for (const panels of [2, 4, 8]) {
      const r = run('exp(x)', 0, 1, Math.log2(panels) + 1);
      const reference = simpson.execute({ expression: 'exp(x)', a: 0, b: 1, n: panels });
      expect(r.rows[Math.log2(panels)].entries[1].value).toBeCloseTo(reference.value, 12);
    }
  });

  it('es exacta para polinomios de grado 3 con solo dos filas (R₁,₁ es Simpson)', () => {
    const r = run('x^3', 0, 1, 2);
    expect(r.value).toBeCloseTo(0.25, 12);
    expect(r.absoluteError).toBeCloseTo(0, 12);
  });
});

describe('RombergRule: estructura de la tabla', () => {
  it('la tabla es triangular: la fila i tiene i + 1 celdas y la fila i usa 2^i subintervalos', () => {
    const r = run('x^2', 0, 2, 4);
    expect(r.levels).toBe(4);
    expect(r.rows).toHaveLength(4);
    r.rows.forEach((row, i) => {
      expect(row.i).toBe(i);
      expect(row.subintervals).toBe(2 ** i);
      expect(row.h).toBeCloseTo(2 / 2 ** i, 12);
      expect(row.entries).toHaveLength(i + 1);
      expect(row.entries[0].j).toBe(0);
    });
    expect(r.value).toBe(r.rows[3].entries[3].value);
  });

  it('la partición más fina tiene 2^(k−1) subintervalos con coeficientes de trapecio', () => {
    const r = run('x', 0, 4, 3);
    expect(r.h).toBeCloseTo(1, 12);
    expect(r.nodes).toHaveLength(5);
    expect(r.nodes.map((node) => node.coefficient)).toEqual([1, 2, 2, 2, 1]);
    expect(r.nodes.map((node) => node.x)).toEqual([0, 1, 2, 3, 4]);
  });

  it('con k = 1 la tabla es la regla simple del trapecio', () => {
    const r = run('x', 0, 2, 1);
    expect(r.rows[0].entries[0].value).toBeCloseTo(2, 12);
    expect(r.value).toBeCloseTo(2, 12);
    expect(r.substitutedLatex).toContain('R_{0,0}');
  });

  it('la fórmula sustituida muestra la última extrapolación con sus números', () => {
    const r = run('exp(x)', 0, 1, 4);
    expect(r.substitutedLatex).toContain('R_{3,3}');
    expect(r.substitutedLatex).toContain('R_{3,2}');
    expect(r.substitutedLatex).toContain('R_{2,2}');
    expect(r.substitutedLatex).toContain('1.7182818');
  });
});

describe('RombergRule: la diagonal converge mucho más rápido', () => {
  it('cada fila gana más de 16 veces en precisión (eˣ en [0, 1])', () => {
    const error = (levels: number) => Math.abs(run('exp(x)', 0, 1, levels).value - (Math.E - 1));
    expect(error(1) / error(2)).toBeGreaterThan(16);
    expect(error(2) / error(3)).toBeGreaterThan(16);
  });

  it('funciona sin primitiva conocida: e^(−x²) en [0, 1] aproxima 0.7468241', () => {
    const r = run('exp(-x^2)', 0, 1, 4);
    expect(r.exactValue).toBeNull();
    // Valor real: (√π/2)·erf(1) ≈ 0.746824133
    expect(r.value).toBeCloseTo(0.746824, 5);
  });

  it('con integral exacta 0 no deja residuos de redondeo (sen x en [0, 2π])', () => {
    const r = run('sin(x)', 0, 2 * Math.PI, 3);
    expect(r.exactValue).toBe(0);
    expect(r.value).toBe(0);
    expect(r.absoluteError).toBe(0);
    expect(r.relativeError).toBeNull();
  });
});

describe('RombergRule: validaciones', () => {
  const valid = { expression: 'x', a: 0, b: 1, n: 4 };

  it('acepta k = 1 y k = 10, rechaza fuera de rango o no entero', () => {
    expect(romberg.validate({ ...valid, n: 1 }).isValid).toBe(true);
    expect(romberg.validate({ ...valid, n: MAX_ROMBERG_LEVELS }).isValid).toBe(true);
    expect(romberg.validate({ ...valid, n: 0 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: MAX_ROMBERG_LEVELS + 1 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: 2.5 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: NaN }).isValid).toBe(false);
  });

  it('el mensaje de error habla de filas, no de subintervalos', () => {
    expect(romberg.validate({ ...valid, n: 0 }).errors.join(' ')).toMatch(/filas k/);
  });

  it('exige a < b', () => {
    expect(romberg.validate({ ...valid, a: 1, b: 1 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, a: 2, b: 1 }).isValid).toBe(false);
  });

  it('rechaza una función inválida o vacía', () => {
    expect(romberg.validate({ ...valid, expression: '' }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, expression: 'x +* 2' }).isValid).toBe(false);
    expect(() => run('', 0, 1, 4)).toThrow();
  });

  it('rechaza una f no definida en algún nodo de la partición más fina', () => {
    const atEdge = romberg.validate({ expression: 'ln(x)', a: 0, b: 1, n: 3 });
    expect(atEdge.isValid).toBe(false);
    expect(atEdge.errors.join(' ')).toMatch(/no está definida en x = 0/);
    // Con k = 1 los nodos son solo a y b (la integral de 1/x en [−1, 1] por simetría da 0); desde k = 2 hay nodo en 0
    expect(romberg.validate({ expression: '1/x', a: -1, b: 1, n: 1 }).isValid).toBe(true);
    expect(romberg.validate({ expression: '1/x', a: -1, b: 1, n: 2 }).isValid).toBe(false);
    expect(romberg.validate({ expression: '1/x', a: -1, b: 1, n: 4 }).isValid).toBe(false);
    expect(() => run('sqrt(x)', -1, 1, 2)).toThrow(/no está definida/);
  });
});
