import React, { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, BookOpen, Play, RotateCcw, Table } from 'lucide-react';
import { MethodFactory } from '../../factories/MethodFactory';
import { JacobiMethod } from '../../domain/systems/Jacobi';
import { GaussSeidelMethod } from '../../domain/systems/GaussSeidel';
import { MAX_SYSTEM_SIZE, MIN_SYSTEM_SIZE, systemLatex } from '../../domain/systems/linearSystem';
import type { LinearSystemInput, LinearSystemResult } from '../../domain/systems/types';
import type { ErrorType } from '../../domain/types';
import { MatrixInput, type LinearSystemRows } from '../../components/MatrixInput/MatrixInput';
import { ParameterForm } from '../../components/ParameterForm/ParameterForm';
import { MathView } from '../../components/MathView/MathView';
import { SystemResultCard } from '../../components/SystemResultCard/SystemResultCard';
import { IterationTable } from '../../components/IterationTable/IterationTable';
import { LinearSystemSteps } from '../../components/LinearSystemSteps/LinearSystemSteps';
import { parseInitialValue, parseSystemNumber } from '../../components/MatrixInput/systemInput';

/** Ejemplo por defecto: 4x₁ − x₂ = 3, −x₁ + 4x₂ = 3 → x₁ = x₂ = 1 */
const EXAMPLE_ROWS: LinearSystemRows = {
  a: [['4', '-1'], ['-1', '4']],
  b: ['3', '3'],
  x0: ['0', '0'],
};

type ResultTab = 'table' | 'steps';

const SYSTEM_METHODS = {
  jacobi: new JacobiMethod(),
  'gauss-seidel': new GaussSeidelMethod(),
} as const;

export const SystemsCalculator: React.FC = () => {
  const [methodId, setMethodId] = useState<keyof typeof SYSTEM_METHODS>('jacobi');
  const method = SYSTEM_METHODS[methodId];
  const methodMeta = MethodFactory.getSystemMethods().find((m) => m.id === methodId)!;

  const [rows, setRows] = useState<LinearSystemRows>(EXAMPLE_ROWS);
  const [tolerance, setTolerance] = useState<number>(0.0001);
  const [maxIterations, setMaxIterations] = useState<number>(50);
  const [errorType, setErrorType] = useState<ErrorType>('relative');
  const [result, setResult] = useState<LinearSystemResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('table');
  const resultsRef = useRef<HTMLElement>(null);

  const input: LinearSystemInput = useMemo(
    () => ({
      a: rows.a.map((row) => row.map(parseSystemNumber)),
      b: rows.b.map(parseSystemNumber),
      x0: rows.x0.map(parseInitialValue),
      tolerance,
      maxIterations,
      errorType,
    }),
    [rows, tolerance, maxIterations, errorType]
  );
  const validation = useMemo(() => method.validate(input), [method, input]);
  const hasEmptyCell = [...rows.a.flat(), ...rows.b, ...rows.x0].some((text) => text.trim() === '');

  const handleCalculate = () => {
    try {
      const solved = method.execute(input);
      setResult(solved);
      setError(null);
      setActiveTab('table');
      if (solved.converged) {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#0D683A', '#4DB54A', '#F7EA0A'],
        });
      }

      if (window.matchMedia('(max-width: 1080px)').matches) {
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : 'No fue posible resolver el sistema.');
    }
  };

  const handleReset = () => {
    setRows(EXAMPLE_ROWS);
    setResult(null);
    setError(null);
  };

  const errorMessage =
    error ??
    (hasEmptyCell
      ? 'Completa todas las celdas de A, b y x⁽⁰⁾ (escribe 0 donde la incógnita no aparece).'
      : input.x0.some((v) => !Number.isFinite(v))
        ? 'Revisa x⁽⁰⁾: ingresa números o fracciones válidas (ej. 3/4), con denominador distinto de cero.'
      : validation.isValid
        ? null
        : validation.errors.join(' '));
  const warnings = !errorMessage ? validation.warnings : [];

  return (
    <div className="workspace-grid">
      <section className="workspace-left-pane" aria-label="Ejercicio">
        <div className="pane-section glass-panel method-panel">
          <label className="workspace-step-label" htmlFor="system-method-select">
            <span className="workspace-step-number">1</span>
            Selecciona el método
          </label>
          <select
            id="system-method-select"
            className="method-dropdown"
            value={methodId}
            onChange={(e) => {
              setMethodId(e.target.value as keyof typeof SYSTEM_METHODS);
              setResult(null);
              setError(null);
            }}
          >
            {MethodFactory.getSystemMethods().map((m) => (
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
            Escribe el sistema Ax = b
          </div>
          <MatrixInput
            value={rows}
            onChange={(next) => {
              setRows(next);
              setError(null);
            }}
            minSize={MIN_SYSTEM_SIZE}
            maxSize={MAX_SYSTEM_SIZE}
          />
          {!hasEmptyCell && input.a.flat().every(Number.isFinite) && input.b.every(Number.isFinite) && (
            <div className="method-summary-formula system-preview">
              <MathView math={systemLatex(input.a, input.b)} block />
            </div>
          )}
        </div>

        <div className="pane-section glass-panel execution-params-section">
          <div className="workspace-step-label">
            <span className="workspace-step-number">3</span>
            Configura los parámetros
          </div>
          <ParameterForm
            parameters={[]}
            values={{}}
            onChangeParam={() => {}}
            tolerance={tolerance}
            onChangeTolerance={setTolerance}
            maxIterations={maxIterations}
            onChangeMaxIterations={setMaxIterations}
            errorType={errorType}
            onChangeErrorType={setErrorType}
          />
        </div>

        <div className="solve-dock">
          {errorMessage && (
            <div className="workspace-alert alert-error" role="alert">
              <AlertTriangle size={18} className="alert-icon" />
              <div className="alert-text">
                <strong>Revisa el sistema:</strong>
                <p>{errorMessage}</p>
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div className="workspace-alert alert-warning">
              <AlertTriangle size={18} className="alert-icon" />
              <div className="alert-text">
                <strong>Advertencia de convergencia:</strong>
                <p>{warnings.join(' ')}</p>
              </div>
            </div>
          )}

          <div className="actions-row solve-actions">
            <button type="button" className="btn-primary calculate-main-btn" onClick={handleCalculate} disabled={Boolean(errorMessage)}>
              <Play size={18} />
              <span>Resolver Sistema</span>
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
            <SystemResultCard result={result} />

            <div className="results-tabs-nav">
              <button type="button" className={`result-tab-btn ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
                <Table size={16} />
                <span>Tabla de Iteraciones</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}>
                <BookOpen size={16} />
                <span>Procedimiento</span>
              </button>
            </div>

            <div className="tab-pane-view">
              {activeTab === 'table' && <IterationTable columns={result.columns} iterations={result.iterations} />}
              {activeTab === 'steps' && <LinearSystemSteps result={result} />}
            </div>
          </div>
        ) : (
          <div className="placeholder-container glass-panel">
            <div className="placeholder-callout">
              <div className="placeholder-icon-box">
                <Play size={24} className="placeholder-icon" />
              </div>
              <h4 className="placeholder-title">Listo para Resolver</h4>
              <p className="placeholder-text">
                Haz clic en <strong>"Resolver Sistema"</strong>. Aquí aparecerán la solución, el residuo, la tabla de
                iteraciones y el procedimiento: comprobación de diagonal dominante y fórmulas despejadas.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
