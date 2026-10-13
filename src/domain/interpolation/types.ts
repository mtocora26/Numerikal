import type { DataPoint } from '../regression/types';

export interface InterpolationInput {
  points: DataPoint[];
  /** Valor x* donde se evalúa el polinomio interpolante. */
  xStar: number;
}

export interface InterpolationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Lo que comparten todos los métodos de interpolación: el mismo polinomio, construido de distinta forma. */
export interface InterpolationResultBase {
  methodId: string;
  methodName: string;
  /** Grado del polinomio: n − 1 con n puntos */
  degree: number;
  n: number;
  points: DataPoint[];
  xStar: number;
  /** Coeficientes del polinomio expandido a0, a1, …, an (de menor a mayor grado) */
  coefficients: number[];
  /** P(x) = anxⁿ + … + a0 en LaTeX */
  expandedLatex: string;
  /** P(x*) */
  valueAtXStar: number;
  executionTimeMs: number;
}

/** Polinomio base de Lagrange Lᵢ(x) con sus valores sustituidos. */
export interface LagrangeBasis {
  index: number;
  xi: number;
  yi: number;
  /** Π(x − xⱼ) con los xⱼ sustituidos */
  numeratorLatex: string;
  /** Π(xᵢ − xⱼ) con los valores sustituidos */
  denominatorLatex: string;
  denominator: number;
  /** Lᵢ(x) expandido, a0 … an */
  coefficients: number[];
  /** Lᵢ(x*) */
  valueAtXStar: number;
}

export interface LagrangeResult extends InterpolationResultBase {
  basis: LagrangeBasis[];
  /** P(x) = y₀L₀(x) + y₁L₁(x) + … con los yᵢ sustituidos */
  sumLatex: string;
}
