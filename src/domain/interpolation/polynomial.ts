import { formatNumberLatex } from '../../services/numberFormat';
import type { DataPoint } from '../regression/types';
import type { InterpolationInput, InterpolationValidationResult } from './types';

/** A partir de este número de puntos el polinomio empieza a oscilar mucho entre los nodos (fenómeno de Runge). */
export const RUNGE_WARNING_POINTS = 8;

const NOISE = 1e-9;

/** Evalúa a0 + a1x + … + anxⁿ con la regla de Horner. */
export function evaluatePolynomial(coefficients: number[], x: number): number {
  return coefficients.reduceRight((acc, a) => acc * x + a, 0);
}

/** Multiplica el polinomio por (x − root). Los coeficientes van de menor a mayor grado. */
export function multiplyByRoot(coefficients: number[], root: number): number[] {
  const result = new Array<number>(coefficients.length + 1).fill(0);
  coefficients.forEach((a, k) => {
    result[k + 1] += a;
    result[k] -= root * a;
  });
  return result;
}

/** Polinomio mónico con las raíces dadas: Π(x − rⱼ). */
export function polynomialFromRoots(roots: number[]): number[] {
  return roots.reduce(multiplyByRoot, [1]);
}

export function addPolynomials(a: number[], b: number[]): number[] {
  const size = Math.max(a.length, b.length);
  return Array.from({ length: size }, (_, k) => (a[k] ?? 0) + (b[k] ?? 0));
}

export function scalePolynomial(coefficients: number[], factor: number): number[] {
  return coefficients.map((a) => a * factor);
}

/** Número entre paréntesis si es negativo, para sustituir en una fórmula: 2 → 2, −2 → (−2). */
export const signedLatex = (value: number): string =>
  value < 0 ? `(${formatNumberLatex(value)})` : formatNumberLatex(value);

/** Factor (x − r) con el signo ya resuelto: r = 0 → x, r = 2 → (x − 2), r = −2 → (x + 2). */
export function rootFactorLatex(root: number): string {
  if (root === 0) return 'x';
  return `(x ${root > 0 ? '-' : '+'} ${formatNumberLatex(Math.abs(root))})`;
}

/** Polinomio en LaTeX de mayor a menor grado, sin términos nulos (el ruido de redondeo se toma como cero). */
export function polynomialLatex(coefficients: number[], variable = 'x'): string {
  const scale = Math.max(...coefficients.map(Math.abs), 1);
  const terms: string[] = [];

  for (let k = coefficients.length - 1; k >= 0; k--) {
    const a = Math.abs(coefficients[k]) < NOISE * scale ? 0 : coefficients[k];
    if (a === 0) continue;

    const magnitude = Math.abs(a);
    const power = k === 0 ? '' : k === 1 ? variable : `${variable}^{${k}}`;
    const body = k === 0 ? formatNumberLatex(magnitude) : magnitude === 1 ? power : `${formatNumberLatex(magnitude)}${power}`;
    const sign = a < 0 ? '-' : '+';

    terms.push(terms.length === 0 ? `${a < 0 ? '-' : ''}${body}` : ` ${sign} ${body}`);
  }

  return terms.length === 0 ? '0' : terms.join('');
}

/** Validación común a todos los métodos de interpolación. */
export function validateInterpolation({ points, xStar }: InterpolationInput): InterpolationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (points.length < 2) {
    errors.push('Se necesitan al menos 2 puntos para interpolar.');
  }
  if (points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
    errors.push('Todos los datos deben ser números válidos.');
  }
  if (!Number.isFinite(xStar)) {
    errors.push('Escribe un valor x* válido donde interpolar.');
  }

  if (errors.length === 0) {
    const repeated = findRepeatedX(points);
    if (repeated.length > 0) {
      errors.push(
        `Los valores de x deben ser distintos: ${repeated.join(', ')} aparece más de una vez. ` +
          'Un polinomio no puede pasar por dos puntos con la misma x y distinta y.'
      );
    }
  }

  if (errors.length === 0) {
    const xs = points.map((p) => p.x);
    if (xStar < Math.min(...xs) || xStar > Math.max(...xs)) {
      warnings.push('x* está fuera del rango de los datos: es extrapolación y el resultado puede ser poco confiable.');
    }
    if (points.length >= RUNGE_WARNING_POINTS) {
      warnings.push(
        `Con ${points.length} puntos el polinomio es de grado ${points.length - 1} y puede oscilar entre los nodos (fenómeno de Runge).`
      );
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

function findRepeatedX(points: DataPoint[]): number[] {
  const seen = new Set<number>();
  const repeated = new Set<number>();
  points.forEach((p) => (seen.has(p.x) ? repeated.add(p.x) : seen.add(p.x)));
  return [...repeated];
}
