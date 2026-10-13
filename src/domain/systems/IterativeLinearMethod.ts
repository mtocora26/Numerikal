import type { IterationColumn, IterationData } from '../Iteration';
import type { LinearSystemInput, LinearSystemResult, LinearSystemValidationResult } from './types';
import { ErrorCalculator } from '../../services/ErrorCalculator';
import { formatNumberLatex } from '../../services/numberFormat';
import { checkDiagonalDominance, residualNorm, systemLatex, validateLinearSystem, variableLatex } from './linearSystem';

/** Si algún valor crece más que esto, el método se está alejando de la solución. */
const DIVERGENCE_LIMIT = 1e12;

/**
 * Base de los métodos iterativos para Ax = b. Cada incógnita se despeja de su propia ecuación;
 * lo único que distingue a un método de otro es qué valores usa el lado derecho:
 *  - simultáneo (Jacobi): solo los de la iteración anterior (k).
 *  - sucesivo (Gauss-Seidel): los ya recalculados en esta iteración (k+1) para j < i, y los de k para j > i.
 */
export abstract class IterativeLinearMethod {
  public abstract readonly id: string;
  public abstract readonly name: string;
  public readonly category = 'systems';
  /** true: usa de inmediato las incógnitas ya actualizadas en la iteración (Gauss-Seidel). */
  protected abstract readonly sequential: boolean;

  public validate(input: LinearSystemInput): LinearSystemValidationResult {
    return validateLinearSystem(input);
  }

  public execute(input: LinearSystemInput): LinearSystemResult {
    const start = performance.now();
    const validation = this.validate(input);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const { a, b, x0, tolerance, maxIterations } = input;
    const errorType = 'absolute';
    const n = a.length;

    const row = (k: number, x: number[], error?: number, individualErrors?: number[]): IterationData => {
      const data: IterationData = { iteration: k, error };
      x.forEach((v, i) => (data[`x${i + 1}`] = v));
      individualErrors?.forEach((value, i) => (data[`e${i + 1}`] = value));
      return data;
    };

    const iterations: IterationData[] = [row(0, x0)];
    let current = [...x0];
    let finalError = Number.NaN;
    let converged = false;
    let convergenceReason = `Se alcanzó el máximo de ${maxIterations} iteraciones sin cumplir la tolerancia.`;

    for (let k = 1; k <= maxIterations; k++) {
      const next: number[] = [];
      a.forEach((rowA, i) => {
        const sum = rowA.reduce((acc, v, j) => {
          if (j === i) return acc;
          return acc + v * (this.sequential && j < i ? next[j] : current[j]);
        }, 0);
        next.push((b[i] - sum) / rowA[i]);
      });

      const individualErrors = next.map((v, i) => ErrorCalculator.calculate(v, current[i], errorType));
      // El error global sigue siendo el mayor error individual para comprobar la tolerancia.
      finalError = Math.max(...individualErrors);
      iterations.push(row(k, next, finalError, individualErrors));
      current = next;

      if (next.some((v) => !Number.isFinite(v) || Math.abs(v) > DIVERGENCE_LIMIT)) {
        convergenceReason = `Los valores crecen sin control en la iteración ${k}: el método diverge con este orden de ecuaciones.`;
        break;
      }
      if (ErrorCalculator.isWithinTolerance(finalError, tolerance, errorType)) {
        converged = true;
        convergenceReason = `El error (${ErrorCalculator.format(finalError, errorType)}) es menor que la tolerancia en la iteración ${k}.`;
        break;
      }
    }

    return {
      methodId: this.id,
      methodName: this.name,
      n,
      sequential: this.sequential,
      a: a.map((r) => [...r]),
      b: [...b],
      x0: [...x0],
      solution: current,
      residualNorm: residualNorm(a, b, current),
      finalError,
      errorType,
      iterationsCount: iterations.length - 1,
      converged,
      convergenceReason,
      dominance: checkDiagonalDominance(a),
      systemLatex: systemLatex(a, b),
      iterationFormulasLatex: a.map((_, i) => this.iterationFormulaLatex(a, b, i)),
      iterations,
      columns: this.columns(n),
      executionTimeMs: performance.now() - start,
    };
  }

  /** Jacobi: x_2^{(k+1)} = \frac{3 + x_1^{(k)}}{4}; Gauss-Seidel usa x_1^{(k+1)} */
  private iterationFormulaLatex(a: number[][], b: number[], i: number): string {
    const parts: string[] = b[i] === 0 ? [] : [formatNumberLatex(b[i])];
    a[i].forEach((v, j) => {
      if (j === i || v === 0) return;
      const abs = Math.abs(v);
      const step = this.sequential && j < i ? '(k+1)' : '(k)';
      const body = `${abs === 1 ? '' : formatNumberLatex(abs)}${variableLatex(j)}^{${step}}`;
      // bᵢ − aᵢⱼxⱼ: un coeficiente negativo pasa sumando
      const sign = v > 0 ? '-' : '+';
      parts.push(parts.length === 0 ? (sign === '-' ? `-${body}` : body) : ` ${sign} ${body}`);
    });
    const numerator = parts.join('') || '0';
    return `${variableLatex(i)}^{(k+1)} = \\frac{${numerator}}{${formatNumberLatex(a[i][i])}}`;
  }

  private columns(n: number): IterationColumn[] {
    return [
      { key: 'iteration', label: 'k', latexLabel: 'k', format: 'integer' },
      ...Array.from({ length: n }, (_, i): IterationColumn => ({
        key: `x${i + 1}`,
        label: `x${i + 1}`,
        latexLabel: `${variableLatex(i)}^{(k)}`,
        format: 'number',
        precision: 6,
      })),
      ...Array.from({ length: n }, (_, i): IterationColumn => ({
        key: `e${i + 1}`,
        label: `e${i + 1}`,
        latexLabel: `e_{${i + 1}}`,
        format: 'scientific',
        precision: 6,
      })),
      { key: 'error', label: 'Error', latexLabel: 'E', format: 'scientific', precision: 6 },
    ];
  }
}
