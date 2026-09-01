import type { NumericalMethod } from '../domain/Method';
import { BisectionMethod } from '../domain/methods/Bisection';
import { FalsePositionMethod } from '../domain/methods/FalsePosition';
import { NewtonRaphsonMethod } from '../domain/methods/NewtonRaphson';
import { SecantMethod } from '../domain/methods/Secant';
import { FixedPointMethod } from '../domain/methods/FixedPoint';
import { ModifiedNewtonRaphsonMethod } from '../domain/methods/ModifiedNewtonRaphson';

export interface MethodMetadata {
  id: string;
  name: string;
  category: 'roots' | 'systems' | 'interpolation' | 'calculus';
  description: string;
  latexFormula: string;
  icon: string;
  tag: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  recommendedConvergence: string;
}

export class MethodFactory {
  private static methods: Map<string, NumericalMethod> = new Map();

  static {
    this.register(new BisectionMethod());
    this.register(new FalsePositionMethod());
    this.register(new NewtonRaphsonMethod());
    this.register(new SecantMethod());
    this.register(new FixedPointMethod());
    this.register(new ModifiedNewtonRaphsonMethod());
  }

  public static register(method: NumericalMethod): void {
    this.methods.set(method.id, method);
  }

  public static create(methodId: string): NumericalMethod {
    const method = this.methods.get(methodId);
    if (!method) {
      throw new Error(`Método numérico no encontrado o no soportado: '${methodId}'.`);
    }
    return method;
  }

  public static getAllMethods(): MethodMetadata[] {
    return [
      {
        id: 'bisection',
        name: 'Método de Bisección',
        category: 'roots',
        description: 'Divide el intervalo a la mitad repetidamente hasta aislar la raíz con garantía de convergencia.',
        latexFormula: 'x_r = \\frac{x_i+x_s}{2}',
        icon: 'divide',
        tag: 'Cerrado • Lineal',
        difficulty: 'Básico',
        recommendedConvergence: 'Infalible (f(xi)·f(xs) < 0)',
      },
      {
        id: 'false-position',
        name: 'Método de Regla Falsa',
        category: 'roots',
        description: 'Une f(xi) y f(xs) mediante una recta secante para calcular una aproximación lineal más rápida.',
        latexFormula: 'x_r = \\frac{x_i f(x_s) - x_s f(x_i)}{f(x_s) - f(x_i)}',
        icon: 'minimize',
        tag: 'Cerrado • Rápido',
        difficulty: 'Básico',
        recommendedConvergence: 'Alta velocidad en curvas suaves',
      },
      {
        id: 'newton-raphson',
        name: 'Método de Newton-Raphson',
        category: 'roots',
        description: 'Traza la recta tangente en el punto actual con convergencia cuadrática súper veloz.',
        latexFormula: 'x_{i+1} = x_i - \\frac{f(x_i)}{f\'(x_i)}',
        icon: 'zap',
        tag: 'Abierto • Cuadrático',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Muy rápida cerca de la raíz',
      },
      {
        id: 'secant',
        name: 'Método de la Secante',
        category: 'roots',
        description: 'Aproxima la derivada sin cálculos simbólicos uniendo los dos puntos previos.',
        latexFormula: 'x_{i+1} = x_i - \\frac{f(x_i)(x_i - x_{i-1})}{f(x_i) - f(x_{i-1})}',
        icon: 'trending-up',
        tag: 'Abierto • Superlineal',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Orden 1.618 (Sin derivada)',
      },
      {
        id: 'fixed-point',
        name: 'Método de Punto Fijo',
        category: 'roots',
        description: 'Itera x_{i+1} = g(x_i) buscando un valor donde x = g(x).',
        latexFormula: 'x_{i+1} = g(x_i)',
        icon: 'repeat',
        tag: 'Abierto • Punto Fijo',
        difficulty: 'Intermedio',
        recommendedConvergence: '|g\'(x)| < 1',
      },
      {
        id: 'modified-newton-raphson',
        name: 'Método de Newton-Raphson Modificado',
        category: 'roots',
        description: 'Utiliza f, f\' y f\'\' para acelerar la convergencia en raíces múltiples.',
        latexFormula: 'x_{i+1} = x_i - \\frac{f(x_i) f\'(x_i)}{[f\'(x_i)]^2 - f(x_i) f\'\'(x_i)}',
        icon: 'layers',
        tag: 'Abierto • Raíces Múltiples',
        difficulty: 'Avanzado',
        recommendedConvergence: 'Convergencia cuadrática en raíces múltiples',
      },
    ];
  }
}
