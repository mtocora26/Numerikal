import React, { useCallback, useEffect, useRef } from 'react';
import { LineChart } from 'lucide-react';
import type { DataPoint } from '../../domain/regression/types';
import { evaluatePolynomial } from '../../domain/interpolation/polynomial';
import {
  GRAPH_COLORS,
  computeYRange,
  createViewport,
  drawAxes,
  drawCurve,
  drawGrid,
  drawPoint,
  drawSegment,
  drawTickLabels,
  prepareCanvas,
  sampleFunction,
  xTickCount,
} from '../FunctionGraph/graphEngine';
import '../FunctionGraph/FunctionGraph.css';

interface InterpolationGraphProps {
  /** Puntos ya leídos de la tabla (vista previa antes de calcular). */
  points: DataPoint[];
  /** Coeficientes a0 … an del polinomio interpolante; null antes de calcular. */
  coefficients: number[] | null;
  /** Punto interpolado (x*, P(x*)); null si todavía no hay resultado. */
  interpolated: DataPoint | null;
  className?: string;
}

export const InterpolationGraph: React.FC<InterpolationGraphProps> = ({
  points,
  coefficients,
  interpolated,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prepared = prepareCanvas(canvas);
    if (!prepared) return;
    const { ctx, width, height } = prepared;

    // El rango incluye x* para que se vea también cuando es extrapolación
    const xs = [...points.map((p) => p.x), ...(interpolated ? [interpolated.x] : [])];
    const rawMin = xs.length > 0 ? Math.min(...xs) : -1;
    const rawMax = xs.length > 0 ? Math.max(...xs) : 1;
    const span = rawMax - rawMin || 2;
    const xMin = rawMin - span * 0.1;
    const xMax = rawMax + span * 0.1;

    const curve = coefficients ? sampleFunction((x) => evaluatePolynomial(coefficients, x), xMin, xMax) : [];

    const yRange = computeYRange([...points, ...curve, ...(interpolated ? [interpolated] : [])]);
    const vp = createViewport(ctx, width, height, [xMin, xMax], yRange);

    const xTicks = xTickCount(vp.plotW);
    drawGrid(vp, xTicks);
    drawAxes(vp);
    drawTickLabels(vp, xTicks);

    if (coefficients) drawCurve(vp, curve);
    if (interpolated) {
      drawSegment(vp, { x: interpolated.x, y: 0 }, interpolated, {
        color: GRAPH_COLORS.construction,
        lineWidth: 1.2,
        dash: [3, 3],
      });
    }
    points.forEach((p) => drawPoint(vp, p, { color: GRAPH_COLORS.iteration, radius: 5 }));
    if (interpolated) drawPoint(vp, interpolated, { color: GRAPH_COLORS.root, radius: 6.5, glow: true });
  }, [points, coefficients, interpolated]);

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
          <h4 className="graph-title">{coefficients ? 'Datos y Polinomio Interpolante' : 'Vista previa de los datos'}</h4>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="numerical-canvas"
          role="img"
          aria-label="Gráfica de los puntos, el polinomio interpolante y el valor interpolado"
        />
      </div>

      <div className="graph-legend-row">
        <div className="legend-item">
          <span className="legend-color-dot dot-iteration"></span>
          <span>Datos (xᵢ, yᵢ)</span>
        </div>
        {coefficients && (
          <div className="legend-item">
            <span className="legend-color-dot dot-function"></span>
            <span>Polinomio de grado {coefficients.length - 1}</span>
          </div>
        )}
        {interpolated && (
          <div className="legend-item">
            <span className="legend-color-dot dot-root"></span>
            <span>Punto interpolado (x*, P(x*))</span>
          </div>
        )}
      </div>
    </div>
  );
};
