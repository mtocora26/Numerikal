import { ExpressionParser } from '../../services/ExpressionParser';
import { formatNumber } from '../../services/numberFormat';
import { findAntiderivative } from './antiderivative';
import type { IntegrationInput, IntegrationNode, IntegrationValidationResult } from './types';

export const MAX_SUBINTERVALS = 100;

export interface PartitionRules {
  minN: number;
  /** n debe ser múltiplo de esto: 1 (trapecio), 2 (Simpson 1/3, de dos en dos) o 3 (Simpson 3/8, de tres en tres). */
  multipleOf: number;
  /** Qué se le dice al usuario cuando n está en rango pero no es múltiplo de `multipleOf`. */
  groupingMessage?: string;
}

/** Validación común: función, límites a < b, n entero en rango y f definida en todos los nodos. */
export function validateIntegrationInput(
  { expression, a, b, n }: IntegrationInput,
  { minN, multipleOf, groupingMessage }: PartitionRules
): IntegrationValidationResult {
  const errors: string[] = [];

  const parsed = ExpressionParser.parse(expression);
  if (!parsed.isValid) {
    errors.push(parsed.errorMessage ?? 'La función no es válida.');
  }

  if (!Number.isFinite(a)) errors.push('Escribe un límite inferior a válido.');
  if (!Number.isFinite(b)) errors.push('Escribe un límite superior b válido.');
  if (Number.isFinite(a) && Number.isFinite(b) && a >= b) {
    errors.push('El límite inferior a debe ser menor que el límite superior b.');
  }

  const nInRange = Number.isInteger(n) && n >= minN && n <= MAX_SUBINTERVALS;
  if (!nInRange) {
    const kind = multipleOf === 1 ? 'un entero' : multipleOf === 2 ? 'un entero par' : `un entero múltiplo de ${multipleOf}`;
    errors.push(`El número de subintervalos n debe ser ${kind} entre ${minN} y ${MAX_SUBINTERVALS}.`);
  } else if (n % multipleOf !== 0) {
    errors.push(groupingMessage ?? `El número de subintervalos n debe ser múltiplo de ${multipleOf}.`);
  }

  if (errors.length === 0) {
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

const NODE_NOISE = 1e-12;

/**
 * Suma de términos que cancela el redondeo: 0.7071 + 1 + 0.7071 − 0.7071 − 1 − 0.7071 vale 0 a mano, pero en punto
 * flotante deja 1e-16. Si el resultado es ínfimo frente a la magnitud de los propios términos, es cancelación exacta.
 */
export function sumTerms(terms: number[]): number {
  let sum = 0;
  let magnitude = 0;
  for (const term of terms) {
    sum += term;
    magnitude += Math.abs(term);
  }
  return Math.abs(sum) < NODE_NOISE * magnitude ? 0 : sum;
}

/** Parte [a, b] en n subintervalos iguales y evalúa f en cada nodo; `coefficientOf` fija el peso de la regla. */
export function buildNodes(
  f: (x: number) => number,
  { a, b, n }: Pick<IntegrationInput, 'a' | 'b' | 'n'>,
  coefficientOf: (index: number, n: number) => number
): { h: number; nodes: IntegrationNode[] } {
  const h = (b - a) / n;
  // El último nodo se fija en b para no arrastrar el redondeo de a + n·h
  const xs = Array.from({ length: n + 1 }, (_, i) => (i === n ? b : a + i * h));
  const values = xs.map(f);

  // sen(π) da 1.2e-16 en punto flotante, pero en clase vale 0: lo que es ruido frente a la escala de f se toma como 0
  const scale = Math.max(...values.map(Math.abs));
  const nodes: IntegrationNode[] = xs.map((x, i) => {
    const fx = Math.abs(values[i]) < NODE_NOISE * scale ? 0 : values[i];
    const coefficient = coefficientOf(i, n);
    return { index: i, x, fx, coefficient, weighted: coefficient * fx };
  });
  return { h, nodes };
}

const CROSS_CHECK_PANELS = 16;
const CROSS_CHECK_TOLERANCE = 1e-10;
const CROSS_CHECK_MAX_DEPTH = 30;
/** Evita que una función muy rugosa congele la pantalla refinando sin parar. */
const CROSS_CHECK_EVALUATION_BUDGET = 60000;

/**
 * Comprobación de que la primitiva vale en todo [a, b]: Simpson adaptativo con extrapolación de Richardson.
 * NUNCA se muestra ni se usa como resultado; solo descarta una primitiva con un polo adentro (1/x en [−1, 2]),
 * donde F(b) − F(a) daría un número que no es la integral.
 * Parte de varios paneles para que una simetría (sen x en [0, 2π]) no dé una convergencia falsa al primer intento.
 * Devuelve null si f deja de ser finita o si no converge dentro del presupuesto de evaluaciones.
 */
function crossCheckIntegral(f: (x: number) => number, a: number, b: number): number | null {
  let evaluations = 0;
  let failed = false;

  const evaluate = (x: number): number => {
    evaluations++;
    const y = f(x);
    if (!Number.isFinite(y)) failed = true;
    return y;
  };
  const simpson = (fa: number, fm: number, fb: number, width: number): number => (width / 6) * (fa + 4 * fm + fb);

  const refine = (lo: number, hi: number, fLo: number, fMid: number, fHi: number, whole: number, tol: number, depth: number): number => {
    if (failed) return 0;
    const mid = (lo + hi) / 2;
    const fLeftMid = evaluate((lo + mid) / 2);
    const fRightMid = evaluate((mid + hi) / 2);
    const left = simpson(fLo, fLeftMid, fMid, mid - lo);
    const right = simpson(fMid, fRightMid, fHi, hi - mid);
    const delta = left + right - whole;

    if (depth <= 0 || Math.abs(delta) <= 15 * tol) return left + right + delta / 15;
    if (evaluations > CROSS_CHECK_EVALUATION_BUDGET) {
      failed = true;
      return 0;
    }
    return (
      refine(lo, mid, fLo, fLeftMid, fMid, left, tol / 2, depth - 1) +
      refine(mid, hi, fMid, fRightMid, fHi, right, tol / 2, depth - 1)
    );
  };

  const width = (b - a) / CROSS_CHECK_PANELS;
  const edges = Array.from({ length: CROSS_CHECK_PANELS + 1 }, (_, p) => (p === CROSS_CHECK_PANELS ? b : a + p * width));
  const mids = edges.slice(0, -1).map((lo, p) => (lo + edges[p + 1]) / 2);
  const fEdges = edges.map(evaluate);
  const fMids = mids.map(evaluate);
  if (failed) return null;

  // La tolerancia se mide contra la escala de la integral: una absoluta fija no se alcanza si f es enorme
  const scale = Math.max(1, (b - a) * Math.max(...fEdges.map(Math.abs), ...fMids.map(Math.abs)));
  const tol = (CROSS_CHECK_TOLERANCE * scale) / CROSS_CHECK_PANELS;

  let total = 0;
  for (let p = 0; p < CROSS_CHECK_PANELS && !failed; p++) {
    const whole = simpson(fEdges[p], fMids[p], fEdges[p + 1], edges[p + 1] - edges[p]);
    total += refine(edges[p], edges[p + 1], fEdges[p], fMids[p], fEdges[p + 1], whole, tol, CROSS_CHECK_MAX_DEPTH);
  }

  return failed || !Number.isFinite(total) ? null : total;
}

/** Coincidencia mínima entre F(b) − F(a) y la comprobación numérica; una primitiva equivocada o con un polo falla por mucho más. */
const CROSS_CHECK_AGREEMENT = 1e-5;

/** Un valor exacto menor que esto frente a la escala de la integral es cancelación de redondeo (F(2π) − F(0) con F = sen). */
const EXACT_NOISE = 1e-12;

/** La integral comparada con su valor exacto I = F(b) − F(a). Todo es null si la integral no tiene primitiva conocida. */
export interface ExactComparison {
  /** Valor exacto de la integral */
  exactValue: number | null;
  /** F(x) en LaTeX */
  antiderivativeLatex: string | null;
  antiderivativeAtA: number | null;
  antiderivativeAtB: number | null;
  /** I − I_aprox, con signo (el error verdadero) */
  trueError: number | null;
  /** |I − I_aprox| */
  absoluteError: number | null;
  /** |I − I_aprox| / |I|; null si I = 0 */
  relativeError: number | null;
}

const NO_EXACT: ExactComparison = {
  exactValue: null,
  antiderivativeLatex: null,
  antiderivativeAtA: null,
  antiderivativeAtB: null,
  trueError: null,
  absoluteError: null,
  relativeError: null,
};

/**
 * Compara la aproximación con el valor real de la integral, calculado con la primitiva (nunca con otra aproximación).
 * Sin primitiva (no existe en forma elemental, como e^(−x²), o ninguna regla la encuentra) no hay comparación.
 */
export function compareWithExact(
  expression: string,
  f: (x: number) => number,
  { a, b }: Pick<IntegrationInput, 'a' | 'b'>,
  nodes: IntegrationNode[],
  value: number
): ExactComparison {
  const antiderivative = findAntiderivative(expression);
  if (!antiderivative) return NO_EXACT;

  const atA = antiderivative.evaluate(a);
  const atB = antiderivative.evaluate(b);
  if (!Number.isFinite(atA) || !Number.isFinite(atB)) return NO_EXACT;

  // Con F(b) − F(a) en punto flotante, ∫ cos x en [0, 2π] da −2.4e-16 en lugar de 0
  const scale = (b - a) * Math.max(...nodes.map((node) => Math.abs(node.fx)));
  const difference = atB - atA;
  const exactValue = Math.abs(difference) < EXACT_NOISE * scale ? 0 : difference;

  const check = crossCheckIntegral(f, a, b);
  if (check === null || Math.abs(check - exactValue) > CROSS_CHECK_AGREEMENT * Math.max(1, Math.abs(exactValue))) {
    return NO_EXACT;
  }

  const trueError = exactValue - value;
  const absoluteError = Math.abs(trueError);
  return {
    exactValue,
    antiderivativeLatex: antiderivative.latex,
    antiderivativeAtA: atA,
    antiderivativeAtB: atB,
    trueError,
    absoluteError,
    relativeError: exactValue === 0 ? null : absoluteError / Math.abs(exactValue),
  };
}
