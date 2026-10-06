/**
 * Motor de gráficas de Numerikal (canvas 2D).
 * Lo comparten la gráfica interactiva de la calculadora y las gráficas teóricas de cada método.
 */

export const GRAPH_COLORS = {
  curve: '#0d683a',
  secondaryCurve: '#7a8b99',
  construction: 'rgba(13, 104, 58, 0.75)',
  iteration: '#4db54a',
  root: '#f7ea0a',
  interval: 'rgba(160, 213, 127, 0.22)',
  grid: 'rgba(54, 146, 62, 0.12)',
  axis: 'rgba(51, 51, 51, 0.38)',
  tickText: 'rgba(51, 51, 51, 0.7)',
  label: '#0d683a',
};

export interface GraphPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface GraphViewport {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  pad: GraphPadding;
  plotW: number;
  plotH: number;
  toScreenX: (x: number) => number;
  toScreenY: (y: number) => number;
}

export interface CurvePoint {
  x: number;
  y: number;
}

/** Ajusta el canvas a su tamaño en pantalla (con devicePixelRatio) y lo pinta de blanco. */
export function prepareCanvas(
  canvas: HTMLCanvasElement,
  fallbackSize: { width: number; height: number } = { width: 700, height: 420 }
): { ctx: CanvasRenderingContext2D; width: number; height: number } | null {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const width = canvas.clientWidth || fallbackSize.width;
  const height = canvas.clientHeight || fallbackSize.height;
  const dpr = window.devicePixelRatio || 1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  ctx.scale(dpr, dpr);

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  return { ctx, width, height };
}

/** Muestrea f en [xMin, xMax] y devuelve solo los puntos finitos. */
export function sampleFunction(
  f: (x: number) => number,
  xMin: number,
  xMax: number,
  samples = 400
): CurvePoint[] {
  const points: CurvePoint[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = xMin + ((xMax - xMin) * i) / samples;
    const y = f(x);
    if (Number.isFinite(y)) points.push({ x, y });
  }
  return points;
}

/** Rango vertical de los puntos con un margen del 20 % (mínimo 1). */
export function computeYRange(points: CurvePoint[]): [number, number] {
  let yMin = Infinity;
  let yMax = -Infinity;
  points.forEach((p) => {
    if (p.y < yMin) yMin = p.y;
    if (p.y > yMax) yMax = p.y;
  });

  if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
    yMin = -5;
    yMax = 5;
  }

  const yPad = Math.max((yMax - yMin) * 0.2, 1);
  return [yMin - yPad, yMax + yPad];
}

