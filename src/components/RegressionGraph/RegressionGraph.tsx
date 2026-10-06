import React, { useCallback, useEffect, useRef } from 'react';
import { LineChart } from 'lucide-react';
import type { DataPoint, RegressionResult } from '../../domain/regression/types';
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

interface RegressionGraphProps {
  /** Puntos ya leídos de la tabla (vista previa antes de calcular). */
  points: DataPoint[];
  result: RegressionResult | null;
  className?: string;
}

export const RegressionGraph: React.FC<RegressionGraphProps> = ({ points, result, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prepared = prepareCanvas(canvas);
    if (!prepared) return;
    const { ctx, width, height } = prepared;

    const xs = points.map((p) => p.x);
    const rawMin = xs.length > 0 ? Math.min(...xs) : -1;
    const rawMax = xs.length > 0 ? Math.max(...xs) : 1;
    const span = rawMax - rawMin || 2;
    const xMin = rawMin - span * 0.1;
    const xMax = rawMax + span * 0.1;

    const evaluate = (x: number) =>
      result ? result.coefficients.reduce((acc, a, k) => acc + a * x ** k, 0) : NaN;
    const curve = result ? sampleFunction(evaluate, xMin, xMax) : [];

    const yRange = computeYRange([...points, ...curve]);
    const vp = createViewport(ctx, width, height, [xMin, xMax], yRange);

    const xTicks = xTickCount(vp.plotW);
    drawGrid(vp, xTicks);
    drawAxes(vp);
    drawTickLabels(vp, xTicks);

    if (result) {
      drawCurve(vp, curve);
      points.forEach((p, i) => {
        drawSegment(vp, p, { x: p.x, y: result.fitted[i] }, { color: GRAPH_COLORS.construction, lineWidth: 1.2, dash: [3, 3] });
      });
    }
    points.forEach((p) => drawPoint(vp, p, { color: GRAPH_COLORS.iteration, radius: 5 }));
  }, [points, result]);

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
          <h4 className="graph-title">{result ? 'Datos y Curva Ajustada' : 'Vista previa de los datos'}</h4>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="numerical-canvas"
          role="img"
          aria-label="Gráfica de dispersión de los datos y la curva de regresión"
        />
      </div>

      <div className="graph-legend-row">
        <div className="legend-item">
          <span className="legend-color-dot dot-iteration"></span>
          <span>Datos (xᵢ, yᵢ)</span>
        </div>
        {result && (
          <>
            <div className="legend-item">
              <span className="legend-color-dot dot-function"></span>
              <span>Polinomio de grado {result.degree}</span>
            </div>
            <div className="legend-item">
              <span className="legend-color-dot dot-root"></span>
              <span>Residuos (distancia vertical a la curva)</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
