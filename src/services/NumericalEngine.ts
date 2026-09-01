import { MethodFactory, type MethodMetadata } from '../factories/MethodFactory';
import { ExpressionParser, type ParsedExpression } from './ExpressionParser';
import type { 
  MethodInputParams, 
  MethodExecutionResult, 
  MethodValidationResult 
} from '../domain/types';

export class NumericalEngine {
  /**
   * Parse and validate a mathematical expression string
   */
  public static parseExpression(expressionStr: string): ParsedExpression {
    return ExpressionParser.parse(expressionStr);
  }

  /**
   * Get metadata for all available methods
   */
  public static getAvailableMethods(): MethodMetadata[] {
    return MethodFactory.getAllMethods();
  }

  /**
   * Pre-validates parameters before running calculations
   */
  public static validate(methodId: string, params: MethodInputParams): MethodValidationResult {
    const parsed = ExpressionParser.parse(params.expression);
    if (!parsed.isValid) {
      return {
        isValid: false,
        errors: [parsed.errorMessage || 'Expresión matemática inválida'],
        warnings: [],
      };
    }

    if (params.tolerance <= 0) {
      return {
        isValid: false,
        errors: ['La tolerancia debe ser un número positivo mayor que cero.'],
        warnings: [],
      };
    }

    if (params.maxIterations < 1 || params.maxIterations > 1000) {
      return {
        isValid: false,
        errors: ['El número máximo de iteraciones debe estar entre 1 y 1000.'],
        warnings: [],
      };
    }

    try {
      const method = MethodFactory.create(methodId);
      return method.validate(parsed.evaluate, params);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error desconocido al validar el método';
      return {
        isValid: false,
        errors: [msg],
        warnings: [],
      };
    }
  }

  /**
   * Unified entry point: Executes the requested numerical method
   */
  public static solve(methodId: string, params: MethodInputParams): MethodExecutionResult {
    const parsed = ExpressionParser.parse(params.expression);
    if (!parsed.isValid) {
      throw new Error(parsed.errorMessage || 'No se puede resolver: la función es inválida.');
    }

    const method = MethodFactory.create(methodId);
    
    const validation = method.validate(parsed.evaluate, params);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(' | '));
    }

    return method.execute(parsed.evaluate, params);
  }
}
