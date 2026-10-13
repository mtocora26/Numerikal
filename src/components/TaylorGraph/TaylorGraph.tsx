import React, { useCallback, useEffect, useRef } from 'react';
import { LineChart } from 'lucide-react';
import type { TaylorResult } from '../../domain/taylor/types';
import { evaluatePolynomial } from '../../domain/interpolation/polynomial';
import { ExpressionParser } from '../../services/ExpressionParser';
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

interface TaylorGraphProps {
  result: TaylorResult;
  className?: string;
}

export const TaylorGraph: React.FC<TaylorGraphProps> = ({ result, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prepared = prepareCanvas(canvas);
    if (!prepared) return;
    const { ctx, width, height } = prepared;

    const { a, xStar, coefficients } = result;
    // Ventana centrada en a que siempre incluye a x*
    const half = Math.max(2, Math.abs(xStar - a) * 1.3);
    const xMin = a - half;
    const xMax = a + half;

    const f = ExpressionParser.parse(result.expression).evaluate;
    const fCurve = sampleFunction(f, xMin, xMax);
    const pCurve = sampleFunction((x) => evaluatePolynomial(coefficients, x), xMin, xMax);

    // El rango vertical sale de f: lejos de a el polinomio crece y aplastaría la gráfica
    const marks = [{ x: a, y: f(a) }, ...(result.exactValue === null ? [] : [{ x: xStar, y: result.exactValue }]), { x: xStar, y: result.valueAtXStar }];
    const yRange = computeYRange([...fCurve, ...marks.filter((p) => Number.isFinite(p.y))]);
    const vp = createViewport(ctx, width, height, [xMin, xMax], yRange);

    const xTicks = xTickCount(vp.plotW);
    drawGrid(vp, xTicks);
    drawAxes(vp);
    drawTickLabels(vp, xTicks);

    drawCurve(vp, fCurve, GRAPH_COLORS.secondaryCurve, 2.5);
    drawCurve(vp, pCurve, GRAPH_COLORS.curve, 2.5);

    if (result.exactValue !== null) {
      drawSegment(vp, { x: xStar, y: result.exactValue }, { x: xStar, y: result.valueAtXStar }, {
        color: GRAPH_COLORS.construction,
        lineWidth: 1.4,
        dash: [3, 3],
      });
      drawPoint(vp, { x: xStar, y: result.exactValue }, { color: GRAPH_COLORS.secondaryCurve, radius: 5 });
    }
    drawPoint(vp, { x: a, y: f(a) }, { color: GRAPH_COLORS.iteration, radius: 5.5 });
    drawPoint(vp, { x: xStar, y: result.valueAtXStar }, { color: GRAPH_COLORS.root, radius: 6.5, glow: true });
  }, [result]);

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
          <h4 className="graph-title">f(x) y Polinomio de Taylor</h4>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="numerical-canvas"
          role="img"
          aria-label="Gráfica de la función y de su polinomio de Taylor alrededor de a"
        />
      </div>

      <div className="graph-legend-row">
        <div className="legend-item">
          <span className="legend-color-dot dot-secondary"></span>
          <span>f(x)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-function"></span>
          <span>Polinomio P(x) de grado {result.degree}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-iteration"></span>
          <span>Punto de expansión (a, f(a))</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-root"></span>
          <span>P(x*)</span>
        </div>
      </div>
    </div>
  );
};
