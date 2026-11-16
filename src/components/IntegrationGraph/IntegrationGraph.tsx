import React, { useCallback, useEffect, useRef } from 'react';
import { LineChart } from 'lucide-react';
import type { IntegrationResult } from '../../domain/integration/types';
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
  fillPolygon,
  prepareCanvas,
  sampleFunction,
  xTickCount,
  type CurvePoint,
} from '../FunctionGraph/graphEngine';
import '../FunctionGraph/FunctionGraph.css';

interface IntegrationGraphProps {
  result: IntegrationResult;
  className?: string;
}

/** Con más subintervalos que esto, los bordes y los nodos solo ensucian la gráfica. */
const MAX_OUTLINED_SUBINTERVALS = 40;
const POLYNOMIAL_SAMPLES = 24;

/** Simpson dibuja un polinomio por cada grupo de subintervalos: parábola (2, tres nodos) o cúbica (3, cuatro nodos). */
const POLYNOMIAL_GROUPS: Record<string, { size: number; singular: string; plural: string; label: string }> = {
  'simpson-1-3': { size: 2, singular: 'parábola', plural: 'parábolas', label: 'parábolas (Simpson 1/3)' },
  'simpson-3-8': { size: 3, singular: 'cúbica', plural: 'cúbicas', label: 'cúbicas (Simpson 3/8)' },
};

/** Polinomio que pasa por los puntos dados (forma de Lagrange), evaluable en x. */
const polynomialThrough = (points: CurvePoint[]) => (x: number) =>
  points.reduce(
    (sum, pi, i) =>
      sum +
      points.reduce((term, pj, j) => (i === j ? term : (term * (x - pj.x)) / (pi.x - pj.x)), pi.y),
    0
  );

export const IntegrationGraph: React.FC<IntegrationGraphProps> = ({ result, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const group = POLYNOMIAL_GROUPS[result.methodId];
  // Para las reglas de Newton-Cotes es n; en Romberg la gráfica dibuja la partición más fina de la tabla
  const panels = result.nodes.length - 1;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const prepared = prepareCanvas(canvas);
    if (!prepared) return;
    const { ctx, width, height } = prepared;

    const { a, b, nodes } = result;
    const margin = (b - a) * 0.06;
    const xMin = a - margin;
    const xMax = b + margin;

    const f = ExpressionParser.parse(result.expression).evaluate;
    const curve = sampleFunction(f, xMin, xMax);
    const nodePoints: CurvePoint[] = nodes.map((node) => ({ x: node.x, y: node.fx }));

    // El eje x entra en el rango para que se vea el área entre la curva y el eje
    const yRange = computeYRange([...curve, ...nodePoints, { x: a, y: 0 }]);
    const vp = createViewport(ctx, width, height, [xMin, xMax], yRange);

    const xTicks = xTickCount(vp.plotW);
    drawGrid(vp, xTicks);
    drawAxes(vp);
    drawTickLabels(vp, xTicks);

    const outlined = panels <= MAX_OUTLINED_SUBINTERVALS;
    const fill = GRAPH_COLORS.interval;

    if (group) {
      // Un polinomio por cada grupo de subintervalos: nodos i … i + size
      for (let i = 0; i + group.size <= panels; i += group.size) {
        const through = nodePoints.slice(i, i + group.size + 1);
        const first = through[0];
        const last = through[through.length - 1];
        const polynomial = polynomialThrough(through);
        const arc: CurvePoint[] = Array.from({ length: POLYNOMIAL_SAMPLES + 1 }, (_, k) => {
          const x = first.x + ((last.x - first.x) * k) / POLYNOMIAL_SAMPLES;
          return { x, y: polynomial(x) };
        });
        fillPolygon(vp, [{ x: first.x, y: 0 }, ...arc, { x: last.x, y: 0 }], { fill });
        drawCurve(vp, arc, GRAPH_COLORS.construction, 1.6);
        if (outlined) {
          drawSegment(vp, { x: first.x, y: 0 }, first, { color: GRAPH_COLORS.construction, lineWidth: 1, dash: [3, 3] });
          drawSegment(vp, { x: last.x, y: 0 }, last, { color: GRAPH_COLORS.construction, lineWidth: 1, dash: [3, 3] });
        }
      }
    } else {
      for (let i = 0; i < panels; i++) {
        const [p0, p1] = [nodePoints[i], nodePoints[i + 1]];
        fillPolygon(vp, [{ x: p0.x, y: 0 }, p0, p1, { x: p1.x, y: 0 }], {
          fill,
          stroke: outlined ? GRAPH_COLORS.construction : undefined,
          lineWidth: 1,
        });
      }
    }

    drawCurve(vp, curve, GRAPH_COLORS.curve, 2.5);
    if (outlined) {
      nodePoints.forEach((p) => drawPoint(vp, p, { color: GRAPH_COLORS.iteration, radius: 3.5 }));
    }
  }, [result, group, panels]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  const pieces = group ? panels / group.size : panels;
  const legendArea = group
    ? `Área bajo ${pieces} ${pieces === 1 ? group.singular : group.plural}`
    : `Área de ${pieces} trapecio${pieces === 1 ? '' : 's'}`;

  return (
    <div className={`function-graph-card ${className}`}>
      <div className="graph-header-toolbar">
        <div className="graph-title-group">
          <LineChart size={16} className="graph-title-icon" />
          <h4 className="graph-title">f(x) y área aproximada</h4>
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="numerical-canvas"
          role="img"
          aria-label={`Gráfica de la función con el área aproximada por ${group ? group.label : 'trapecios'} entre a y b`}
        />
      </div>

      <div className="graph-legend-row">
        <div className="legend-item">
          <span className="legend-color-dot dot-function"></span>
          <span>f(x)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-area"></span>
          <span>{legendArea}</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-iteration"></span>
          <span>Nodos xᵢ</span>
        </div>
      </div>
    </div>
  );
};