export function createViewport(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  xRange: [number, number],
  yRange: [number, number],
  pad: GraphPadding = { left: 55, right: 25, top: 25, bottom: 45 }
): GraphViewport {
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  const plotW = width - pad.left - pad.right;
  const plotH = height - pad.top - pad.bottom;

  return {
    ctx,
    width,
    height,
    xMin,
    xMax,
    yMin,
    yMax,
    pad,
    plotW,
    plotH,
    toScreenX: (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * plotW,
    toScreenY: (y: number) => pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH,
  };
}

/** Divisiones del eje x que caben sin que se encimen las etiquetas: una cada ~64 px, entre 2 y 8. */
export function xTickCount(plotWidth: number): number {
  return Math.max(2, Math.min(8, Math.floor(plotWidth / 64)));
}

export function drawGrid(vp: GraphViewport, xTicks = 8, yTicks = 6): void {
  const { ctx, xMin, xMax, yMin, yMax, pad, width, height, toScreenX, toScreenY } = vp;
  ctx.strokeStyle = GRAPH_COLORS.grid;
  ctx.lineWidth = 1;

  for (let i = 0; i <= xTicks; i++) {
    const gx = toScreenX(xMin + ((xMax - xMin) * i) / xTicks);
    ctx.beginPath();
    ctx.moveTo(gx, pad.top);
    ctx.lineTo(gx, height - pad.bottom);
    ctx.stroke();
  }

  for (let i = 0; i <= yTicks; i++) {
    const gy = toScreenY(yMin + ((yMax - yMin) * i) / yTicks);
    ctx.beginPath();
    ctx.moveTo(pad.left, gy);
    ctx.lineTo(width - pad.right, gy);
    ctx.stroke();
  }
}

export function drawAxes(vp: GraphViewport): void {
  const { ctx, xMin, xMax, yMin, yMax, pad, width, height, toScreenX, toScreenY } = vp;
  ctx.strokeStyle = GRAPH_COLORS.axis;
  ctx.lineWidth = 1.5;

  if (yMin <= 0 && yMax >= 0) {
    const y0 = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(pad.left, y0);
    ctx.lineTo(width - pad.right, y0);
    ctx.stroke();
  }

  if (xMin <= 0 && xMax >= 0) {
    const x0 = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(x0, pad.top);
    ctx.lineTo(x0, height - pad.bottom);
    ctx.stroke();
  }
}

export function drawTickLabels(vp: GraphViewport, xTicks = 8, yTicks = 6, decimals = 2): void {
  const { ctx, xMin, xMax, yMin, yMax, pad, height, toScreenX, toScreenY } = vp;
  ctx.fillStyle = GRAPH_COLORS.tickText;
  ctx.font = '11px JetBrains Mono, monospace';
  ctx.textAlign = 'center';

  for (let i = 0; i <= xTicks; i++) {
    const val = xMin + ((xMax - xMin) * i) / xTicks;
    ctx.fillText(val.toFixed(decimals), toScreenX(val), height - pad.bottom + 16);
  }

  ctx.textAlign = 'right';
  for (let i = 0; i <= yTicks; i++) {
    const val = yMin + ((yMax - yMin) * i) / yTicks;
    ctx.fillText(val.toFixed(decimals), pad.left - 8, toScreenY(val) + 4);
  }
}

export function drawCurve(
  vp: GraphViewport,
  points: CurvePoint[],
  color: string = GRAPH_COLORS.curve,
  lineWidth = 2.5
): void {
  if (points.length < 2) return;
  const { ctx, toScreenX, toScreenY } = vp;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  let started = false;

  points.forEach((p) => {
    const sx = toScreenX(p.x);
    const sy = toScreenY(p.y);
    if (Number.isFinite(sx) && Number.isFinite(sy)) {
      if (!started) {
        ctx.moveTo(sx, sy);
        started = true;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
  });
  ctx.stroke();
}

/** Segmento entre dos puntos en coordenadas matemáticas. */
export function drawSegment(
  vp: GraphViewport,
  from: CurvePoint,
  to: CurvePoint,
  options: { color?: string; lineWidth?: number; dash?: number[] } = {}
): void {
  const { ctx, toScreenX, toScreenY } = vp;
  ctx.strokeStyle = options.color ?? GRAPH_COLORS.construction;
  ctx.lineWidth = options.lineWidth ?? 1.5;
  ctx.setLineDash(options.dash ?? []);
  ctx.beginPath();
  ctx.moveTo(toScreenX(from.x), toScreenY(from.y));
  ctx.lineTo(toScreenX(to.x), toScreenY(to.y));
  ctx.stroke();
  ctx.setLineDash([]);
}

/** Recta que pasa por dos puntos, prolongada a todo el ancho visible. */
export function drawLineThrough(
  vp: GraphViewport,
  p1: CurvePoint,
  p2: CurvePoint,
  options: { color?: string; lineWidth?: number; dash?: number[] } = {}
): void {
  if (p1.x === p2.x) return;
  const slope = (p2.y - p1.y) / (p2.x - p1.x);
  const yAt = (x: number) => p1.y + slope * (x - p1.x);
  drawSegment(vp, { x: vp.xMin, y: yAt(vp.xMin) }, { x: vp.xMax, y: yAt(vp.xMax) }, options);
}

export function drawPoint(
  vp: GraphViewport,
  point: CurvePoint,
  options: { color?: string; radius?: number; glow?: boolean } = {}
): void {
  const { ctx, toScreenX, toScreenY } = vp;
  const sx = toScreenX(point.x);
  const sy = toScreenY(point.y);
  const radius = options.radius ?? 4.5;

  if (options.glow) {
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(247, 234, 10, 0.4)';
    ctx.fill();
  }

  ctx.beginPath();
  ctx.arc(sx, sy, radius, 0, Math.PI * 2);
  ctx.fillStyle = options.color ?? GRAPH_COLORS.root;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawLabel(
  vp: GraphViewport,
  text: string,
  point: CurvePoint,
  options: { color?: string; align?: CanvasTextAlign; dx?: number; dy?: number; font?: string } = {}
): void {
  const { ctx, toScreenX, toScreenY } = vp;
  ctx.fillStyle = options.color ?? GRAPH_COLORS.label;
  ctx.font = options.font ?? 'bold 12px Space Grotesk, sans-serif';
  ctx.textAlign = options.align ?? 'center';
  ctx.fillText(text, toScreenX(point.x) + (options.dx ?? 0), toScreenY(point.y) + (options.dy ?? 0));
}
