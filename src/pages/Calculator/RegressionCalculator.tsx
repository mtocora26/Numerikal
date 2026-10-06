import React, { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, BookOpen, LineChart, Play, RotateCcw, Sigma, Table } from 'lucide-react';
import { MethodFactory } from '../../factories/MethodFactory';
import {
  MAX_POLYNOMIAL_DEGREE,
  PolynomialRegression,
} from '../../domain/regression/PolynomialRegression';
import type { DataPoint, RegressionResult } from '../../domain/regression/types';
import { DataPointsInput, type DataRow } from '../../components/DataPointsInput/DataPointsInput';
import { MathView } from '../../components/MathView/MathView';
import { RegressionResultCard } from '../../components/RegressionResultCard/RegressionResultCard';
import { SummationTable, ResidualsTable } from '../../components/RegressionTables/RegressionTables';
import { GaussJordanSteps } from '../../components/GaussJordanSteps/GaussJordanSteps';
import { RegressionGraph } from '../../components/RegressionGraph/RegressionGraph';
import {
  RegressionHistory,
  type RegressionHistoryItem,
} from '../../components/RegressionHistory/RegressionHistory';
import '../../components/ParameterForm/ParameterForm.css';

const HISTORY_KEY = 'numerikal_regression_history';

/** Ejemplo clásico de mínimos cuadrados con polinomio de segundo orden (6 datos). */
const EXAMPLE_ROWS: DataRow[] = [
  [0, 2.1], [1, 7.7], [2, 13.6], [3, 27.2], [4, 40.9], [5, 61.1],
].map(([x, y]) => ({ x: String(x), y: String(y) }));

const toNumber = (text: string): number => (text.trim() === '' ? NaN : Number(text.trim().replace(',', '.')));

const loadHistory = (): RegressionHistoryItem[] => {
  try {
    const stored = sessionStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

type ResultTab = 'table' | 'steps' | 'graph' | 'residuals';

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

export const RegressionCalculator: React.FC = () => {
  const method = useMemo(() => new PolynomialRegression(), []);
  const methodMeta = MethodFactory.getRegressionMethods()[0];

  const [rows, setRows] = useState<DataRow[]>(EXAMPLE_ROWS);
  const [degree, setDegree] = useState<number>(2);
  const [result, setResult] = useState<RegressionResult | null>(null);
  const [resultPoints, setResultPoints] = useState<DataPoint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('table');
  const [history, setHistory] = useState<RegressionHistoryItem[]>(loadHistory);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const live = useMemo(() => readRows(rows), [rows]);
  const validation = useMemo(
    () => (live.error ? null : method.validate({ points: live.points, degree })),
    [live, method, degree]
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
      const solved = method.execute({ points, degree });
      setResult(solved);
      setResultPoints(points);
      setError(null);
      setActiveTab('table');
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0D683A', '#4DB54A', '#F7EA0A'],
      });

      const item: RegressionHistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        methodId: method.id,
        methodName: method.name,
        rows: rows.map((row) => ({ ...row })),
        degree,
        result: solved,
      };
      setHistory((prev) => {
        const updated = [item, ...prev].slice(0, 15);
        try {
          sessionStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setActiveHistoryId(item.id);

      if (window.matchMedia('(max-width: 1080px)').matches) {
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'No fue posible calcular la regresión.');
    }
  };

  const handleSelectHistoryItem = (item: RegressionHistoryItem) => {
    setRows(item.rows);
    setDegree(item.degree);
    setResult(item.result);
    setResultPoints(readRows(item.rows).points);
    setError(null);
    setActiveHistoryId(item.id);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActiveHistoryId(null);
    try {
      sessionStorage.removeItem(HISTORY_KEY);
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setRows(EXAMPLE_ROWS);
    setDegree(2);
  };

  const errorMessage = error ?? (validation && !validation.isValid ? validation.errors.join(' ') : null);
  const warnings = validation?.isValid ? validation.warnings : [];
  const canCalculate = !live.error && Boolean(validation?.isValid);

  return (
    <div className="workspace-grid">
      <section className="workspace-left-pane" aria-label="Ejercicio">
        <div className="pane-section glass-panel method-panel">
          <label className="workspace-step-label" htmlFor="regression-method-select">
            <span className="workspace-step-number">1</span>
            Selecciona el modelo
          </label>
          <select id="regression-method-select" className="method-dropdown" defaultValue={methodMeta.id}>
            {MethodFactory.getRegressionMethods().map((m) => (
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
            Elige el grado del polinomio
          </div>
          <div className="param-field-group">
            <label htmlFor="regression-degree" className="param-label">
              Grado <span className="param-subname">(m)</span>
            </label>
            <select
              id="regression-degree"
              className="param-select-input"
              value={degree}
              onChange={(e) => {
                setDegree(Number(e.target.value));
                setError(null);
              }}
            >
              {Array.from({ length: MAX_POLYNOMIAL_DEGREE }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  {m === 1 ? '1 (lineal)' : m === 2 ? '2 (cuadrático)' : m === 3 ? '3 (cúbico)' : `${m}`}
                </option>
              ))}
            </select>
            <span className="regression-degree-hint">
              Se resolverá un sistema de {degree + 1}×{degree + 1} y se necesitan al menos {degree + 1} datos con x distinta.
            </span>
          </div>
        </div>

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
            <span>Calcular Regresión</span>
          </button>
          <button type="button" className="btn-secondary reset-btn" onClick={handleReset} title="Restablecer ejemplo" aria-label="Limpiar">
            <RotateCcw size={16} />
            <span>Limpiar</span>
          </button>
        </div>
      </section>

      <section className="workspace-right-pane" aria-label="Solución" ref={resultsRef}>
        {result ? (
          <div className="results-container">
            <RegressionResultCard result={result} />

            <div className="results-tabs-nav">
              <button type="button" className={`result-tab-btn ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
                <Table size={16} />
                <span>Tabla de Sumatorias</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}>
                <BookOpen size={16} />
                <span>Gauss-Jordan</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>
                <LineChart size={16} />
                <span>Gráfica</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'residuals' ? 'active' : ''}`} onClick={() => setActiveTab('residuals')}>
                <Sigma size={16} />
                <span>Residuos</span>
              </button>
            </div>

            <div className="tab-pane-view">
              {activeTab === 'table' && <SummationTable result={result} />}
              {activeTab === 'steps' && <GaussJordanSteps result={result} />}
              {activeTab === 'graph' && <RegressionGraph points={resultPoints} result={result} />}
              {activeTab === 'residuals' && <ResidualsTable result={result} points={resultPoints} />}
            </div>
          </div>
        ) : (
          <div className="placeholder-container glass-panel">
            <div className="placeholder-callout">
              <div className="placeholder-icon-box">
                <Play size={24} className="placeholder-icon" />
              </div>
              <h4 className="placeholder-title">Listo para Ajustar</h4>
              <p className="placeholder-text">
                Haz clic en <strong>"Calcular Regresión"</strong>. Aquí aparecerán el polinomio, la tabla de sumatorias, el sistema resuelto con Gauss-Jordan, la gráfica y los residuos.
              </p>
            </div>
            <RegressionGraph points={live.points} result={null} />
          </div>
        )}

        <RegressionHistory
          history={history}
          activeHistoryId={activeHistoryId}
          onSelectHistoryItem={handleSelectHistoryItem}
          onClearHistory={handleClearHistory}
        />
      </section>
    </div>
  );
};
