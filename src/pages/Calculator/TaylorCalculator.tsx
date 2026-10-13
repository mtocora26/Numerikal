import React, { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, BookOpen, LineChart, Play, RotateCcw, Table } from 'lucide-react';
import { MethodFactory } from '../../factories/MethodFactory';
import { useExpressionParser } from '../../hooks/useExpressionParser';
import { MAX_TAYLOR_DEGREE, MIN_TAYLOR_DEGREE, TaylorPolynomial } from '../../domain/taylor/TaylorPolynomial';
import type { TaylorResult } from '../../domain/taylor/types';
import { MathInput } from '../../components/MathInput/MathInput';
import { MathView } from '../../components/MathView/MathView';
import { TaylorGraph } from '../../components/TaylorGraph/TaylorGraph';
import { TaylorResultCard } from '../../components/TaylorResultCard/TaylorResultCard';
import { DerivativesTable, TaylorSteps } from '../../components/TaylorSteps/TaylorSteps';
import '../../components/ParameterForm/ParameterForm.css';

/** Ejemplo por defecto: Maclaurin de eˣ de grado 4 evaluado en 0.5. */
const EXAMPLE = { expression: 'exp(x)', a: '0', degree: 4, xStar: '0.5' };

const toNumber = (text: string): number => (text.trim() === '' ? NaN : Number(text.trim().replace(',', '.')));

type ResultTab = 'steps' | 'table' | 'graph';

export const TaylorCalculator: React.FC = () => {
  const method = useMemo(() => new TaylorPolynomial(), []);
  const methodMeta = MethodFactory.getSeriesMethods()[0];

  const [expression, setExpression] = useState(EXAMPLE.expression);
  const [aText, setAText] = useState(EXAMPLE.a);
  const [degree, setDegree] = useState(EXAMPLE.degree);
  const [xStarText, setXStarText] = useState(EXAMPLE.xStar);
  const [result, setResult] = useState<TaylorResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('steps');
  const resultsRef = useRef<HTMLElement>(null);

  const parsed = useExpressionParser(expression);
  const input = useMemo(
    () => ({ expression, a: toNumber(aText), degree, xStar: toNumber(xStarText) }),
    [expression, aText, degree, xStarText]
  );
  const validation = useMemo(() => method.validate(input), [method, input]);

  const handleCalculate = () => {
    try {
      setResult(method.execute(input));
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
      setError(e instanceof Error ? e.message : 'No fue posible calcular el polinomio.');
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setExpression(EXAMPLE.expression);
    setAText(EXAMPLE.a);
    setDegree(EXAMPLE.degree);
    setXStarText(EXAMPLE.xStar);
  };

  const errorMessage = error ?? (!validation.isValid ? validation.errors.join(' ') : null);
  const warnings = validation.isValid ? validation.warnings : [];

  return (
    <div className="workspace-grid">
      <section className="workspace-left-pane" aria-label="Ejercicio">
        <div className="pane-section glass-panel method-panel">
          <label className="workspace-step-label" htmlFor="series-method-select">
            <span className="workspace-step-number">1</span>
            Selecciona el método
          </label>
          <select id="series-method-select" className="method-dropdown" defaultValue={methodMeta.id}>
            {MethodFactory.getSeriesMethods().map((m) => (
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
            Escribe la función
          </div>
          <MathInput value={expression} onChange={(value) => { setExpression(value); setError(null); }} parsed={parsed} inputSymbol="f(x)" />
        </div>

        <div className="pane-section glass-panel">
          <div className="workspace-step-label">
            <span className="workspace-step-number">3</span>
            Punto, grado y valor a evaluar
          </div>
          <div className="param-field-group">
            <label htmlFor="taylor-a" className="param-label">Punto de expansión <span className="param-subname">(a)</span></label>
            <input
              id="taylor-a"
              type="text"
              inputMode="decimal"
              className="param-select-input"
              value={aText}
              onChange={(e) => { setAText(e.target.value); setError(null); }}
            />
            <span className="regression-degree-hint">Con a = 0 el polinomio se llama de Maclaurin.</span>
          </div>
          <div className="param-field-group">
            <label htmlFor="taylor-degree" className="param-label">Grado <span className="param-subname">(n)</span></label>
            <select
              id="taylor-degree"
              className="param-select-input"
              value={degree}
              onChange={(e) => { setDegree(Number(e.target.value)); setError(null); }}
            >
              {Array.from({ length: MAX_TAYLOR_DEGREE - MIN_TAYLOR_DEGREE + 1 }, (_, i) => i + MIN_TAYLOR_DEGREE).map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="regression-degree-hint">Se derivará f hasta el orden {degree}.</span>
          </div>
          <div className="param-field-group">
            <label htmlFor="taylor-x-star" className="param-label">Valor a evaluar <span className="param-subname">(x*)</span></label>
            <input
              id="taylor-x-star"
              type="text"
              inputMode="decimal"
              className="param-select-input"
              value={xStarText}
              onChange={(e) => { setXStarText(e.target.value); setError(null); }}
            />
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
            <button type="button" className="btn-primary calculate-main-btn" onClick={handleCalculate} disabled={!validation.isValid}>
              <Play size={18} />
              <span>Calcular Polinomio</span>
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
            <TaylorResultCard result={result} />

            <div className="results-tabs-nav">
              <button type="button" className={`result-tab-btn ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}>
                <BookOpen size={16} />
                <span>Procedimiento</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
                <Table size={16} />
                <span>Derivadas</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>
                <LineChart size={16} />
                <span>Gráfica</span>
              </button>
            </div>

            <div className="tab-pane-view">
              {activeTab === 'steps' && <TaylorSteps result={result} />}
              {activeTab === 'table' && <DerivativesTable result={result} />}
              {activeTab === 'graph' && <TaylorGraph result={result} />}
            </div>
          </div>
        ) : (
          <div className="placeholder-container glass-panel">
            <div className="placeholder-callout">
              <div className="placeholder-icon-box">
                <Play size={24} className="placeholder-icon" />
              </div>
              <h4 className="placeholder-title">Listo para Aproximar</h4>
              <p className="placeholder-text">
                Haz clic en <strong>"Calcular Polinomio"</strong>. Aquí aparecerán las derivadas, los coeficientes, el polinomio, el error y la gráfica de f(x) junto a P(x).
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
