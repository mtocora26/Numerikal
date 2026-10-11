import type { ErrorType } from '../types';
import type { IterationColumn, IterationData } from '../Iteration';

export interface LinearSystemInput {
  /** Matriz de coeficientes A (n×n) */
  a: number[][];
  /** Vector de términos independientes b */
  b: number[];
  /** Vector inicial x⁽⁰⁾ */
  x0: number[];
  tolerance: number;
  maxIterations: number;
  errorType: ErrorType;
}

export interface LinearSystemValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Una fila por ecuación: |aᵢᵢ| frente a Σ_{j≠i} |aᵢⱼ|. */
export interface DiagonalDominanceRow {
  diagonal: number;
  offDiagonalSum: number;
  dominant: boolean;
}

export interface DiagonalDominanceCheck {
  rows: DiagonalDominanceRow[];
  /** Estrictamente diagonal dominante por filas (condición suficiente de convergencia) */
  strictlyDominant: boolean;
}

export interface LinearSystemResult {
  methodId: string;
  methodName: string;
  n: number;
  /** true si el método usa las incógnitas ya actualizadas dentro de la misma iteración (Gauss-Seidel) */
  sequential: boolean;
  a: number[][];
  b: number[];
  x0: number[];
  solution: number[];
  /** ‖Ax − b‖∞ con la solución aproximada */
  residualNorm: number;
  finalError: number;
  errorType: ErrorType;
  iterationsCount: number;
  converged: boolean;
  convergenceReason: string;
  dominance: DiagonalDominanceCheck;
  /** Sistema original en LaTeX */
  systemLatex: string;
  /** Fórmula despejada de cada incógnita, en LaTeX */
  iterationFormulasLatex: string[];
  iterations: IterationData[];
  columns: IterationColumn[];
  executionTimeMs: number;
}
