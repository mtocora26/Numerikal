import { parse, derivative, type MathNode } from 'mathjs';
import { ExpressionParser } from './ExpressionParser';

export interface DerivativeStep {
  stepNumber: number;
  title: string;
  ruleName: string;
  latexFormula: string;
  explanation: string;
}

export interface DerivativeExplanationResult {
  isValid: boolean;
  originalExpr: string;
  originalLatex: string;
  d1Latex: string;
  d1Steps: DerivativeStep[];
  d2Latex: string;
  d2Steps: DerivativeStep[];
}

export class DerivativeStepExplainer {
  /**
   * Generates step-by-step explanations for 1st and 2nd derivatives of f(x)
   */
  public static explain(exprStr: string): DerivativeExplanationResult {
    const clean = ExpressionParser.sanitize(exprStr);
    if (!clean) {
      return {
        isValid: false,
        originalExpr: exprStr,
        originalLatex: '',
        d1Latex: '',
        d1Steps: [],
        d2Latex: '',
        d2Steps: [],
      };
    }

    try {
      const parsedNode = parse(clean);
      const d1Node = derivative(parsedNode, 'x');
      const d2Node = derivative(d1Node, 'x');

      let originalLatex = '';
      let d1Latex = '';
      let d2Latex = '';

      try { originalLatex = parsedNode.toTex({ parenthesis: 'keep' }); } catch { originalLatex = clean; }
      try { d1Latex = d1Node.toTex({ parenthesis: 'keep' }); } catch { d1Latex = d1Node.toString(); }
      try { d2Latex = d2Node.toTex({ parenthesis: 'keep' }); } catch { d2Latex = d2Node.toString(); }

      const d1Steps = this.generateStepsForNode(parsedNode, d1Node, "f'(x)", false);
      const d2Steps = this.generateStepsForNode(d1Node, d2Node, "f''(x)", true);

      return {
        isValid: true,
        originalExpr: clean,
        originalLatex,
        d1Latex,
        d1Steps,
        d2Latex,
        d2Steps,
      };
    } catch {
      return {
        isValid: false,
        originalExpr: exprStr,
        originalLatex: '',
        d1Latex: '',
        d1Steps: [],
        d2Latex: '',
        d2Steps: [],
      };
    }
  }

  private static generateStepsForNode(
    inputNode: MathNode,
    resultNode: MathNode,
    targetName: string,
    isSecondDeriv: boolean
  ): DerivativeStep[] {
    const steps: DerivativeStep[] = [];
    let stepNum = 1;

    let inputTex = '';
    let resultTex = '';
    try { inputTex = inputNode.toTex(); } catch { inputTex = inputNode.toString(); }
    try { resultTex = resultNode.toTex(); } catch { resultTex = resultNode.toString(); }

    // Step 1: Sum/Difference rule breakdown
    steps.push({
      stepNumber: stepNum++,
      title: `Aplicar la regla de suma/resta`,
      ruleName: 'Regla de la Suma y Resta',
      latexFormula: `\\frac{d}{dx}[${inputTex}]`,
      explanation: `Separamos el análisis término a término. La derivada de una suma de funciones es la suma de sus derivadas individuales: \\frac{d}{dx}[u \\pm v] = \\frac{d}{dx}[u] \\pm \\frac{d}{dx}[v].`,
    });

    // Extract terms if sum/subtraction
    const terms = this.extractTerms(inputNode);

    if (terms.length > 1) {
      terms.forEach((term, idx) => {
        let termTex = '';
        try { termTex = term.toTex(); } catch { termTex = term.toString(); }

        try {
          const dTerm = derivative(term, 'x');
          let dTermTex = '';
          try { dTermTex = dTerm.toTex(); } catch { dTermTex = dTerm.toString(); }

          const termRule = this.identifyRule(term);

          steps.push({
            stepNumber: stepNum++,
            title: `Derivar término ${idx + 1}: ${termTex}`,
            ruleName: termRule.ruleName,
            latexFormula: `\\frac{d}{dx}\\left(${termTex}\\right) = ${dTermTex}`,
            explanation: termRule.explanation,
          });
        } catch {
          // ignore single term error
        }
      });
    } else {
      const rule = this.identifyRule(inputNode);
      steps.push({
        stepNumber: stepNum++,
        title: `Aplicar regla de derivación principal`,
        ruleName: rule.ruleName,
        latexFormula: `\\frac{d}{dx}\\left(${inputTex}\\right) = ${resultTex}`,
        explanation: rule.explanation,
      });
    }

    // Final Step: Simplification & Result
    steps.push({
      stepNumber: stepNum++,
      title: `Simplificar y agrupar el resultado final`,
      ruleName: 'Simplificación Algebraica',
      latexFormula: `${targetName} = ${resultTex}`,
      explanation: isSecondDeriv
        ? `Agrupamos los términos obtenidos al derivar la primera derivada, resultando en la segunda derivada ${targetName}.`
        : `Unimos las derivadas de cada término y simplificamos coeficientes y exponentes para obtener ${targetName}.`,
    });

    return steps;
  }

