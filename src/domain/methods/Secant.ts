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

export class SecantMethod implements NumericalMethod {
  public readonly id = 'secant';
  public readonly name = 'Método de la Secante';
  public readonly category = 'roots';
  public readonly description = 
    'Aproxima la derivada de Newton-Raphson mediante diferencias finitas usando dos puntos iniciales, sin necesidad de calcular la derivada analítica.';
  public readonly latexFormula = 'x_{i+1} = x_i - \\frac{f(x_i)(x_i - x_{i-1})}{f(x_i) - f(x_{i-1})}';

  public readonly parameters: MethodParameterDef[] = [
    {
      name: 'xi',
      label: 'Primer punto (xi)',
      latexLabel: 'x_i',
      description: 'Primera estimación inicial',
      defaultValue: 0,
      step: 0.1,
      placeholder: 'Ej. 0',
    },
    {
      name: 'xs',
      label: 'Segundo punto (xs)',
      latexLabel: 'x_s',
      description: 'Segunda estimación inicial',
      defaultValue: 1,
      step: 0.1,
      placeholder: 'Ej. 1',
    },
  ];

  public readonly iterationColumns: IterationColumn[] = [
    { key: 'iteration', label: 'Iteración', latexLabel: 'i', format: 'number' },
    { key: 'xPrev', label: 'x_{i-1}', latexLabel: 'x_{i-1}', format: 'number', precision: 6 },
    { key: 'xCurr', label: 'x_i', latexLabel: 'x_i', format: 'number', precision: 6 },
    { key: 'fxPrev', label: 'f(x_{i-1})', latexLabel: 'f(x_{i-1})', format: 'number', precision: 6 },
    { key: 'fxCurr', label: 'f(x_i)', latexLabel: 'f(x_i)', format: 'number', precision: 6 },
    { key: 'xNext', label: 'x_{i+1}', latexLabel: 'x_{i+1}', format: 'number', precision: 6 },
    { key: 'error', label: 'Error', latexLabel: 'E', format: 'scientific', precision: 6 },
  ];

  public validate(f: (x: number) => number, params: MethodInputParams): MethodValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const xi = params.params.xi;
    const xs = params.params.xs;

    if (xi === undefined || Number.isNaN(xi)) {
      errors.push('Debes ingresar un valor válido para xi.');
    }
    if (xs === undefined || Number.isNaN(xs)) {
      errors.push('Debes ingresar un valor válido para xs.');
    }

    if (xi !== undefined && xs !== undefined && !Number.isNaN(xi) && !Number.isNaN(xs)) {
      if (Math.abs(xi - xs) < 1e-15) {
        errors.push('xi y xs deben ser distintos.');
      } else {
        const fxi = f(xi);
        const fxs = f(xs);
        if (Math.abs(fxi - fxs) < 1e-15) {
          warnings.push('f(xi) y f(xs) son prácticamente iguales, lo que provocará una división por cero en la secante.');
        }
      }
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  public execute(f: (x: number) => number, params: MethodInputParams): MethodExecutionResult {
    const startTime = performance.now();
    let xPrev = params.params.xi ?? 0;
    let xCurr = params.params.xs ?? 1;
    const tolerance = params.tolerance;
    const maxIterations = params.maxIterations;
    const errorType = params.errorType;

    const iterations: IterationData[] = [];
    const explanations: StepExplanation[] = [];
    let currentError = 1.0;
    let converged = false;
    let convergenceReason = '';

    for (let iter = 1; iter <= maxIterations; iter++) {
      const fxPrev = f(xPrev);
      const fxCurr = f(xCurr);

      const denom = fxCurr - fxPrev;
      if (Math.abs(denom) < 1e-15) {
        convergenceReason = `División por cero en f(x_i) - f(x_{i-1}) en la iteración ${iter}.`;
        break;
      }

      const xNext = xCurr - (fxCurr * (xCurr - xPrev)) / denom;
      currentError = ErrorCalculator.calculate(xNext, xCurr, errorType);

      const iterData: IterationData = {
        iteration: iter,
        xPrev,
        xCurr,
        fxPrev,
        fxCurr,
        xNext,
        error: currentError,
      };
      iterations.push(iterData);

      if (iter <= 3 || iter === maxIterations || Math.abs(f(xNext)) < 1e-12 || ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        explanations.push({
          stepNumber: iter,
          title: `Iteración ${iter}: Secante por (${xPrev.toFixed(4)}, ${fxPrev.toFixed(4)}) y (${xCurr.toFixed(4)}, ${fxCurr.toFixed(4)})`,
          description: `Calculamos la recta secante e intersectamos con el eje X: x_{${iter+1}} = ${xNext.toFixed(6)}.`,
          latexFormula: `x_{${iter+1}} = ${xCurr.toFixed(4)} - \\frac{(${fxCurr.toFixed(4)})(${xCurr.toFixed(4)} - ${xPrev.toFixed(4)})}{${fxCurr.toFixed(4)} - (${fxPrev.toFixed(4)})} = ${xNext.toFixed(6)}`,
          dataSnapshot: {
            'x_{i-1}': xPrev,
            'x_i': xCurr,
            'x_{i+1}': xNext,
            'Error': currentError,
          },
        });
      }

      if (Math.abs(f(xNext)) < 1e-14) {
        converged = true;
        xCurr = xNext;
        convergenceReason = `Se alcanzó raíz con f(x) = 0 en ${xNext}.`;
        break;
      }

      if (ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        converged = true;
        xCurr = xNext;
        convergenceReason = `El error calculado (${ErrorCalculator.format(currentError, errorType)}) es menor o igual a la tolerancia (${tolerance}).`;
        break;
      }

      xPrev = xCurr;
      xCurr = xNext;
    }

    if (!converged && iterations.length >= maxIterations) {
      convergenceReason = `Se alcanzó el número máximo de iteraciones (${maxIterations}) sin alcanzar la convergencia.`;
    }

    const endTime = performance.now();

    return {
      methodId: this.id,
      methodName: this.name,
      expression: params.expression,
      approximateRoot: xCurr,
      finalError: currentError,
      iterationsCount: iterations.length,
      converged,
      convergenceReason,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      iterations,
      columns: this.iterationColumns,
      explanations,
      educationalInsights: {
        methodSummary: 'La Secante evita derivar analíticamente aproximando la pendiente mediante la diferencia de las dos evaluaciones previas.',
        keyFormula: 'x_{i+1} = x_i - \\frac{f(x_i)(x_i - x_{i-1})}{f(x_i) - f(x_{i-1})}',
        convergenceCondition: '\\text{Orden de convergencia superlineal: } \\alpha \\approx 1.618 \\text{ (Número Áureo)}',
        remarks: [
          'No requiere que f(x₀) y f(x₁) tengan signos opuestos (es un método abierto).',
          'Convergencia más veloz que la bisección y no requiere cálculo de derivadas.',
        ],
      },
      rootEvaluation: f(xCurr),
    };
  }
}
