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

export class BisectionMethod implements NumericalMethod {
  public readonly id = 'bisection';
  public readonly name = 'Método de Bisección';
  public readonly category = 'roots';
  public readonly description = 
    'Divide el intervalo a la mitad iterativamente donde la función cambia de signo, garantizando la convergencia hacia una raíz mediante el Teorema del Valor Intermedio (Bolzano).';
  public readonly latexFormula = 'x_r = \\frac{a + b}{2}';

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
    { key: 'xr', label: 'Punto medio (xr)', latexLabel: 'x_{r}', format: 'number', precision: 6 },
    { key: 'fxi', label: 'f(xi)', latexLabel: 'f(x_i)', format: 'sign' },
    { key: 'fxs', label: 'f(xs)', latexLabel: 'f(x_s)', format: 'sign' },
    { key: 'fxr', label: 'f(xr)', latexLabel: 'f(x_{r})', format: 'sign' },
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
          if (Math.abs(fxi) < 1e-12) {
            warnings.push(`¡El punto xi = ${xi} ya es una raíz exacta de f(x)!`);
          } else if (Math.abs(fxs) < 1e-12) {
            warnings.push(`¡El punto xs = ${xs} ya es una raíz exacta de f(x)!`);
          } else if (fxi * fxs > 0) {
            errors.push(
              `f(xi) = ${fxi.toFixed(4)} y f(xs) = ${fxs.toFixed(4)} tienen el MISMO signo (f(xi)·f(xs) > 0). El Teorema de Bolzano exige signos opuestos en el intervalo [xi, xs] para garantizar una raíz.`
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
    let xr = (xi + xs) / 2;
    let currentError = 1.0;
    let converged = false;
    let convergenceReason = '';

    for (let iter = 1; iter <= maxIterations; iter++) {
      const fxi = f(xi);
      const fxs = f(xs);
      xr = (xi + xs) / 2;
      const fxr = f(xr);

      if (iter === 1) {
        currentError = Math.abs(xs - xi) / 2;
      } else {
        currentError = ErrorCalculator.calculate(xr, prevXr, errorType);
      }

      const prod = fxi * fxr;
      const signCheckText = prod < 0 ? '< 0 (xi = xi, xs = xr)' : prod > 0 ? '> 0 (xi = xr, xs = xs)' : '= 0 (Raíz exacta)';

      const iterData: IterationData = {
        iteration: iter,
        xi,
        xs,
        xr,
        fxi,
        fxs,
        fxr,
        signCheck: signCheckText,
        error: currentError,
      };
      iterations.push(iterData);

      if (iter <= 3 || iter === maxIterations || Math.abs(fxr) < 1e-12 || ErrorCalculator.isWithinTolerance(currentError, tolerance, errorType)) {
        explanations.push({
          stepNumber: iter,
          title: `Iteración ${iter}: Intervalo [${xi.toFixed(4)}, ${xs.toFixed(4)}]`,
          description: `Calculamos el punto medio xr = (${xi.toFixed(4)} + ${xs.toFixed(4)}) / 2 = ${xr.toFixed(6)}. Evaluamos f(xr) = ${fxr.toFixed(6)}. Como f(xi)·f(xr) ${prod < 0 ? '< 0' : '> 0'}, la raíz se encuentra en [${prod < 0 ? `${xi.toFixed(4)}, ${xr.toFixed(4)}` : `${xr.toFixed(4)}, ${xs.toFixed(4)}`}].`,
          latexFormula: `x_r = \\frac{${xi.toFixed(4)} + ${xs.toFixed(4)}}{2} = ${xr.toFixed(6)}`,
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
        methodSummary: 'El método de Bisección garantiza convergencia reduciendo el intervalo a la mitad en cada paso de forma lineal.',
        keyFormula: 'x_r = \\frac{x_i + x_s}{2}',
        convergenceCondition: 'f(x_i) \\cdot f(x_s) < 0 \\quad \\text{en cada iteración}',
        remarks: [
          'La tasa de convergencia es lineal, con factor de reducción constante de 1/2 por iteración.',
          'Es infalible siempre que la función sea continua y exista cambio de signo en el intervalo.',
          'El número de iteraciones necesarias se puede calcular de antemano: n \\ge \\frac{\\ln(x_{s0} - x_{i0}) - \\ln(\\text{Tol})}{\\ln 2}.',
        ],
      },
      rootEvaluation: f(xr),
    };
  }
}
