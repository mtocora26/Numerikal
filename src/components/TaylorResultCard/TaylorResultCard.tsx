import React from 'react';
import { CheckCircle, Clock, Hash, Target } from 'lucide-react';
import type { TaylorResult } from '../../domain/taylor/types';
import { formatNumber, formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../ResultCard/ResultCard.css';
import '../RegressionResultCard/RegressionResultCard.css';

export const TaylorResultCard: React.FC<{ result: TaylorResult }> = ({ result }) => (
  <div className="result-card-container converged">
    <div className="result-status-header">
      <div className="status-badge-wrapper">
        <div className="badge-converged"><CheckCircle size={16} /><span>Polinomio calculado</span></div>
        <span className="method-pill">
          {result.isMaclaurin ? 'Maclaurin' : 'Taylor'} · grado {result.degree} · a = {formatNumber(result.a)}
        </span>
      </div>
      <div className="execution-meta">
        <span className="meta-item" title="Tiempo de ejecución">
          <Clock size={13} /> {result.executionTimeMs.toFixed(1)} ms
        </span>
      </div>
    </div>

    <div className="main-root-box">
      <div className="root-label-row">
        <span className="root-label">Valor aproximado</span>
      </div>
      <div className="regression-model-display">
        <MathView math={`P(${formatNumberLatex(result.xStar)}) \\approx ${formatNumberLatex(result.valueAtXStar, 8)}`} block />
      </div>
    </div>

    <div className="regression-model-display">
      <MathView math={result.substitutedLatex} block />
    </div>

    <div className="result-metrics-grid">
      <div className="metric-box">
        <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>f(x*) exacto</span></div>
        <div className="metric-value">{result.exactValue === null ? '—' : formatNumber(result.exactValue, 8)}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Error |f(x*) − P(x*)|</span></div>
        <div className="metric-value">{result.absoluteError === null ? '—' : formatNumber(result.absoluteError, 4)}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon-label"><Hash size={14} className="metric-icon" /><span>Grado (n)</span></div>
        <div className="metric-value">{result.degree}</div>
      </div>
    </div>
  </div>
);
