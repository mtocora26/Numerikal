import { ExpressionParser } from '../../services/ExpressionParser';
import { formatNumberLatex, termLatex } from '../../services/numberFormat';
import { buildNodes, compareWithExact, sumTerms, validateIntegrationInput } from './quadrature';
import type { IntegrationInput, IntegrationValidationResult, TrapezoidResult } from './types';

export const MIN_TRAPEZOID_SUBINTERVALS = 1;

/**
 * Regla del trapecio compuesta:
 *   I ≈ h/2 · [ f(x₀) + 2·Σ f(xᵢ) + f(xₙ) ],  h = (b − a)/n,  i = 1 … n − 1
 * Con n = 1 es la regla simple: el área de un solo trapecio bajo la recta que une f(a) y f(b).
 */
export class TrapezoidRule {
  public readonly id = 'trapezoid';
  public readonly name = 'Regla del Trapecio';
  public readonly category = 'integration';

  public validate(input: IntegrationInput): IntegrationValidationResult {
    return validateIntegrationInput(input, { minN: MIN_TRAPEZOID_SUBINTERVALS, multipleOf: 1 });
  }

  public execute(input: IntegrationInput): TrapezoidResult {
    const start = performance.now();
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { a, b, n } = input;
    const parsed = ExpressionParser.parse(input.expression);
    const { h, nodes } = buildNodes(parsed.evaluate, input, (index, last) => (index === 0 || index === last ? 1 : 2));

    const endsSum = sumTerms([nodes[0].fx, nodes[n].fx]);
    const innerSum = sumTerms(nodes.slice(1, n).map((node) => node.fx));
    const weightedSum = sumTerms(nodes.map((node) => node.weighted));
    const value = (h / 2) * weightedSum;

    // Con n = 1 no hay nodos interiores y el término 2·Σ no aparece
    const innerTerm = n > 1 ? ` + 2(${formatNumberLatex(innerSum)})` : '';
    const substitutedLatex =
      `I \\approx \\frac{${formatNumberLatex(h)}}{2}\\left[${termLatex(nodes[0].fx)}${innerTerm} + ${termLatex(nodes[n].fx)}\\right]` +
      ` = ${formatNumberLatex(value, 8)}`;

    return {
      methodId: this.id,
      methodName: this.name,
      expression: parsed.rawExpression,
      functionLatex: parsed.latex,
      a,
      b,
      n,
      h,
      nodes,
      weightedSum,
      endsSum,
      innerSum,
      value,
      substitutedLatex,
      ...compareWithExact(input.expression, parsed.evaluate, input, nodes, value),
      executionTimeMs: performance.now() - start,
    };
  }
}
