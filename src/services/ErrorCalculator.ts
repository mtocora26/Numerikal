import type { ErrorType } from '../domain/types';

export class ErrorCalculator {
  /**
   * Calculates the error based on selected type
   * @param current Current approximate value (xr_new)
   * @param previous Previous approximate value (xr_old)
   * @param errorType 'absolute' | 'relative' | 'percentage'
   */
  public static calculate(
    current: number,
    previous: number | null | undefined,
    errorType: ErrorType = 'relative'
  ): number {
    if (previous === null || previous === undefined || Number.isNaN(previous)) {
      return 1;
    }

    const diff = Math.abs(current - previous);

    switch (errorType) {
      case 'absolute':
        return diff;
      case 'percentage':
        if (Math.abs(current) < 1e-15) return diff * 100;
        return (diff / Math.abs(current)) * 100;
      case 'relative':
      default:
        if (Math.abs(current) < 1e-15) return diff;
        return diff / Math.abs(current);
    }
  }

  /**
   * Evaluates if error satisfies the tolerance
   */
  public static isWithinTolerance(
    error: number,
    tolerance: number,
    errorType: ErrorType = 'relative'
  ): boolean {
    if (errorType === 'percentage') {
      return error <= tolerance * 100;
    }
    return error <= tolerance;
  }

  /**
   * Formats error for display
   */
  public static format(error: number, errorType: ErrorType = 'relative', decimals: number = 6): string {
    if (error === 0) return '0';
    if (Math.abs(error) < 1e-4 || Math.abs(error) > 1e6) {
      return error.toExponential(decimals - 2);
    }
    const suffix = errorType === 'percentage' ? '%' : '';
    return error.toFixed(decimals) + suffix;
  }
}
