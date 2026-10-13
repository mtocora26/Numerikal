import { describe, expect, it } from 'vitest';
import { GaussSeidelMethod } from './GaussSeidel';
import { JacobiMethod } from './Jacobi';
import type { LinearSystemInput } from './types';

const seidel = new GaussSeidelMethod();

// Mismo ejemplo de la calculadora: 4x − y = 3, −x + 4y = 3 → x = y = 1
const input = (overrides: Partial<LinearSystemInput> = {}): LinearSystemInput => ({
  a: [[4, -1], [-1, 4]],
  b: [3, 3],
  x0: [0, 0],
  tolerance: 1e-4,
  maxIterations: 30,
  errorType: 'relative',
  ...overrides,
});

describe('método de Gauss-Seidel', () => {
  it('reutiliza de inmediato las incógnitas ya actualizadas', () => {
    const { iterations } = seidel.execute(input());
    // x1 = (3 + 0)/4 = 0.75; x2 usa el x1 nuevo: (3 + 0.75)/4 = 0.9375
    expect(iterations[1]).toMatchObject({ iteration: 1, x1: 0.75, x2: 0.9375 });
    // x1 = (3 + 0.9375)/4 = 0.984375; x2 = (3 + 0.984375)/4 = 0.99609375
    expect(iterations[2].x1).toBeCloseTo(0.984375, 10);
    expect(iterations[2].x2).toBeCloseTo(0.99609375, 10);
  });

  it('converge en menos iteraciones que Jacobi en el mismo sistema', () => {
    const gs = seidel.execute(input());
    const jacobi = new JacobiMethod().execute(input());
    expect(gs.converged).toBe(true);
    expect(gs.solution[0]).toBeCloseTo(1, 4);
    expect(gs.solution[1]).toBeCloseTo(1, 4);
    expect(gs.iterationsCount).toBeLessThan(jacobi.iterationsCount);
  });

  it('marca el método como sucesivo y escribe (k+1) en las incógnitas anteriores', () => {
    const result = seidel.execute(input());
    expect(result.sequential).toBe(true);
    expect(result.iterationFormulasLatex[0]).toContain('x_{2}^{(k)}');
    expect(result.iterationFormulasLatex[1]).toContain('x_{1}^{(k+1)}');
    expect(new JacobiMethod().execute(input()).sequential).toBe(false);
  });

  it('rechaza una diagonal con cero', () => {
    expect(seidel.validate(input({ a: [[0, 1], [1, 4]] })).isValid).toBe(false);
  });
});
