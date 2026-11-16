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
  category: 'roots' | 'systems' | 'interpolation' | 'regression' | 'series' | 'integration' | 'calculus';
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

  /** Integración numérica (fórmulas de Newton-Cotes compuestas): trabaja con f(x) y los límites a, b. */
  public static getIntegrationMethods(): MethodMetadata[] {
    return [
      {
        id: 'trapezoid',
        name: 'Regla del Trapecio',
        category: 'integration',
        description: 'Une los puntos de la curva con segmentos rectos: cada subintervalo se convierte en un trapecio y el área total es la suma de todos.',
        latexFormula: 'I \\approx \\frac{h}{2}\\left[f(x_0) + 2\\sum_{i=1}^{n-1} f(x_i) + f(x_n)\\right]',
        icon: 'area-chart',
        tag: 'Integración • Newton-Cotes',
        difficulty: 'Básico',
        recommendedConvergence: 'Error de orden h²: al duplicar n el error baja unas 4 veces; es exacta para rectas',
      },
      {
        id: 'simpson-1-3',
        name: 'Regla de Simpson 1/3',
        category: 'integration',
        description: 'Reemplaza f por una parábola en cada par de subintervalos, por lo que sigue mejor las curvas que el trapecio con los mismos nodos.',
        latexFormula: 'I \\approx \\frac{h}{3}\\left[f(x_0) + 4\\sum_{i=1,3,5}^{n-1} f(x_i) + 2\\sum_{i=2,4,6}^{n-2} f(x_i) + f(x_n)\\right]',
        icon: 'area-chart',
        tag: 'Integración • Newton-Cotes',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Error de orden h⁴: al duplicar n el error baja unas 16 veces; exacta hasta polinomios de grado 3; n debe ser par',
      },
      {
        id: 'simpson-3-8',
        name: 'Regla de Simpson 3/8',
        category: 'integration',
        description: 'Reemplaza f por una cúbica en cada grupo de tres subintervalos; sirve cuando n es múltiplo de 3, por ejemplo con n impar combinada con Simpson 1/3.',
        latexFormula: 'I \\approx \\frac{3h}{8}\\left[f(x_0) + 3\\sum_{i \\not\\equiv 0\\ (\\mathrm{mod}\\ 3)} f(x_i) + 2\\sum_{i=3,6,9}^{n-3} f(x_i) + f(x_n)\\right]',
        icon: 'area-chart',
        tag: 'Integración • Newton-Cotes',
        difficulty: 'Intermedio',
        recommendedConvergence: 'Error de orden h⁴ (igual que Simpson 1/3); exacta hasta polinomios de grado 3; n debe ser múltiplo de 3',
      },
      {
        id: 'romberg',
        name: 'Integración de Romberg',
        category: 'integration',
        description: 'Refina el trapecio duplicando los subintervalos en cada fila y combina pares de aproximaciones con extrapolación de Richardson, llenando una tabla triangular cuya diagonal converge mucho más rápido que ninguna regla directa.',
        latexFormula: 'R_{i,j} = \\frac{4^{j}\\,R_{i,j-1} - R_{i-1,j-1}}{4^{j} - 1}',
        icon: 'area-chart',
        tag: 'Integración • Extrapolación de Richardson',
        difficulty: 'Avanzado',
        recommendedConvergence: 'La celda R(i,j) es exacta hasta polinomios de grado 2j+1: la diagonal gana dos órdenes de h por fila; la primera columna es el trapecio con 2^i subintervalos',
      },
    ];
  }
}