  private static extractTerms(node: MathNode): MathNode[] {
    const terms: MathNode[] = [];

    const traverse = (n: MathNode) => {
      if (n.type === 'OperatorNode') {
        const opNode = n as unknown as { isOperatorNode?: boolean; op: string; args: MathNode[] };
        if (opNode.op === '+' || opNode.op === '-') {
          opNode.args.forEach((arg) => traverse(arg));
          return;
        }
      }
      terms.push(n);
    };

    traverse(node);
    return terms.length > 0 ? terms : [node];
  }

  private static identifyRule(node: MathNode): { ruleName: string; explanation: string } {
    const str = node.toString();

    if (node.type === 'SymbolNode') {
      const sym = (node as unknown as { name: string }).name;
      if (sym === 'x') {
        return {
          ruleName: 'Regla de la Variable Identidad',
          explanation: 'La derivada de x respecto a x es igual a 1: \\frac{d}{dx}[x] = 1.',
        };
      }
      return {
        ruleName: 'Regla de la Constante',
        explanation: `Símbolo constante ${sym}: la derivada de cualquier constante es 0.`,
      };
    }

    if (node.type === 'ConstantNode') {
      return {
        ruleName: 'Regla de la Constante',
        explanation: `La derivada de un número constante ${str} es siempre cero: \\frac{d}{dx}[c] = 0.`,
      };
    }

    if (node.type === 'OperatorNode') {
      const opNode = node as unknown as { op: string; args: MathNode[] };

      if (opNode.op === '^') {
        return {
          ruleName: 'Regla de la Potencia',
          explanation: `Para x^n bajes el exponente multiplicando y le restas 1 al exponente: \\frac{d}{dx}[x^n] = n \\cdot x^{n-1}.`,
        };
      }

      if (opNode.op === '*') {
        return {
          ruleName: 'Múltiplo Constante / Regla del Producto',
          explanation: `Multiplicamos la constante por la derivada del término variable: \\frac{d}{dx}[c \\cdot u(x)] = c \\cdot u'(x).`,
        };
      }
    }

    if (node.type === 'FunctionNode') {
      const fnNode = node as unknown as { name: string };
      if (fnNode.name === 'sin') {
        return {
          ruleName: 'Regla Trigonométrica (Seno)',
          explanation: 'La derivada del seno es el coseno: \\frac{d}{dx}[\\sin(x)] = \\cos(x).',
        };
      }
      if (fnNode.name === 'cos') {
        return {
          ruleName: 'Regla Trigonométrica (Coseno)',
          explanation: 'La derivada del coseno es el seno negativo: \\frac{d}{dx}[\\cos(x)] = -\\sin(x).',
        };
      }
      if (fnNode.name === 'exp') {
        return {
          ruleName: 'Regla Exponencial',
          explanation: 'La derivada de e^x es e^x. Si tiene coeficiente en el exponente se aplica la regla de la cadena.',
        };
      }
      if (fnNode.name === 'log' || fnNode.name === 'ln') {
        return {
          ruleName: 'Regla del Logaritmo Natural',
          explanation: 'La derivada del logaritmo natural es \\frac{d}{dx}[\\ln(x)] = \\frac{1}{x}.',
        };
      }
    }

    return {
      ruleName: 'Regla General de Derivación',
      explanation: 'Se aplican las reglas estándar de derivación y álgebra para este término.',
    };
  }
}
