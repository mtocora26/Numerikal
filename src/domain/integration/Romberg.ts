import { ExpressionParser } from '../../services/ExpressionParser';
import { formatNumber, formatNumberLatex, termLatex } from '../../services/numberFormat';
import { buildNodes, compareWithExact, sumTerms } from './quadrature';
import type { IntegrationInput, IntegrationValidationResult, RombergEntry, RombergResult, RombergRow } from './types';

/** Con n = 512 = 2^9 la tabla tiene K = 10 filas y f se evalúa 513 veces. */
export const MAX_ROMBERG_SUBINTERVALS = 512;

const isPowerOfTwo = (n: number): boolean => n >= 1 && (n & (n - 1)) === 0;

/**
 * Validación propia: aquí n es la partición más fina de la tabla y debe ser potencia de 2 (1, 2, 4, 8…), porque cada
 * fila duplica la partición de la anterior. Se exige que f esté definida en los n + 1 nodos de esa partición: si falla
 * ahí, falla en todas las filas.
 */
function validateRombergInput(
  { a, b, n }: IntegrationInput,
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

  if (!Number.isInteger(n) || !isPowerOfTwo(n) || n > MAX_ROMBERG_SUBINTERVALS) {
    errors.push(`El número de subintervalos n debe ser una potencia de 2 (1, 2, 4, 8, 16…) hasta ${MAX_ROMBERG_SUBINTERVALS}.`);
  } else if (errors.length === 0) {
    const h = (b - a) / n;
    for (let i = 0; i <= n; i++) {
      const x = i === n ? b : a + i * h;
      if (!Number.isFinite(parsed.evaluate(x))) {
        errors.push(`La función no está definida en x = ${formatNumber(x)}, que es un nodo del intervalo: cambia los límites o el número de subintervalos.`);
        break;
      }
    }
  }

  return { isValid: errors.length === 0, errors, warnings: [] };
}

/**
 * Integración de Romberg, con el procedimiento de clase (tablas numeradas desde 1):
 *   R(1,1) = H/2 · [f(a) + f(b)],                         H = b − a
 *   R(k,1) = 1/2 · [R(k−1,1) + h_ant · Σ f(puntos nuevos)],  con h_ant = H/2^(k−2)
 *            y puntos nuevos f(a + (2i−1)·s), s = H/2^(k−1), i = 1 … 2^(k−2)
 *   R(k,j) = R(k,j−1) + [R(k,j−1) − R(k−1,j−1)] / (4^(j−1) − 1)   (extrapolación, divisores 3, 15, 63…)
 * El resultado es la esquina inferior derecha R(K,K), con K = log₂(n) + 1 filas para el n dado.
 * Todos los valores f(x) salen de una sola evaluación sobre la partición más fina (n subintervalos): los nodos de cada
 * fila son un subconjunto de esa partición, y el factor de los puntos nuevos es el h ANTERIOR, no el nuevo.
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

    const { a, b, n } = input;
    const H = b - a;

    // Partición más fina: de aquí salen todos los valores f(xᵢ) que usa la tabla, con el ruido de redondeo limpio
    const { h: hFinest, nodes } = buildNodes(parsed.evaluate, input, (index, last) =>
      index === 0 || index === last ? 1 : 2
    );

    // Primera columna por la recurrencia de clase: R(k,1) = 1/2 · [R(k−1,1) + h_ant · Σ f(puntos nuevos)]
    const rows: RombergRow[] = [];
    let previousFirst = 0;
    for (let k = 1; k <= Math.log2(n) + 1; k++) {
      const panels = 2 ** (k - 1);
      const h = H / panels;
      let first: number;
      if (k === 1) {
        first = (H / 2) * sumTerms([nodes[0].fx, nodes[n].fx]);
      } else {
        // Los puntos nuevos son los impares de esta partición: a + (2i−1)·s, con s = H/2^(k−1)
        const stride = n / panels;
        const hAnt = H / 2 ** (k - 2);
        const newValues: number[] = [];
        for (let i = 1; i <= panels / 2; i++) {
          newValues.push(nodes[(2 * i - 1) * stride].fx);
        }
        first = (previousFirst + hAnt * sumTerms(newValues)) / 2;
      }

      // Extrapolación de Richardson: R(k,j) = R(k,j−1) + [R(k,j−1) − R(k−1,j−1)] / (4^(j−1) − 1)
      const entries: RombergEntry[] = [{ j: 1, value: first }];
      for (let j = 2; j <= k; j++) {
        const left = entries[j - 2].value;
        const above = rows[k - 2].entries[j - 2].value;
        entries.push({ j, value: left + (left - above) / (4 ** (j - 1) - 1) });
      }
      rows.push({ k, subintervals: panels, h, entries });
      previousFirst = first;
    }

    const K = rows.length;
    const best = rows[K - 1].entries[K - 1].value;
    const lastDivisor = 4 ** (K - 1) - 1;
    const substitutedLatex =
      K === 1
        ? `R_{1,1} = \\frac{${formatNumberLatex(H)}}{2}\\left[${termLatex(nodes[0].fx)} + ${termLatex(nodes[n].fx)}\\right] = ${formatNumberLatex(best, 8)}`
        : `R_{${K},${K}} = R_{${K},${K - 1}} + \\frac{R_{${K},${K - 1}} - R_{${K - 1},${K - 1}}}{${formatNumberLatex(lastDivisor)}}` +
          ` = ${formatNumberLatex(rows[K - 1].entries[K - 2].value, 8)} + \\frac{${formatNumberLatex(rows[K - 1].entries[K - 2].value, 8)} - (${formatNumberLatex(rows[K - 2].entries[K - 2].value, 8)})}{${formatNumberLatex(lastDivisor)}}` +
          ` = ${formatNumberLatex(best, 8)}`;

    return {
      methodId: this.id,
      methodName: this.name,
      expression: parsed.rawExpression,
      functionLatex: parsed.latex,
      a,
      b,
      k: K,
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
