import React from 'react';
import { CheckCircle, Clock, Hash, Ruler, Target } from 'lucide-react';
import type { IntegrationResult } from '../../domain/integration/types';
import { isRombergResult } from '../../domain/integration/types';
import { formatNumber, formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../ResultCard/ResultCard.css';
import '../RegressionResultCard/RegressionResultCard.css';
import '../ParameterForm/ParameterForm.css';

export const IntegrationResultCard: React.FC<{ result: IntegrationResult }> = ({ result }) => (
  <div className="result-card-container converged">
    <div className="result-status-header">
      <div className="status-badge-wrapper">
        <div className="badge-converged"><CheckCircle size={16} /><span>Integral calculada</span></div>
        <span className="method-pill">{result.methodName} · {isRombergResult(result) ? `k = ${result.levels} filas` : `n = ${result.n}`}</span>
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
        <MathView
          math={`\\int_{${formatNumberLatex(result.a)}}^{${formatNumberLatex(result.b)}} ${result.functionLatex}\\,dx \\approx ${formatNumberLatex(result.value, 8)}`}
          block
        />
      </div>
    </div>

    <div className="regression-model-display">
      <MathView math={result.substitutedLatex} block />
    </div>

    <div className="result-metrics-grid">
      <div className="metric-box">
        <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Valor exacto</span></div>
        <div className="metric-value">{result.exactValue === null ? '—' : formatNumber(result.exactValue, 8)}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Error absoluto</span></div>
        <div className="metric-value">{result.absoluteError === null ? '—' : formatNumber(result.absoluteError, 4)}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Error relativo</span></div>
        <div className="metric-value">{result.relativeError === null ? '—' : `${formatNumber(result.relativeError * 100, 4)} %`}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon-label"><Ruler size={14} className="metric-icon" /><span>{isRombergResult(result) ? 'h más fino' : 'Ancho h'}</span></div>
        <div className="metric-value">{formatNumber(result.h)}</div>
      </div>
      <div className="metric-box">
        <div className="metric-icon-label"><Hash size={14} className="metric-icon" /><span>{isRombergResult(result) ? 'Filas de la tabla (k)' : 'Subintervalos (n)'}</span></div>
        <div className="metric-value">{isRombergResult(result) ? result.levels : result.n}</div>
      </div>
    </div>

    {result.exactValue === null && (
      <p className="regression-degree-hint">
        Sin valor exacto: Numerikal no encontró una primitiva de esta función (puede que no exista en forma elemental, como e^(−x²)),
        así que no se compara con otra aproximación.
      </p>
    )}
  </div>
);
