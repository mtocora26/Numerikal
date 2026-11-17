import React, { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { AlertTriangle, BookOpen, LineChart, Play, RotateCcw, Table } from 'lucide-react';
import { MethodFactory } from '../../factories/MethodFactory';
import { useExpressionParser } from '../../hooks/useExpressionParser';
import { MAX_SUBINTERVALS } from '../../domain/integration/quadrature';
import { MAX_ROMBERG_SUBINTERVALS, RombergRule } from '../../domain/integration/Romberg';
import { Simpson13Rule } from '../../domain/integration/Simpson13';
import { Simpson38Rule } from '../../domain/integration/Simpson38';
import { TrapezoidRule } from '../../domain/integration/Trapezoid';
import type { IntegrationResult } from '../../domain/integration/types';
import { isRombergResult } from '../../domain/integration/types';
import { IntegrationGraph } from '../../components/IntegrationGraph/IntegrationGraph';
import { IntegrationResultCard } from '../../components/IntegrationResultCard/IntegrationResultCard';
import { IntegrationSteps, NodesTable, RombergTable } from '../../components/IntegrationSteps/IntegrationSteps';
import { MathInput } from '../../components/MathInput/MathInput';
import { MathView } from '../../components/MathView/MathView';
import { ExpressionParser } from '../../services/ExpressionParser';
import '../../components/ParameterForm/ParameterForm.css';

/** Ejemplo de clase: ∫₀^π sen x dx = 2. Con n = 4 el trapecio da 1.8961 y Simpson 2.0046. */
const EXAMPLE = { expression: 'sin(x)', a: '0', b: 'pi', n: '4' };

const toNumber = (text: string): number => (text.trim() === '' ? NaN : Number(text.trim().replace(',', '.')));

/** Los límites se escriben como constantes (0, 2.5, pi, 2pi, pi/2, sqrt(2)); también con coma decimal.
 *  Ruta rápida: un número plano se resuelve con `Number` y una constante con
 *  `evaluateConstant` (sin LaTeX ni derivada). La versión anterior pasaba cada
 *  tecla por `ExpressionParser.parse`, que encima de compilar f(x) calcula dos
 *  derivadas simbólicas: con 3 campos eso era 3 parses por tecla y la escritura
 *  se sentía lenta, sobre todo en los límites y en n. */
const toLimit = (text: string): number => {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return NaN;
  const num = Number(clean);
  if (Number.isFinite(num)) return num;
  // Sin letras no hay constante que evaluar (tampoco hace falta mathjs: "--" o "1.2.3" ya dieron NaN)
  if (!/[a-zA-Zπ]/.test(clean)) return NaN;
  return ExpressionParser.evaluateConstant(clean);
};

type ResultTab = 'steps' | 'table' | 'graph';

export const IntegrationCalculator: React.FC = () => {
  const methods = useMemo(
    () => ({
      trapezoid: new TrapezoidRule(),
      'simpson-1-3': new Simpson13Rule(),
      'simpson-3-8': new Simpson38Rule(),
      romberg: new RombergRule(),
    }),
    []
  );
  const integrationMethods = useMemo(() => MethodFactory.getIntegrationMethods(), []);
  const [methodId, setMethodId] = useState<keyof typeof methods>('trapezoid');
  const method = methods[methodId];
  const methodMeta = integrationMethods.find((m) => m.id === methodId)!;

  const [expression, setExpression] = useState(EXAMPLE.expression);
  const [aText, setAText] = useState(EXAMPLE.a);
  const [bText, setBText] = useState(EXAMPLE.b);
  const [nText, setNText] = useState(EXAMPLE.n);
  const [result, setResult] = useState<IntegrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>('steps');
  const resultsRef = useRef<HTMLElement>(null);

  const parsed = useExpressionParser(expression);

  // Sin validación en vivo: la versión anterior calculaba `input` y
  // `method.validate(input)` en cada tecla (otro `parse` de f(x) + evaluar f en
  // los n + 1 nodos) solo para mostrar el error y deshabilitar el botón. Eso
  // hacía lento escribir a, b y n, y además llenaba la pantalla de errores
  // mientras se tecleaba un valor a medias. Ahora se valida al calcular:
  // `execute` ya valida por dentro y su mensaje llega a `error`; mientras
  // tanto solo quedan las ayudas junto a cada campo.
  const handleCalculate = () => {
    const input = { expression, a: toLimit(aText), b: toLimit(bText), n: toNumber(nText) };
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
      setError(e instanceof Error ? e.message : 'No fue posible calcular la integral.');
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setExpression(EXAMPLE.expression);
    setAText(EXAMPLE.a);
    setBText(EXAMPLE.b);
    setNText(EXAMPLE.n);
  };

  const nHint = {
    trapezoid: `Entero de 1 a ${MAX_SUBINTERVALS}. Con n = 1 es la regla simple: un solo trapecio.`,
    'simpson-1-3': `Debe ser par (2 a ${MAX_SUBINTERVALS}). Con n = 2 es la regla simple: una sola parábola.`,
    'simpson-3-8': `Debe ser múltiplo de 3 (3 a ${MAX_SUBINTERVALS - 1}). Con n = 3 es la regla simple: una sola cúbica.`,
    romberg: `Potencia de 2 (1 a ${MAX_ROMBERG_SUBINTERVALS}): la tabla tiene log₂(n) + 1 filas. Con n = 8 son 4 filas y la esquina R₄,₄ es la mejor aproximación.`,
  }[methodId];

  return (
    <div className="workspace-grid">
      <section className="workspace-left-pane" aria-label="Ejercicio">
        <div className="pane-section glass-panel method-panel">
          <label className="workspace-step-label" htmlFor="integration-method-select">
            <span className="workspace-step-number">1</span>
            Selecciona el método
          </label>
          <select
            id="integration-method-select"
            className="method-dropdown"
            value={methodId}
            onChange={(e) => {
              setMethodId(e.target.value as keyof typeof methods);
              setResult(null);
              setError(null);
              setActiveTab('steps');
            }}
          >
            {integrationMethods.map((m) => (
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
            Límites y subintervalos
          </div>
          <div className="param-field-group">
            <label htmlFor="integration-a" className="param-label">Límite inferior <span className="param-subname">(a)</span></label>
            <input
              id="integration-a"
              type="text"
              inputMode="decimal"
              className="param-select-input"
              value={aText}
              onChange={(e) => { setAText(e.target.value); setError(null); }}
            />
          </div>
          <div className="param-field-group">
            <label htmlFor="integration-b" className="param-label">Límite superior <span className="param-subname">(b)</span></label>
            <input
              id="integration-b"
              type="text"
              inputMode="decimal"
              className="param-select-input"
              value={bText}
              onChange={(e) => { setBText(e.target.value); setError(null); }}
            />
            <span className="regression-degree-hint">Los límites pueden ser pi, 2pi, pi/2, sqrt(2)… Debe cumplirse a &lt; b.</span>
          </div>
          <div className="param-field-group">
            <label htmlFor="integration-n" className="param-label">Subintervalos <span className="param-subname">(n)</span></label>
            <input
              id="integration-n"
              type="text"
              inputMode="numeric"
              className="param-select-input"
              value={nText}
              onChange={(e) => { setNText(e.target.value); setError(null); }}
            />
            <span className="regression-degree-hint">{nHint}</span>
          </div>
        </div>

        <div className="solve-dock">
          {error && (
            <div className="workspace-alert alert-error" role="alert">
              <AlertTriangle size={18} className="alert-icon" />
              <div className="alert-text">
                <strong>Revisa los datos:</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          <div className="actions-row solve-actions">
            <button type="button" className="btn-primary calculate-main-btn" onClick={handleCalculate}>
              <Play size={18} />
              <span>Calcular Integral</span>
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
            <IntegrationResultCard result={result} />

            <div className="results-tabs-nav">
              <button type="button" className={`result-tab-btn ${activeTab === 'steps' ? 'active' : ''}`} onClick={() => setActiveTab('steps')}>
                <BookOpen size={16} />
                <span>Procedimiento</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
                <Table size={16} />
                <span>Tabla</span>
              </button>
              <button type="button" className={`result-tab-btn ${activeTab === 'graph' ? 'active' : ''}`} onClick={() => setActiveTab('graph')}>
                <LineChart size={16} />
                <span>Gráfica</span>
              </button>
            </div>

            <div className="tab-pane-view">
              {activeTab === 'steps' && <IntegrationSteps result={result} />}
              {activeTab === 'table' && (isRombergResult(result) ? <RombergTable result={result} /> : <NodesTable result={result} />)}
              {activeTab === 'graph' && <IntegrationGraph result={result} />}
            </div>
          </div>
        ) : (
          <div className="placeholder-container glass-panel">
            <div className="placeholder-callout">
              <div className="placeholder-icon-box">
                <Play size={24} className="placeholder-icon" />
              </div>
              <h4 className="placeholder-title">Listo para Integrar</h4>
              <p className="placeholder-text">
                Haz clic en <strong>"Calcular Integral"</strong>. Aquí aparecerán el procedimiento, la tabla de nodos, el valor aproximado con su error y la gráfica del área bajo la curva.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};
