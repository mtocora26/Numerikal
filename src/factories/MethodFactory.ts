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
  category: 'roots' | 'systems' | 'interpolation' | 'regression' | 'series' | 'calculus';
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

  /** Métodos iterativos para sistemas de ecuaciones lineales Ax = b. */
  public static getSystemMethods(): MethodMetadata[] {
    return [
      {
        id: 'jacobi',
        name: 'Método de Jacobi',
        category: 'systems',
        description: 'Despeja cada incógnita de su ecuación y calcula todas las incógnitas nuevas usando solo los valores de la iteración anterior.',
        latexFormula: 'x_i^{(k+1)} = \\frac{b_i - \\sum_{j \\neq i} a_{ij} x_j^{(k)}}{a_{ii}}',
        icon: 'grid',
        tag: 'Iterativo • Sistemas Ax = b',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Converge si A es estrictamente diagonal dominante',
      },
      {
        id: 'gauss-seidel',
        name: 'Método de Gauss-Seidel',
        category: 'systems',
        description: 'Igual que Jacobi, pero cada incógnita recién calculada se usa de inmediato en las ecuaciones siguientes de la misma iteración.',
        latexFormula: 'x_i^{(k+1)} = \\frac{b_i - \\sum_{j < i} a_{ij} x_j^{(k+1)} - \\sum_{j > i} a_{ij} x_j^{(k)}}{a_{ii}}',
        icon: 'grid',
        tag: 'Iterativo • Sistemas Ax = b',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Converge si A es estrictamente diagonal dominante (suele necesitar menos iteraciones que Jacobi)',
      },
    ];
  }

  /** Métodos de regresión y ajuste de curvas (no usan f(x), sino una tabla de datos). */
  public static getRegressionMethods(): MethodMetadata[] {
    return [
      {
        id: 'polynomial-regression',
        name: 'Regresión Polinomial',
        category: 'regression',
        description: 'Ajusta un polinomio de grado m a un conjunto de datos minimizando la suma de los cuadrados de los residuos.',
        latexFormula: 'y = a_0 + a_1 x + a_2 x^2 + \\cdots + a_m x^m',
        icon: 'trending-up',
        tag: 'Mínimos Cuadrados • Ajuste',
        difficulty: 'Intermedio',
        recommendedConvergence: 'R² cercano a 1 indica un buen ajuste',
      },
    ];
  }

  /** Métodos de interpolación: el polinomio pasa exactamente por los puntos (x, y). */
  public static getInterpolationMethods(): MethodMetadata[] {
    return [
      {
        id: 'lagrange',
        name: 'Interpolación de Lagrange',
        category: 'interpolation',
        description: 'Construye el polinomio que pasa por todos los puntos como una suma de polinomios base Lᵢ(x), cada uno multiplicado por su yᵢ.',
        latexFormula: 'P_n(x) = \\sum_{i=0}^{n} y_i \\prod_{j \\neq i} \\frac{x - x_j}{x_i - x_j}',
        icon: 'spline',
        tag: 'Interpolación • Polinomio exacto',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Requiere valores de x distintos; con muchos puntos puede oscilar (fenómeno de Runge)',
      },
      {
        id: 'newton-divided-differences',
        name: 'Diferencias Divididas de Newton',
        category: 'interpolation',
        description: 'Obtiene el mismo polinomio interpolante con una tabla triangular de diferencias divididas; su primera fila da los coeficientes de la forma de Newton.',
        latexFormula: 'P_n(x) = f[x_0] + f[x_0,x_1](x - x_0) + f[x_0,x_1,x_2](x - x_0)(x - x_1) + \\cdots',
        icon: 'spline',
        tag: 'Interpolación • Tabla triangular',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Requiere valores de x distintos; agregar un punto solo añade un término al polinomio',
      },
      {
        id: 'neville',
        name: 'Interpolación de Neville',
        category: 'interpolation',
        description: 'Evalúa el polinomio interpolante en x* llenando una tabla triangular con una recurrencia; no necesita construir el polinomio.',
        latexFormula: 'P_{i,j}(x) = \\frac{(x - x_i)\\,P_{i+1,j}(x) - (x - x_j)\\,P_{i,j-1}(x)}{x_j - x_i}',
        icon: 'spline',
        tag: 'Interpolación • Tabla de Neville',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Requiere valores de x distintos; ideal cuando solo interesa el valor en un x*',
      },
    ];
  }

  /** Aproximación de funciones con series (Taylor): trabaja con f(x) y sus derivadas. */
  public static getSeriesMethods(): MethodMetadata[] {
    return [
      {
        id: 'taylor',
        name: 'Polinomio de Taylor',
        category: 'series',
        description: 'Aproxima f(x) cerca de un punto a con el polinomio que iguala a f y a sus primeras n derivadas en a.',
        latexFormula: 'P_n(x) = \\sum_{k=0}^{n} \\frac{f^{(k)}(a)}{k!}(x - a)^k',
        icon: 'sigma',
        tag: 'Serie • Aproximación local',
        difficulty: 'Intermedio',
        recommendedConvergence: 'La aproximación es mejor cerca de a y al subir el grado n',
      },
    ];
  }
}
