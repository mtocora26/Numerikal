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

/** Una diferencia dividida f[xᵢ, …, xᵢ₊ₖ] de la tabla triangular. */
export interface DividedDifferenceEntry {
  /** Orden k: 0 = f[xᵢ], 1 = primera diferencia, … */
  order: number;
  /** Fila i dentro de su columna */
  index: number;
  /** f[xᵢ, …, xᵢ₊ₖ] en LaTeX */
  labelLatex: string;
  /** Fórmula con los valores sustituidos y el resultado; vacío en el orden 0 */
  formulaLatex: string;
  value: number;
}

export interface NewtonResult extends InterpolationResultBase {
  /** columns[k][i] = f[xᵢ, …, xᵢ₊ₖ]; la columna 0 son los yᵢ */
  columns: DividedDifferenceEntry[][];
  /** Primera fila de la tabla: f[x₀], f[x₀,x₁], … (coeficientes de la forma de Newton) */
  newtonCoefficients: number[];
  /** P(x) = f[x₀] + f[x₀,x₁](x − x₀) + … con los símbolos de la tabla */
  symbolicLatex: string;
  /** P(x) con las diferencias y los nodos sustituidos */
  substitutedLatex: string;
}

/** Un valor P_{i,j} de la tabla de Neville: el polinomio que pasa por xᵢ, …, xⱼ evaluado en x*. */
export interface NevilleEntry {
  /** Orden k = j − i: 0 = P_{i,i} = yᵢ */
  order: number;
  /** Fila i dentro de su columna */
  index: number;
  /** P_{i,j} en LaTeX */
  labelLatex: string;
  /** Fórmula con los valores sustituidos y el resultado; vacío en el orden 0 */
  formulaLatex: string;
  value: number;
}

export interface NevilleResult extends InterpolationResultBase {
  /** columns[k][i] = P_{i,i+k}(x*); la columna 0 son los yᵢ */
  columns: NevilleEntry[][];
  /** Recurrencia general de Neville en LaTeX */
  recurrenceLatex: string;
}
