import { describe, expect, it } from 'vitest';
import { NevilleInterpolation } from './Neville';
import { LagrangeInterpolation } from './Lagrange';
import { evaluatePolynomial } from './polynomial';
import type { DataPoint } from '../regression/types';

const neville = new NevilleInterpolation();
const lagrange = new LagrangeInterpolation();

const points = (pairs: [number, number][]): DataPoint[] => pairs.map(([x, y]) => ({ x, y }));

// Mismo ejemplo que Lagrange y Newton: P3(x) = x³ + 2x² − 6x + 7
const REFERENCE = points([[0, 7], [1, 4], [2, 11], [3, 34]]);

describe('NevilleInterpolation: ejemplo de referencia', () => {
  const result = neville.execute({ points: REFERENCE, xStar: 1.5 });
  const values = result.columns.map((column) => column.map((e) => e.value));

  it('la tabla coincide con el cálculo a mano', () => {
    expect(values[0]).toEqual([7, 4, 11, 34]);
    expect(values[1]).toEqual([2.5, 7.5, -0.5]);
    expect(values[3]).toHaveLength(1);
  });

  it('P(1.5) coincide con x³ + 2x² − 6x + 7', () => {
    expect(result.valueAtXStar).toBeCloseTo(1.5 ** 3 + 2 * 1.5 ** 2 - 6 * 1.5 + 7, 10);
  });

  it('el polinomio expandido es x³ + 2x² − 6x + 7', () => {
    expect(result.expandedLatex).toBe('P_{3}(x) = x^{3} + 2x^{2} - 6x + 7');
    expect(evaluatePolynomial(result.coefficients, 1.5)).toBeCloseTo(result.valueAtXStar, 10);
  });

  it('escribe la fórmula con los valores sustituidos', () => {
    expect(result.columns[1][0].formulaLatex).toContain('P_{0,1} = \\frac{(x^* - x_{0})\\,P_{1,1} - (x^* - x_{1})\\,P_{0,0}}{x_{1} - x_{0}}');
  });
});

describe('NevilleInterpolation: coherencia con Lagrange', () => {
  it('da el mismo valor y polinomio con nodos no equiespaciados', () => {
    const pts = points([[-1, 2], [0.5, -3], [2, 4], [3.5, 1], [5, 8]]);
    const a = neville.execute({ points: pts, xStar: 1.7 });
    const b = lagrange.execute({ points: pts, xStar: 1.7 });
    expect(a.valueAtXStar).toBeCloseTo(b.valueAtXStar, 9);
    a.coefficients.forEach((c, k) => expect(c).toBeCloseTo(b.coefficients[k], 8));
  });

  it('con 2 puntos es la recta que los une', () => {
    const r = neville.execute({ points: points([[1, 2], [3, 6]]), xStar: 2 });
    expect(r.valueAtXStar).toBeCloseTo(4, 12);
  });

  it('en un nodo devuelve su y', () => {
    expect(neville.execute({ points: REFERENCE, xStar: 2 }).valueAtXStar).toBeCloseTo(11, 12);
  });
});

describe('NevilleInterpolation: validación', () => {
  it('rechaza x repetidos', () => {
    expect(() => neville.execute({ points: points([[1, 2], [1, 3]]), xStar: 1 })).toThrow(/distintos/);
  });
  it('avisa de extrapolación', () => {
    const v = neville.validate({ points: REFERENCE, xStar: 10 });
    expect(v.isValid).toBe(true);
    expect(v.warnings.join(' ')).toMatch(/extrapolación/);
  });
});
