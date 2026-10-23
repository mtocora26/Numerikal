import { describe, expect, it } from 'vitest';
import { JacobiMethod } from '../../domain/systems/Jacobi';
import { GaussSeidelMethod } from '../../domain/systems/GaussSeidel';
import { canUseDiagonalQuotients, diagonalQuotients, emptySystemRows, parseInitialValue } from './systemInput';
import type { LinearSystemRows } from './MatrixInput';

const rows: LinearSystemRows = {
  a: [['4', '-1'], ['-1', '-3']],
  b: ['3', '2'],
  x0: ['0', '0'],
};

describe('vector inicial del sistema', () => {
  it('deja todas las celdas vacías al cambiar la dimensión, incluso al volver a 2×2', () => {
    expect(emptySystemRows(3)).toEqual({
      a: [['', '', ''], ['', '', ''], ['', '', '']],
      b: ['', '', ''],
      x0: ['', '', ''],
    });
    expect(emptySystemRows(2)).toEqual({ a: [['', ''], ['', '']], b: ['', ''], x0: ['', ''] });
  });

  it('acepta fracciones, signos, espacios y coma decimal', () => {
    expect(parseInitialValue('3/4')).toBe(0.75);
    expect(parseInitialValue(' -2 / -3 ')).toBeCloseTo(2 / 3);
    expect(parseInitialValue('1,5 / 0,5')).toBe(3);
    expect(parseInitialValue('0,25')).toBe(0.25);
  });

  it('rechaza denominador cero, fracciones incompletas y expresiones ajenas', () => {
    for (const text of ['1/0', '1 / ', '/2', '1/2/3', '1+2', 'Infinity', '']) {
      expect(Number.isFinite(parseInitialValue(text))).toBe(false);
    }
  });

  it('produce cocientes sin redondear y evita sobrescribir el vector si faltan datos', () => {
    expect(diagonalQuotients(rows)).toEqual(['3/4', '2/-3']);
    expect(parseInitialValue(diagonalQuotients(rows)![1])).toBeCloseTo(-2 / 3);
    expect(canUseDiagonalQuotients({ ...rows, a: [['0', '-1'], ['-1', '-3']] })).toBe(false);
    expect(diagonalQuotients({ ...rows, b: ['', '2'] })).toBeNull();
  });

  it('usa las fracciones iniciales en Jacobi y Gauss-Seidel', () => {
    for (const method of [new JacobiMethod(), new GaussSeidelMethod()]) {
      const x0 = ['3/4', '2/3'].map(parseInitialValue);
      const result = method.execute({ a: [[4, -1], [-1, 4]], b: [3, 3], x0,
        tolerance: 1e-4, maxIterations: 50, errorType: 'relative' });
      expect(result.iterations[0]).toMatchObject({ x1: 0.75, x2: 2 / 3 });
    }
  });
});
