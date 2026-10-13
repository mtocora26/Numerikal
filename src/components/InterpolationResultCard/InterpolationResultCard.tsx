import React from 'react';
import { CheckCircle, Clock, Hash, Target } from 'lucide-react';
import type { InterpolationResultBase } from '../../domain/interpolation/types';
import { formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../ResultCard/ResultCard.css';
import '../RegressionResultCard/RegressionResultCard.css';

export const InterpolationResultCard: React.FC<{ result: InterpolationResultBase }> = ({ result }) => (
  <div className="result-card-container converged">
    <div className="result-status-header">
      <div className="status-badge-wrapper">
        <div className="badge-converged"><CheckCircle size={16} /><span>Polinomio interpolante calculado</span></div>
        <span className="method-pill">{result.methodName} · grado {result.degree}</span>
      </div>
      <div className="execution-meta">
        <span className="meta-item" title="Tiempo de ejecución">
          <Clock size={13} /> {result.executionTimeMs.toFixed(1)} ms
        </span>
      </div>
    </div>

    <div className="main-root-box">
      <div className="root-label-row">
        <span className="root-label">Valor interpolado</span>
      </div>
      <div className="regression-model-display">
        <MathView math={`P(${formatNumberLatex(result.xStar)}) \\approx ${formatNumberLatex(result.valueAtXStar, 8)}`} block />
      </div>
    </div>

    <div className="regression-model-display">
      <MathView math={result.expandedLatex} block />
    </div>

    <div className="regression-coefficients">
      {result.coefficients.map((a, k) => (
        <div className="regression-coefficient" key={k}>
          <MathView math={`a_{${k}} = ${formatNumberLatex(a)}`} />
        </div>
      ))}
    </div>

    <div className="result-metrics-grid">
      <div className="metric-box">
        <div className="metric-icon-label"><Hash size={14} className="metric-icon" /><span>Puntos (n)</span></div>
        <div className="metric-value">{result.n}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Grado del polinomio</span></div>
        <div className="metric-value">{result.degree}</div>
      </div>
    </div>
  </div>
);
