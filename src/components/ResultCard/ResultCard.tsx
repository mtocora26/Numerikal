import React from 'react';
import type { MethodExecutionResult } from '../../domain/types';
import { MathView } from '../MathView/MathView';
import { CheckCircle, AlertTriangle, Clock, Zap, Target } from 'lucide-react';
import './ResultCard.css';

interface ResultCardProps {
  result: MethodExecutionResult;
  className?: string;
}

export const ResultCard: React.FC<ResultCardProps> = ({ result, className = '' }) => {
  const isConverged = result.converged;

  return (
    <div className={`result-card-container ${isConverged ? 'converged' : 'unconverged'} ${className}`}>
      {/* Top status banner */}
      <div className="result-status-header">
        <div className="status-badge-wrapper">
          {isConverged ? (
            <div className="badge-converged">
              <CheckCircle size={16} />
              <span>Convergencia Exitosa</span>
            </div>
          ) : (
            <div className="badge-warning">
              <AlertTriangle size={16} />
              <span>Convergencia Incompleta</span>
            </div>
          )}
          <span className="method-pill">{result.methodName}</span>
        </div>

        <div className="execution-meta">
          <span className="meta-item" title="Tiempo de ejecución">
            <Clock size={13} /> {result.executionTimeMs} ms
          </span>
        </div>
      </div>

      {/* Main Root Display */}
      <div className="main-root-box">
        <div className="root-label-row">
          <span className="root-label">Raíz Aproximada Calculada</span>
          <span className="root-formula-symbol">x_r</span>
        </div>
        <div className="root-value-display">
          <span className="root-number">{result.approximateRoot.toFixed(8)}</span>
        </div>
        <div className="root-evaluation-row">
          <span className="eval-label">Evaluación residual:</span>
          <MathView
            math={`f(${result.approximateRoot.toFixed(6)}) \\approx ${
              Math.abs(result.rootEvaluation) < 1e-6
                ? result.rootEvaluation.toExponential(4)
                : result.rootEvaluation.toFixed(6)
            }`}
          />
        </div>
      </div>

      {/* Metrics Row */}
      <div className="result-metrics-grid">
        <div className="metric-box">
          <div className="metric-icon-label">
            <Zap size={14} className="metric-icon" />
            <span>Iteraciones</span>
          </div>
          <div className="metric-value">{result.iterationsCount}</div>
        </div>

        <div className="metric-box">
          <div className="metric-icon-label">
            <Target size={14} className="metric-icon" />
            <span>Error Final</span>
          </div>
          <div className="metric-value">
            {result.finalError < 1e-4 ? result.finalError.toExponential(4) : result.finalError.toFixed(6)}
          </div>
        </div>
      </div>

      {/* Convergence Reason */}
      <div className="convergence-reason-box">
        <span className="reason-title">Motivo de finalización:</span>
        <p className="reason-text">{result.convergenceReason}</p>
      </div>
    </div>
  );
};
