import { parse, derivative } from 'mathjs';

export interface ParsedExpression {
  isValid: boolean;
  rawExpression: string;
  latex: string;
  errorMessage?: string;
  evaluate: (x: number) => number;
  derivative?: (x: number) => number;
  derivativeLatex?: string;
}

export class ExpressionParser {
  public static normalizeForDifferentiation(expression: string): string {
    let normalized = this.sanitize(expression);
    let start = normalized.toLowerCase().indexOf('cbrt(');

    while (start >= 0) {
      const argumentStart = start + 5;
      let depth = 1;
      let end = argumentStart;
      while (end < normalized.length && depth > 0) {
        if (normalized[end] === '(') depth++;
        if (normalized[end] === ')') depth--;
        end++;
      }
      if (depth !== 0) break;
      const argument = normalized.slice(argumentStart, end - 1);
      normalized = `${normalized.slice(0, start)}(${argument})^(1/3)${normalized.slice(end)}`;
      start = normalized.toLowerCase().indexOf('cbrt(');
    }

    return normalized;
  }

  /**
   * Pre-cleans human friendly math expressions to mathjs syntax
   * e.g. "2x" -> "2*x", "sen(x)" -> "sin(x)", "e^x" -> "exp(x)"
   */
  public static sanitize(input: string): string {
    if (!input) return '';
    let sanitized = input.trim();

    // Replace unicode minus and multiplication symbols
    sanitized = sanitized
      .replace(/−/g, '-')
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/π/g, 'pi');

    // Replace spanish trig function names
    sanitized = sanitized
      .replace(/\bsen\b/gi, 'sin')
      .replace(/\btg\b/gi, 'tan')
      .replace(/\bln\b/gi, 'log');

    // Fix implicit multiplication like 4x -> 4*x, 3(x+1) -> 3*(x+1), (x+1)(x-2) -> (x+1)*(x-2)
    sanitized = sanitized.replace(/(\d+)\s*([a-zA-Z(])/g, '$1*$2');
    sanitized = sanitized.replace(/(\))\s*([a-zA-Z0-9(])/g, '$1*$2');
    sanitized = sanitized.replace(/(\b(?:e|pi|x)\b)\s+(?=(?:sin|cos|tan|log|exp)\b)/gi, '$1*');

    return sanitized;
  }

  /**
   * Parses an expression string and creates an evaluable object
   */
  public static parse(expressionStr: string): ParsedExpression {
    const cleanStr = this.sanitize(expressionStr);

    if (!cleanStr) {
      return {
        isValid: false,
        rawExpression: expressionStr,
        latex: '',
        errorMessage: 'Por favor introduce una expresión matemática.',
        evaluate: () => NaN,
      };
    }

    try {
      const node = parse(cleanStr);
      const compiled = node.compile();

      // Test evaluation at x = 1 to catch undefined variables or runtime parse failures
      const testVal = compiled.evaluate({ x: 1, e: Math.E, pi: Math.PI });
      if (typeof testVal !== 'number' && typeof testVal !== 'boolean') {
        throw new Error('La expresión no retorna un valor numérico real.');
      }

      // Generate LaTeX representation
      let latex = '';
      try {
        latex = node.toTex({ parenthesis: 'keep', implicit: 'hide' });
      } catch {
        latex = cleanStr;
      }

      // Create safe evaluation function
      const evaluate = (x: number): number => {
        try {
          const res = compiled.evaluate({ x, e: Math.E, pi: Math.PI });
          if (typeof res === 'number') {
            if (!Number.isFinite(res)) return NaN;
            return res;
          }
          return NaN;
        } catch {
          return NaN;
        }
      };

      // Attempt symbolic derivative computation
      let derivFn: ((x: number) => number) | undefined;
      let derivLatex: string | undefined;

      try {
        const derivNode = derivative(this.normalizeForDifferentiation(cleanStr), 'x');
        const compiledDeriv = derivNode.compile();
        derivLatex = derivNode.toTex({ parenthesis: 'keep', implicit: 'hide' });
        derivFn = (x: number): number => {
          try {
            const val = compiledDeriv.evaluate({ x, e: Math.E, pi: Math.PI });
            return typeof val === 'number' && Number.isFinite(val) ? val : NaN;
          } catch {
            return NaN;
          }
        };
      } catch {
        // Derivative fallback
      }

      return {
        isValid: true,
        rawExpression: cleanStr,
        latex,
        evaluate,
        derivative: derivFn,
        derivativeLatex: derivLatex,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sintaxis de expresión matemática no válida';
      return {
        isValid: false,
        rawExpression: expressionStr,
        latex: '',
        errorMessage: `Error en la función: ${msg}`,
        evaluate: () => NaN,
      };
    }
  }
}
