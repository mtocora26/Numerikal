import { describe, expect, it } from 'vitest';
import { RombergRule, MAX_ROMBERG_SUBINTERVALS } from './Romberg';
import { Simpson13Rule } from './Simpson13';
import { TrapezoidRule } from './Trapezoid';

const romberg = new RombergRule();
const run = (expression: string, a: number, b: number, n: number) => romberg.execute({ expression, a, b, n });

describe('RombergRule: ejercicio del profe (∫₀² dx/√(x²+4), n = 8)', () => {
  const r = run('1/sqrt(x^2+4)', 0, 2, 8);

  it('la tabla completa coincide con la pizarra', () => {
    const values = r.rows.map((row) => row.entries.map((entry) => entry.value));
    expect(values[0][0]).toBeCloseTo(0.85355339, 7);
    expect(values[1][0]).toBeCloseTo(0.87399029, 7);
    expect(values[1][1]).toBeCloseTo(0.88080259, 7);
    expect(values[2][0]).toBeCloseTo(0.87953077, 7);
    expect(values[2][1]).toBeCloseTo(0.88137760, 7);
    expect(values[2][2]).toBeCloseTo(0.88141593, 7);
    expect(values[3][0]).toBeCloseTo(0.88091314, 7);
    expect(values[3][1]).toBeCloseTo(0.88137393, 7);
    expect(values[3][2]).toBeCloseTo(0.88137369, 7);
    expect(values[3][3]).toBeCloseTo(0.88137302, 7);
    expect(r.value).toBeCloseTo(0.88137302, 7);
  });

  it('el R(4,4) correcto es 0.88137302 (el 0.88137730175 de la pizarra tiene una equivocación)', () => {
    // Valor exacto: asinh(1) = 0.88137359; el cálculo de clase queda a 5.7e-7
    expect(r.exactValue).toBeCloseTo(Math.asinh(1), 7);
    expect(r.absoluteError).toBeLessThan(1e-6);
  });

  it('dx = 0.25 y la tabla tiene log₂(8) + 1 = 4 filas', () => {
    expect(r.h).toBeCloseTo(0.25, 12);
    expect(r.k).toBe(4);
    expect(r.rows.map((row) => row.subintervals)).toEqual([1, 2, 4, 8]);
  });
});

describe('RombergRule: ejercicio de práctica (∫₀¹ dx/(1+x²), n = 8)', () => {
  it('la primera columna es 0.75, 0.775, 0.782794, 0.784747 y llega a π/4', () => {
    const r = run('1/(1+x^2)', 0, 1, 8);
    const firstColumn = r.rows.map((row) => row.entries[0].value);
    expect(firstColumn[0]).toBeCloseTo(0.75, 12);
    expect(firstColumn[1]).toBeCloseTo(0.775, 12);
    expect(firstColumn[2]).toBeCloseTo(0.782794, 6);
    expect(firstColumn[3]).toBeCloseTo(0.784747, 6);
    expect(r.exactValue).toBeCloseTo(Math.PI / 4, 12);
    expect(r.value).toBeCloseTo(Math.PI / 4, 5);
  });
});

describe('RombergRule: la recurrencia de clase coincide con las reglas directas', () => {
  it('la primera columna coincide con el trapecio compuesto de 2^(k−1) subintervalos', () => {
    const trapezoid = new TrapezoidRule();
    for (const n of [1, 2, 4, 8]) {
      const r = run('sin(x)', 0, Math.PI, n);
      const reference = trapezoid.execute({ expression: 'sin(x)', a: 0, b: Math.PI, n });
      expect(r.rows[n > 1 ? Math.log2(n) : 0].entries[0].value).toBeCloseTo(reference.value, 12);
    }
  });

  it('la columna 2 (divisor 3) coincide con Simpson 1/3', () => {
    const simpson = new Simpson13Rule();
    for (const n of [2, 4, 8]) {
      const r = run('exp(x)', 0, 1, n);
      const reference = simpson.execute({ expression: 'exp(x)', a: 0, b: 1, n });
      expect(r.rows[Math.log2(n)].entries[1].value).toBeCloseTo(reference.value, 12);
    }
  });

  it('es exacta para polinomios de grado 3 con solo dos filas (R(2,2) es Simpson)', () => {
    const r = run('x^3', 0, 1, 2);
    expect(r.value).toBeCloseTo(0.25, 12);
    expect(r.absoluteError).toBeCloseTo(0, 12);
  });
});

