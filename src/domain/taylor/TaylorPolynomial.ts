import { derivative, parse, type MathNode } from 'mathjs';
import { ExpressionParser } from '../../services/ExpressionParser';
import { formatNumberLatex } from '../../services/numberFormat';
import {
  addPolynomials,
  evaluatePolynomial,
  polynomialFromRoots,
  polynomialLatex,
  scalePolynomial,
} from '../interpolation/polynomial';
import type { TaylorInput, TaylorResult, TaylorTerm, TaylorValidationResult } from './types';

export const MIN_TAYLOR_DEGREE = 1;
export const MAX_TAYLOR_DEGREE = 10;

/** Los valores de derivadas que son ruido de redondeo (sen π ≈ 1.2e-16) se toman como 0. */
const NOISE = 1e-12;

/**
 * Tiempo máximo para derivar. En funciones racionales como 1/(1+x²) la derivada simbólica crece
 * ~6 veces por orden (varios segundos hacia el orden 6) y congelaría la pantalla.
 */
const DERIVATION_BUDGET_MS = 1000;
const GROWTH_PER_ORDER = 6;

const SCOPE = { e: Math.E, pi: Math.PI };

const factorial = (k: number): number => (k <= 1 ? 1 : k * factorial(k - 1));

/** (x − a)ᵏ en LaTeX: a = 0 → xᵏ, a = 2 → (x − 2)ᵏ, a = −2 → (x + 2)ᵏ. */
const powerLatex = (a: number, k: number): string => {
  if (k === 0) return '';
  const base = a === 0 ? 'x' : `(x ${a > 0 ? '-' : '+'} ${formatNumberLatex(Math.abs(a))})`;
  return k === 1 ? base : `${base}^{${k}}`;
};

const toTex = (node: MathNode): string => {
  try {
    return node.toTex({ parenthesis: 'keep', implicit: 'hide' });
  } catch {
    return node.toString();
  }
};

/**
 * Polinomio de Taylor de grado n alrededor de a:
 *   P(x) = Σ f⁽ᵏ⁾(a)/k! · (x − a)ᵏ,  k = 0 … n
 * Las derivadas son simbólicas (mathjs); se registran la tabla de derivadas,
 * el polinomio sustituido y el polinomio expandido en potencias de x.
 */
export class TaylorPolynomial {
  public readonly id = 'taylor';
  public readonly name = 'Polinomio de Taylor';
  public readonly category = 'series';

  public validate({ expression, a, degree, xStar }: TaylorInput): TaylorValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const parsed = ExpressionParser.parse(expression);
    if (!parsed.isValid) {
      errors.push(parsed.errorMessage ?? 'La función no es válida.');
    }
    if (!Number.isInteger(degree) || degree < MIN_TAYLOR_DEGREE || degree > MAX_TAYLOR_DEGREE) {
      errors.push(`El grado n debe ser un entero entre ${MIN_TAYLOR_DEGREE} y ${MAX_TAYLOR_DEGREE}.`);
    }
    if (!Number.isFinite(a)) errors.push('Escribe un punto a válido.');
    if (!Number.isFinite(xStar)) errors.push('Escribe un valor x* válido donde evaluar.');

    if (errors.length === 0 && !Number.isFinite(parsed.evaluate(a))) {
      errors.push('La función no está definida en el punto a: no se puede construir el polinomio ahí.');
    }

    if (errors.length === 0 && !Number.isFinite(parsed.evaluate(xStar))) {
      warnings.push('f(x*) no está definida, así que no se puede calcular el error de la aproximación.');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  public execute(input: TaylorInput): TaylorResult {
    const start = performance.now();
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { a, degree, xStar } = input;
    const parsed = ExpressionParser.parse(input.expression);
    const terms = this.buildTerms(input.expression, a, degree);

    const coefficients = terms.reduce(
      (sum, term) => addPolynomials(sum, scalePolynomial(polynomialFromRoots(new Array<number>(term.order).fill(a)), term.coefficient)),
      [] as number[]
    );

    // P(x*) con la forma de Taylor (potencias de x* − a), como se evalúa a mano
    const valueAtXStar = terms.reduce((acc, term) => acc + term.coefficient * (xStar - a) ** term.order, 0);
    const fAtXStar = parsed.evaluate(xStar);
    const exactValue = Number.isFinite(fAtXStar) ? fAtXStar : null;

    return {
      methodId: this.id,
      methodName: this.name,
      expression: parsed.rawExpression,
      functionLatex: parsed.latex,
      a,
      degree,
      xStar,
      isMaclaurin: a === 0,
      terms,
      substitutedLatex: this.buildSubstitutedLatex(terms, a),
      coefficients,
      expandedLatex: `P_{${degree}}(x) = ${polynomialLatex(coefficients)}`,
      valueAtXStar,
      exactValue,
      absoluteError: exactValue === null ? null : Math.abs(exactValue - valueAtXStar),
      executionTimeMs: performance.now() - start,
    };
  }

  /** P evaluado en cualquier x con los coeficientes ya expandidos (para la gráfica). */
  public static evaluate(result: Pick<TaylorResult, 'coefficients'>, x: number): number {
    return evaluatePolynomial(result.coefficients, x);
  }

  private buildTerms(expression: string, a: number, degree: number): TaylorTerm[] {
    const terms: TaylorTerm[] = [];
    let node: MathNode = parse(ExpressionParser.normalizeForDifferentiation(expression));
    const startedAt = performance.now();
    let lastStepMs = 0;

    for (let k = 0; k <= degree; k++) {
      if (k > 0) {
        const stepStart = performance.now();
        // Si el siguiente orden ya no cabe en el presupuesto, se corta antes de bloquear la pantalla
        if (stepStart - startedAt + lastStepMs * GROWTH_PER_ORDER > DERIVATION_BUDGET_MS) {
          throw new Error(
            `La derivada de orden ${k} es demasiado larga para calcularla simbólicamente (pasa con funciones racionales). ` +
              `Prueba con un grado menor que ${k} o con una función más simple.`
          );
        }
        try {
          node = derivative(node, 'x');
        } catch {
          throw new Error(`No fue posible calcular la derivada de orden ${k} de la función.`);
        }
        lastStepMs = performance.now() - stepStart;
      }

      let value: number;
      try {
        value = Number(node.compile().evaluate({ x: a, ...SCOPE }));
      } catch {
        value = NaN;
      }
      if (!Number.isFinite(value)) {
        throw new Error(
          k === 0
            ? 'La función no está definida en el punto a.'
            : `La derivada de orden ${k} no está definida en a = ${a}: el polinomio de grado ${degree} no se puede construir ahí.`
        );
      }
      if (Math.abs(value) < NOISE) value = 0;

      const kFactorial = factorial(k);
      terms.push({ order: k, derivativeLatex: toTex(node), derivativeAtA: value, factorial: kFactorial, coefficient: value / kFactorial });
    }
    return terms;
  }

  private buildSubstitutedLatex(terms: TaylorTerm[], a: number): string {
    const parts: string[] = [];
    terms.forEach((term) => {
      const c = term.coefficient;
      if (c === 0) return;
      const magnitude = Math.abs(c);
      const power = powerLatex(a, term.order);
      const body = term.order === 0 ? formatNumberLatex(magnitude) : magnitude === 1 ? power : `${formatNumberLatex(magnitude)}${power}`;
      parts.push(parts.length === 0 ? `${c < 0 ? '-' : ''}${body}` : ` ${c < 0 ? '-' : '+'} ${body}`);
    });
    return `P_{${terms.length - 1}}(x) = ${parts.length === 0 ? '0' : parts.join('')}`;
  }
}
