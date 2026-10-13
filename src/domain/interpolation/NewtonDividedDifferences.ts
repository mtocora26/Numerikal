import { formatNumberLatex } from '../../services/numberFormat';
import {
  addPolynomials,
  polynomialFromRoots,
  polynomialLatex,
  rootFactorLatex,
  scalePolynomial,
  signedLatex,
  validateInterpolation,
} from './polynomial';
import type {
  DividedDifferenceEntry,
  InterpolationInput,
  InterpolationValidationResult,
  NewtonResult,
} from './types';

/** f[xᵢ, …, xᵢ₊ₖ] en LaTeX; con orden alto se abrevia con puntos suspensivos. */
const labelLatex = (i: number, k: number): string => {
  if (k === 0) return `f[x_{${i}}]`;
  if (k <= 2) return `f[${Array.from({ length: k + 1 }, (_, t) => `x_{${i + t}}`).join(', ')}]`;
  return `f[x_{${i}}, \\ldots, x_{${i + k}}]`;
};

/**
 * Interpolación por diferencias divididas de Newton.
 * Arma la tabla triangular, toma su primera fila como coeficientes y
 * construye P(x) = f[x₀] + f[x₀,x₁](x − x₀) + f[x₀,x₁,x₂](x − x₀)(x − x₁) + …
 */
export class NewtonDividedDifferences {
  public readonly id = 'newton-divided-differences';
  public readonly name = 'Diferencias Divididas de Newton';
  public readonly category = 'interpolation';

  public validate(input: InterpolationInput): InterpolationValidationResult {
    return validateInterpolation(input);
  }

  public execute(input: InterpolationInput): NewtonResult {
    const start = performance.now();
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { points, xStar } = input;
    const xs = points.map((p) => p.x);
    const columns = this.buildTable(input);
    const newtonCoefficients = columns.map((column) => column[0].value);

    // Σ cₖ·Π_{j<k}(x − xⱼ), expandido término a término
    const coefficients = newtonCoefficients.reduce(
      (sum, c, k) => addPolynomials(sum, scalePolynomial(polynomialFromRoots(xs.slice(0, k)), c)),
      [] as number[]
    );

    // Evaluación en la forma de Newton (la que se hace a mano): Σ cₖ·Π_{j<k}(x* − xⱼ)
    let product = 1;
    let valueAtXStar = 0;
    newtonCoefficients.forEach((c, k) => {
      valueAtXStar += c * product;
      product *= xStar - xs[k];
    });

    const degree = points.length - 1;
    return {
      methodId: this.id,
      methodName: this.name,
      degree,
      n: points.length,
      points,
      xStar,
      coefficients,
      expandedLatex: `P_{${degree}}(x) = ${polynomialLatex(coefficients)}`,
      valueAtXStar,
      columns,
      newtonCoefficients,
      symbolicLatex: this.buildNewtonLatex(xs, newtonCoefficients, true),
      substitutedLatex: this.buildNewtonLatex(xs, newtonCoefficients, false),
      executionTimeMs: performance.now() - start,
    };
  }

  private buildTable({ points }: InterpolationInput): DividedDifferenceEntry[][] {
    const n = points.length;
    const columns: DividedDifferenceEntry[][] = [
      points.map((p, i) => ({ order: 0, index: i, labelLatex: labelLatex(i, 0), formulaLatex: '', value: p.y })),
    ];

    for (let k = 1; k < n; k++) {
      const previous = columns[k - 1];
      const column: DividedDifferenceEntry[] = [];
      for (let i = 0; i + k < n; i++) {
        const upper = previous[i + 1].value;
        const lower = previous[i].value;
        const xHigh = points[i + k].x;
        const xLow = points[i].x;
        const value = (upper - lower) / (xHigh - xLow);

        column.push({
          order: k,
          index: i,
          labelLatex: labelLatex(i, k),
          formulaLatex:
            `${labelLatex(i, k)} = \\frac{${labelLatex(i + 1, k - 1)} - ${labelLatex(i, k - 1)}}{x_{${i + k}} - x_{${i}}}` +
            ` = \\frac{${signedLatex(upper)} - ${signedLatex(lower)}}{${signedLatex(xHigh)} - ${signedLatex(xLow)}}` +
            ` = ${formatNumberLatex(value)}`,
          value,
        });
      }
      columns.push(column);
    }
    return columns;
  }

  /** Con `symbolic` usa f[x₀, …] y (x − x₀); si no, los números ya sustituidos. */
  private buildNewtonLatex(xs: number[], coefficients: number[], symbolic: boolean): string {
    const terms: string[] = [];
    coefficients.forEach((c, k) => {
      if (!symbolic && c === 0) return;
      const factors = xs
        .slice(0, k)
        .map((xj, j) => (symbolic ? `(x - x_{${j}})` : rootFactorLatex(xj)))
        .join('');
      const magnitude = symbolic ? labelLatex(0, k) : Math.abs(c) === 1 && k > 0 ? '' : formatNumberLatex(Math.abs(c));
      const body = `${magnitude}${factors}`;
      const negative = !symbolic && c < 0;
      terms.push(terms.length === 0 ? `${negative ? '-' : ''}${body}` : ` ${negative ? '-' : '+'} ${body}`);
    });
    return `P_{${coefficients.length - 1}}(x) = ${terms.join('')}`;
  }
}
