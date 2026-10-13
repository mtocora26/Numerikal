import { describe, expect, it } from 'vitest';
import { NewtonDividedDifferences } from './NewtonDividedDifferences';
import { LagrangeInterpolation } from './Lagrange';
import { evaluatePolynomial } from './polynomial';
import type { DataPoint } from '../regression/types';

const newton = new NewtonDividedDifferences();
const lagrange = new LagrangeInterpolation();

const points = (pairs: [number, number][]): DataPoint[] => pairs.map(([x, y]) => ({ x, y }));

// Ejemplo del documento de clase: P3(x) = x³ + 2x² − 6x + 7
const REFERENCE = points([[0, 7], [1, 4], [2, 11], [3, 34]]);

describe('NewtonDividedDifferences: ejemplo de referencia', () => {
  const result = newton.execute({ points: REFERENCE, xStar: 1.5 });
  const values = result.columns.map((column) => column.map((e) => e.value));

  it('la tabla coincide con el cálculo a mano', () => {
    expect(values).toEqual([
      [7, 4, 11, 34],
      [-3, 7, 23],
      [5, 8],
      [1],
    ]);
  });

  it('la primera fila de la tabla da los coeficientes de Newton', () => {
    expect(result.newtonCoefficients).toEqual([7, -3, 5, 1]);
  });

  it('el polinomio expandido es x³ + 2x² − 6x + 7', () => {
    expect(result.coefficients[0]).toBeCloseTo(7, 10);
    expect(result.coefficients[1]).toBeCloseTo(-6, 10);
    expect(result.coefficients[2]).toBeCloseTo(2, 10);
    expect(result.coefficients[3]).toBeCloseTo(1, 10);
    expect(result.expandedLatex).toBe('P_{3}(x) = x^{3} + 2x^{2} - 6x + 7');
  });

  it('escribe la forma de Newton simbólica y sustituida', () => {
    expect(result.symbolicLatex).toBe(
      'P_{3}(x) = f[x_{0}] + f[x_{0}, x_{1}](x - x_{0}) + f[x_{0}, x_{1}, x_{2}](x - x_{0})(x - x_{1}) + f[x_{0}, \\ldots, x_{3}](x - x_{0})(x - x_{1})(x - x_{2})'
    );
    expect(result.substitutedLatex).toBe('P_{3}(x) = 7 - 3x + 5x(x - 1) + x(x - 1)(x - 2)');
  });

  it('muestra cada diferencia con los valores sustituidos', () => {
    expect(result.columns[1][0].formulaLatex).toBe(
      'f[x_{0}, x_{1}] = \\frac{f[x_{1}] - f[x_{0}]}{x_{1} - x_{0}} = \\frac{4 - 7}{1 - 0} = -3'
    );
    expect(result.columns[2][0].formulaLatex).toContain('\\frac{7 - (-3)}{2 - 0} = 5');
  });

  it('P(xᵢ) = yᵢ en todos los nodos', () => {
    REFERENCE.forEach((p) => expect(evaluatePolynomial(result.coefficients, p.x)).toBeCloseTo(p.y, 10));
  });

  it('P(x*) = 5.875', () => {
    expect(result.valueAtXStar).toBeCloseTo(5.875, 10);
  });
});

describe('NewtonDividedDifferences: coincide con Lagrange', () => {
  const cases: { name: string; pts: DataPoint[]; xStar: number }[] = [
    { name: 'ejemplo de clase', pts: REFERENCE, xStar: 2.7 },
    { name: 'nodos negativos y no equiespaciados', pts: points([[-2, 1.5], [-0.5, 4], [1, -2], [2.5, 3], [4, 0.5]]), xStar: 0.3 },
    { name: 'puntos desordenados', pts: points([[3, 9], [-1, 1], [2, 4], [0, 0]]), xStar: 1 },
    { name: 'extrapolación', pts: points([[1, 2], [2, 3], [4, 7]]), xStar: 6 },
  ];

  cases.forEach(({ name, pts, xStar }) => {
    it(`mismos coeficientes y mismo P(x*): ${name}`, () => {
      const a = newton.execute({ points: pts, xStar });
      const b = lagrange.execute({ points: pts, xStar });
      expect(a.coefficients).toHaveLength(b.coefficients.length);
      a.coefficients.forEach((c, k) => expect(c).toBeCloseTo(b.coefficients[k], 8));
      expect(a.valueAtXStar).toBeCloseTo(b.valueAtXStar, 8);
    });
  });

  it('con 2 puntos la tabla tiene dos columnas y da la recta', () => {
    const result = newton.execute({ points: points([[1, 3], [3, 7]]), xStar: 2 });
    expect(result.columns.map((c) => c.length)).toEqual([2, 1]);
    expect(result.coefficients[0]).toBeCloseTo(1, 12);
    expect(result.coefficients[1]).toBeCloseTo(2, 12);
    expect(result.valueAtXStar).toBeCloseTo(5, 12);
  });

  it('con datos de un polinomio de grado menor, las últimas diferencias son 0', () => {
    const result = newton.execute({ points: points([[0, 1], [1, 3], [2, 5], [3, 7]]), xStar: 4 });
    expect(result.newtonCoefficients).toEqual([1, 2, 0, 0]);
    expect(result.expandedLatex).toBe('P_{3}(x) = 2x + 1');
    expect(result.valueAtXStar).toBeCloseTo(9, 12);
  });
});

describe('NewtonDividedDifferences: validaciones', () => {
  it('rechaza menos de 2 puntos y x repetidas', () => {
    expect(newton.validate({ points: points([[1, 1]]), xStar: 1 }).isValid).toBe(false);
    const repeated = newton.validate({ points: points([[1, 1], [1, 2]]), xStar: 1 });
    expect(repeated.isValid).toBe(false);
    expect(repeated.errors.join(' ')).toMatch(/distintos/);
    expect(() => newton.execute({ points: points([[1, 1], [1, 2]]), xStar: 1 })).toThrow();
  });

  it('avisa de extrapolación', () => {
    expect(newton.validate({ points: REFERENCE, xStar: -4 }).warnings.join(' ')).toMatch(/extrapolación/);
  });
});
