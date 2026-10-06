import React, { useState, useEffect, useRef } from 'react';
import { MethodFactory } from '../../factories/MethodFactory';
import { useExpressionParser } from '../../hooks/useExpressionParser';
import { useNumericalSolver } from '../../hooks/useNumericalSolver';
import type { ErrorType, MethodInputParams } from '../../domain/types';
import { MathInput } from '../../components/MathInput/MathInput';
import { ParameterForm } from '../../components/ParameterForm/ParameterForm';
import { ResultCard } from '../../components/ResultCard/ResultCard';
import { IterationTable } from '../../components/IterationTable/IterationTable';
import { FunctionGraph } from '../../components/FunctionGraph/FunctionGraph';
import { EducationalExplanation } from '../../components/EducationalExplanation/EducationalExplanation';
import { SessionHistory, type HistoryItem } from '../../components/SessionHistory/SessionHistory';
import { MathView } from '../../components/MathView/MathView';
import { ExpressionParser } from '../../services/ExpressionParser';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, AlertTriangle, LineChart, Table, BookOpen, Zap } from 'lucide-react';
import './Calculator.css';

interface CalculatorProps {
  initialMethodId?: string;
}

// Ejemplo por defecto: raíz x ≈ 2.1149 en [2, 3]. Punto Fijo necesita la ecuación despejada x = g(x).
const DEFAULT_EXPRESSION = 'x^3 - 4*x - 1';
const DEFAULT_FIXED_POINT_EXPRESSION = 'cbrt(4*x + 1)';

