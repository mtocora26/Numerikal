import type { NumericalMethod } from '../Method';
import type { 
  MethodInputParams, 
  MethodExecutionResult, 
  MethodValidationResult, 
  MethodParameterDef,
  StepExplanation 
} from '../types';
import type { IterationColumn, IterationData } from '../Iteration';
import { ErrorCalculator } from '../../services/ErrorCalculator';

export class FalsePositionMethod implements NumericalMethod {
  public readonly id = 'false-position';
  public readonly name = 'Método de Regla Falsa';
  public readonly category = 'roots';
  public readonly description = 
    'Aprovecha los valores f(a) y f(b) para trazar una recta secante e intersectarla con el eje X, logrando generalmente una convergencia más rápida que la bisección mediante interpolación lineal.';
  public readonly latexFormula = 'x_r = b - \\frac{f(b)(a - b)}{f(a) - f(b)} = \\frac{a f(b) - b f(a)}{f(b) - f(a)}';

  public readonly parameters: MethodParameterDef[] = [
    {
      name: 'xi',
      label: 'Límite inferior (xi)',
      latexLabel: 'x_i',
      description: 'Extremo izquierdo del intervalo inicial',
      defaultValue: 1,
      step: 0.1,
      placeholder: 'Ej. 1',
    },
    {
      name: 'xs',
      label: 'Límite superior (xs)',
      latexLabel: 'x_s',
      description: 'Extremo derecho del intervalo inicial',
      defaultValue: 2,
      step: 0.1,
      placeholder: 'Ej. 2',
    },
  ];

  public readonly iterationColumns: IterationColumn[] = [
    { key: 'iteration', label: 'Iteración', latexLabel: 'i', format: 'integer' },
    { key: 'xi', label: 'xi (inferior)', latexLabel: 'x_i', format: 'number', precision: 6 },
    { key: 'xs', label: 'xs (superior)', latexLabel: 'x_s', format: 'number', precision: 6 },
    { key: 'xr', label: 'Raíz falsa (xr)', latexLabel: 'x_{r}', format: 'number', precision: 6 },
    { key: 'fxi', label: 'f(xi)', latexLabel: 'f(x_i)', format: 'number', precision: 6 },
    { key: 'fxs', label: 'f(xs)', latexLabel: 'f(x_s)', format: 'number', precision: 6 },
    { key: 'fxr', label: 'f(xr)', latexLabel: 'f(x_{r})', format: 'number', precision: 6 },
    { key: 'error', label: 'Error', latexLabel: 'E', format: 'scientific', precision: 6 },
  ];

  public validate(f: (x: number) => number, params: MethodInputParams): MethodValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const xi = params.params.xi;
    const xs = params.params.xs;

    if (xi === undefined || Number.isNaN(xi)) {
      errors.push('Debes ingresar un valor válido para el límite inferior xi.');
    }
    if (xs === undefined || Number.isNaN(xs)) {
      errors.push('Debes ingresar un valor válido para el límite superior xs.');
    }

