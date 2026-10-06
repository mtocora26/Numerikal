import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, Clock, Hash, Target } from 'lucide-react';
import type { RegressionResult } from '../../domain/regression/types';
import { formatNumber, formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../ResultCard/ResultCard.css';
import './RegressionResultCard.css';

const fitQuality = (r2: number): { label: string; good: boolean } => {
  if (r2 >= 0.99) return { label: 'Ajuste excelente', good: true };
  if (r2 >= 0.9) return { label: 'Buen ajuste', good: true };
  if (r2 >= 0.7) return { label: 'Ajuste moderado', good: false };
  return { label: 'Ajuste débil', good: false };
};

export const RegressionResultCard: React.FC<{ result: RegressionResult }> = ({ result }) => {
  const [evalX, setEvalX] = useState('');
  const quality = fitQuality(result.r2);

  const evalValue = Number(evalX.replace(',', '.'));
  const predicted =
    evalX.trim() !== '' && Number.isFinite(evalValue)
      ? result.coefficients.reduce((acc, a, k) => acc + a * evalValue ** k, 0)
      : null;

  return (
    <div className={`result-card-container ${quality.good ? 'converged' : 'unconverged'}`}>
      <div className="result-status-header">
        <div className="status-badge-wrapper">
          {quality.good ? (
            <div className="badge-converged"><CheckCircle size={16} /><span>{quality.label}</span></div>
          ) : (
            <div className="badge-warning"><AlertTriangle size={16} /><span>{quality.label}</span></div>
          )}
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
          <span className="root-label">Modelo de Regresión</span>
        </div>
        <div className="regression-model-display">
          <MathView math={result.modelLatex} block />
        </div>
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
          <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Coef. de determinación R²</span></div>
          <div className="metric-value">{result.r2.toFixed(6)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Coef. de correlación r</span></div>
          <div className="metric-value">{result.r.toFixed(6)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-icon-label"><Hash size={14} className="metric-icon" /><span>Datos (n)</span></div>
          <div className="metric-value">{result.n}</div>
        </div>
        <div className="metric-box">
          <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Suma de residuos² (Sr)</span></div>
          <div className="metric-value">{formatNumber(result.sr, 6)}</div>
        </div>
        <div className="metric-box">
          <div className="metric-icon-label"><Target size={14} className="metric-icon" /><span>Error estándar s_y/x</span></div>
          <div className="metric-value">{result.standardError === null ? '—' : formatNumber(result.standardError, 6)}</div>
        </div>
      </div>

      <div className="regression-predict">
        <label htmlFor="regression-eval-x">Evaluar el modelo en x =</label>
        <input
          id="regression-eval-x"
          type="text"
          inputMode="decimal"
          value={evalX}
          placeholder="Ej. 2.5"
          onChange={(e) => setEvalX(e.target.value)}
        />
        {predicted !== null && (
          <MathView math={`\\hat{y}(${formatNumberLatex(evalValue)}) \\approx ${formatNumberLatex(predicted)}`} />
        )}
      </div>

      <div className="convergence-reason-box">
        <span className="reason-title">Interpretación:</span>
        <p className="reason-text">
          El modelo explica el {(result.r2 * 100).toFixed(2)} % de la variación de y.
          {result.standardError === null &&
            ' Hay tantos datos como coeficientes, por lo que el polinomio pasa exactamente por todos los puntos.'}
        </p>
      </div>
    </div>
  );
};
