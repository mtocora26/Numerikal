import {
  derivative,
  isFunctionNode,
  isOperatorNode,
  isParenthesisNode,
  isSymbolNode,
  parse,
  simplify,
  type MathNode,
} from 'mathjs';
import { ExpressionParser } from '../../services/ExpressionParser';

export interface Antiderivative {
  /** F(x) en LaTeX */
  latex: string;
  /** F evaluada en x; NaN si no está definida */
  evaluate: (x: number) => number;
}

/** Coeficientes de un polinomio en x, de menor a mayor grado. */
type Poly = number[];

/** u = a·x + b: `u` es el texto de u(x) y `a` el de su pendiente (ambos entre paréntesis, listos para componer). */
interface Linear {
  u: string;
  a: string;
}

const SCOPE = { e: Math.E, pi: Math.PI };

const wrap = (text: string): string => `(${text})`;

const unwrap = (node: MathNode): MathNode => (isParenthesisNode(node) ? unwrap(node.content) : node);

const dependsOnX = (node: MathNode): boolean => node.filter((n) => isSymbolNode(n) && n.name === 'x').length > 0;

const constantValue = (node: MathNode): number | null => {
  try {
    const value = node.compile().evaluate(SCOPE);
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
};

/** Número como texto de mathjs: enteros tal cual y fracciones simples como (p/q), para que F quede exacta y legible. */
const formatCoefficient = (value: number): string => {
  if (Number.isInteger(value)) return value < 0 ? wrap(String(value)) : String(value);
  for (let q = 2; q <= 720; q++) {
    const p = Math.round(value * q);
    if (Math.abs(value - p / q) <= 1e-12 * Math.max(1, Math.abs(value))) return wrap(`${p}/${q}`);
  }
  return wrap(String(Number(value.toPrecision(15))));
};

/** u = a·x + b con a ≠ 0. La pendiente sale de derivar, así que se conserva simbólica (π, 2, 1/2…). */
const asLinear = (node: MathNode): Linear | null => {
  if (!dependsOnX(node)) return null;
  try {
    const slope = simplify(derivative(node, 'x'));
    if (dependsOnX(slope)) return null;
    const value = constantValue(slope);
    if (value === null || value === 0) return null;
    return { u: wrap(node.toString()), a: wrap(slope.toString()) };
  } catch {
    return null;
  }
};

// ---------- Polinomios ----------

const polyAdd = (p: Poly, q: Poly, sign = 1): Poly =>
  Array.from({ length: Math.max(p.length, q.length) }, (_, i) => (p[i] ?? 0) + sign * (q[i] ?? 0));

const polyMul = (p: Poly, q: Poly): Poly => {
  const out: Poly = new Array<number>(p.length + q.length - 1).fill(0);
  p.forEach((pi, i) => q.forEach((qj, j) => (out[i + j] += pi * qj)));
  return out;
};

const polyDerivative = (p: Poly): Poly => (p.length <= 1 ? [0] : p.slice(1).map((c, i) => c * (i + 1)));

/** El nodo como polinomio en x (sumas, productos, potencias enteras ≥ 0, división entre constantes); null si no lo es. */
const polyOf = (raw: MathNode): Poly | null => {
  const node = unwrap(raw);
  if (!dependsOnX(node)) {
    const value = constantValue(node);
    return value === null ? null : [value];
  }
  if (isSymbolNode(node)) return [0, 1];
  if (!isOperatorNode(node)) return null;

  const args = node.args.map(polyOf);
  const [p, q] = args;
  switch (node.fn) {
    case 'unaryMinus': return p ? p.map((c) => -c) : null;
    case 'unaryPlus': return p;
    case 'add': return p && q ? polyAdd(p, q) : null;
    case 'subtract': return p && q ? polyAdd(p, q, -1) : null;
    case 'multiply': return p && q ? polyMul(p, q) : null;
    case 'divide': {
      const divisor = !dependsOnX(node.args[1]) ? constantValue(node.args[1]) : null;
      return p && divisor !== null && divisor !== 0 ? p.map((c) => c / divisor) : null;
    }
    case 'pow': {
      const exponent = !dependsOnX(node.args[1]) ? constantValue(node.args[1]) : null;
      if (!p || exponent === null || !Number.isInteger(exponent) || exponent < 0) return null;
      return Array.from({ length: exponent }).reduce<Poly>((acc) => polyMul(acc, p), [1]);
    }
    default: return null;
  }
};

/** Texto de mathjs del polinomio (en x) con coeficientes exactos. */
const polyText = (p: Poly): string => wrap(p.map((c, k) => `${formatCoefficient(c)}*x^${k}`).join(' + '));

const polyAntiderivativeText = (p: Poly): string =>
  wrap(p.map((c, k) => `${formatCoefficient(c / (k + 1))}*x^${k + 1}`).join(' + '));

// ---------- Reglas básicas ----------

/** ∫ u^p dx con u lineal: u^(p+1)/((p+1)·a), o ln|u|/a si p = −1. */
const powerText = (lin: Linear, p: number): string =>
  Math.abs(p + 1) < 1e-12
    ? `log(abs(${lin.u}))/${lin.a}`
    : `${lin.u}^${formatCoefficient(p + 1)}/(${formatCoefficient(p + 1)}*${lin.a})`;

/** Primitivas de g(u) con u lineal. */
const FUNCTION_RULES = new Map<string, (lin: Linear) => string>(Object.entries({
  sin: ({ u, a }) => `-cos(${u})/${a}`,
  cos: ({ u, a }) => `sin(${u})/${a}`,
  exp: ({ u, a }) => `exp(${u})/${a}`,
  sinh: ({ u, a }) => `cosh(${u})/${a}`,
  cosh: ({ u, a }) => `sinh(${u})/${a}`,
  tan: ({ u, a }) => `-log(abs(cos(${u})))/${a}`,
  log: ({ u, a }) => `(${u}*log(${u}) - ${u})/${a}`,
  sqrt: (lin: Linear) => powerText(lin, 0.5),
}));

type Oscillating = { kind: 'exp' | 'sin' | 'cos'; lin: Linear };

/** exp(u), e^u, sin(u) o cos(u) con u lineal: los que se integran por partes al multiplicar un polinomio. */
const asOscillating = (raw: MathNode): Oscillating | null => {
  const node = unwrap(raw);
  if (isFunctionNode(node) && ['exp', 'sin', 'cos'].includes(node.fn.name)) {
    const lin = asLinear(node.args[0]);
    return lin ? { kind: node.fn.name as Oscillating['kind'], lin } : null;
  }
  if (isOperatorNode(node) && node.fn === 'pow') {
    const base = unwrap(node.args[0]);
    const lin = isSymbolNode(base) && base.name === 'e' ? asLinear(node.args[1]) : null;
    return lin ? { kind: 'exp', lin } : null;
  }
  return null;
};

/**
 * ∫ P(x)·g(u) dx por partes repetidas (método tabular), con g = exp, sen o cos y u = a·x + b:
 *   exp: e^u · Σ (−1)^k P⁽ᵏ⁾ / a^(k+1)
 *   sen: −cos u · Σ (−1)^j P⁽²ʲ⁾ / a^(2j+1)  +  sen u · Σ (−1)^j P⁽²ʲ⁺¹⁾ / a^(2j+2)
 *   cos:  sen u · Σ (−1)^j P⁽²ʲ⁾ / a^(2j+1)  +  cos u · Σ (−1)^j P⁽²ʲ⁺¹⁾ / a^(2j+2)
 */
const byPartsText = (poly: Poly, { kind, lin }: Oscillating): string => {
  const derivatives: Poly[] = [poly];
  while (derivatives.length < poly.length) {
    derivatives.push(polyDerivative(derivatives[derivatives.length - 1]));
  }
  const term = (k: number, sign: number): string => `${sign < 0 ? '-' : '+'}${polyText(derivatives[k])}/${lin.a}^${k + 1}`;

  if (kind === 'exp') {
    return `exp(${lin.u})*(0${derivatives.map((_, k) => term(k, k % 2 === 0 ? 1 : -1)).join('')})`;
  }
  const even = derivatives.map((_, k) => k).filter((k) => k % 2 === 0);
  const odd = derivatives.map((_, k) => k).filter((k) => k % 2 === 1);
  const alternating = (ks: number[]): string => `(0${ks.map((k) => term(k, Math.floor(k / 2) % 2 === 0 ? 1 : -1)).join('')})`;
  return kind === 'sin'
    ? `-cos(${lin.u})*${alternating(even)} + sin(${lin.u})*${alternating(odd)}`
    : `sin(${lin.u})*${alternating(even)} + cos(${lin.u})*${alternating(odd)}`;
};

/** x, (2x+1)^3, sqrt(x), 1/(3x−1)… como (u lineal, exponente p) para aplicar la regla de la potencia. */
const asPower = (raw: MathNode): { lin: Linear; p: number } | null => {
  const node = unwrap(raw);
  const direct = asLinear(node);
  if (direct) return { lin: direct, p: 1 };
  if (isFunctionNode(node) && node.fn.name === 'sqrt') {
    const lin = asLinear(node.args[0]);
    return lin ? { lin, p: 0.5 } : null;
  }
  if (isOperatorNode(node) && node.fn === 'pow' && !dependsOnX(node.args[1])) {
    const lin = asLinear(node.args[0]);
    const p = constantValue(node.args[1]);
    return lin && p !== null ? { lin, p } : null;
  }
  return null;
};

/** Factores de un producto (aplanando paréntesis y productos anidados). */
const factorsOf = (raw: MathNode): MathNode[] => {
  const node = unwrap(raw);
  return isOperatorNode(node) && node.fn === 'multiply' ? node.args.flatMap(factorsOf) : [node];
};

/**
 * p = c + a·x², sin término lineal y con a y c del mismo signo: la forma que tiene primitiva con atan o asinh.
 * Devuelve a y c positivos; si la cuadrática era negativa, `negated` avisa para voltear el numerador (1/(−Q) = −1/Q).
 */
const pureQuadraticOf = (raw: MathNode): { a: number; c: number; negated: boolean } | null => {
  const p = polyOf(raw);
  if (!p || p.length !== 3 || p[1] !== 0 || p[0] === 0 || p[2] === 0) return null;
  if (p[0] * p[2] <= 0) return null;
  return p[0] > 0 ? { a: p[2], c: p[0], negated: false } : { a: -p[2], c: -p[0], negated: true };
};

/**
 * Numerador constante sobre una cuadrática pura, las dos reglas de los ejercicios de clase:
 *   ∫ m/(a·x² + c) dx  = (m/√(a·c))·atan(x·√(a/c))          (ej. 1/(1+x²) = atan x)
 *   ∫ m/√(a·x² + c) dx = (m/√a)·asinh(x·√(a/c))             (ej. 1/√(x²+4) = asinh(x/2))
 */
const quadraticDenominatorText = (raw: MathNode, coefficient: number): string | null => {
  const node = unwrap(raw);
  const isSqrt = isFunctionNode(node) && node.fn.name === 'sqrt';
  const quadratic = isSqrt ? pureQuadraticOf(node.args[0]) : pureQuadraticOf(node);
  if (!quadratic) return null;
  // asinh solo queda real si la cuadrática interna es positiva; con negativa no hay regla
  if (isSqrt && quadratic.negated) return null;

  const coef = formatCoefficient(quadratic.negated ? -coefficient : coefficient);
  const ratio = formatCoefficient(quadratic.a / quadratic.c);
  const argument = `x*sqrt(${ratio})`;
  return isSqrt
    ? `${coef}*asinh(${argument})/sqrt(${formatCoefficient(quadratic.a)})`
    : `${coef}*atan(${argument})/sqrt(${formatCoefficient(quadratic.a * quadratic.c)})`;
};

/** Texto de mathjs de una primitiva de `raw`, o null si ninguna regla aplica. */
const integrate = (raw: MathNode): string | null => {
  const node = unwrap(raw);

  if (!dependsOnX(node)) return constantValue(node) === null ? null : `${wrap(node.toString())}*x`;
  if (isSymbolNode(node)) return powerText({ u: 'x', a: '1' }, 1);

  if (isFunctionNode(node)) {
    const rule = FUNCTION_RULES.get(node.fn.name);
    const lin = node.args.length === 1 ? asLinear(node.args[0]) : null;
    return rule && lin ? rule(lin) : null;
  }

  if (!isOperatorNode(node)) return null;
  const [first, second] = node.args;

  switch (node.fn) {
    case 'unaryMinus': {
      const inner = integrate(first);
      return inner && `-${wrap(inner)}`;
    }
    case 'unaryPlus':
      return integrate(first);

    case 'add':
    case 'subtract': {
      const left = integrate(first);
      const right = integrate(second);
      return left && right && `${wrap(left)} ${node.fn === 'add' ? '+' : '-'} ${wrap(right)}`;
    }

    case 'divide': {
      if (!dependsOnX(second)) {
        const numerator = integrate(first);
        return numerator && `${wrap(numerator)}/${wrap(second.toString())}`;
      }
      // Numerador constante sobre una cuadrática pura: atan (1/(1+x²)) o asinh (1/√(x²+4)), los ejercicios de clase
      if (!dependsOnX(first)) {
        const numerator = constantValue(first);
        if (numerator !== null && numerator !== 0) {
          const quadratic = quadraticDenominatorText(second, numerator);
          if (quadratic) return quadratic;
        }
      }
      const power = dependsOnX(first) ? null : asPower(second);
      return power && `${wrap(first.toString())}*${wrap(powerText(power.lin, -power.p))}`;
    }

    case 'pow': {
      if (!dependsOnX(second)) {
        const power = asPower(node);
        if (power) return powerText(power.lin, power.p);
        const poly = polyOf(node);
        return poly && polyAntiderivativeText(poly);
      }
      // Base constante y exponente lineal: b^u/(a·ln b); con base e, ln e = 1
      const lin = dependsOnX(first) ? null : asLinear(second);
      const base = unwrap(first);
      const baseValue = constantValue(base);
      if (!lin || baseValue === null || baseValue <= 0 || baseValue === 1) return null;
      return isSymbolNode(base) && base.name === 'e'
        ? `exp(${lin.u})/${lin.a}`
        : `${wrap(base.toString())}^${lin.u}/(${lin.a}*log(${wrap(base.toString())}))`;
    }

    case 'multiply': {
      const factors = factorsOf(node);
      const constants = factors.filter((f) => !dependsOnX(f));
      const variable = factors.filter(dependsOnX);
      const coefficient = constants.length === 0 ? '1' : wrap(constants.map((f) => wrap(f.toString())).join('*'));

      if (variable.length === 1) {
        const inner = integrate(variable[0]);
        return inner && `${coefficient}*${wrap(inner)}`;
      }

      // Varios factores con x: polinomios entre sí, o un polinomio por exp/sen/cos (por partes)
      const polynomials = variable.map((f) => ({ node: f, poly: polyOf(f) }));
      const others = polynomials.filter((f) => f.poly === null);
      const poly = polynomials.reduce<Poly>((acc, f) => (f.poly ? polyMul(acc, f.poly) : acc), [1]);

      if (others.length === 0) return `${coefficient}*${polyAntiderivativeText(poly)}`;
      const oscillating = others.length === 1 ? asOscillating(others[0].node) : null;
      return oscillating && `${coefficient}*(${byPartsText(poly, oscillating)})`;
    }

    default:
      return null;
  }
};

/**
 * Primitiva simbólica de f(x), si las reglas de Numerikal la encuentran: sumas y múltiplos de polinomios,
 * potencias de (ax + b), 1/(ax + b), 1/(a·x² + c) (atan), 1/√(a·x² + c) (asinh), √(ax + b), e^(ax+b), b^(ax+b),
 * sen, cos, tan, senh, cosh y ln de (ax + b), y polinomio × exp, sen o cos.
 * Devuelve null cuando no hay regla (aunque la integral tenga solución, como x/(x² + 1))
 * y también cuando no existe en forma elemental (como e^(−x²) o sen(x)/x).
 * Que F sea una primitiva en todo [a, b] (sin polos adentro) lo comprueba `exactIntegral`.
 */
export function findAntiderivative(expression: string): Antiderivative | null {
  try {
    const text = integrate(parse(ExpressionParser.normalizeForDifferentiation(expression)));
    if (text === null) return null;

    let node = parse(text);
    try {
      node = simplify(node);
    } catch {
      // Sin simplificar la primitiva sigue siendo correcta, solo menos compacta
    }
    const compiled = node.compile();

    let latex: string;
    try {
      latex = node.toTex({ parenthesis: 'keep', implicit: 'hide' });
    } catch {
      latex = node.toString();
    }

    return {
      latex,
      evaluate: (x: number): number => {
        try {
          const value = compiled.evaluate({ x, ...SCOPE });
          return typeof value === 'number' ? value : NaN;
        } catch {
          return NaN;
        }
      },
    };
  } catch {
    return null;
  }
}
