import type { MethodExecutionResult } from '../../domain/types';
import {
  GRAPH_COLORS,
  drawLabel,
  drawLineThrough,
  drawPoint,
  drawSegment,
  type GraphViewport,
} from '../FunctionGraph/graphEngine';

export interface DiagramLegendItem {
  label: string;
  color: string;
  dashed?: boolean;
}

export interface MethodDiagram {
  /** Ejemplo con el que se construye la gráfica (se resuelve con el propio método de la plataforma). */
  expression: string;
  exampleLatex: string;
  params: Record<string, number>;
  xRange: [number, number];
  yRange?: [number, number];
  /** Qué debe observar el estudiante en la gráfica. */
  caption: string;
  reference: string;
  legend: DiagramLegendItem[];
  /** Curvas adicionales (por ejemplo y = x en Punto Fijo). */
  extraCurves?: { f: (x: number) => number; color: string }[];
  /** Método adicional que se resuelve para comparar (Newton-Raphson Modificado vs. Newton-Raphson). */
  comparisonMethodId?: string;
  draw: (
    vp: GraphViewport,
    result: MethodExecutionResult,
    f: (x: number) => number,
    comparison?: MethodExecutionResult
  ) => void;
}

const SUBSCRIPTS = '₀₁₂₃₄₅₆₇₈₉';
const sub = (n: number) => String(n).split('').map((d) => SUBSCRIPTS[Number(d)]).join('');

const ROOT_LEGEND: DiagramLegendItem = { label: 'Raíz', color: GRAPH_COLORS.root };

/** Barra horizontal (en píxeles, bajo el eje) que representa un intervalo [a, b]. */
function drawIntervalBar(vp: GraphViewport, a: number, b: number, screenY: number, label: string) {
  const { ctx, toScreenX } = vp;
  const ax = toScreenX(a);
  const bx = toScreenX(b);

  ctx.strokeStyle = GRAPH_COLORS.construction;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(ax, screenY);
  ctx.lineTo(bx, screenY);
  ctx.moveTo(ax, screenY - 5);
  ctx.lineTo(ax, screenY + 5);
  ctx.moveTo(bx, screenY - 5);
  ctx.lineTo(bx, screenY + 5);
  ctx.stroke();

  ctx.fillStyle = GRAPH_COLORS.tickText;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(label, ax - 8, screenY + 4);
}

/** Marca un punto sobre el eje x y lo une con la curva mediante una línea punteada. */
function markAxisIterate(
  vp: GraphViewport,
  x: number,
  fx: number,
  label: string | null,
  options: { color?: string; below?: boolean; dx?: number } = {}
) {
  const color = options.color ?? GRAPH_COLORS.iteration;
  drawSegment(vp, { x, y: 0 }, { x, y: fx }, { color, lineWidth: 1.2, dash: [4, 4] });
  drawPoint(vp, { x, y: 0 }, { color, radius: 3.5 });
  if (label) {
    drawLabel(vp, label, { x, y: 0 }, {
      dx: options.dx ?? 0,
      dy: options.below ? 18 : -10,
      color,
      font: 'bold 11px Space Grotesk, sans-serif',
    });
  }
}

const burdenCubic = 'x^3 + 4*x^2 - 10';
const burdenCubicLatex = 'f(x) = x^3 + 4x^2 - 10';

