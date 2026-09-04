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
    const clean = ExpressionParser.normalizeForDifferentiation(exprStr);
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

    let resultTex = '';
    try { resultTex = resultNode.toTex(); } catch { resultTex = resultNode.toString(); }

    const addStep = (node: MathNode, ruleName: string, explanation: string, formula?: string) => {
      let nodeTex = '';
      let derivativeTex = '';
      try { nodeTex = node.toTex(); } catch { nodeTex = node.toString(); }
      try { derivativeTex = derivative(node, 'x').toTex(); } catch { derivativeTex = nodeTex; }
      steps.push({
        stepNumber: stepNum++,
        title: `Aplicar ${ruleName.toLowerCase()}`,
        ruleName,
        latexFormula: formula || `\\frac{d}{dx}\\left(${nodeTex}\\right) = ${derivativeTex}`,
        explanation,
      });
    };

    const explainNode = (node: MathNode) => {
      if (node.type === 'OperatorNode') {
        const opNode = node as unknown as { op: string; args: MathNode[] };
        if (opNode.op === '+' || opNode.op === '-') {
          addStep(node, 'Regla de la Suma y Resta', 'Se deriva cada término por separado y se conserva el signo: (u ± v)\' = u\' ± v\'.');
          opNode.args.forEach(explainNode);
          return;
        }
        if (opNode.op === '*') {
          const hasConstantFactor = opNode.args.some((arg) => this.isConstantNode(arg));
          addStep(
            node,
            hasConstantFactor ? 'Regla del Múltiplo Constante' : 'Regla del Producto',
            hasConstantFactor
              ? 'Sacamos la constante y derivamos únicamente la función variable: (c·u)\' = c·u\'.'
              : 'Para un producto de funciones se deriva la primera manteniendo la segunda y luego se suma la primera manteniendo la derivada de la segunda: (u·v)\' = u\'v + uv\'.'
          );
          opNode.args.forEach(explainNode);
          return;
        }
        if (opNode.op === '^') {
          if (this.isConstantNode(opNode.args[1])) {
            addStep(node, 'Regla de la Potencia', 'Bajamos el exponente como factor y restamos uno al exponente: (x^n)\' = n·x^(n-1).');
            return;
          }
          addStep(node, 'Regla de la Cadena', 'El exponente es una función de x. Se deriva la función exterior y se multiplica por la derivada del exponente: (e^u)\' = e^u·u\'.');
          explainNode(opNode.args[1]);
          return;
        }
      }

      if (node.type === 'FunctionNode') {
        const functionNode = node as unknown as { name: string; args: MathNode[] };
        const argument = functionNode.args[0];
        if (argument && argument.toString() !== 'x') {
          addStep(node, 'Regla de la Cadena', 'Se deriva la función exterior y se multiplica por la derivada de la función interior: (F(g(x)))\' = F\'(g(x))·g\'(x).');
          explainNode(argument);
        } else {
          addStep(node, this.identifyRule(node).ruleName, this.identifyRule(node).explanation);
        }
        return;
      }

      const rule = this.identifyRule(node);
      addStep(node, rule.ruleName, rule.explanation);
    };

    explainNode(inputNode);

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

  private static isConstantNode(node: MathNode | undefined): boolean {
    if (!node) return false;
    if (node.type === 'ConstantNode') return true;
    return node.type === 'SymbolNode' && (node as unknown as { name: string }).name !== 'x';
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
