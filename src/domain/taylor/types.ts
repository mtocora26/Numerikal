export interface TaylorInput {
  /** f(x) tal como la escribe el usuario */
  expression: string;
  /** Punto de expansión a (a = 0 es el polinomio de Maclaurin) */
  a: number;
  /** Grado n del polinomio */
  degree: number;
  /** Valor x* donde se evalúa */
  xStar: number;
}

export interface TaylorValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/** Una fila de la tabla de derivadas: f⁽ᵏ⁾(x), f⁽ᵏ⁾(a) y el coeficiente f⁽ᵏ⁾(a)/k!. */
export interface TaylorTerm {
  order: number;
  /** f⁽ᵏ⁾(x) simbólica en LaTeX (el lado derecho) */
  derivativeLatex: string;
  /** f⁽ᵏ⁾(a) */
  derivativeAtA: number;
  /** k! */
  factorial: number;
  /** cₖ = f⁽ᵏ⁾(a)/k! */
  coefficient: number;
}

export interface TaylorResult {
  methodId: string;
  methodName: string;
  expression: string;
  /** f(x) en LaTeX */
  functionLatex: string;
  a: number;
  degree: number;
  xStar: number;
  isMaclaurin: boolean;
  terms: TaylorTerm[];
  /** P(x) con los coeficientes sustituidos y las potencias de (x − a) */
  substitutedLatex: string;
  /** Coeficientes del polinomio expandido en potencias de x: b0, b1, …, bn */
  coefficients: number[];
  expandedLatex: string;
  /** P(x*) */
  valueAtXStar: number;
  /** f(x*); null si f no está definida en x* */
  exactValue: number | null;
  /** |f(x*) − P(x*)|; null si no hay f(x*) */
  absoluteError: number | null;
  executionTimeMs: number;
}
