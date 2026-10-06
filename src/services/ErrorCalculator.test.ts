import { describe, expect, it } from 'vitest';
import { ErrorCalculator } from './ErrorCalculator';

describe('ErrorCalculator', () => {
  it('error absoluto', () => {
    expect(ErrorCalculator.calculate(2.5, 2, 'absolute')).toBeCloseTo(0.5, 12);
  });

  it('error relativo', () => {
    expect(ErrorCalculator.calculate(2.5, 2, 'relative')).toBeCloseTo(0.2, 12);
  });

  it('error porcentual', () => {
    expect(ErrorCalculator.calculate(2.5, 2, 'percentage')).toBeCloseTo(20, 12);
  });

  it('en la primera iteración (sin valor previo) el error es 1', () => {
    expect(ErrorCalculator.calculate(2.5, null)).toBe(1);
    expect(ErrorCalculator.calculate(2.5, undefined)).toBe(1);
  });

  it('no divide entre cero cuando el valor actual es 0', () => {
    expect(ErrorCalculator.calculate(0, 0.5, 'relative')).toBe(0.5);
    expect(ErrorCalculator.calculate(0, 0.5, 'percentage')).toBe(50);
  });
});
