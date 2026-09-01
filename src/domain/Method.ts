import type { 
  MethodParameterDef, 
  MethodInputParams, 
  MethodExecutionResult, 
  MethodValidationResult 
} from './types';
import type { IterationColumn } from './Iteration';

export interface NumericalMethod {
  readonly id: string;
  readonly name: string;
  readonly category: 'roots' | 'systems' | 'interpolation' | 'calculus';
  readonly description: string;
  readonly latexFormula: string;
  readonly parameters: MethodParameterDef[];
  readonly iterationColumns: IterationColumn[];

  validate(f: (x: number) => number, params: MethodInputParams): MethodValidationResult;
  execute(f: (x: number) => number, params: MethodInputParams): MethodExecutionResult;
}
