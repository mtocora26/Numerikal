import { describe, expect, it } from 'vitest';
import { LagrangeInterpolation } from './Lagrange';
import { evaluatePolynomial, polynomialFromRoots, polynomialLatex } from './polynomial';
import type { DataPoint } from '../regression/types';

const lagrange = new LagrangeInterpolation();

const points = (pairs: [number, number][]): DataPoint[] => pairs.map(([x, y]) => ({ x, y }));

// Ejemplo del documento de clase: P3(x) = x³ + 2x² − 6x + 7
const REFERENCE = points([[0, 7], [1, 4], [2, 11], [3, 34]]);

describe('LagrangeInterpolation: ejemplo de referencia', () => {
  const result = lagrange.execute({ points: REFERENCE, xStar: 1.5 });

  it('recupera el polinomio x³ + 2x² − 6x + 7', () => {
    expect(result.degree).toBe(3);
    expect(result.coefficients[0]).toBeCloseTo(7, 10);
    expect(result.coefficients[1]).toBeCloseTo(-6, 10);
    expect(result.coefficients[2]).toBeCloseTo(2, 10);
    expect(result.coefficients[3]).toBeCloseTo(1, 10);
    expect(result.expandedLatex).toBe('P_{3}(x) = x^{3} + 2x^{2} - 6x + 7');
  });

  it('calcula los polinomios base como en clase', () => {
    const [l0, l1, l2, l3] = result.basis;
    expect(l0.denominator).toBe(-6); // (0-1)(0-2)(0-3)
    expect(l1.denominator).toBe(2);
    expect(l2.denominator).toBe(-2);
    expect(l3.denominator).toBe(6);
    // L0(x) = −(1/6)(x³ − 6x² + 11x − 6)
    expect(l0.coefficients[0]).toBeCloseTo(1, 10);
    expect(l0.coefficients[1]).toBeCloseTo(-11 / 6, 10);
    expect(l0.coefficients[2]).toBeCloseTo(1, 10);
    expect(l0.coefficients[3]).toBeCloseTo(-1 / 6, 10);
  });

  it('muestra cada Lᵢ con los valores sustituidos', () => {
    expect(result.basis[0].numeratorLatex).toBe('(x - 1)(x - 2)(x - 3)');
    expect(result.basis[0].denominatorLatex).toBe('(0 - 1)(0 - 2)(0 - 3)');
    expect(result.basis[1].numeratorLatex).toBe('x(x - 2)(x - 3)');
    expect(result.sumLatex).toBe('P_{3}(x) = 7\\,L_{0}(x) + 4\\,L_{1}(x) + 11\\,L_{2}(x) + 34\\,L_{3}(x)');
  });

  it('P(xᵢ) = yᵢ en todos los nodos', () => {
    REFERENCE.forEach((p) => expect(evaluatePolynomial(result.coefficients, p.x)).toBeCloseTo(p.y, 10));
  });

  it('P(x*) coincide con el cálculo a mano: 1.5³ + 2·1.5² − 6·1.5 + 7 = 5.875', () => {
    expect(result.valueAtXStar).toBeCloseTo(5.875, 10);
    expect(evaluatePolynomial(result.coefficients, 1.5)).toBeCloseTo(5.875, 10);
  });

  it('la suma de los Lᵢ(x*) vale 1', () => {
    expect(result.basis.reduce((acc, term) => acc + term.valueAtXStar, 0)).toBeCloseTo(1, 12);
  });
});

