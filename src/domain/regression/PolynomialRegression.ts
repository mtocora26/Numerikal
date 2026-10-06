import type {
  DataPoint,
  GaussJordanStep,
  RegressionInput,
  RegressionResult,
  RegressionValidationResult,
  SummationTable,
} from './types';

export const MAX_POLYNOMIAL_DEGREE = 6;

const SINGULAR_EPS = 1e-12;

const sup = (k: number): string => (k === 1 ? '' : `^{${k}}`);

/**
 * Regresión polinomial por mínimos cuadrados.
 * Arma el sistema normal (n+1)×(n+1) con las sumatorias de la tabla y lo
 * resuelve con Gauss-Jordan, registrando cada paso.
 */
export class PolynomialRegression {
  public readonly id = 'polynomial-regression';
  public readonly name = 'Regresión Polinomial';
  public readonly category = 'regression';

  public validate({ points, degree }: RegressionInput): RegressionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!Number.isInteger(degree) || degree < 1 || degree > MAX_POLYNOMIAL_DEGREE) {
      errors.push(`El grado del polinomio debe ser un entero entre 1 y ${MAX_POLYNOMIAL_DEGREE}.`);
    }

    if (points.some((p) => !Number.isFinite(p.x) || !Number.isFinite(p.y))) {
      errors.push('Todos los datos deben ser números válidos.');
    }

    if (errors.length === 0) {
      const distinctX = new Set(points.map((p) => p.x)).size;
      if (distinctX < degree + 1) {
        errors.push(
          `Un polinomio de grado ${degree} necesita al menos ${degree + 1} valores de x distintos (hay ${distinctX}).`
        );
      } else if (points.length === degree + 1) {
        warnings.push('Hay tantos datos como coeficientes: el polinomio pasa exactamente por todos los puntos (interpolación, no regresión).');
      } else if (degree >= 4 && points.length < 2 * (degree + 1)) {
        warnings.push('Con pocos datos y grado alto el polinomio puede sobreajustar y oscilar entre los puntos.');
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  public execute({ points, degree }: RegressionInput): RegressionResult {
    const start = performance.now();
    const validation = this.validate({ points, degree });
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' '));
    }

    const n = points.length;
    const m = degree;

    const summationTable = this.buildSummationTable(points, m);
    const augmentedMatrix = this.buildNormalSystem(summationTable, m);
    const { solution, steps } = this.gaussJordan(augmentedMatrix);

    const evaluate = (x: number) => solution.reduce((acc, a, k) => acc + a * x ** k, 0);
    const fitted = points.map((p) => evaluate(p.x));
    const residuals = points.map((p, i) => p.y - fitted[i]);
    const meanY = points.reduce((acc, p) => acc + p.y, 0) / n;

    const sr = residuals.reduce((acc, e) => acc + e * e, 0);
    const st = points.reduce((acc, p) => acc + (p.y - meanY) ** 2, 0);
    const r2 = st < SINGULAR_EPS ? 1 : Math.max(0, (st - sr) / st);

    return {
      methodId: this.id,
      methodName: this.name,
      degree: m,
      n,
      coefficients: solution,
      summationTable,
      augmentedMatrix,
      steps,
      fitted,
      residuals,
      sr,
      st,
      r2,
      r: Math.sqrt(r2),
      standardError: n > m + 1 ? Math.sqrt(sr / (n - (m + 1))) : null,
      meanY,
      modelLatex: this.buildModelLatex(solution),
      executionTimeMs: performance.now() - start,
    };
  }

  private buildSummationTable(points: DataPoint[], m: number): SummationTable {
    const columns: SummationTable['columns'] = [
      { key: 'x', label: 'x', latexLabel: 'x_i' },
      { key: 'y', label: 'y', latexLabel: 'y_i' },
    ];
    for (let k = 2; k <= 2 * m; k++) {
      columns.push({ key: `x${k}`, label: `x^${k}`, latexLabel: `x_i${sup(k)}` });
    }
    for (let k = 1; k <= m; k++) {
      columns.push({ key: `x${k}y`, label: k === 1 ? 'x·y' : `x^${k}·y`, latexLabel: `x_i${sup(k)}y_i` });
    }

    const rows = points.map(({ x, y }) => {
      const row: Record<string, number> = { x, y };
      for (let k = 2; k <= 2 * m; k++) row[`x${k}`] = x ** k;
      for (let k = 1; k <= m; k++) row[`x${k}y`] = x ** k * y;
      return row;
    });

    const totals: Record<string, number> = {};
    for (const { key } of columns) {
      totals[key] = rows.reduce((acc, row) => acc + row[key], 0);
    }

    return { columns, rows, totals };
  }

  /**
   * Σ x^(i+j) en A[i][j] y Σ x^i·y en b[i], con Σ x^0 = n.
   * Para m = 2 es el sistema de 3×3 de los apuntes.
   */
  private buildNormalSystem(table: SummationTable, m: number): number[][] {
    const powerSum = (k: number): number =>
      k === 0 ? table.rows.length : table.totals[k === 1 ? 'x' : `x${k}`];
    const crossSum = (k: number): number =>
      k === 0 ? table.totals.y : table.totals[`x${k}y`];

    return Array.from({ length: m + 1 }, (_, i) => [
      ...Array.from({ length: m + 1 }, (_, j) => powerSum(i + j)),
      crossSum(i),
    ]);
  }

  private gaussJordan(initial: number[][]): { solution: number[]; steps: GaussJordanStep[] } {
    const size = initial.length;
    const a = initial.map((row) => [...row]);
    const steps: GaussJordanStep[] = [];
    const snapshot = (title: string, description: string) =>
      steps.push({ stepNumber: steps.length + 1, title, description, matrix: a.map((row) => [...row]) });

    snapshot('Matriz aumentada', 'Sistema normal armado con las sumatorias de la tabla.');

    for (let col = 0; col < size; col++) {
      let pivotRow = col;
      for (let r = col + 1; r < size; r++) {
        if (Math.abs(a[r][col]) > Math.abs(a[pivotRow][col])) pivotRow = r;
      }
      if (Math.abs(a[pivotRow][col]) < SINGULAR_EPS) {
        throw new Error('El sistema normal es singular: los datos no permiten ajustar un polinomio de este grado.');
      }

      if (pivotRow !== col) {
        [a[col], a[pivotRow]] = [a[pivotRow], a[col]];
        snapshot(`Intercambio F${col + 1} ↔ F${pivotRow + 1}`, 'Se elige como pivote el elemento de mayor valor absoluto de la columna.');
      }

      const pivot = a[col][col];
      if (pivot !== 1) {
        a[col] = a[col].map((v) => v / pivot);
        snapshot(`F${col + 1} ← F${col + 1} / ${Number(pivot.toPrecision(6))}`, `Se divide la fila ${col + 1} por el pivote para obtener un 1.`);
      }

      const eliminated: number[] = [];
      for (let r = 0; r < size; r++) {
        if (r === col) continue;
        const factor = a[r][col];
        if (factor === 0) continue;
        a[r] = a[r].map((v, c) => v - factor * a[col][c]);
        a[r][col] = 0;
        eliminated.push(r + 1);
      }
      if (eliminated.length > 0) {
        snapshot(
          `Eliminar columna ${col + 1}`,
          `Se anulan los demás elementos de la columna ${col + 1} (filas ${eliminated.join(', ')}) restando un múltiplo de F${col + 1}.`
        );
      }
    }

    return { solution: a.map((row) => row[size]), steps };
  }

  private buildModelLatex(coefficients: number[]): string {
    const fmt = (v: number) => Number(v.toPrecision(6)).toString();
    const terms = coefficients.map((a, k) => {
      const value = fmt(Math.abs(a));
      const body = k === 0 ? value : `${value}x${sup(k)}`;
      return { negative: a < 0, body };
    });
    return (
      'y = ' +
      terms
        .map((t, i) => (i === 0 ? `${t.negative ? '-' : ''}${t.body}` : ` ${t.negative ? '-' : '+'} ${t.body}`))
        .join('')
    );
  }
}
