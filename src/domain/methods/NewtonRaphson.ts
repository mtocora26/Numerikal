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
import { ExpressionParser } from '../../services/ExpressionParser';

export class NewtonRaphsonMethod implements NumericalMethod {
  public readonly id = 'newton-raphson';
  public readonly name = 'Método de Newton-Raphson';
  public readonly category = 'roots';
  public readonly description = 
    'Método abierto de convergencia cuadrática que utiliza la recta tangente a la curva en el punto actual para proyectar la siguiente aproximación.';
  public readonly latexFormula = 'x_{i+1} = x_i - \\frac{f(x_i)}{f\'(x_i)}';

  public readonly parameters: MethodParameterDef[] = [
    {
      name: 'xi',
      label: 'Punto inicial (xi)',
      latexLabel: 'x_i',
      description: 'Estimación inicial de la raíz',
      defaultValue: 1.5,
      step: 0.1,
      placeholder: 'Ej. 1.5',
    },
  ];

  public readonly iterationColumns: IterationColumn[] = [
    { key: 'iteration', label: 'Iteración', latexLabel: 'i', format: 'integer' },
    { key: 'xi', label: 'x_i', latexLabel: 'x_i', format: 'number', precision: 6 },
    { key: 'fxi', label: 'f(x_i)', latexLabel: 'f(x_i)', format: 'number', precision: 6 },
    { key: 'dfxi', label: "f'(x_i)", latexLabel: "f'(x_i)", format: 'number', precision: 6 },
    { key: 'xNext', label: 'x_{i+1}', latexLabel: 'x_{i+1}', format: 'number', precision: 6 },
    { key: 'error', label: 'Error', latexLabel: 'E', format: 'scientific', precision: 6 },
  ];

  public validate(f: (x: number) => number, params: MethodInputParams): MethodValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const xi = params.params.xi;
    if (xi === undefined || Number.isNaN(xi)) {
      errors.push('Debes ingresar un valor válido para la estimación inicial xi.');
    } else {
      const fxi = f(xi);
      if (!Number.isFinite(fxi)) {
        errors.push(`f(xi) no está definida en xi = ${xi}.`);
      }

      const parsed = ExpressionParser.parse(params.expression);
      let dfxi = parsed.derivative ? parsed.derivative(xi) : NaN;
      if (Number.isNaN(dfxi)) {
        const h = 1e-6;
        dfxi = (f(xi + h) - f(xi - h)) / (2 * h);
      }

      if (Math.abs(dfxi) < 1e-12) {
        warnings.push(`La derivada f'(xi) en xi = ${xi} es prácticamente cero (${dfxi.toFixed(6)}), lo que puede causar divergencia por tangente horizontal.`);
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
    let currentX = params.params.xi ?? 1.5;
    const tolerance = params.tolerance;
    const maxIterations = params.maxIterations;
    const errorType = params.errorType;

    const parsed = ExpressionParser.parse(params.expression);
    const getDerivative = (x: number): number => {
      if (parsed.derivative) {
        const val = parsed.derivative(x);
        if (Number.isFinite(val)) return val;
      }
      const h = 1e-6;
      return (f(x + h) - f(x - h)) / (2 * h);
    };

    const iterations: IterationData[] = [];
    const explanations: StepExplanation[] = [];
    let currentError = 1.0;
    let converged = false;
    let convergenceReason = '';

    for (let iter = 1; iter <= maxIterations; iter++) {
      const fxi = f(currentX);
      const dfxi = getDerivative(currentX);

      if (Math.abs(dfxi) < 1e-15) {
        convergenceReason = `Derivada nula (f'(x) = 0) en x = ${currentX}. La recta tangente es horizontal y no corta el eje X.`;
        break;
      }

      const xNext = currentX - (fxi / dfxi);
      currentError = ErrorCalculator.calculate(xNext, currentX, errorType);

      const iterData: IterationData = {
        iteration: iter,
        xi: currentX,
        fxi,
        dfxi,
        xNext,
        error: currentError,
      };
      iterations.push(iterData);

      if (iter <= 3 || iter === maxIterations || Math.abs(fxi) < 1e-12 || ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        explanations.push({
          stepNumber: iter,
          title: `Iteración ${iter}: Tangente en x = ${currentX.toFixed(4)}`,
          description: `Evaluamos f(${currentX.toFixed(4)}) = ${fxi.toFixed(6)} y f'(${currentX.toFixed(4)}) = ${dfxi.toFixed(6)}. Trazamos la tangente y proyectamos x_{${iter}} = ${xNext.toFixed(6)}.`,
          latexFormula: `x_{${iter}} = ${currentX.toFixed(4)} - \\frac{${fxi.toFixed(6)}}{${dfxi.toFixed(6)}} = ${xNext.toFixed(6)}`,
          dataSnapshot: {
            'x_i': currentX,
            "f'(x_i)": dfxi,
            'x_{i+1}': xNext,
            'Error': currentError,
          },
        });
      }

      if (Math.abs(f(xNext)) < 1e-14) {
        converged = true;
        currentX = xNext;
        convergenceReason = `Se alcanzó la raíz con f(x) = 0 en ${xNext}.`;
        break;
      }

      if (ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        converged = true;
        currentX = xNext;
        convergenceReason = `El error calculado (${ErrorCalculator.format(currentError, errorType)}) es menor o igual a la tolerancia (${tolerance}).`;
        break;
      }

      currentX = xNext;
    }

    if (!converged && iterations.length >= maxIterations) {
      convergenceReason = `Se alcanzó el número máximo de iteraciones (${maxIterations}) sin alcanzar la convergencia.`;
    }

    const endTime = performance.now();

    return {
      methodId: this.id,
      methodName: this.name,
      expression: params.expression,
      approximateRoot: currentX,
      finalError: currentError,
      iterationsCount: iterations.length,
      converged,
      convergenceReason,
      executionTimeMs: Math.round((endTime - startTime) * 100) / 100,
      iterations,
      columns: this.iterationColumns,
      explanations,
      educationalInsights: {
        methodSummary: 'Newton-Raphson utiliza la recta tangente basada en la serie de Taylor de primer orden para aproximar la raíz con velocidad cuadrática.',
        keyFormula: 'x_{i+1} = x_i - \\frac{f(x_i)}{f\'(x_i)}',
        convergenceCondition: '|f(x) \\cdot f\'\'(x)| < [f\'(x)]^2 \\quad \\text{(Criterio de Fourier)}',
        remarks: [
          'Convergencia cuadrática: el número de dígitos significativos correctos se duplica aproximadamente en cada iteración exitosa.',
          'Sensibilidad al punto inicial $x_0$: si se elige cerca de un punto de inflexión o donde $f\'(x) \\approx 0$, el método puede divergir, ciclar o fallar por división entre cero.',
          'Cálculo de derivadas: requiere evaluar tanto la función $f(x)$ como su primera derivada $f\'(x)$ en cada paso iterativo.',
        ],
      },
      rootEvaluation: f(currentX),
    };
  }
}
