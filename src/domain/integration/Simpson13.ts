import { ExpressionParser } from '../../services/ExpressionParser';
import { formatNumberLatex, termLatex } from '../../services/numberFormat';
import { buildNodes, compareWithExact, sumTerms, validateIntegrationInput } from './quadrature';
import type { IntegrationInput, IntegrationValidationResult, SimpsonResult } from './types';

export const MIN_SIMPSON_SUBINTERVALS = 2;

/**
 * Regla de Simpson 1/3 compuesta (n par):
 *   I ≈ h/3 · [ f(x₀) + 4·Σ f(xᵢ) + 2·Σ f(xᵢ) + f(xₙ) ],  h = (b − a)/n
 * donde los 4 van en los nodos de índice impar y los 2 en los de índice par interiores.
 * Con n = 2 es la regla simple: la parábola que pasa por f(a), f(punto medio) y f(b).
 */
export class Simpson13Rule {
  public readonly id = 'simpson-1-3';
  public readonly name = 'Regla de Simpson 1/3';
  public readonly category = 'integration';

  public validate(input: IntegrationInput): IntegrationValidationResult {
    return validateIntegrationInput(input, {
      minN: MIN_SIMPSON_SUBINTERVALS,
      multipleOf: 2,
      groupingMessage: 'Simpson 1/3 necesita un número par de subintervalos n, porque agrupa los subintervalos de dos en dos.',
    });
  }

  public execute(input: IntegrationInput): SimpsonResult {
    const start = performance.now();
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { a, b, n } = input;
    const parsed = ExpressionParser.parse(input.expression);
    const { h, nodes } = buildNodes(parsed.evaluate, input, (index, last) =>
      index === 0 || index === last ? 1 : index % 2 === 1 ? 4 : 2
    );

    const endsSum = sumTerms([nodes[0].fx, nodes[n].fx]);
    const oddSum = sumTerms(nodes.filter((node) => node.coefficient === 4).map((node) => node.fx));
    const evenSum = sumTerms(nodes.filter((node) => node.coefficient === 2).map((node) => node.fx));
    const weightedSum = sumTerms(nodes.map((node) => node.weighted));
    const value = (h / 3) * weightedSum;

    // Con n = 2 no hay nodos pares interiores y el término 2·Σ no aparece
    const evenTerm = n > 2 ? ` + 2(${formatNumberLatex(evenSum)})` : '';
    const substitutedLatex =
      `I \\approx \\frac{${formatNumberLatex(h)}}{3}\\left[${termLatex(nodes[0].fx)} + 4(${formatNumberLatex(oddSum)})${evenTerm} + ${termLatex(nodes[n].fx)}\\right]` +
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
      oddSum,
      evenSum,
      value,
      substitutedLatex,
      ...compareWithExact(input.expression, parsed.evaluate, input, nodes, value),
      executionTimeMs: performance.now() - start,
    };
  }
}
