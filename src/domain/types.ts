import type { IterationData, IterationColumn } from './Iteration';

export type ErrorType = 'absolute' | 'relative' | 'percentage';

export interface MethodParameterDef {
  name: string;
  label: string;
  latexLabel?: string;
  description: string;
  defaultValue: number;
  step?: number;
  placeholder?: string;
}

export interface MethodInputParams {
  expression: string;
  tolerance: number;
  maxIterations: number;
  errorType: ErrorType;
  params: Record<string, number>;
}

export interface StepExplanation {
  stepNumber: number;
  title: string;
  description: string;
  latexFormula?: string;
  dataSnapshot?: Record<string, number | string>;
}

export interface MethodExecutionResult {
  methodId: string;
  methodName: string;
  expression: string;
  approximateRoot: number;
  finalError: number;
  iterationsCount: number;
  converged: boolean;
  convergenceReason: string;
  executionTimeMs: number;
  iterations: IterationData[];
  columns: IterationColumn[];
  explanations?: StepExplanation[];
  educationalInsights: {
    methodSummary: string;
    keyFormula: string;
    convergenceCondition: string;
    remarks: string[];
  };
  rootEvaluation: number; // f(xr)
}

export interface MethodValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
