import { ExpressionParser } from '../../services/ExpressionParser';
import { formatNumberLatex, termLatex } from '../../services/numberFormat';
import { buildNodes, compareWithExact, sumTerms, validateIntegrationInput } from './quadrature';
import type { IntegrationInput, IntegrationValidationResult, Simpson38Result } from './types';

export const MIN_SIMPSON38_SUBINTERVALS = 3;

/**
 * Regla de Simpson 3/8 compuesta (n múltiplo de 3):
 *   I ≈ 3h/8 · [ f(x₀) + 3·Σ f(xᵢ) + 2·Σ f(xᵢ) + f(xₙ) ],  h = (b − a)/n
 * donde los 2 van en los nodos interiores de índice múltiplo de 3 y los 3 en todos los demás.
 * Con n = 3 es la regla simple: la cúbica que pasa por f(a), f(a + h), f(a + 2h) y f(b).
 */
export class Simpson38Rule {
  public readonly id = 'simpson-3-8';
  public readonly name = 'Regla de Simpson 3/8';
  public readonly category = 'integration';

  public validate(input: IntegrationInput): IntegrationValidationResult {
    return validateIntegrationInput(input, {
      minN: MIN_SIMPSON38_SUBINTERVALS,
      multipleOf: 3,
      groupingMessage: 'Simpson 3/8 necesita un número de subintervalos n múltiplo de 3, porque agrupa los subintervalos de tres en tres.',
    });
  }

  public execute(input: IntegrationInput): Simpson38Result {
    const start = performance.now();
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { a, b, n } = input;
    const parsed = ExpressionParser.parse(input.expression);
    const { h, nodes } = buildNodes(parsed.evaluate, input, (index, last) =>
      index === 0 || index === last ? 1 : index % 3 === 0 ? 2 : 3
    );

    const endsSum = sumTerms([nodes[0].fx, nodes[n].fx]);
    const tripleSum = sumTerms(nodes.filter((node) => node.coefficient === 3).map((node) => node.fx));
    const sharedSum = sumTerms(nodes.filter((node) => node.coefficient === 2).map((node) => node.fx));
    const weightedSum = sumTerms(nodes.map((node) => node.weighted));
    const value = ((3 * h) / 8) * weightedSum;

    // Con n = 3 no hay nodos compartidos y el término 2·Σ no aparece
    const sharedTerm = n > 3 ? ` + 2(${formatNumberLatex(sharedSum)})` : '';
    const substitutedLatex =
      `I \\approx \\frac{3(${formatNumberLatex(h)})}{8}\\left[${termLatex(nodes[0].fx)} + 3(${formatNumberLatex(tripleSum)})${sharedTerm} + ${termLatex(nodes[n].fx)}\\right]` +
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
      tripleSum,
      sharedSum,
      value,
      substitutedLatex,
      ...compareWithExact(input.expression, parsed.evaluate, input, nodes, value),
      executionTimeMs: performance.now() - start,
    };
  }
}
