import React from 'react';
import { CheckCircle, AlertTriangle, Clock, Target, Zap } from 'lucide-react';
import type { LinearSystemResult } from '../../domain/systems/types';
import { ErrorCalculator } from '../../services/ErrorCalculator';
import { formatNumber, formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../ResultCard/ResultCard.css';
import '../RegressionResultCard/RegressionResultCard.css';

export const SystemResultCard: React.FC<{ result: LinearSystemResult }> = ({ result }) => {
  const { converged, dominance } = result;

  return (
    <div className={`result-card-container ${converged ? 'converged' : 'unconverged'}`}>
      <div className="result-status-header">
        <div className="status-badge-wrapper">
          {converged ? (
            <div className="badge-converged"><CheckCircle size={16} /><span>Convergencia Exitosa</span></div>
          ) : (
            <div className="badge-warning"><AlertTriangle size={16} /><span>Convergencia Incompleta</span></div>
          )}
          <span className="method-pill">{result.methodName} · {result.n}×{result.n}</span>
        </div>
        <div className="execution-meta">
          <span className="meta-item" title="Tiempo de ejecución">
            <Clock size={13} /> {result.executionTimeMs.toFixed(1)} ms
          </span>
        </div>
      </div>

      <div className="main-root-box">
        <div className="root-label-row">
          <span className="root-label">Solución Aproximada</span>
          <span className="root-formula-symbol">x</span>
        </div>
        <div className="regression-coefficients">
          {result.solution.map((v, i) => (
            <div className="regression-coefficient" key={i}>
              <MathView math={`x_{${i + 1}} \\approx ${formatNumberLatex(v, 8)}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="result-metrics-grid">
        <div className="metric-box">
          <div className="metric-icon-label"><Zap size={14} className="metric-icon" /><span>Iteraciones</span></div>
          <div className="metric-value">{result.iterationsCount}</div>
        </div>
        <div className="metric-box">
          <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Error Final</span></div>
          <div className="metric-value">{ErrorCalculator.format(result.finalError, result.errorType)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Residuo ‖Ax − b‖∞</span></div>
          <div className="metric-value">{formatNumber(result.residualNorm, 6)}</div>
        </div>
      </div>

      <div className={`convergence-diagnostic-box ${dominance.strictlyDominant ? 'diagnostic-positive' : 'diagnostic-negative'}`}>
        <div className="diagnostic-heading">
          <span>Comprobación de convergencia</span>
          <strong>{dominance.strictlyDominant ? 'Diagonal dominante' : 'No es diagonal dominante'}</strong>
        </div>
        <div className="diagnostic-values">
          <span>
            {dominance.strictlyDominant
              ? 'En cada fila |aᵢᵢ| es mayor que la suma de los demás coeficientes: la convergencia está garantizada.'
              : 'Alguna fila no cumple |aᵢᵢ| > Σ|aᵢⱼ|. El método puede converger o no; revisa la pestaña Procedimiento.'}
          </span>
        </div>
      </div>

      <div className="convergence-reason-box">
        <span className="reason-title">Motivo de finalización:</span>
        <p className="reason-text">{result.convergenceReason}</p>
      </div>
    </div>
  );
};