export const Calculator: React.FC<CalculatorProps> = ({ initialMethodId = 'bisection' }) => {
  const methods = MethodFactory.getAllMethods();
  // State
  const [selectedMethodId, setSelectedMethodId] = useState<string>(initialMethodId);
  const [expression, setExpression] = useState<string>(DEFAULT_EXPRESSION);
  const [paramValues, setParamValues] = useState<Record<string, number>>({ xi: 2, xs: 3 });
  const [tolerance, setTolerance] = useState<number>(0.0001);
  const [maxIterations, setMaxIterations] = useState<number>(30);
  const [errorType, setErrorType] = useState<ErrorType>('relative');
  const [activeTab, setActiveTab] = useState<'graph' | 'table' | 'educational'>('table');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  // Custom Hooks
  const parsedExpression = useExpressionParser(expression);
  const { result, validation, isCalculating, executionError, solve, reset, setResult } = useNumericalSolver();

  // Selected Method Strategy instance
  const currentMethod = MethodFactory.create(selectedMethodId);

  // Load history from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('numerikal_session_history');
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);

  useEffect(() => {
    if (initialMethodId) {
      setSelectedMethodId(initialMethodId);
    }
  }, [initialMethodId]);

  const handleParamChange = (name: string, val: number) => {
    setParamValues((prev) => ({ ...prev, [name]: val }));
  };

  const handleCalculate = () => {
    const params: MethodInputParams = {
      expression,
      tolerance,
      maxIterations,
      errorType,
      params: paramValues,
    };

    const success = solve(selectedMethodId, params);
    if (success) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#0D683A', '#4DB54A', '#F7EA0A'],
      });

      // Save calculation to session history
      const solveResult = MethodFactory.create(selectedMethodId).execute(
        parsedExpression.evaluate,
        params
      );

      const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        methodId: selectedMethodId,
        methodName: currentMethod.name,
        expression,
        paramValues: { ...paramValues },
        tolerance,
        maxIterations,
        errorType,
        result: solveResult,
      };

      setHistory((prev) => {
        const updated = [newItem, ...prev.filter((h) => h.id !== newItem.id)].slice(0, 15);
        try {
          sessionStorage.setItem('numerikal_session_history', JSON.stringify(updated));
        } catch {
          // ignore
        }
        return updated;
      });
      setActiveHistoryId(newItem.id);

      // In the single-column layout the solution sits below the form, so bring it into view
      if (window.matchMedia('(max-width: 1080px)').matches) {
        requestAnimationFrame(() => {
          resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setSelectedMethodId(item.methodId);
    setExpression(item.expression);
    setParamValues(item.paramValues);
    setTolerance(item.tolerance);
    setMaxIterations(item.maxIterations);
    setErrorType(item.errorType);
    setResult(item.result);
    setActiveHistoryId(item.id);
  };

  const handleClearHistory = () => {
    setHistory([]);
    setActiveHistoryId(null);
    try {
      sessionStorage.removeItem('numerikal_session_history');
    } catch {
      // ignore
    }
  };

  const handleResetAll = () => {
    reset();
  };

  const selectedMethodMeta = methods.find((method) => method.id === selectedMethodId);
  const hasValidationError = Boolean(executionError || (validation && !validation.isValid));
  const hasWarnings = Boolean(validation?.warnings && validation.warnings.length > 0);

  return (
    <div className="calculator-workspace">
      {/* Workspace Header */}
      <div className="workspace-header">
        <div className="header-text-block">
          <div className="header-badge">
            <Zap size={13} />
            <span>Espacio de Trabajo Interactivo</span>
          </div>
          <h1 className="workspace-title">Resolución y Análisis Numérico</h1>
          <p className="workspace-subtitle">
            Elige un método, escribe tu ejercicio y obtén la solución con su tabla, gráfica y explicación.
          </p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="workspace-grid">
        {/* Left Column: Exercise (method, function, parameters, solve) */}
        <section className="workspace-left-pane" aria-label="Ejercicio">
          {/* Step 1: Method */}
          <div className="pane-section glass-panel method-panel">
            <label className="workspace-step-label" htmlFor="method-select">
              <span className="workspace-step-number">1</span>
              Selecciona el método
            </label>
            <select
              id="method-select"
              value={selectedMethodId}
              onChange={(e) => {
                const nextId = e.target.value;
                // Si el usuario no ha cambiado el ejemplo, se cambia por el que corresponde al método
                if (nextId === 'fixed-point' && expression === DEFAULT_EXPRESSION) {
                  setExpression(DEFAULT_FIXED_POINT_EXPRESSION);
                } else if (selectedMethodId === 'fixed-point' && nextId !== 'fixed-point' && expression === DEFAULT_FIXED_POINT_EXPRESSION) {
                  setExpression(DEFAULT_EXPRESSION);
                }
                setSelectedMethodId(nextId);
                reset();
              }}
              className="method-dropdown"
            >
              {methods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>

            {selectedMethodMeta && (
              <div className="method-summary">
                <div className="method-summary-tags">
                  <span className="method-badge-compact">{selectedMethodMeta.tag}</span>
                  <span className="method-summary-difficulty">{selectedMethodMeta.difficulty}</span>
                </div>
                <p className="method-summary-description">
                  {selectedMethodMeta.description}
                </p>
                <div className="method-summary-formula">
                  <MathView math={selectedMethodMeta.latexFormula} />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Function Input */}
          <div className="pane-section glass-panel">
            <div className="workspace-step-label">
              <span className="workspace-step-number">2</span>
              Escribe el ejercicio
            </div>
            <MathInput
              value={expression}
              onChange={setExpression}
              parsed={parsedExpression}
              inputLabel={selectedMethodId === 'fixed-point' ? 'Función de iteración' : undefined}
              inputSymbol={selectedMethodId === 'fixed-point' ? 'g(x)' : undefined}
              inputPrefix={selectedMethodId === 'fixed-point' ? 'g(x) =' : undefined}
            />
            {selectedMethodId === 'fixed-point' && (
              <p className="fixed-point-hint">
                Punto Fijo necesita la función despejada <strong>g(x)</strong>. Si partes de f(x) = 0, primero despeja x; la calculadora usa xᵢ₊₁ = g(xᵢ) y no transforma f(x) automáticamente.
              </p>
            )}
          </div>

          {/* Step 3: Execution Parameters */}
          <div className="pane-section glass-panel execution-params-section">
            <div className="workspace-step-label">
              <span className="workspace-step-number">3</span>
              Configura los parámetros
            </div>

            <ParameterForm
              parameters={currentMethod.parameters}
              values={paramValues}
              onChangeParam={handleParamChange}
              tolerance={tolerance}
              onChangeTolerance={setTolerance}
              maxIterations={maxIterations}
              onChangeMaxIterations={setMaxIterations}
              errorType={errorType}
              onChangeErrorType={setErrorType}
              evaluateExpression={parsedExpression.isValid ? parsedExpression.evaluate : undefined}
              requiresSignChange={selectedMethodId === 'bisection' || selectedMethodId === 'false-position'}
            />
          </div>

          {/* Validation Warnings / Error Banner (next to the solve button) */}
          {hasValidationError && (
            <div className="workspace-alert alert-error" role="alert">
              <AlertTriangle size={18} className="alert-icon" />
              <div className="alert-text">
                <strong>Error de validación matemática:</strong>
                <p>{executionError || (validation?.errors || []).join(' ')}</p>
              </div>
            </div>
          )}

          {hasWarnings && (
            <div className="workspace-alert alert-warning">
              <AlertTriangle size={18} className="alert-icon" />
              <div className="alert-text">
                <strong>Advertencia de convergencia:</strong>
                <p>{validation?.warnings.join(' ')}</p>
              </div>
            </div>
          )}

          {/* Step 4: Solve (sticky so it stays visible while editing) */}
          <div className="actions-row solve-actions">
            <button
              type="button"
              className="btn-primary calculate-main-btn"
              onClick={handleCalculate}
              disabled={isCalculating || !parsedExpression.isValid}
            >
              <Play size={18} />
              <span>{isCalculating ? 'Calculando...' : 'Calcular Solución'}</span>
            </button>

            <button
              type="button"
              className="btn-secondary reset-btn"
              onClick={handleResetAll}
              title="Restablecer cálculos"
              aria-label="Limpiar"
            >
              <RotateCcw size={16} />
              <span>Limpiar</span>
            </button>
          </div>
        </section>

        {/* Right Column: Solution, Graphs, Tables & Insights */}
        <section className="workspace-right-pane" aria-label="Solución" ref={resultsRef}>
          {result ? (
            <div className="results-container">
              {/* Exercise being solved, so the solution stays tied to its input */}
              <div className="solved-exercise-strip">
                <span className="solved-exercise-label">Solución del ejercicio</span>
                <MathView math={`${result.methodId === 'fixed-point' ? 'g(x)' : 'f(x)'} = ${ExpressionParser.parse(result.expression).latex || result.expression}`} />
              </div>

              {/* Result Summary Card */}
              <ResultCard result={result} />
              {/* View Switcher Tabs */}
              <div className="results-tabs-nav">
                <button
                  type="button"
                  className={`result-tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                  onClick={() => setActiveTab('table')}
                >
                  <Table size={16} />
                  <span>Tabla de Iteraciones</span>
                </button>

                <button
                  type="button"
                  className={`result-tab-btn ${activeTab === 'graph' ? 'active' : ''}`}
                  onClick={() => setActiveTab('graph')}
                >
                  <LineChart size={16} />
                  <span>Visualización Gráfica</span>
                </button>

                <button
                  type="button"
                  className={`result-tab-btn ${activeTab === 'educational' ? 'active' : ''}`}
                  onClick={() => setActiveTab('educational')}
                >
                  <BookOpen size={16} />
                  <span>Comprensión Teórica</span>
                </button>
              </div>

              {/* Tab Content Panes */}
              <div className="tab-pane-view">
                {activeTab === 'table' && (
                  <IterationTable
                    columns={result.columns}
                    iterations={result.iterations}
                  />
                )}

                {activeTab === 'graph' && (
                  <FunctionGraph result={result} expression={expression} />
                )}

                {activeTab === 'educational' && (
                  <EducationalExplanation result={result} />
                )}
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
                  Haz clic en <strong>"Calcular Solución"</strong> para ejecutar el método seleccionado. Aquí aparecerán la raíz, la tabla de iteraciones, la gráfica y la explicación paso a paso.
                </p>
              </div>

              <FunctionGraph result={null} expression={expression} />
            </div>
          )}

          {/* Session History Component */}
          <SessionHistory
            history={history}
            activeHistoryId={activeHistoryId}
            onSelectHistoryItem={handleSelectHistoryItem}
            onClearHistory={handleClearHistory}
          />
        </section>
      </div>
    </div>
  );
};
