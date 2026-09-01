import { useState, useCallback } from 'react';
import { NumericalEngine } from '../services/NumericalEngine';
import type { MethodInputParams, MethodExecutionResult, MethodValidationResult } from '../domain/types';

export function useNumericalSolver() {
  const [result, setResult] = useState<MethodExecutionResult | null>(null);
  const [validation, setValidation] = useState<MethodValidationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const solve = useCallback((methodId: string, params: MethodInputParams) => {
    setIsCalculating(true);
    setExecutionError(null);

    try {
      const valResult = NumericalEngine.validate(methodId, params);
      setValidation(valResult);

      if (!valResult.isValid) {
        setExecutionError(valResult.errors[0] || 'Los parámetros no son válidos para este método.');
        setIsCalculating(false);
        return false;
      }

      const execResult = NumericalEngine.solve(methodId, params);
      setResult(execResult);
      setIsCalculating(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error inesperado durante la ejecución';
      setExecutionError(msg);
      setIsCalculating(false);
      return false;
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setValidation(null);
    setExecutionError(null);
    setIsCalculating(false);
  }, []);

  return {
    result,
    validation,
    isCalculating,
    executionError,
    solve,
    reset,
  };
}
