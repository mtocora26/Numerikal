import type { DiagonalDominanceCheck, LinearSystemInput, LinearSystemValidationResult } from './types';
import { formatNumberLatex } from '../../services/numberFormat';

export const MIN_SYSTEM_SIZE = 2;
export const MAX_SYSTEM_SIZE = 6;
export const MAX_SYSTEM_ITERATIONS = 500;

/** Utilidades comunes a los métodos iterativos para Ax = b (Jacobi y Gauss-Seidel). */

export const variableLatex = (index: number): string => `x_{${index + 1}}`;

export function checkDiagonalDominance(a: number[][]): DiagonalDominanceCheck {
  const rows = a.map((row, i) => {
    const diagonal = Math.abs(row[i]);
    const offDiagonalSum = row.reduce((acc, v, j) => (j === i ? acc : acc + Math.abs(v)), 0);
    return { diagonal, offDiagonalSum, dominant: diagonal > offDiagonalSum };
  });
  return { rows, strictlyDominant: rows.every((row) => row.dominant) };
}

/** ‖Ax − b‖∞: la mayor diferencia entre el lado izquierdo y el derecho de cada ecuación. */
export function residualNorm(a: number[][], b: number[], x: number[]): number {
  return Math.max(...a.map((row, i) => Math.abs(row.reduce((acc, v, j) => acc + v * x[j], 0) - b[i])));
}

/** Validaciones de entrada compartidas: tamaño, números válidos, diagonal y criterios de parada. */
export function validateLinearSystem({ a, b, x0, tolerance, maxIterations }: LinearSystemInput): LinearSystemValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const n = a.length;

  if (n < MIN_SYSTEM_SIZE || n > MAX_SYSTEM_SIZE) {
    errors.push(`El sistema debe tener entre ${MIN_SYSTEM_SIZE} y ${MAX_SYSTEM_SIZE} ecuaciones.`);
  } else if (a.some((row) => row.length !== n) || b.length !== n || x0.length !== n) {
    errors.push(`La matriz A debe ser de ${n}×${n} y los vectores b y x⁽⁰⁾ deben tener ${n} valores.`);
  }

  if (errors.length === 0 && [...a.flat(), ...b, ...x0].some((v) => !Number.isFinite(v))) {
    errors.push('Todos los coeficientes, términos independientes y valores iniciales deben ser números válidos.');
  }

  if (!Number.isFinite(tolerance) || tolerance <= 0) {
    errors.push('La tolerancia debe ser un número mayor que cero.');
  }
  if (!Number.isInteger(maxIterations) || maxIterations < 1 || maxIterations > MAX_SYSTEM_ITERATIONS) {
    errors.push(`El máximo de iteraciones debe ser un entero entre 1 y ${MAX_SYSTEM_ITERATIONS}.`);
  }

  if (errors.length === 0) {
    const zeroDiagonal = a.map((_, i) => i).filter((i) => a[i][i] === 0);
    if (zeroDiagonal.length > 0) {
      const list = zeroDiagonal.map((i) => `a${i + 1}${i + 1}`).join(', ');
      errors.push(
        `No se puede despejar porque ${list} = 0. Reordena las ecuaciones para que ningún elemento de la diagonal sea cero.`
      );
    } else if (!checkDiagonalDominance(a).strictlyDominant) {
      warnings.push(
        'La matriz no es estrictamente diagonal dominante, así que no está garantizado que el método converja. Si puedes, reordena las ecuaciones para que en cada fila el elemento de la diagonal sea mayor (en valor absoluto) que la suma de los demás.'
      );
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/** Escribe c·x con su signo; omite el 1 y devuelve null si el coeficiente es cero. */
const term = (coefficient: number, variable: string, first: boolean): string | null => {
  if (coefficient === 0) return null;
  const abs = Math.abs(coefficient);
  const body = `${abs === 1 ? '' : formatNumberLatex(abs)}${variable}`;
  if (first) return coefficient < 0 ? `-${body}` : body;
  return coefficient < 0 ? ` - ${body}` : ` + ${body}`;
};

/** Sistema original, una ecuación por fila: 4x_1 − x_2 = 3 */
export function systemLatex(a: number[][], b: number[]): string {
  const equations = a.map((row, i) => {
    const terms: string[] = [];
    row.forEach((v, j) => {
      const t = term(v, variableLatex(j), terms.length === 0);
      if (t) terms.push(t);
    });
    return `${terms.join('') || '0'} &= ${formatNumberLatex(b[i])}`;
  });
  return `\\begin{aligned}${equations.join(' \\\\ ')}\\end{aligned}`;
}
