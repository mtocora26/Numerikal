import React, { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, BookOpen, LineChart, Play, RotateCcw } from 'lucide-react';
import { MethodFactory } from '../../factories/MethodFactory';
import { LagrangeInterpolation } from '../../domain/interpolation/Lagrange';
import type { LagrangeResult } from '../../domain/interpolation/types';
import type { DataPoint } from '../../domain/regression/types';
import { DataPointsInput, type DataRow } from '../../components/DataPointsInput/DataPointsInput';
import { InterpolationGraph } from '../../components/InterpolationGraph/InterpolationGraph';
import { InterpolationResultCard } from '../../components/InterpolationResultCard/InterpolationResultCard';
import { LagrangeSteps } from '../../components/LagrangeSteps/LagrangeSteps';
import { MathView } from '../../components/MathView/MathView';
import '../../components/ParameterForm/ParameterForm.css';

/** Ejemplo de clase: pasa por un polinomio cúbico, P(x) = x³ + 2x² − 6x + 7. */
const EXAMPLE_ROWS: DataRow[] = [[0, 7], [1, 4], [2, 11], [3, 34]].map(([x, y]) => ({ x: String(x), y: String(y) }));
const EXAMPLE_X_STAR = '1.5';

const toNumber = (text: string): number => (text.trim() === '' ? NaN : Number(text.trim().replace(',', '.')));

type ResultTab = 'steps' | 'graph';

interface ReadRows {
  points: DataPoint[];
  error: string | null;
}

/** Convierte las filas de la tabla en puntos; ignora las filas vacías y avisa de las incompletas. */
const readRows = (rows: DataRow[]): ReadRows => {
  const points: DataPoint[] = [];
  for (let i = 0; i < rows.length; i++) {
    const { x, y } = rows[i];
    if (x.trim() === '' && y.trim() === '') continue;
    const px = toNumber(x);
    const py = toNumber(y);
    if (!Number.isFinite(px) || !Number.isFinite(py)) {
      return { points: [], error: `La fila ${i + 1} está incompleta o no es un número válido.` };
    }
    points.push({ x: px, y: py });
  }
  return { points, error: null };
};

