import { formatNumberLatex } from '../../services/numberFormat';
import {
  addPolynomials,
  evaluatePolynomial,
  polynomialFromRoots,
  polynomialLatex,
  rootFactorLatex,
  scalePolynomial,
  signedLatex,
  validateInterpolation,
} from './polynomial';
import type {
  InterpolationInput,
  InterpolationValidationResult,
  LagrangeBasis,
  LagrangeResult,
} from './types';

/**
 * Interpolación de Lagrange: P(x) = Σ yᵢ·Lᵢ(x), con Lᵢ(x) = Π_{j≠i} (x − xⱼ) / (xᵢ − xⱼ).
 * Registra cada Lᵢ con los valores sustituidos y el polinomio expandido.
 */
export class LagrangeInterpolation {
  public readonly id = 'lagrange';
  public readonly name = 'Interpolación de Lagrange';
  public readonly category = 'interpolation';

  public validate(input: InterpolationInput): InterpolationValidationResult {
    return validateInterpolation(input);
  }

  public execute(input: InterpolationInput): LagrangeResult {
    const start = performance.now();
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { points, xStar } = input;
    const basis = points.map((_, i) => this.buildBasis(input, i));

    const coefficients = basis.reduce(
      (sum, term) => addPolynomials(sum, scalePolynomial(term.coefficients, term.yi)),
      [] as number[]
    );
    const valueAtXStar = basis.reduce((acc, term) => acc + term.yi * term.valueAtXStar, 0);

    return {
      methodId: this.id,
      methodName: this.name,
      degree: points.length - 1,
      n: points.length,
      points,
      xStar,
      coefficients,
      expandedLatex: `P_{${points.length - 1}}(x) = ${polynomialLatex(coefficients)}`,
      valueAtXStar,
      basis,
      sumLatex: this.buildSumLatex(basis),
      executionTimeMs: performance.now() - start,
    };
  }

  private buildBasis({ points, xStar }: InterpolationInput, index: number): LagrangeBasis {
    const { x: xi, y: yi } = points[index];
    const others = points.filter((_, j) => j !== index).map((p) => p.x);

    const denominator = others.reduce((acc, xj) => acc * (xi - xj), 1);
    const coefficients = scalePolynomial(polynomialFromRoots(others), 1 / denominator);

    return {
      index,
      xi,
      yi,
      numeratorLatex: others.map(rootFactorLatex).join(''),
      denominatorLatex: others.map((xj) => `(${formatNumberLatex(xi)} - ${signedLatex(xj)})`).join(''),
      denominator,
      coefficients,
      valueAtXStar: evaluatePolynomial(coefficients, xStar),
    };
  }

  private buildSumLatex(basis: LagrangeBasis[]): string {
    const terms = basis.map((term, i) => {
      const y = formatNumberLatex(Math.abs(term.yi));
      const body = `${y}\\,L_{${i}}(x)`;
      if (i === 0) return `${term.yi < 0 ? '-' : ''}${body}`;
      return ` ${term.yi < 0 ? '-' : '+'} ${body}`;
    });
    return `P_{${basis.length - 1}}(x) = ${terms.join('')}`;
  }
}
