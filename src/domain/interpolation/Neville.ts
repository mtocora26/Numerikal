import { formatNumberLatex } from '../../services/numberFormat';
import {
  addPolynomials,
  multiplyByRoot,
  polynomialLatex,
  scalePolynomial,
  signedLatex,
  validateInterpolation,
} from './polynomial';
import type { InterpolationInput, InterpolationValidationResult, NevilleEntry, NevilleResult } from './types';

const labelLatex = (i: number, j: number): string => `P_{${i},${j}}`;

const RECURRENCE_LATEX =
  'P_{i,j}(x) = \\frac{(x - x_i)\\,P_{i+1,j}(x) - (x - x_j)\\,P_{i,j-1}(x)}{x_j - x_i}';

/**
 * Interpolación de Neville: evalúa en x* el polinomio que pasa por los puntos sin construirlo.
 * P_{i,i} = yᵢ y P_{i,j} = [(x* − xᵢ)·P_{i+1,j} − (x* − xⱼ)·P_{i,j-1}] / (xⱼ − xᵢ); el valor final es P_{0,n}.
 * La misma recurrencia se aplica a los polinomios para obtener la forma expandida (la usa la gráfica).
 */
export class NevilleInterpolation {
  public readonly id = 'neville';
  public readonly name = 'Interpolación de Neville';
  public readonly category = 'interpolation';

  public validate(input: InterpolationInput): InterpolationValidationResult {
    return validateInterpolation(input);
  }

  public execute(input: InterpolationInput): NevilleResult {
    const start = performance.now();
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { points, xStar } = input;
    const n = points.length;
    const columns: NevilleEntry[][] = [
      points.map((p, i) => ({ order: 0, index: i, labelLatex: labelLatex(i, i), formulaLatex: '', value: p.y })),
    ];
    // Mismos P_{i,j}, pero como polinomios (coeficientes de menor a mayor grado)
    let polynomials: number[][] = points.map((p) => [p.y]);

    for (let k = 1; k < n; k++) {
      const previous = columns[k - 1];
      const column: NevilleEntry[] = [];
      const nextPolynomials: number[][] = [];

      for (let i = 0; i + k < n; i++) {
        const j = i + k;
        const xi = points[i].x;
        const xj = points[j].x;
        const lower = previous[i + 1].value; // P_{i+1,j}
        const upper = previous[i].value; // P_{i,j-1}
        const value = ((xStar - xi) * lower - (xStar - xj) * upper) / (xj - xi);

        column.push({
          order: k,
          index: i,
          labelLatex: labelLatex(i, j),
          formulaLatex:
            `${labelLatex(i, j)} = \\frac{(x^* - x_{${i}})\\,${labelLatex(i + 1, j)} - (x^* - x_{${j}})\\,${labelLatex(i, j - 1)}}{x_{${j}} - x_{${i}}}` +
            ` = \\frac{(${formatNumberLatex(xStar)} - ${signedLatex(xi)})(${signedLatex(lower)}) - (${formatNumberLatex(xStar)} - ${signedLatex(xj)})(${signedLatex(upper)})}{${signedLatex(xj)} - ${signedLatex(xi)}}` +
            ` = ${formatNumberLatex(value)}`,
          value,
        });

        const numerator = addPolynomials(
          multiplyByRoot(polynomials[i + 1], xi),
          scalePolynomial(multiplyByRoot(polynomials[i], xj), -1)
        );
        nextPolynomials.push(scalePolynomial(numerator, 1 / (xj - xi)));
      }

      columns.push(column);
      polynomials = nextPolynomials;
    }

    const coefficients = polynomials[0];
    const degree = n - 1;
    return {
      methodId: this.id,
      methodName: this.name,
      degree,
      n,
      points,
      xStar,
      coefficients,
      expandedLatex: `P_{${degree}}(x) = ${polynomialLatex(coefficients)}`,
      valueAtXStar: columns[degree][0].value,
      columns,
      recurrenceLatex: RECURRENCE_LATEX,
      executionTimeMs: performance.now() - start,
    };
  }
}
