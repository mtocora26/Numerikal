import { describe, expect, it } from 'vitest';
import { PolynomialRegression } from './PolynomialRegression';
import type { DataPoint } from './types';

const regression = new PolynomialRegression();
const points = (pairs: [number, number][]): DataPoint[] => pairs.map(([x, y]) => ({ x, y }));

// Ejemplo de referencia: sistema normal 3×3 con n = 6, Σx = 15, Σx² = 55, Σx³ = 225, Σx⁴ = 979
const REFERENCE = points([[0, 2.1], [1, 7.7], [2, 13.6], [3, 27.2], [4, 40.9], [5, 61.1]]);
const result = regression.execute({ points: REFERENCE, degree: 2 });
const titles = result.steps.map((step) => step.title);

const rowsChanged = (before: number[][], after: number[][]): number =>
  before.filter((row, r) => row.some((v, c) => v !== after[r][c])).length;

describe('Gauss-Jordan: procedimiento de clase', () => {
  it('empieza dividiendo la fila 1 entre su pivote y luego anula la columna fila por fila', () => {
    expect(titles.slice(0, 4)).toEqual([
      'Matriz aumentada',
      'F1 ← F1 / (6)',
      'F2 ← F2 − (15)·F1',
      'F3 ← F3 − (55)·F1',
    ]);
  });

  it('el paso 2 deja un 1 en la posición (1,1): F1 = [1, 2.5, 55/6, 152.6/6]', () => {
    const [, first] = [result.steps[0], result.steps[1]];
    expect(first.matrix[0][0]).toBe(1);
    expect(first.matrix[0][1]).toBeCloseTo(2.5, 12);
    expect(first.matrix[0][2]).toBeCloseTo(55 / 6, 12);
    expect(first.matrix[0][3]).toBeCloseTo(152.6 / 6, 12);
  });

  it('F2 ← F2 − (15)·F1 deja [0, 17.5, 87.5, 204.1]', () => {
    const row = result.steps[2].matrix[1];
    expect(row[0]).toBe(0);
    expect(row[1]).toBeCloseTo(17.5, 10);
    expect(row[2]).toBeCloseTo(87.5, 10);
    expect(row[3]).toBeCloseTo(204.1, 10);
  });

  it('cada paso cambia exactamente una fila de la matriz', () => {
    result.steps.slice(1).forEach((step, i) => {
      expect(rowsChanged(result.steps[i].matrix, step.matrix)).toBe(1);
    });
  });

  it('no intercambia filas cuando el pivote no es cero', () => {
    expect(titles.some((title) => title.startsWith('Intercambio'))).toBe(false);
  });

  it.each([
    [1, [[0, 1], [1, 3], [2, 5.2], [3, 6.9]]],
    [3, [[-2, 3], [-1, 1], [0, 0.5], [1, 2], [2, 6], [3, 14]]],
    [2, [[10, 5], [20, 9], [30, 17], [40, 30], [50, 52]]],
  ] as [number, [number, number][]][])('no hay intercambios en un ajuste de grado %i', (degree, pairs) => {
    const { steps } = regression.execute({ points: points(pairs), degree });
    expect(steps.some((step) => step.title.startsWith('Intercambio'))).toBe(false);
  });

  it('termina en la identidad con la solución en la última columna', () => {
    const last = result.steps[result.steps.length - 1].matrix;
    last.forEach((row, i) => {
      row.slice(0, 3).forEach((value, j) => expect(value).toBe(i === j ? 1 : 0));
      expect(row[3]).toBeCloseTo(result.coefficients[i], 10);
    });
  });

  it('obtiene los mismos coeficientes de referencia', () => {
    expect(result.coefficients[0]).toBeCloseTo(2.47857, 5);
    expect(result.coefficients[1]).toBeCloseTo(2.35929, 5);
    expect(result.coefficients[2]).toBeCloseTo(1.86071, 5);
  });
});

describe('Gauss-Jordan: pivote cero', () => {
  const gaussJordan = (matrix: number[][]) => regression['gaussJordan'](matrix);

  it('solo intercambia filas cuando el pivote es cero', () => {
    const { solution, steps } = gaussJordan([[0, 1, 1], [1, 0, 2]]);
    expect(steps[1].title).toBe('Intercambio F1 ↔ F2');
    expect(solution[0]).toBeCloseTo(2, 12);
    expect(solution[1]).toBeCloseTo(1, 12);
  });

  it('lanza un error claro si el sistema es singular', () => {
    expect(() => gaussJordan([[1, 1, 2], [1, 1, 3]])).toThrow(/singular/);
  });
});
