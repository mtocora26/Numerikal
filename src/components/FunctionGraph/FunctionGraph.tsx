import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { MethodExecutionResult } from '../../domain/types';
import { ExpressionParser } from '../../services/ExpressionParser';
import { LineChart, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.clientWidth || 700;
    const height = canvas.clientHeight || 420;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, width, height);

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

    const samples = 400;
    const points: { x: number; y: number }[] = [];
    let yMin = Infinity;
    let yMax = -Infinity;

    for (let i = 0; i <= samples; i++) {
      const x = xMin + ((xMax - xMin) * i) / samples;
      const y = f(x);
      if (Number.isFinite(y)) {
        points.push({ x, y });
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }

    if (!Number.isFinite(yMin) || !Number.isFinite(yMax) || yMin === yMax) {
      yMin = -5;
      yMax = 5;
    }

    const yPad = Math.max((yMax - yMin) * 0.2, 1);
    yMin -= yPad;
    yMax += yPad;

    const pad = { left: 55, right: 25, top: 25, bottom: 45 };
    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;

    const toScreenX = (x: number) => pad.left + ((x - xMin) / (xMax - xMin)) * plotW;
    const toScreenY = (y: number) => pad.top + (1 - (y - yMin) / (yMax - yMin)) * plotH;

    // Grid lines
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
    ctx.lineWidth = 1;
    const xTicks = 8;
    const yTicks = 6;

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

    // Axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
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

    // Axis Tick Labels
    ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.font = '11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';

    for (let i = 0; i <= xTicks; i++) {
      const val = xMin + ((xMax - xMin) * i) / xTicks;
      const sx = toScreenX(val);
      ctx.fillText(val.toFixed(2), sx, height - pad.bottom + 16);
    }

    ctx.textAlign = 'right';
    for (let i = 0; i <= yTicks; i++) {
      const val = yMin + ((yMax - yMin) * i) / yTicks;
      const sy = toScreenY(val);
      ctx.fillText(val.toFixed(2), pad.left - 8, sy + 4);
    }

    // Curve f(x)
    if (points.length > 1) {
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
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

    if (result && result.iterations.length > 0) {
      const iters = result.iterations;

      if (result.methodId === 'bisection') {
        const first = iters[0];
        const aX = toScreenX(Number(first.xi));
        const bX = toScreenX(Number(first.xs));
        ctx.fillStyle = 'rgba(99, 102, 241, 0.08)';
        ctx.fillRect(aX, pad.top, bX - aX, plotH);

        iters.slice(-3).forEach((it, idx) => {
          const xr = Number(it.xr);
          const fxr = Number(it.fxr);
          const sx = toScreenX(xr);
          const sy = toScreenY(fxr);
          const y0 = toScreenY(0);

          ctx.strokeStyle = idx === iters.slice(-3).length - 1 ? '#34d399' : '#fbbf24';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(sx, y0);
          ctx.lineTo(sx, sy);
          ctx.stroke();
          ctx.setLineDash([]);
        });
      } else if (result.methodId === 'false-position') {
        const last = iters[iters.length - 1];
        const aX = toScreenX(Number(last.xi));
        const aY = toScreenY(Number(last.fxi));
        const bX = toScreenX(Number(last.xs));
        const bY = toScreenY(Number(last.fxs));

        ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([6, 3]);
        ctx.beginPath();
        ctx.moveTo(aX, aY);
        ctx.lineTo(bX, bY);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Root Point with glow
      const rootX = toScreenX(result.approximateRoot);
      const rootY = toScreenY(0);

      ctx.beginPath();
      ctx.arc(rootX, rootY, 9, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(rootX, rootY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 12px Space Grotesk, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`xr ≈ ${result.approximateRoot.toFixed(4)}`, rootX, rootY - 14);
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