export const InterpolationCalculator: React.FC = () => {
  const method = useMemo(() => new LagrangeInterpolation(), []);
  const methodMeta = MethodFactory.getInterpolationMethods()[0];

  const [rows, setRows] = useState<DataRow[]>(EXAMPLE_ROWS);
  const [xStarText, setXStarText] = useState<string>(EXAMPLE_X_STAR);
  const [result, setResult] = useState<LagrangeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('steps');
  const resultsRef = useRef<HTMLElement>(null);

  const xStar = toNumber(xStarText);
  const live = useMemo(() => readRows(rows), [rows]);
  const validation = useMemo(
    () => (live.error ? null : method.validate({ points: live.points, xStar })),
    [live, method, xStar]
  );

  const handleRowsChange = (next: DataRow[]) => {
    setRows(next);
    setError(null);
  };

  const handleCalculate = () => {
    const { points, error: readError } = readRows(rows);
    if (readError) {
      setError(readError);
      return;
    }

    try {
      setResult(method.execute({ points, xStar }));
      setError(null);
      setActiveTab('steps');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0D683A', '#4DB54A', '#F7EA0A'],
      });

      if (window.matchMedia('(max-width: 1080px)').matches) {
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'No fue posible calcular la interpolación.');
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setRows(EXAMPLE_ROWS);
    setXStarText(EXAMPLE_X_STAR);
  };

  const errorMessage = error ?? (validation && !validation.isValid ? validation.errors.join(' ') : null);
  const warnings = validation?.isValid ? validation.warnings : [];
  const canCalculate = !live.error && Boolean(validation?.isValid);

  return (
    <div className="workspace-grid">
      <section className="workspace-left-pane" aria-label="Ejercicio">
        <div className="pane-section glass-panel method-panel">
          <label className="workspace-step-label" htmlFor="interpolation-method-select">
            <span className="workspace-step-number">1</span>
            Selecciona el método
          </label>
          <select id="interpolation-method-select" className="method-dropdown" defaultValue={methodMeta.id}>
            {MethodFactory.getInterpolationMethods().map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="method-summary">
            <div className="method-summary-tags">
              <span className="method-badge-compact">{methodMeta.tag}</span>
              <span className="method-summary-difficulty">{methodMeta.difficulty}</span>
            </div>
            <p className="method-summary-description">{methodMeta.description}</p>
            <div className="method-summary-formula">
              <MathView math={methodMeta.latexFormula} />
            </div>
          </div>
        </div>

        <div className="pane-section glass-panel">
          <div className="workspace-step-label">
            <span className="workspace-step-number">2</span>
            Ingresa los datos (x, y)
          </div>
          <DataPointsInput rows={rows} onChange={handleRowsChange} />
        </div>

        <div className="pane-section glass-panel">
          <div className="workspace-step-label">
            <span className="workspace-step-number">3</span>
            Valor donde interpolar
          </div>
          <div className="param-field-group">
            <label htmlFor="interpolation-x-star" className="param-label">
              Valor <span className="param-subname">(x*)</span>
            </label>
            <input
              id="interpolation-x-star"
              type="text"
              inputMode="decimal"
              className="param-select-input"
              value={xStarText}
              placeholder="Ej. 1.5"
              onChange={(e) => {
                setXStarText(e.target.value);
                setError(null);
              }}
            />
            <span className="regression-degree-hint">
              Con {live.points.length} puntos el polinomio es de grado {Math.max(live.points.length - 1, 0)}. Se necesitan al
              menos 2 puntos con x distinta.
            </span>
          </div>
        </div>

        <div className="solve-dock">
          {errorMessage && (
            <div className="workspace-alert alert-error" role="alert">
              <AlertTriangle size={18} className="alert-icon" />
              <div className="alert-text">
                <strong>Revisa los datos:</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {!errorMessage && warnings.length > 0 && (
            <div className="workspace-alert alert-warning">
              <AlertTriangle size={18} className="alert-icon" />
              <div className="alert-text">
                <strong>Advertencia:</strong>
                <p>{warnings.join(' ')}</p>
              </div>
            </div>
          )}

          <div className="actions-row solve-actions">
            <button type="button" className="btn-primary calculate-main-btn" onClick={handleCalculate} disabled={!canCalculate}>
              <Play size={18} />
              <span>Interpolar</span>
            </button>
            <button type="button" className="btn-secondary reset-btn" onClick={handleReset} title="Restablecer ejemplo" aria-label="Limpiar">
              <RotateCcw size={16} />
              <span>Limpiar</span>
            </button>
          </div>
        </div>
      </section>

      <section className="workspace-right-pane" aria-label="Solución" ref={resultsRef}>
        {result ? (
          <div className="results-container">
            <InterpolationResultCard result={result} />

            <div className="results-tabs-nav">
              <button type="button" className={`result-tab-btn ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}>
                <BookOpen size={16} />
                <span>Procedimiento</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>
                <LineChart size={16} />
                <span>Gráfica</span>
              </button>
            </div>

            <div className="tab-pane-view">
              {activeTab === 'steps' && <LagrangeSteps result={result} />}
              {activeTab === 'graph' && (
                <InterpolationGraph
                  points={result.points}
                  coefficients={result.coefficients}
                  interpolated={{ x: result.xStar, y: result.valueAtXStar }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="placeholder-container glass-panel">
            <div className="placeholder-callout">
              <div className="placeholder-icon-box">
                <Play size={24} className="placeholder-icon" />
              </div>
              <h4 className="placeholder-title">Listo para Interpolar</h4>
              <p className="placeholder-text">
                Haz clic en <strong>"Interpolar"</strong>. Aquí aparecerán el polinomio, cada Lᵢ(x), el valor en x* y la gráfica.
              </p>
            </div>
            <InterpolationGraph points={live.points} coefficients={null} interpolated={null} />
          </div>
        )}
      </section>
    </div>
  );
};
