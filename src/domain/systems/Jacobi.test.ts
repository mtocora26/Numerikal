import { describe, expect, it } from 'vitest';
import { JacobiMethod } from './Jacobi';
import { checkDiagonalDominance } from './linearSystem';
import type { LinearSystemInput } from './types';

const jacobi = new JacobiMethod();

// Ejemplo por defecto de la calculadora: 4x − y = 3, −x + 4y = 3 → x = y = 1
const input = (overrides: Partial<LinearSystemInput> = {}): LinearSystemInput => ({
  a: [[4, -1], [-1, 4]],
  b: [3, 3],
  x0: [0, 0],
  tolerance: 1e-4,
  maxIterations: 30,
  errorType: 'relative',
  ...overrides,
});

const product = (a: number[][], x: number[]) => a.map((row) => row.reduce((acc, v, j) => acc + v * x[j], 0));

describe('método de Jacobi', () => {
  it('resuelve el ejemplo por defecto sin cambiar nada', () => {
    const request = input();
    expect(jacobi.validate(request)).toEqual({ isValid: true, errors: [], warnings: [] });

    const result = jacobi.execute(request);
    expect(result.converged).toBe(true);
    expect(result.solution[0]).toBeCloseTo(1, 4);
    expect(result.solution[1]).toBeCloseTo(1, 4);
    // Cada iteración reduce el error absoluto a la cuarta parte; termina en k = 8.
    expect(result.iterationsCount).toBe(8);
  });

  it('calcula las primeras iteraciones como a mano', () => {
    const { iterations } = jacobi.execute(input());
    expect(iterations[0]).toMatchObject({ iteration: 0, x1: 0, x2: 0 });
    expect(iterations[1]).toMatchObject({ iteration: 1, x1: 0.75, x2: 0.75, e1: 0.75, e2: 0.75, error: 0.75 });
    expect(iterations[2]).toMatchObject({ iteration: 2, x1: 0.9375, x2: 0.9375 });
    expect(iterations[2].error).toBeCloseTo(0.1875, 10);
  });

  it('incluye en la tabla el error individual de cada incógnita', () => {
    const result = jacobi.execute(input({
      a: [[4, 1, 0], [1, 5, 1], [0, 1, 3]],
      b: [4, 10, 9],
      x0: [0, 0, 0],
    }));

    expect(result.columns.map(({ key }) => key)).toEqual([
      'iteration', 'x1', 'x2', 'x3', 'e1', 'e2', 'e3', 'error',
    ]);
    expect(result.errorType).toBe('absolute');
    expect(result.iterations[2].e1).toBeCloseTo(0.5, 10);
    expect(result.iterations[2].e2).toBeCloseTo(0.8, 10);
    expect(result.iterations[2].e3).toBeCloseTo(2 / 3, 10);
    expect(result.iterations[2].error).toBeCloseTo(0.8, 10);
  });

  it('usa solo los valores de la iteración anterior (ejemplo 4×4 de Burden)', () => {
    const a = [[10, -1, 2, 0], [-1, 11, -1, 3], [2, -1, 10, -1], [0, 3, -1, 8]];
    const b = [6, 25, -11, 15];
    const result = jacobi.execute(input({ a, b, x0: [0, 0, 0, 0], tolerance: 1e-8, maxIterations: 100 }));

    // Con x⁽⁰⁾ = 0, x⁽¹⁾ es simplemente bᵢ / aᵢᵢ en cada incógnita
    expect(result.iterations[1]).toMatchObject({ x1: 0.6, x3: -1.1, x4: 1.875 });
    expect(result.iterations[1].x2).toBeCloseTo(25 / 11, 12);

    expect(result.converged).toBe(true);
    [1, 2, -1, 1].forEach((v, i) => expect(result.solution[i]).toBeCloseTo(v, 6));
  });

  it('la solución verifica Ax ≈ b', () => {
    const a = [[5, 1, 1], [1, 4, -1], [2, -1, 6]];
    const b = [10, 7, 15];
    const result = jacobi.execute(input({ a, b, x0: [0, 0, 0], tolerance: 1e-10, maxIterations: 200 }));
    product(a, result.solution).forEach((v, i) => expect(v).toBeCloseTo(b[i], 8));
    expect(result.residualNorm).toBeLessThan(1e-8);
  });

  it('muestra las fórmulas despejadas de cada incógnita', () => {
    const { iterationFormulasLatex, systemLatex } = jacobi.execute(input());
    expect(iterationFormulasLatex).toEqual([
      'x_{1}^{(k+1)} = \\frac{3 + x_{2}^{(k)}}{4}',
      'x_{2}^{(k+1)} = \\frac{3 + x_{1}^{(k)}}{4}',
    ]);
    expect(systemLatex).toContain('4x_{1} - x_{2} &= 3');
  });

  it('rechaza un elemento cero en la diagonal', () => {
    const validation = jacobi.validate(input({ a: [[0, 1], [1, 4]] }));
    expect(validation.isValid).toBe(false);
    expect(validation.errors.join(' ')).toContain('a11 = 0');
    expect(() => jacobi.execute(input({ a: [[0, 1], [1, 4]] }))).toThrow();
  });

  it('avisa cuando la matriz no es diagonal dominante', () => {
    const validation = jacobi.validate(input({ a: [[1, 2], [3, 1]] }));
    expect(validation.isValid).toBe(true);
    expect(validation.warnings[0]).toContain('diagonal dominante');
  });

  it('detecta la divergencia en lugar de devolver valores infinitos', () => {
    const result = jacobi.execute(input({ a: [[1, 5], [7, 1]], b: [6, 8], maxIterations: 500 }));
    expect(result.converged).toBe(false);
    expect(result.convergenceReason).toContain('diverge');
  });

  it('rechaza tamaños, valores y criterios de parada inválidos', () => {
    expect(jacobi.validate(input({ a: [[4]], b: [3], x0: [0] })).isValid).toBe(false);
    expect(jacobi.validate(input({ b: [3] })).isValid).toBe(false);
    expect(jacobi.validate(input({ b: [3, Number.NaN] })).isValid).toBe(false);
    expect(jacobi.validate(input({ tolerance: 0 })).isValid).toBe(false);
    expect(jacobi.validate(input({ maxIterations: 0 })).isValid).toBe(false);
  });
});

describe('dominancia diagonal', () => {
  it('compara |aᵢᵢ| con la suma de los demás elementos de la fila', () => {
    const check = checkDiagonalDominance([[4, -1, 2], [1, 2, 1], [0, 1, 3]]);
    expect(check.rows.map((r) => r.dominant)).toEqual([true, false, true]);
    expect(check.rows[1]).toMatchObject({ diagonal: 2, offDiagonalSum: 2 });
    expect(check.strictlyDominant).toBe(false);
  });
});
