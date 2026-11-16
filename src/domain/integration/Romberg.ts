import { ExpressionParser } from '../../services/ExpressionParser';
import { formatNumber, formatNumberLatex, termLatex } from '../../services/numberFormat';
import { buildNodes, compareWithExact, sumTerms } from './quadrature';
import type { IntegrationInput, IntegrationValidationResult, RombergEntry, RombergResult, RombergRow } from './types';

export const MIN_ROMBERG_LEVELS = 1;
/** Con 10 filas la partición más fina tiene 2⁹ = 512 subintervalos: 513 evaluaciones de f. */
export const MAX_ROMBERG_LEVELS = 10;

/**
 * Validación propia: aquí n cuenta filas de la tabla, no subintervalos, así que la comprobación común de
 * `validateIntegrationInput` no aplica. Se exigen enteros de 1 a MAX_ROMBERG_LEVELS y que f esté definida en los
 * nodos de la partición más fina (2^(k−1) subintervalos): si falla ahí, falla en todas las filas.
 */
function validateRombergInput(
  { a, b, n: levels }: IntegrationInput,
  parsed: ReturnType<typeof ExpressionParser.parse>
): IntegrationValidationResult {
  const errors: string[] = [];

  if (!parsed.isValid) {
    errors.push(parsed.errorMessage ?? 'La función no es válida.');
  }
  if (!Number.isFinite(a)) errors.push('Escribe un límite inferior a válido.');
  if (!Number.isFinite(b)) errors.push('Escribe un límite superior b válido.');
  if (Number.isFinite(a) && Number.isFinite(b) && a >= b) {
    errors.push('El límite inferior a debe ser menor que el límite superior b.');
  }

  if (!Number.isInteger(levels) || levels < MIN_ROMBERG_LEVELS || levels > MAX_ROMBERG_LEVELS) {
    errors.push(`El número de filas k debe ser un entero entre ${MIN_ROMBERG_LEVELS} y ${MAX_ROMBERG_LEVELS}.`);
  } else if (errors.length === 0) {
    const panels = 2 ** (levels - 1);
    const h = (b - a) / panels;
    for (let i = 0; i <= panels; i++) {
      const x = i === panels ? b : a + i * h;
      if (!Number.isFinite(parsed.evaluate(x))) {
        errors.push(`La función no está definida en x = ${formatNumber(x)}, que es un nodo del intervalo: cambia los límites o el número de filas.`);
        break;
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Integración de Romberg: tabla triangular R(i, j) donde
 *   R(i, 0) = trapecio compuesto con 2^i subintervalos,
 *   R(i, j) = (4^j · R(i, j−1) − R(i−1, j−1)) / (4^j − 1)   (extrapolación de Richardson).
 * La primera columna reutiliza los nodos de la partición más fina (2^(levels−1) subintervalos): los nodos de cada
 * fila son un subconjunto de esa partición, así que f se evalúa una sola vez. La mejor aproximación es la esquina
 * inferior derecha R(levels−1, levels−1), exacta para polinomios de grado 2·levels − 1.
 */
export class RombergRule {
  public readonly id = 'romberg';
  public readonly name = 'Integración de Romberg';
  public readonly category = 'integration';

  public validate(input: IntegrationInput): IntegrationValidationResult {
    return validateRombergInput(input, ExpressionParser.parse(input.expression));
  }

  public execute(input: IntegrationInput): RombergResult {
    const start = performance.now();
    const parsed = ExpressionParser.parse(input.expression);
    const validation = validateRombergInput(input, parsed);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { a, b, n: levels } = input;

    // Partición más fina: de aquí salen todos los valores f(xᵢ) que usa la tabla, con el ruido de redondeo limpio
    const finestPanels = 2 ** (levels - 1);
    const { h: hFinest, nodes } = buildNodes(parsed.evaluate, { ...input, n: finestPanels }, (index, last) =>
      index === 0 || index === last ? 1 : 2
    );

    // Primera columna: trapecio compuesto con 2^i subintervalos, sumado sobre los nodos de la partición más fina
    const firstColumn: number[] = [];
    for (let i = 0; i < levels; i++) {
      const panels = 2 ** i;
      const step = finestPanels / panels;
      const h = hFinest * step;
      const terms: number[] = [];
      for (let k = 0; k <= panels; k++) {
        const fx = nodes[k * step].fx;
        terms.push(k === 0 || k === panels ? fx : 2 * fx);
      }
      firstColumn.push((h / 2) * sumTerms(terms));
    }

    // Extrapolación de Richardson: cada celda combina la de su izquierda con la de la fila anterior
    const rows: RombergRow[] = [];
    for (let i = 0; i < levels; i++) {
      const entries: RombergEntry[] = [{ j: 0, value: firstColumn[i] }];
      for (let j = 1; j <= i; j++) {
        const power = 4 ** j;
        entries.push({
          j,
          value: (power * entries[j - 1].value - rows[i - 1].entries[j - 1].value) / (power - 1),
        });
      }
      rows.push({ i, subintervals: 2 ** i, h: hFinest * (finestPanels / 2 ** i), entries });
    }

    const best = rows[levels - 1].entries[levels - 1].value;
    const substitutedLatex =
      levels === 1
        ? `R_{0,0} = \\frac{${formatNumberLatex(b - a)}}{2}\\left[${termLatex(nodes[0].fx)} + ${termLatex(nodes[1].fx)}\\right] = ${formatNumberLatex(best, 8)}`
        : `R_{${levels - 1},${levels - 1}} = \\frac{4^{${levels - 1}}\\,R_{${levels - 1},${levels - 2}} - R_{${levels - 2},${levels - 2}}}{4^{${levels - 1}} - 1}` +
          ` = \\frac{${formatNumberLatex(4 ** (levels - 1))}\\,(${formatNumberLatex(rows[levels - 1].entries[levels - 2].value, 8)}) - (${formatNumberLatex(rows[levels - 2].entries[levels - 2].value, 8)})}{${formatNumberLatex(4 ** (levels - 1) - 1)}}` +
          ` = ${formatNumberLatex(best, 8)}`;

    return {
      methodId: this.id,
      methodName: this.name,
      expression: parsed.rawExpression,
      functionLatex: parsed.latex,
      a,
      b,
      levels,
      h: hFinest,
      nodes,
      rows,
      value: best,
      substitutedLatex,
      ...compareWithExact(input.expression, parsed.evaluate, input, nodes, best),
      executionTimeMs: performance.now() - start,
    };
  }
}
