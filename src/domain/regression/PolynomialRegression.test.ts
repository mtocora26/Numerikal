import { describe, expect, it } from 'vitest';
import { MAX_POLYNOMIAL_DEGREE, PolynomialRegression } from './PolynomialRegression';
import { parseDataPoints } from './parseDataPoints';
import type { DataPoint } from './types';

const regression = new PolynomialRegression();

const points = (pairs: [number, number][]): DataPoint[] => pairs.map(([x, y]) => ({ x, y }));
const fromPolynomial = (coefficients: number[], xs: number[]): DataPoint[] =>
  xs.map((x) => ({ x, y: coefficients.reduce((acc, a, k) => acc + a * x ** k, 0) }));

// Ejemplo clásico de mínimos cuadrados con un polinomio de segundo orden (6 datos)
const REFERENCE = points([[0, 2.1], [1, 7.7], [2, 13.6], [3, 27.2], [4, 40.9], [5, 61.1]]);

describe('PolynomialRegression: resultados de referencia', () => {
  const result = regression.execute({ points: REFERENCE, degree: 2 });

  it('calcula los coeficientes del ejemplo', () => {
    expect(result.coefficients[0]).toBeCloseTo(2.47857, 5);
    expect(result.coefficients[1]).toBeCloseTo(2.35929, 5);
    expect(result.coefficients[2]).toBeCloseTo(1.86071, 5);
  });

  it('calcula las métricas del ajuste', () => {
    expect(result.sr).toBeCloseTo(3.74657, 5);
    expect(result.r2).toBeCloseTo(0.99851, 5);
    expect(result.r).toBeCloseTo(Math.sqrt(result.r2), 12);
    expect(result.standardError).toBeCloseTo(1.11752, 5);
    expect(result.n).toBe(6);
  });

  it('arma el sistema normal 3×3 con las sumatorias de la tabla', () => {
    expect(result.augmentedMatrix).toEqual([
      [6, 15, 55, 152.6],
      [15, 55, 225, 585.6],
      [55, 225, 979, 2488.8],
    ]);
  });

  it('la tabla de sumatorias tiene una fila por dato y los totales correctos', () => {
    const { rows, totals, columns } = result.summationTable;
    expect(rows).toHaveLength(6);
    expect(columns.map((c) => c.key)).toEqual(['x', 'y', 'x2', 'x3', 'x4', 'x1y', 'x2y']);
    expect(totals.x).toBe(15);
    expect(totals.y).toBeCloseTo(152.6, 12);
    expect(totals.x4).toBe(979);
    expect(totals.x2y).toBeCloseTo(2488.8, 12);
  });

  it('Gauss-Jordan termina en la matriz identidad con la solución en la última columna', () => {
    const last = result.steps[result.steps.length - 1].matrix;
    last.forEach((row, i) => {
      row.slice(0, 3).forEach((value, j) => expect(value).toBeCloseTo(i === j ? 1 : 0, 10));
      expect(row[3]).toBeCloseTo(result.coefficients[i], 10);
    });
    expect(result.steps[0].matrix).toEqual(result.augmentedMatrix);
  });

  it('los residuos suman cero y su suma de cuadrados es Sr', () => {
    expect(result.residuals.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 8);
    expect(result.residuals.reduce((a, e) => a + e * e, 0)).toBeCloseTo(result.sr, 10);
  });

  it('escribe el modelo en LaTeX', () => {
    expect(result.modelLatex).toBe('y = 2.47857 + 2.35929x + 1.86071x^{2}');
  });
});

describe('PolynomialRegression: recupera polinomios exactos', () => {
  it.each([
    [1, [3, -2]],
    [2, [1, 2, 3]],
    [3, [-1, 0.5, 0, 2]],
  ])('grado %i', (degree, coefficients) => {
    const result = regression.execute({ points: fromPolynomial(coefficients, [-2, -1, 0, 1, 2, 3, 4]), degree });
    coefficients.forEach((a, k) => expect(result.coefficients[k]).toBeCloseTo(a, 8));
    expect(result.r2).toBeCloseTo(1, 10);
    expect(result.sr).toBeCloseTo(0, 10);
  });

  it('regresión lineal con datos ruidosos coincide con las fórmulas de la recta', () => {
    // n = 4, Σx = 10, Σy = 20, Σxy = 59.8, Σx² = 30
    // a1 = (nΣxy − ΣxΣy) / (nΣx² − (Σx)²) = 39.2 / 20,  a0 = (Σy − a1Σx) / n
    const noisy = points([[1, 2.1], [2, 3.9], [3, 6.1], [4, 7.9]]);
    const result = regression.execute({ points: noisy, degree: 1 });
    expect(result.coefficients[1]).toBeCloseTo(1.96, 10);
    expect(result.coefficients[0]).toBeCloseTo(0.1, 10);
  });

  it('con tantos datos como coeficientes pasa por todos los puntos (sin error estándar)', () => {
    const result = regression.execute({ points: points([[0, 1], [1, 3], [2, 11]]), degree: 2 });
    expect(result.standardError).toBeNull();
    result.fitted.forEach((y, i) => expect(y).toBeCloseTo([1, 3, 11][i], 10));
  });

  it('con y constante, R² vale 1', () => {
    const result = regression.execute({ points: points([[0, 4], [1, 4], [2, 4], [3, 4]]), degree: 1 });
    expect(result.r2).toBe(1);
    expect(result.coefficients[0]).toBeCloseTo(4, 10);
    expect(result.coefficients[1]).toBeCloseTo(0, 10);
  });
});