    if (xi !== undefined && xs !== undefined && !Number.isNaN(xi) && !Number.isNaN(xs)) {
      if (xi >= xs) {
        errors.push(`El límite inferior xi (${xi}) debe ser menor que el límite superior xs (${xs}).`);
      } else {
        const fxi = f(xi);
        const fxs = f(xs);

        if (!Number.isFinite(fxi)) {
          errors.push(`f(xi) no está definida o es infinita en xi = ${xi}.`);
        }
        if (!Number.isFinite(fxs)) {
          errors.push(`f(xs) no está definida o es infinita en xs = ${xs}.`);
        }

        if (Number.isFinite(fxi) && Number.isFinite(fxs)) {
          if (Math.abs(fxi - fxs) < 1e-15) {
            errors.push('f(xi) y f(xs) son iguales, produciendo una división por cero en la fórmula de la recta secante.');
          } else if (fxi * fxs > 0) {
            errors.push(
              `f(xi) = ${fxi.toFixed(4)} y f(xs) = ${fxs.toFixed(4)} tienen el MISMO signo. Regla Falsa requiere que f(xi) y f(xs) encierren un cambio de signo (f(xi)·f(xs) < 0).`
            );
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public execute(f: (x: number) => number, params: MethodInputParams): MethodExecutionResult {
    const startTime = performance.now();
    let xi = params.params.xi ?? 0;
    let xs = params.params.xs ?? 1;
    const tolerance = params.tolerance;
    const maxIterations = params.maxIterations;
    const errorType = params.errorType;

    const iterations: IterationData[] = [];
    const explanations: StepExplanation[] = [];
    let prevXr: number | null = null;
    let xr = xi;
    let currentError = 1.0;
    let converged = false;
    let convergenceReason = '';

    for (let iter = 1; iter <= maxIterations; iter++) {
      const fxi = f(xi);
      const fxs = f(xs);

      const denominator = fxs - fxi;
      if (Math.abs(denominator) < 1e-15) {
        convergenceReason = 'División por cero detectada en f(xs) - f(xi). El método se detuvo.';
        break;
      }

      xr = (xi * fxs - xs * fxi) / denominator;
      const fxr = f(xr);

      if (iter === 1) {
        currentError = Math.abs(xs - xi);
      } else {
        currentError = ErrorCalculator.calculate(xr, prevXr, errorType);
      }

      const prod = fxi * fxr;
      const signCheckText = prod < 0 ? '< 0 (xi = xi, xs = xr)' : prod > 0 ? '> 0 (xi = xr, xs = xs)' : '= 0 (Raíz exacta)';

      const iterData: IterationData = {
        iteration: iter,
        xi,
        xs,
        fxi,
        fxs,
        xr,
        fxr,
        signCheck: signCheckText,
        error: currentError,
      };
      iterations.push(iterData);

      if (iter <= 3 || iter === maxIterations || Math.abs(fxr) < 1e-12 || ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        explanations.push({
          stepNumber: iter,
          title: `Iteración ${iter}: Secante en [${xi.toFixed(4)}, ${xs.toFixed(4)}]`,
          description: `Trazamos la recta secante uniendo (${xi.toFixed(3)}, ${fxi.toFixed(3)}) y (${xs.toFixed(3)}, ${fxs.toFixed(3)}). Su intersección con el eje X da xr = ${xr.toFixed(6)}. f(xr) = ${fxr.toFixed(6)}.`,
          latexFormula: `x_r = \\frac{(${xi.toFixed(4)})(${fxs.toFixed(4)}) - (${xs.toFixed(4)})(${fxi.toFixed(4)})}{${fxs.toFixed(4)} - (${fxi.toFixed(4)})} = ${xr.toFixed(6)}`,
          dataSnapshot: {
            'xi': xi,
            'xs': xs,
            'xr': xr,
            'f(xr)': fxr,
            'Error': currentError,
          },
        });
      }

      if (Math.abs(fxr) < 1e-14) {
        converged = true;
        convergenceReason = `Se encontró la raíz exacta en xr = ${xr} con f(xr) = 0.`;
        break;
      }

      if (iter > 1 && ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        converged = true;
        convergenceReason = `El error calculado (${ErrorCalculator.format(currentError, errorType)}) es menor o igual a la tolerancia fijada (${tolerance}).`;
        break;
      }

      prevXr = xr;
      if (prod < 0) {
        xs = xr;
      } else {
        xi = xr;
      }
    }

    if (!converged && iterations.length >= maxIterations) {
      convergenceReason = `Se alcanzó el número máximo de iteraciones (${maxIterations}) sin alcanzar la tolerancia requerida.`;
    }

    const endTime = performance.now();

    return {
      methodId: this.id,
      methodName: this.name,
      expression: params.expression,
      approximateRoot: xr,
      finalError: currentError,
      iterationsCount: iterations.length,
      converged,
      convergenceReason,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      iterations,
      columns: this.iterationColumns,
      explanations,
      educationalInsights: {
        methodSummary: 'La Regla Falsa (Falsa Posición) acelera la búsqueda uniendo los extremos del intervalo con una recta secante e intersectando con el eje X.',
        keyFormula: 'x_r = \\frac{x_i f(x_s) - x_s f(x_i)}{f(x_s) - f(x_i)}',
        convergenceCondition: 'f(x_i) \\cdot f(x_s) < 0 \\quad \\text{en cada iteración}',
        remarks: [
          'Método cerrado con interpolación lineal: combina la seguridad de convergencia de la bisección con una mejor aproximación geométrica.',
          'Riesgo de punto estancado: si la curva posee concavidad pronunciada y persistente, uno de los extremos del intervalo puede permanecer fijo, ralentizando el ritmo de convergencia.',
          'Mayor velocidad práctica: para funciones continuas y suaves, suele alcanzar la tolerancia en sustancialmente menos iteraciones que la bisección.',
        ],
      },
      rootEvaluation: f(xr),
    };
  }
}