describe('LagrangeInterpolation: otros casos', () => {
  it('recupera un polinomio conocido con nodos no equiespaciados y negativos', () => {
    const f = (x: number) => 2 * x ** 4 - x ** 2 + 3 * x - 5;
    const nodes = [-2, -0.5, 1, 2.5, 4];
    const result = lagrange.execute({ points: nodes.map((x) => ({ x, y: f(x) })), xStar: 3 });
    expect(result.coefficients[4]).toBeCloseTo(2, 8);
    expect(result.coefficients[3]).toBeCloseTo(0, 8);
    expect(result.coefficients[2]).toBeCloseTo(-1, 8);
    expect(result.coefficients[1]).toBeCloseTo(3, 8);
    expect(result.coefficients[0]).toBeCloseTo(-5, 8);
    expect(result.valueAtXStar).toBeCloseTo(f(3), 8);
  });

  it('con 2 puntos da la recta que los une', () => {
    const result = lagrange.execute({ points: points([[1, 3], [3, 7]]), xStar: 2 });
    expect(result.coefficients[0]).toBeCloseTo(1, 12);
    expect(result.coefficients[1]).toBeCloseTo(2, 12);
    expect(result.valueAtXStar).toBeCloseTo(5, 12);
  });

  it('el orden de los puntos no cambia el polinomio', () => {
    const reversed = [...REFERENCE].reverse();
    const result = lagrange.execute({ points: reversed, xStar: 1.5 });
    expect(result.coefficients[3]).toBeCloseTo(1, 10);
    expect(result.valueAtXStar).toBeCloseTo(5.875, 10);
  });

  it('usa el signo correcto en los factores con xⱼ negativo', () => {
    const result = lagrange.execute({ points: points([[-1, 2], [0, 1], [2, 5]]), xStar: 1 });
    expect(result.basis[1].numeratorLatex).toBe('(x + 1)(x - 2)');
    expect(result.basis[0].denominatorLatex).toBe('(-1 - 0)(-1 - 2)');
    expect(result.basis[2].denominatorLatex).toBe('(2 - (-1))(2 - 0)');
  });
});

describe('LagrangeInterpolation: validaciones', () => {
  it('rechaza menos de 2 puntos', () => {
    const v = lagrange.validate({ points: points([[1, 1]]), xStar: 1 });
    expect(v.isValid).toBe(false);
    expect(v.errors.join(' ')).toMatch(/al menos 2 puntos/);
    expect(() => lagrange.execute({ points: [], xStar: 1 })).toThrow();
  });

  it('rechaza valores de x repetidos', () => {
    const v = lagrange.validate({ points: points([[1, 1], [2, 3], [1, 5]]), xStar: 1.5 });
    expect(v.isValid).toBe(false);
    expect(v.errors.join(' ')).toMatch(/distintos/);
    expect(() => lagrange.execute({ points: points([[1, 1], [1, 2]]), xStar: 1 })).toThrow(/distintos/);
  });

  it('rechaza datos o x* que no son números', () => {
    expect(lagrange.validate({ points: points([[1, NaN], [2, 3]]), xStar: 1 }).isValid).toBe(false);
    expect(lagrange.validate({ points: REFERENCE, xStar: NaN }).isValid).toBe(false);
  });

  it('avisa de extrapolación pero sigue siendo válido', () => {
    const v = lagrange.validate({ points: REFERENCE, xStar: 10 });
    expect(v.isValid).toBe(true);
    expect(v.warnings.join(' ')).toMatch(/extrapolación/);
  });

  it('avisa del fenómeno de Runge con muchos puntos', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ x: i, y: i * i }));
    const v = lagrange.validate({ points: many, xStar: 4 });
    expect(v.isValid).toBe(true);
    expect(v.warnings.join(' ')).toMatch(/Runge/);
  });

  it('sin avisos con pocos puntos y x* dentro del rango', () => {
    expect(lagrange.validate({ points: REFERENCE, xStar: 1.5 }).warnings).toEqual([]);
  });
});

describe('polynomial: utilidades', () => {
  it('polynomialFromRoots expande Π(x − r)', () => {
    expect(polynomialFromRoots([1, 2, 3])).toEqual([-6, 11, -6, 1]);
  });

  it('polynomialLatex omite términos nulos, el coeficiente 1 y el ruido de redondeo', () => {
    expect(polynomialLatex([0, 0, 1])).toBe('x^{2}');
    expect(polynomialLatex([-5, 1e-14, -1])).toBe('-x^{2} - 5');
    expect(polynomialLatex([0, 0])).toBe('0');
  });
});
