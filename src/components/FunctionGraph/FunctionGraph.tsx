import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { MethodExecutionResult } from '../../domain/types';
import { ExpressionParser } from '../../services/ExpressionParser';
import { LineChart, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  GRAPH_COLORS,
  computeYRange,
  createViewport,
  drawAxes,
  drawCurve,
  drawGrid,
  drawLabel,
  drawPoint,
  drawSegment,
  drawTickLabels,
  prepareCanvas,
  sampleFunction,
} from './graphEngine';
import './FunctionGraph.css';

interface FunctionGraphProps {
  result: MethodExecutionResult | null;
  expression: string;
  defaultDomain?: [number, number];
  className?: string;
}

export const FunctionGraph: React.FC<FunctionGraphProps> = ({
  result,
  expression,
  defaultDomain,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const resetView = () => {
    setZoomLevel(1);
    setOffset({ x: 0, y: 0 });
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const prepared = prepareCanvas(canvas);
    if (!prepared) return;
    const { ctx, width, height } = prepared;

    let xMin = -4;
    let xMax = 4;

    if (result && result.iterations.length > 0) {
      if (result.methodId === 'bisection' || result.methodId === 'false-position') {
        const a0 = Number(result.iterations[0].xi);
        const b0 = Number(result.iterations[0].xs);
        const span = Math.abs(b0 - a0) || 2;
        xMin = Math.min(a0, b0) - span * 0.4;
        xMax = Math.max(a0, b0) + span * 0.4;
      } else {
        const root = result.approximateRoot;
        xMin = root - 3;
        xMax = root + 3;
      }
    } else if (defaultDomain) {
      xMin = defaultDomain[0];
      xMax = defaultDomain[1];
    }

    const currentSpan = (xMax - xMin) / zoomLevel;
    const midX = (xMin + xMax) / 2 + offset.x;
    xMin = midX - currentSpan / 2;
    xMax = midX + currentSpan / 2;

    const parsed = ExpressionParser.parse(expression);
    const f = parsed.isValid ? parsed.evaluate : (x: number) => x;

    const points = sampleFunction(f, xMin, xMax);
    const vp = createViewport(ctx, width, height, [xMin, xMax], computeYRange(points));
    const { toScreenX, pad, plotH } = vp;

    drawGrid(vp);
    drawAxes(vp);
    drawTickLabels(vp);
    drawCurve(vp, points);

    if (result && result.iterations.length > 0) {
      const iters = result.iterations;

      if (result.methodId === 'bisection') {
        const first = iters[0];
        const aX = toScreenX(Number(first.xi));
        const bX = toScreenX(Number(first.xs));
        ctx.fillStyle = GRAPH_COLORS.interval;
        ctx.fillRect(aX, pad.top, bX - aX, plotH);

        const lastIters = iters.slice(-3);
        lastIters.forEach((it, idx) => {
          const xr = Number(it.xr);
          drawSegment(vp, { x: xr, y: 0 }, { x: xr, y: Number(it.fxr) }, {
            color: idx === lastIters.length - 1 ? GRAPH_COLORS.root : GRAPH_COLORS.iteration,
            dash: [4, 4],
          });
        });
      } else if (result.methodId === 'false-position') {
        const last = iters[iters.length - 1];
        drawSegment(
          vp,
          { x: Number(last.xi), y: Number(last.fxi) },
          { x: Number(last.xs), y: Number(last.fxs) },
          { lineWidth: 1.8, dash: [6, 3] }
        );
      }

      // Root Point with glow
      const rootPoint = { x: result.approximateRoot, y: 0 };
      drawPoint(vp, rootPoint, { glow: true });
      drawLabel(vp, `xr ≈ ${result.approximateRoot.toFixed(4)}`, rootPoint, { dy: -14 });
    }
  }, [result, expression, defaultDomain, zoomLevel, offset]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  return (
    <div className={`function-graph-card ${className}`}>
      <div className="graph-header-toolbar">
        <div className="graph-title-group">
          <LineChart size={16} className="graph-title-icon" />
          <h4 className="graph-title">Visualización Gráfica del Método</h4>
        </div>

        <div className="graph-controls">
          <button
            type="button"
            className="graph-btn"
            onClick={() => setZoomLevel((z) => Math.min(z * 1.3, 10))}
            title="Acercar"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            className="graph-btn"
            onClick={() => setZoomLevel((z) => Math.max(z / 1.3, 0.3))}
            title="Alejar"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            className="graph-btn"
            onClick={resetView}
            title="Restablecer vista"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} className="numerical-canvas" />
      </div>

      <div className="graph-legend-row">
        <div className="legend-item">
          <span className="legend-color-dot dot-function"></span>
          <span>Curva f(x)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-root"></span>
          <span>Raíz aproximada (x_r, 0)</span>
        </div>
        {result && (
          <div className="legend-item">
            <span className="legend-color-dot dot-iteration"></span>
            <span>Iteraciones / Secantes</span>
          </div>
        )}
      </div>
    </div>
  );
};
