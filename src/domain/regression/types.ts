export interface DataPoint {
  x: number;
  y: number;
}

export interface RegressionInput {
  points: DataPoint[];
  degree: number;
}

export interface RegressionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Tabla de sumatorias, como se arma en clase: una fila por dato y una fila final con Σ. */
export interface SummationTable {
  /** Encabezados en texto plano y en LaTeX: x, y, x², …, x^2m, xy, …, x^m y */
  columns: { key: string; label: string; latexLabel: string }[];
  rows: Record<string, number>[];
  totals: Record<string, number>;
}

/** Fotografía de la matriz aumentada [A | b] en un paso de Gauss-Jordan. */
export interface GaussJordanStep {
  stepNumber: number;
  title: string;
  description: string;
  matrix: number[][];
}

export interface RegressionResult {
  methodId: string;
  methodName: string;
  degree: number;
  n: number;
  /** a0, a1, …, am */
  coefficients: number[];
  summationTable: SummationTable;
  /** Matriz aumentada inicial del sistema normal */
  augmentedMatrix: number[][];
  steps: GaussJordanStep[];
  fitted: number[];
  residuals: number[];
  /** Sr = Σ(yi − ŷi)² */
  sr: number;
  /** St = Σ(yi − ȳ)² */
  st: number;
  /** R² = (St − Sr) / St */
  r2: number;
  /** r = √R² */
  r: number;
  /** s_{y/x} = √(Sr / (n − (m+1))); null si n = m+1 (ajuste exacto) */
  standardError: number | null;
  meanY: number;
  modelLatex: string;
  executionTimeMs: number;
}