describe('RombergRule: estructura de la tabla', () => {
  it('la tabla es triangular: la fila k tiene k celdas y usa 2^(k−1) subintervalos', () => {
    const r = run('x^2', 0, 2, 8);
    expect(r.k).toBe(4);
    expect(r.rows).toHaveLength(4);
    r.rows.forEach((row, index) => {
      expect(row.k).toBe(index + 1);
      expect(row.subintervals).toBe(2 ** index);
      expect(row.h).toBeCloseTo(2 / 2 ** index, 12);
      expect(row.entries).toHaveLength(index + 1);
      expect(row.entries[0].j).toBe(1);
    });
    expect(r.value).toBe(r.rows[3].entries[3].value);
  });

  it('la partición más fina tiene n nodos con coeficientes de trapecio', () => {
    const r = run('x', 0, 4, 4);
    expect(r.h).toBeCloseTo(1, 12);
    expect(r.nodes).toHaveLength(5);
    expect(r.nodes.map((node) => node.coefficient)).toEqual([1, 2, 2, 2, 1]);
    expect(r.nodes.map((node) => node.x)).toEqual([0, 1, 2, 3, 4]);
  });

  it('con n = 1 la tabla es la regla simple del trapecio', () => {
    const r = run('x', 0, 2, 1);
    expect(r.rows[0].entries[0].value).toBeCloseTo(2, 12);
    expect(r.value).toBeCloseTo(2, 12);
    expect(r.substitutedLatex).toContain('R_{1,1}');
  });

  it('la fórmula sustituida muestra la última extrapolación en la forma de clase', () => {
    const r = run('exp(x)', 0, 1, 8);
    expect(r.substitutedLatex).toContain('R_{4,4}');
    expect(r.substitutedLatex).toContain('R_{4,3}');
    expect(r.substitutedLatex).toContain('R_{3,3}');
    expect(r.substitutedLatex).toContain('63');
  });
});

describe('RombergRule: la diagonal converge mucho más rápido', () => {
  it('cada fila gana más de 16 veces en precisión (eˣ en [0, 1])', () => {
    const error = (n: number) => Math.abs(run('exp(x)', 0, 1, n).value - (Math.E - 1));
    expect(error(2) / error(4)).toBeGreaterThan(16);
    expect(error(4) / error(8)).toBeGreaterThan(16);
  });

  it('funciona sin primitiva conocida: e^(−x²) en [0, 1] aproxima 0.7468241', () => {
    const r = run('exp(-x^2)', 0, 1, 8);
    expect(r.exactValue).toBeNull();
    // Valor real: (√π/2)·erf(1) ≈ 0.746824133
    expect(r.value).toBeCloseTo(0.746824, 5);
  });

  it('con integral exacta 0 no deja residuos de redondeo (sen x en [0, 2π])', () => {
    const r = run('sin(x)', 0, 2 * Math.PI, 4);
    expect(r.exactValue).toBe(0);
    expect(r.value).toBe(0);
    expect(r.absoluteError).toBe(0);
    expect(r.relativeError).toBeNull();
  });
});

describe('RombergRule: validaciones', () => {
  const valid = { expression: 'x', a: 0, b: 1, n: 4 };

  it('acepta potencias de 2 (1 a 512) y rechaza las demás', () => {
    expect(romberg.validate({ ...valid, n: 1 }).isValid).toBe(true);
    expect(romberg.validate({ ...valid, n: 2 }).isValid).toBe(true);
    expect(romberg.validate({ ...valid, n: MAX_ROMBERG_SUBINTERVALS }).isValid).toBe(true);
    expect(romberg.validate({ ...valid, n: 3 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: 6 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: 100 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: MAX_ROMBERG_SUBINTERVALS * 2 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: 0 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: 2.5 }).isValid).toBe(false);
    expect(romberg.validate({ ...valid, n: NaN }).isValid).toBe(false);
  });

  it('el mensaje de error pide potencia de 2', () => {
    expect(romberg.validate({ ...valid, n: 3 }).errors.join(' ')).toMatch(/potencia de 2/);
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
    const atEdge = romberg.validate({ expression: 'ln(x)', a: 0, b: 1, n: 4 });
    expect(atEdge.isValid).toBe(false);
    expect(atEdge.errors.join(' ')).toMatch(/no está definida en x = 0/);
    // Con n = 1 los nodos son solo a y b (1/x en [−1, 1] por simetría da 0); desde n = 2 hay nodo en 0
    expect(romberg.validate({ expression: '1/x', a: -1, b: 1, n: 1 }).isValid).toBe(true);
    expect(romberg.validate({ expression: '1/x', a: -1, b: 1, n: 2 }).isValid).toBe(false);
    expect(romberg.validate({ expression: '1/x', a: -1, b: 1, n: 8 }).isValid).toBe(false);
    expect(() => run('sqrt(x)', -1, 1, 2)).toThrow(/no está definida/);
  });
});
