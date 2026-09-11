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

export class ModifiedNewtonRaphsonMethod implements NumericalMethod {
  public readonly id = 'modified-newton-raphson';
  public readonly name = 'Método de Newton-Raphson Modificado';
  public readonly category = 'roots';
  public readonly description = 
    'Aplica la fórmula de Ralston/Chapra para raíces múltiples utilizando la primera y segunda derivada, manteniendo la convergencia cuadrática aun cuando f\'(x) se aproxime a cero.';
  public readonly latexFormula = 'x_{i+1} = x_i - \\frac{f(x_i) \\cdot f\'(x_i)}{[f\'(x_i)]^2 - f(x_i) \\cdot f\'\'(x_i)}';

  public readonly parameters: MethodParameterDef[] = [
    {
      name: 'xi',
      label: 'Punto inicial (xi)',
      latexLabel: 'x_i',
      description: 'Estimación inicial x_0 de la raíz',
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
    { key: 'd2fxi', label: "f''(x_i)", latexLabel: "f''(x_i)", format: 'number', precision: 6 },
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
        errors.push(`f(xi) no está definida o es infinita en xi = ${xi}.`);
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

    // Compute derivative 1 and derivative 2 safely
    const getDerivatives = (x: number): { df: number; d2f: number } => {
      let df = NaN;
      if (parsed.derivative) {
        df = parsed.derivative(x);
      }
      const h = 1e-5;
      if (Number.isNaN(df) || !Number.isFinite(df)) {
        df = (f(x + h) - f(x - h)) / (2 * h);
      }

      // Second derivative via central differences: [f(x+h) - 2f(x) + f(x-h)] / h^2
      const d2f = (f(x + h) - 2 * f(x) + f(x - h)) / (h * h);
      return { df, d2f };
    };

    const iterations: IterationData[] = [];
    const explanations: StepExplanation[] = [];
    let currentError = 1.0;
    let converged = false;
    let convergenceReason = '';

    for (let iter = 1; iter <= maxIterations; iter++) {
      const fxi = f(currentX);
      const { df: dfxi, d2f: d2fxi } = getDerivatives(currentX);

      const denom = dfxi * dfxi - fxi * d2fxi;

      if (Math.abs(denom) < 1e-15) {
        convergenceReason = `División por cero en el denominador [f'(x)]² - f(x)f''(x) en la iteración ${iter}.`;
        break;
      }

      const num = fxi * dfxi;
      const xNext = currentX - num / denom;

      if (!Number.isFinite(xNext)) {
        convergenceReason = `Se obtuvo un valor no numérico en x_{i+1}. El método se detuvo.`;
        break;
      }

      currentError = ErrorCalculator.calculate(xNext, currentX, errorType);

      const iterData: IterationData = {
        iteration: iter,
        xi: currentX,
        fxi,
        dfxi,
        d2fxi,
        xNext,
        error: currentError,
      };
      iterations.push(iterData);

      if (iter <= 3 || iter === maxIterations || Math.abs(fxi) < 1e-12 || ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        explanations.push({
          stepNumber: iter,
          title: `Iteración ${iter}: x = ${currentX.toFixed(4)}`,
          description: `f(${currentX.toFixed(4)}) = ${fxi.toFixed(6)}, f' = ${dfxi.toFixed(6)}, f'' = ${d2fxi.toFixed(6)}. x_{${iter}} = ${xNext.toFixed(6)}.`,
          latexFormula: `x_{${iter}} = ${currentX.toFixed(4)} - \\frac{(${fxi.toFixed(4)})(${dfxi.toFixed(4)})}{(${dfxi.toFixed(4)})^2 - (${fxi.toFixed(4)})(${d2fxi.toFixed(4)})} = ${xNext.toFixed(6)}`,
          dataSnapshot: {
            'x_i': currentX,
            "f'(x_i)": dfxi,
            "f''(x_i)": d2fxi,
            'x_{i+1}': xNext,
            'Error': currentError,
          },
        });
      }

      if (Math.abs(f(xNext)) < 1e-14) {
        converged = true;
        currentX = xNext;
        convergenceReason = `Se alcanzó la raíz exacta con f(x) = 0 en ${xNext}.`;
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
        methodSummary:
          'El método de Newton-Raphson Modificado incorpora la segunda derivada para resolver eficientemente raíces múltiples ($m > 1$) donde la primera derivada $f\'(x)$ también se anula.',
        keyFormula: 'x_{i+1} = x_i - \\frac{f(x_i) \\cdot f\'(x_i)}{[f\'(x_i)]^2 - f(x_i) \\cdot f\'\'(x_i)}',
        convergenceCondition: '[f\'(x)]^2 - f(x) \\cdot f\'\'(x) \\neq 0',
        remarks: [
          'Tratamiento de raíces múltiples: restaura la rapidez cuadrática del método en problemas con raíces dobles o triples donde el Newton clásico se degrada a lineal.',
          'Uso conjunto de derivadas: requiere evaluar tanto la primera derivada $f\'(x)$ como la segunda derivada $f\'\'(x)$ en cada ciclo iterativo.',
          'Comportamiento en raíces simples: también converge cuadráticamente en raíces simples ($m = 1$), con un costo computacional adicional por evaluar $f\'\'(x)$.',
        ],
      },
      rootEvaluation: f(currentX),
    };
  }
}
