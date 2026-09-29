import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { MethodFactory } from '../../factories/MethodFactory';
import { ExpressionParser } from '../../services/ExpressionParser';
import type { MethodExecutionResult } from '../../domain/types';
import { MathView } from '../MathView/MathView';
import {
  computeYRange,
  createViewport,
  drawAxes,
  drawCurve,
  drawGrid,
  drawPoint,
  drawTickLabels,
  prepareCanvas,
  sampleFunction,
} from '../FunctionGraph/graphEngine';
import { METHOD_DIAGRAMS } from './methodDiagrams';
import './MethodTheoryGraph.css';

interface MethodTheoryGraphProps {
  methodId: string;
  className?: string;
}

function solveExample(methodId: string, expression: string, params: Record<string, number>): MethodExecutionResult | null {
  const parsed = ExpressionParser.parse(expression);
  if (!parsed.isValid) return null;
  try {
    return MethodFactory.create(methodId).execute(parsed.evaluate, {
      expression,
      tolerance: 1e-6,
      maxIterations: 60,
      errorType: 'relative',
      params,
    });
  } catch {
    return null;
  }
}

/**
 * Gráfica teórica (estática) de un método: resuelve un ejemplo de referencia con el propio
 * método de la plataforma y dibuja su construcción geométrica con el motor de gráficas.
 */
export const MethodTheoryGraph: React.FC<MethodTheoryGraphProps> = ({ methodId, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const diagram = METHOD_DIAGRAMS[methodId];

  const solved = useMemo(() => {
    if (!diagram) return null;
    const result = solveExample(methodId, diagram.expression, diagram.params);
    const comparison = diagram.comparisonMethodId
      ? solveExample(diagram.comparisonMethodId, diagram.expression, diagram.params)
      : null;
    return result ? { result, comparison } : null;
  }, [methodId, diagram]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !diagram || !solved) return;

    const prepared = prepareCanvas(canvas, { width: 520, height: 280 });
    if (!prepared) return;
    const { ctx, width, height } = prepared;

    const f = ExpressionParser.parse(diagram.expression).evaluate;
    const [xMin, xMax] = diagram.xRange;
    const points = sampleFunction(f, xMin, xMax);
    const yRange = diagram.yRange ?? computeYRange(points);
    const compact = width < 420;
    const vp = createViewport(ctx, width, height, [xMin, xMax], yRange, {
      left: compact ? 50 : 54,
      right: 16,
      top: 16,
      bottom: 36,
    });
    const ticks = compact ? 4 : 6;

    drawGrid(vp, ticks, 5);
    drawAxes(vp);
    drawTickLabels(vp, ticks, 5, xMax - xMin <= 2 ? 2 : 1);
    diagram.extraCurves?.forEach((curve) => {
      drawCurve(vp, sampleFunction(curve.f, xMin, xMax), curve.color, 1.6);
    });
    drawCurve(vp, points);

    diagram.draw(vp, solved.result, f, solved.comparison ?? undefined);

    const root = solved.result.approximateRoot;
    const rootY = methodId === 'fixed-point' ? root : 0;
    drawPoint(vp, { x: root, y: rootY }, { glow: true });
  }, [diagram, solved, methodId]);

  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);

  if (!diagram || !solved) return null;

  return (
    <figure className={`method-theory-graph ${className}`}>
      <div className="theory-graph-example">
        <span className="theory-graph-label">Interpretación gráfica</span>
        <MathView math={diagram.exampleLatex} />
      </div>

      <div className="theory-graph-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="theory-graph-canvas"
          role="img"
          aria-label={`Gráfica del método: ${diagram.caption}`}
        />
      </div>

      <ul className="theory-graph-legend">
        {diagram.legend.map((item) => (
          <li key={item.label}>
            <span
              className={`theory-legend-swatch ${item.dashed ? 'dashed' : ''}`}
              style={{ '--swatch-color': item.color } as React.CSSProperties}
            />
            {item.label}
          </li>
        ))}
      </ul>

      <figcaption className="theory-graph-caption">
        <p>{diagram.caption}</p>
        <p className="theory-graph-root">
          Raíz obtenida por Numerikal: <strong>{solved.result.approximateRoot.toFixed(6)}</strong>
          {' '}en {solved.result.iterationsCount} iteraciones.
        </p>
        <p className="theory-graph-reference">Referencia: {diagram.reference}</p>
      </figcaption>
    </figure>
  );
};
