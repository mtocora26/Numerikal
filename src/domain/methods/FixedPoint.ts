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

export class FixedPointMethod implements NumericalMethod {
  public readonly id = 'fixed-point';
  public readonly name = 'Método de Punto Fijo';
  public readonly category = 'roots';
  public readonly description = 
    'Requiere una función g(x) ya despejada y calcula iterativamente x_{i+1} = g(x_i). No despeja automáticamente una ecuación f(x) = 0. Para garantizar la convergencia, |g\'(x)| debe ser menor a 1 cerca de la raíz.';
  public readonly latexFormula = 'x_{i+1} = g(x_i)';

  public readonly parameters: MethodParameterDef[] = [
    {
      name: 'xi',
      label: 'Valor inicial (x0)',
      latexLabel: 'x_0',
      description: 'Estimación inicial x_0 para comenzar la iteración de g(x)',
      defaultValue: 0,
      step: 0.1,
      placeholder: 'Ej. 0',
    },
  ];

  public readonly iterationColumns: IterationColumn[] = [
    { key: 'iteration', label: 'Iteración', latexLabel: 'i', format: 'integer' },
    { key: 'xi', label: 'x_i', latexLabel: 'x_i', format: 'number', precision: 6 },
    { key: 'gxi', label: 'x_{i+1} = g(x_i)', latexLabel: 'x_{i+1} = g(x_i)', format: 'number', precision: 6 },
    { key: 'error', label: 'Error', latexLabel: 'E', format: 'scientific', precision: 6 },
  ];

  public validate(g: (x: number) => number, params: MethodInputParams): MethodValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const xi = params.params.xi;
    if (xi === undefined || Number.isNaN(xi)) {
      errors.push('Debes ingresar un valor inicial válido para xi.');
    } else {
      const gxi = g(xi);
      if (!Number.isFinite(gxi)) {
        errors.push(`La función g(x) no está definida o produce un valor indeterminado en x = ${xi}.`);
      } else {
        // Estimate derivative g'(x) via central difference
        const h = 1e-5;
        const dg = (g(xi + h) - g(xi - h)) / (2 * h);
        if (Math.abs(dg) >= 1) {
          warnings.push(
            `|g'(${xi})| ≈ ${dg.toFixed(4)} ≥ 1. El criterio de convergencia de Punto Fijo (|g'(x)| < 1) NO se satisface en x0 = ${xi}, por lo que el método podría diverger.`
          );
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  public execute(g: (x: number) => number, params: MethodInputParams): MethodExecutionResult {
    const startTime = performance.now();
    let currentX = params.params.xi ?? 0;
    const tolerance = params.tolerance;
    const maxIterations = params.maxIterations;
    const errorType = params.errorType;
    const parsed = ExpressionParser.parse(params.expression);
    const derivativeAt = (x: number): number => {
      if (parsed.derivative) {
        const symbolicValue = parsed.derivative(x);
        if (Number.isFinite(symbolicValue)) return symbolicValue;
      }
      const h = 1e-5;
      return (g(x + h) - g(x - h)) / (2 * h);
    };

    const iterations: IterationData[] = [];
    const explanations: StepExplanation[] = [];
    let currentError = 1.0;
    let converged = false;
    let convergenceReason = '';

    for (let iter = 1; iter <= maxIterations; iter++) {
      const gxi = g(currentX);

      if (!Number.isFinite(gxi)) {
        convergenceReason = `La función g(x) retornó un valor no finito (${gxi}) en la iteración ${iter}. El método divergió.`;
        break;
      }

      const gprimeXi = derivativeAt(currentX);
      if (iter === 1) {
        currentError = Math.abs(gxi - currentX);
      } else {
        currentError = ErrorCalculator.calculate(gxi, currentX, errorType);
      }

      const iterData: IterationData = {
        iteration: iter,
        xi: currentX,
        gxi: gxi,
        error: currentError,
      };
      iterations.push(iterData);

      if (iter <= 3 || iter === maxIterations || ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        explanations.push({
          stepNumber: iter,
          title: `Iteración ${iter}: Evaluando g(${currentX.toFixed(4)})`,
          description: `Calculamos x_{${iter}} = g(${currentX.toFixed(4)}) = ${gxi.toFixed(6)}. Además, g'(${currentX.toFixed(4)}) = ${gprimeXi.toFixed(6)} y ${Math.abs(gprimeXi) < 1 ? 'cumple' : 'no cumple'} el criterio local |g'(x_i)| < 1.`,
          latexFormula: `x_{${iter}} = g(${currentX.toFixed(4)}) = ${gxi.toFixed(6)}`,
          dataSnapshot: {
            'x_i': currentX,
            'g(x_i)': gxi,
            "g'(x_i)": gprimeXi,
            'Error': currentError,
          },
        });
      }

      if (ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        converged = true;
        currentX = gxi;
        convergenceReason = `El error calculado (${ErrorCalculator.format(currentError, errorType)}) es menor o igual a la tolerancia (${tolerance}).`;
        break;
      }

      if (Math.abs(gxi) > 1e12) {
        convergenceReason = `El valor de g(x) creció exponencialmente (${gxi}). El método de Punto Fijo está divergiendo.`;
        break;
      }

      currentX = gxi;
    }

    if (!converged && iterations.length >= maxIterations) {
      convergenceReason = `Se alcanzó el número máximo de iteraciones (${maxIterations}) sin cumplir la tolerancia requerida.`;
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
          'El método de Punto Fijo reescribe la ecuación $f(x) = 0$ en la forma equivalente $x = g(x)$, evaluando sucesivamente $x_{i+1} = g(x_i)$ hasta converger.',
        keyFormula: 'x_{i+1} = g(x_i)',
        convergenceCondition: '|g\'(x)| < 1 \\quad \\text{en el entorno de la raíz}',
        remarks: [
          'Despeje de la función generadora: asegúrate de haber despejado $x$ correctamente para construir una función $g(x)$ adecuada.',
          'Condición de convergencia local: si $|g\'(x)| < 1$, las iteraciones convergen de forma monótona o en espiral hacia el punto fijo.',
          'Diagnóstico de divergencia: si $|g\'(x)| > 1$, los valores se alejan de la raíz. En ese caso es indispensable plantear otro despeje algebraico para $g(x)$.',
        ],
      },
      rootEvaluation: g(currentX) - currentX,
      convergenceDiagnostics: {
        label: "g'(x_i)",
        value: derivativeAt(params.params.xi ?? 0),
        criterion: '|g\'(x_i)| < 1',
        criterionMet: Math.abs(derivativeAt(params.params.xi ?? 0)) < 1,
      },
    };
  }
}
