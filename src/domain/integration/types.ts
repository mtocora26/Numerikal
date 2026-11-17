import type { ExactComparison } from './quadrature';

export interface IntegrationInput {
  /** f(x) tal como la escribe el usuario */
  expression: string;
  /** Límite inferior de la integral */
  a: number;
  /** Límite superior de la integral */
  b: number;
  /** Número de subintervalos en que se divide [a, b] */
  n: number;
}

export interface IntegrationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Un nodo xᵢ = a + i·h con su f(xᵢ) y el coeficiente que le toca en la suma de la regla. */
export interface IntegrationNode {
  index: number;
  x: number;
  fx: number;
  /** Trapecio: 1 en los extremos y 2 adentro. Simpson 1/3: 1 en los extremos, 4 en los impares y 2 en los pares. Simpson 3/8: 1 en los extremos, 2 en los múltiplos de 3 y 3 en el resto. */
  coefficient: number;
  /** coeficiente · f(xᵢ) */
  weighted: number;
}

/** Lo que comparten las reglas de integración: la misma partición, distinta forma de sumar. */
export interface IntegrationResultBase extends ExactComparison {
  methodId: string;
  methodName: string;
  expression: string;
  /** f(x) en LaTeX */
  functionLatex: string;
  a: number;
  b: number;
  n: number;
  /** h = (b − a)/n */
  h: number;
  /** Los n + 1 nodos x₀ … xₙ */
  nodes: IntegrationNode[];
  /** Σ coeficiente · f(xᵢ), el corchete de la fórmula antes de multiplicar por h/2, h/3 o 3h/8 */
  weightedSum: number;
  /** f(x₀) + f(xₙ) */
  endsSum: number;
  /** La integral aproximada */
  value: number;
  /** La fórmula con los números sustituidos, en LaTeX */
  substitutedLatex: string;
  executionTimeMs: number;
}

export interface TrapezoidResult extends IntegrationResultBase {
  /** Σ f(xᵢ), i = 1 … n − 1 */
  innerSum: number;
}

export interface SimpsonResult extends IntegrationResultBase {
  /** Σ f(xᵢ), i = 1, 3, 5 … n − 1 */
  oddSum: number;
  /** Σ f(xᵢ), i = 2, 4, 6 … n − 2 */
  evenSum: number;
}

export interface Simpson38Result extends IntegrationResultBase {
  /** Σ f(xᵢ) en los nodos que no son múltiplos de 3 (peso 3): i = 1, 2, 4, 5, 7, 8 … */
  tripleSum: number;
  /** Σ f(xᵢ) en los nodos interiores múltiplos de 3 (peso 2, son el borde compartido entre dos cúbicas): i = 3, 6, 9 … n − 3 */
  sharedSum: number;
}

/** Una celda R(k, j) de la tabla de Romberg: el trapecio con 2^(k−1) subintervalos tras j − 1 extrapolaciones de Richardson. */
export interface RombergEntry {
  /** Columna j de la tabla (1 = trapecio puro, 2 = primera extrapolación con divisor 3, …) */
  j: number;
  value: number;
}

/** Fila k de la tabla (numerada desde 1, como en clase): la primera columna es el trapecio con 2^(k−1) subintervalos y las demás, extrapolaciones. */
export interface RombergRow {
  k: number;
  /** 2^(k−1): los subintervalos de la primera columna de esta fila */
  subintervals: number;
  /** h de esta fila = H/2^(k−1), con H = b − a */
  h: number;
  /** R(k, 1), R(k, 2), …, R(k, k) */
  entries: RombergEntry[];
}

export interface RombergResult extends ExactComparison {
  methodId: string;
  methodName: string;
  expression: string;
  /** f(x) en LaTeX */
  functionLatex: string;
  a: number;
  b: number;
  /** Filas de la tabla K: la fila k usa 2^(k−1) subintervalos, así que el n pedido cumple n = 2^(K−1) */
  k: number;
  /** h de la partición más fina = (b − a)/n */
  h: number;
  /** Nodos de la partición más fina, con el coeficiente del trapecio (1, 2, …, 2, 1); de aquí salen todas las filas */
  nodes: IntegrationNode[];
  /** La tabla triangular completa: rows[k−1].entries[j−1] es R(k, j) */
  rows: RombergRow[];
  /** La mejor aproximación: R(K, K), la esquina inferior derecha de la tabla */
  value: number;
  /** La última extrapolación con los números sustituidos, en LaTeX */
  substitutedLatex: string;
  executionTimeMs: number;
}

export type IntegrationResult = TrapezoidResult | SimpsonResult | Simpson38Result | RombergResult;

export const isRombergResult = (result: IntegrationResult): result is RombergResult => result.methodId === 'romberg';