export const METHOD_DIAGRAMS: Record<string, MethodDiagram> = {
  bisection: {
    expression: burdenCubic,
    exampleLatex: `${burdenCubicLatex},\\quad [x_i, x_s] = [1, 2]`,
    params: { xi: 1, xs: 2 },
    xRange: [0.85, 2.1],
    yRange: [-26, 17],
    caption:
      'En cada iteración se toma el punto medio xr del intervalo y se conserva la mitad donde f cambia de signo. Las barras inferiores muestran cómo el intervalo que contiene la raíz se reduce a la mitad en cada paso.',
    reference: 'Burden & Faires, Análisis numérico, §2.1 (Ejemplo 1) · Chapra & Canale, Métodos numéricos para ingenieros, cap. 5.',
    legend: [
      { label: 'f(x)', color: GRAPH_COLORS.curve },
      { label: 'Intervalos [xi, xs]', color: GRAPH_COLORS.construction },
      { label: 'Puntos medios xr', color: GRAPH_COLORS.iteration, dashed: true },
      ROOT_LEGEND,
    ],
    draw: (vp, result) => {
      result.iterations.slice(0, 4).forEach((it, idx) => {
        drawIntervalBar(vp, Number(it.xi), Number(it.xs), vp.toScreenY(-11 - idx * 3.6), `i=${it.iteration}`);
        markAxisIterate(vp, Number(it.xr), Number(it.fxr), idx < 2 ? `x${sub(idx + 1)}` : null, { below: true });
      });
    },
  },

  'false-position': {
    expression: burdenCubic,
    exampleLatex: `${burdenCubicLatex},\\quad [x_i, x_s] = [1, 2]`,
    params: { xi: 1, xs: 2 },
    xRange: [0.9, 2.1],
    caption:
      'Se traza la recta que une (xi, f(xi)) y (xs, f(xs)); su corte con el eje x es la nueva aproximación xr. Como la curva es convexa, el extremo xs queda fijo y las rectas giran alrededor de él.',
    reference: 'Chapra & Canale, Métodos numéricos para ingenieros, cap. 5 · Burden & Faires, Análisis numérico, §2.3.',
    legend: [
      { label: 'f(x)', color: GRAPH_COLORS.curve },
      { label: 'Rectas entre extremos', color: GRAPH_COLORS.construction, dashed: true },
      { label: 'Aproximaciones xr', color: GRAPH_COLORS.iteration },
      ROOT_LEGEND,
    ],
    draw: (vp, result) => {
      result.iterations.slice(0, 2).forEach((it, idx) => {
        const a = { x: Number(it.xi), y: Number(it.fxi) };
        const b = { x: Number(it.xs), y: Number(it.fxs) };
        drawSegment(vp, a, b, { dash: [6, 3], lineWidth: 1.6 });
        drawPoint(vp, a, { color: GRAPH_COLORS.construction, radius: 3 });
        drawPoint(vp, b, { color: GRAPH_COLORS.construction, radius: 3 });
        markAxisIterate(vp, Number(it.xr), Number(it.fxr), `x${sub(idx + 1)}`, { dx: idx === 1 ? -8 : 0 });
      });
    },
  },

  'newton-raphson': {
    expression: burdenCubic,
    exampleLatex: `${burdenCubicLatex},\\quad x_0 = 2.5`,
    params: { xi: 2.5 },
    xRange: [1.2, 2.6],
    caption:
      'Desde xi se traza la recta tangente a la curva; su corte con el eje x es xi+1. Luego se repite desde el nuevo punto. Cerca de la raíz las tangentes casi coinciden con la curva y la convergencia es cuadrática.',
    reference: 'Burden & Faires, Análisis numérico, §2.3 · Chapra & Canale, Métodos numéricos para ingenieros, cap. 6.',
    legend: [
      { label: 'f(x)', color: GRAPH_COLORS.curve },
      { label: 'Rectas tangentes', color: GRAPH_COLORS.construction, dashed: true },
      { label: 'Iteraciones xi', color: GRAPH_COLORS.iteration },
      ROOT_LEGEND,
    ],
    draw: (vp, result) => {
      const iters = result.iterations.slice(0, 3);
      iters.forEach((it, idx) => {
        const xi = Number(it.xi);
        const fxi = Number(it.fxi);
        const xNext = Number(it.xNext);
        if (idx === 0) {
          markAxisIterate(vp, xi, fxi, `x${sub(0)}`);
        }
        drawSegment(vp, { x: xi, y: fxi }, { x: xNext, y: 0 }, { dash: [6, 3], lineWidth: 1.6 });
        drawPoint(vp, { x: xi, y: fxi }, { color: GRAPH_COLORS.construction, radius: 3 });
        const fNext = idx + 1 < result.iterations.length ? Number(result.iterations[idx + 1].fxi) : 0;
        markAxisIterate(vp, xNext, fNext, idx < 2 ? `x${sub(idx + 1)}` : null);
      });
    },
  },

  secant: {
    expression: burdenCubic,
    exampleLatex: `${burdenCubicLatex},\\quad x_{-1} = 2,\\; x_0 = 1.75`,
    params: { xi: 2, xs: 1.75 },
    xRange: [1.15, 2.15],
    caption:
      'La recta que pasa por los dos últimos puntos (xi−1, f(xi−1)) y (xi, f(xi)) reemplaza a la tangente; su corte con el eje x es xi+1. A diferencia de la regla falsa, los dos puntos no necesitan encerrar la raíz.',
    reference: 'Burden & Faires, Análisis numérico, §2.3 · Chapra & Canale, Métodos numéricos para ingenieros, cap. 6.',
    legend: [
      { label: 'f(x)', color: GRAPH_COLORS.curve },
      { label: 'Rectas secantes', color: GRAPH_COLORS.construction, dashed: true },
      { label: 'Iteraciones xi', color: GRAPH_COLORS.iteration },
      ROOT_LEGEND,
    ],
    draw: (vp, result, f) => {
      const iters = result.iterations.slice(0, 2);
      iters.forEach((it, idx) => {
        const prev = { x: Number(it.xPrev), y: Number(it.fxPrev) };
        const curr = { x: Number(it.xCurr), y: Number(it.fxCurr) };
        const xNext = Number(it.xNext);
        drawLineThrough(vp, prev, curr, { dash: [6, 3], lineWidth: 1.4 });
        drawPoint(vp, prev, { color: GRAPH_COLORS.construction, radius: 3 });
        drawPoint(vp, curr, { color: GRAPH_COLORS.construction, radius: 3 });
        if (idx === 0) {
          markAxisIterate(vp, prev.x, prev.y, 'x₋₁');
          markAxisIterate(vp, curr.x, curr.y, `x${sub(0)}`);
        }
        markAxisIterate(vp, xNext, f(xNext), `x${sub(idx + 1)}`, { below: true, dx: idx === 1 ? -10 : 0 });
      });
    },
  },

  'fixed-point': {
    expression: 'exp(-x)',
    exampleLatex: 'g(x) = e^{-x}\\;\\;(f(x) = e^{-x} - x),\\quad x_0 = 0',
    params: { xi: 0 },
    xRange: [-0.08, 1.1],
    yRange: [-0.08, 1.1],
    caption:
      'La raíz es el punto donde la curva y = g(x) corta la recta y = x. El diagrama de telaraña sube de xi a g(xi) y se mueve horizontalmente hasta y = x para obtener xi+1. Como |g\'(x)| < 1 cerca de la raíz, la espiral se cierra y el método converge.',
    reference: 'Chapra & Canale, Métodos numéricos para ingenieros, cap. 6 · Burden & Faires, Análisis numérico, §2.2.',
    legend: [
      { label: 'y = g(x)', color: GRAPH_COLORS.curve },
      { label: 'y = x', color: GRAPH_COLORS.secondaryCurve },
      { label: 'Telaraña xi → g(xi)', color: GRAPH_COLORS.construction, dashed: true },
      ROOT_LEGEND,
    ],
    extraCurves: [{ f: (x: number) => x, color: GRAPH_COLORS.secondaryCurve }],
    draw: (vp, result) => {
      const iters = result.iterations.slice(0, 7);
      iters.forEach((it, idx) => {
        const xi = Number(it.xi);
        const gxi = Number(it.gxi);
        const from = idx === 0 ? { x: xi, y: 0 } : { x: xi, y: xi };
        drawSegment(vp, from, { x: xi, y: gxi }, { dash: [4, 3], lineWidth: 1.4 });
        drawSegment(vp, { x: xi, y: gxi }, { x: gxi, y: gxi }, { dash: [4, 3], lineWidth: 1.4 });
        if (idx < 4) {
          drawPoint(vp, { x: xi, y: 0 }, { color: GRAPH_COLORS.iteration, radius: 3 });
          drawLabel(vp, `x${sub(idx)}`, { x: xi, y: 0 }, { dy: 16, color: GRAPH_COLORS.iteration, font: 'bold 11px Space Grotesk, sans-serif' });
        }
      });
    },
  },

  'modified-newton-raphson': {
    expression: '(x - 3)*(x - 1)^2',
    exampleLatex: 'f(x) = (x-3)(x-1)^2,\\quad x_0 = 0',
    params: { xi: 0 },
    xRange: [-0.1, 1.7],
    caption:
      'En x = 1 hay una raíz doble: la curva toca el eje sin cruzarlo y f\'(1) = 0. Newton-Raphson clásico (gris) se acerca lentamente, con convergencia solo lineal, mientras que el método modificado (verde) usa f\'\' para recuperar la convergencia cuadrática y llega en pocas iteraciones.',
    reference: 'Chapra & Canale, Métodos numéricos para ingenieros, cap. 6 (raíces múltiples) · Burden & Faires, Análisis numérico, §2.4.',
    legend: [
      { label: 'f(x)', color: GRAPH_COLORS.curve },
      { label: 'Newton-Raphson modificado', color: GRAPH_COLORS.iteration },
      { label: 'Newton-Raphson clásico', color: GRAPH_COLORS.secondaryCurve },
      { label: 'Raíz doble x = 1', color: GRAPH_COLORS.root },
    ],
    comparisonMethodId: 'newton-raphson',
    draw: (vp, result, f, comparison) => {
      comparison?.iterations.slice(0, 5).forEach((it, idx) => {
        markAxisIterate(vp, Number(it.xNext), f(Number(it.xNext)), idx < 3 ? `x${sub(idx + 1)}` : null, {
          color: GRAPH_COLORS.secondaryCurve,
          below: true,
        });
      });

      const x0 = Number(result.iterations[0]?.xi ?? 0);
      markAxisIterate(vp, x0, f(x0), `x${sub(0)}`, { below: true });
      result.iterations.slice(0, 2).forEach((it, idx) => {
        const x = Number(it.xNext);
        markAxisIterate(vp, x, f(x), idx === 0 ? `x${sub(1)}` : null, { dx: 10 });
      });
    },
  },
};
