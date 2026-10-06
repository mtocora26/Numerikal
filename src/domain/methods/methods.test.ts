import { describe, expect, it } from 'vitest';
import { MethodFactory } from '../../factories/MethodFactory';
import { NumericalEngine } from '../../services/NumericalEngine';
import { ExpressionParser } from '../../services/ExpressionParser';
import type { MethodInputParams } from '../types';

// x^3 - 4x - 1 = 0 tiene una raíz en x ≈ 2.1149 (también -0.2541 y -1.8608)
const EXAMPLE = 'x^3 - 4*x - 1';
const EXAMPLE_ROOT = 2.114907541;

const input = (expression: string, params: Record<string, number>, overrides: Partial<MethodInputParams> = {}): MethodInputParams => ({
  expression,
  tolerance: 1e-4,
  maxIterations: 30,
  errorType: 'relative',
  params,
  ...overrides,
});

const run = (methodId: string, expression: string, params: Record<string, number>) => {
  const f = ExpressionParser.parse(expression).evaluate;
  const method = MethodFactory.create(methodId);
  const request = input(expression, params);
  return { validation: method.validate(f, request), result: method.execute(f, request) };
};

describe('métodos de raíces con los valores por defecto de la calculadora', () => {
  // Estos son los parámetros iniciales de la calculadora: el ejemplo debe resolverse sin cambiar nada
  const cases: [string, string, Record<string, number>][] = [
    ['bisection', EXAMPLE, { xi: 2, xs: 3 }],
    ['false-position', EXAMPLE, { xi: 2, xs: 3 }],
    ['newton-raphson', EXAMPLE, { xi: 2, xs: 3 }],
    ['secant', EXAMPLE, { xi: 2, xs: 3 }],
    ['fixed-point', 'cbrt(4*x + 1)', { xi: 2, xs: 3 }],
    ['modified-newton-raphson', EXAMPLE, { xi: 2, xs: 3 }],
  ];

  it.each(cases)('%s converge a la raíz', (methodId, expression, params) => {
    const { validation, result } = run(methodId, expression, params);
    expect(validation.isValid).toBe(true);
    expect(result.converged).toBe(true);
    expect(result.approximateRoot).toBeCloseTo(EXAMPLE_ROOT, 2);
    expect(Math.abs(result.rootEvaluation)).toBeLessThan(1e-2);
  });

  it('todos los métodos registrados tienen un caso de prueba', () => {
    const tested = new Set(cases.map(([id]) => id));
    MethodFactory.getAllMethods().forEach((method) => expect(tested.has(method.id)).toBe(true));
  });
});

describe('métodos cerrados: validación del intervalo', () => {
  it.each(['bisection', 'false-position'])('%s rechaza un intervalo sin cambio de signo', (methodId) => {
    // f(1) = -4 y f(2) = -1: el antiguo intervalo por defecto
    const f = ExpressionParser.parse(EXAMPLE).evaluate;
    const validation = MethodFactory.create(methodId).validate(f, input(EXAMPLE, { xi: 1, xs: 2 }));
    expect(validation.isValid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  it('bisección reduce el intervalo a la mitad en cada iteración', () => {
    const { result } = run('bisection', EXAMPLE, { xi: 2, xs: 3 });
    const first = result.iterations[0];
    expect(Number(first.xr)).toBeCloseTo(2.5, 12);
  });
});

describe('Newton-Raphson', () => {
  it('encuentra otra raíz según el valor inicial', () => {
    const { result } = run('newton-raphson', EXAMPLE, { xi: 1 });
    expect(result.converged).toBe(true);
    expect(result.approximateRoot).toBeCloseTo(-1.860805853, 2);
  });
});

describe('NumericalEngine.validate', () => {
  const base = input(EXAMPLE, { xi: 2, xs: 3 });

  it('acepta una entrada correcta', () => {
    expect(NumericalEngine.validate('bisection', base).isValid).toBe(true);
  });

  it('rechaza una expresión inválida', () => {
    expect(NumericalEngine.validate('bisection', { ...base, expression: '2 +' }).isValid).toBe(false);
  });

  it('rechaza una tolerancia no positiva', () => {
    expect(NumericalEngine.validate('bisection', { ...base, tolerance: 0 }).isValid).toBe(false);
    expect(NumericalEngine.validate('bisection', { ...base, tolerance: -1 }).isValid).toBe(false);
  });

  it('rechaza un número de iteraciones fuera de rango', () => {
    expect(NumericalEngine.validate('bisection', { ...base, maxIterations: 0 }).isValid).toBe(false);
    expect(NumericalEngine.validate('bisection', { ...base, maxIterations: 1001 }).isValid).toBe(false);
  });

  it('rechaza un método inexistente', () => {
    expect(NumericalEngine.validate('no-existe', base).isValid).toBe(false);
  });
});