describe('PolynomialRegression: validación', () => {
  const valid = points([[0, 1], [1, 2], [2, 5], [3, 10], [4, 17]]);

  it('acepta datos suficientes', () => {
    expect(regression.validate({ points: valid, degree: 2 })).toMatchObject({ isValid: true, errors: [] });
  });

  it.each([0, 7, 1.5, NaN])('rechaza el grado %s', (degree) => {
    expect(regression.validate({ points: valid, degree }).isValid).toBe(false);
  });

  it(`el grado máximo permitido es ${MAX_POLYNOMIAL_DEGREE}`, () => {
    const many = fromPolynomial([1, 1], [0, 1, 2, 3, 4, 5, 6, 7]);
    expect(regression.validate({ points: many, degree: MAX_POLYNOMIAL_DEGREE }).isValid).toBe(true);
  });

  it('rechaza menos valores de x distintos que coeficientes', () => {
    expect(regression.validate({ points: points([[1, 1], [2, 2]]), degree: 2 }).isValid).toBe(false);
    expect(regression.validate({ points: points([[1, 1], [1, 2], [1, 3]]), degree: 1 }).isValid).toBe(false);
  });

  it('rechaza datos no numéricos', () => {
    expect(regression.validate({ points: points([[0, 1], [NaN, 2], [2, 3]]), degree: 1 }).isValid).toBe(false);
    expect(regression.validate({ points: points([[0, 1], [1, Infinity], [2, 3]]), degree: 1 }).isValid).toBe(false);
  });

  it('avisa de interpolación exacta y de posible sobreajuste', () => {
    expect(regression.validate({ points: points([[0, 1], [1, 3], [2, 11]]), degree: 2 }).warnings).toHaveLength(1);
    const few = fromPolynomial([1, 1], [0, 1, 2, 3, 4, 5, 6]);
    expect(regression.validate({ points: few, degree: 5 }).warnings).toHaveLength(1);
  });

  it('execute lanza un error claro si los datos no son válidos', () => {
    expect(() => regression.execute({ points: points([[1, 1], [2, 2]]), degree: 2 })).toThrow(/al menos 3/);
  });
});

describe('parseDataPoints', () => {
  it('lee datos pegados desde Excel (tabulador)', () => {
    expect(parseDataPoints('0\t2.1\n1\t7.7\r\n2\t13.6').points).toEqual(points([[0, 2.1], [1, 7.7], [2, 13.6]]));
  });

  it('lee CSV, punto y coma y espacios', () => {
    expect(parseDataPoints('1,2\n3,4').points).toEqual(points([[1, 2], [3, 4]]));
    expect(parseDataPoints('1;2\n3;4').points).toEqual(points([[1, 2], [3, 4]]));
    expect(parseDataPoints('1  2\n3 4').points).toEqual(points([[1, 2], [3, 4]]));
  });

  it('acepta coma decimal cuando el separador es tabulador o punto y coma', () => {
    expect(parseDataPoints('1,5\t2,25').points).toEqual(points([[1.5, 2.25]]));
    expect(parseDataPoints('1,5;2,25').points).toEqual(points([[1.5, 2.25]]));
  });

  it('acepta negativos y notación científica', () => {
    expect(parseDataPoints('-1\t-2.5\n1e-3\t2').points).toEqual(points([[-1, -2.5], [0.001, 2]]));
  });

  it('ignora líneas vacías y reporta las inválidas', () => {
    const parsed = parseDataPoints('1\t2\n\nabc\t3\n4\t5\t6\n7\t8');
    expect(parsed.points).toEqual(points([[1, 2], [7, 8]]));
    expect(parsed.invalidLines).toEqual([3, 4]);
  });
});
