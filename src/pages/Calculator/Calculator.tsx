import React, { useState, useEffect } from 'react';
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
import confetti from 'canvas-confetti';
import { Play, RotateCcw, AlertTriangle, LineChart, Table, BookOpen, Zap } from 'lucide-react';
import './Calculator.css';

interface CalculatorProps {
  initialMethodId?: string;
}

export const Calculator: React.FC<CalculatorProps> = ({ initialMethodId = 'bisection' }) => {
  const methods = MethodFactory.getAllMethods();

  // State
  const [selectedMethodId, setSelectedMethodId] = useState<string>(initialMethodId);
  const [expression, setExpression] = useState<string>('x^3 - 4*x - 1');
  const [paramValues, setParamValues] = useState<Record<string, number>>({ xi: 1, xs: 2, x0: 1.5, x1: 2 });
  const [tolerance, setTolerance] = useState<number>(0.0001);
  const [maxIterations, setMaxIterations] = useState<number>(30);
  const [errorType, setErrorType] = useState<ErrorType>('relative');
  const [activeTab, setActiveTab] = useState<'graph' | 'table' | 'educational'>('table');

  // Custom Hooks
  const parsedExpression = useExpressionParser(expression);
  const { result, validation, isCalculating, executionError, solve, reset } = useNumericalSolver();

  // Selected Method Strategy instance
  const currentMethod = MethodFactory.create(selectedMethodId);

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
        colors: ['#6366f1', '#22d3ee', '#10b981'],
      });
    }
  };

  const handleResetAll = () => {
    reset();
  };

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
            Configura tu problema matemático, calcula iteraciones con precisión y explora la convergencia.
          </p>
        </div>
      </div>

      {/* Validation Warnings / Error Banner */}
      {(executionError || (validation && !validation.isValid)) && (
        <div className="workspace-alert alert-error">
          <AlertTriangle size={18} className="alert-icon" />
          <div className="alert-text">
            <strong>Error de validación matemática:</strong>
            <p>{executionError || (validation?.errors || []).join(' ')}</p>
          </div>
        </div>
      )}

      {validation && validation.warnings && validation.warnings.length > 0 && (
        <div className="workspace-alert alert-warning">
          <AlertTriangle size={18} className="alert-icon" />
          <div className="alert-text">
            <strong>Advertencia de convergencia:</strong>
            <p>{validation.warnings.join(' ')}</p>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="workspace-grid">
        {/* Left Column: Form & Configuration */}
        <div className="workspace-left-pane">
          {/* Action Buttons - TOP PRIORITY */}
          <div className="actions-row top-actions">
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
            >
              <RotateCcw size={16} />
              <span>Limpiar</span>
            </button>
          </div>

          {/* MathInput - Function Input */}
          <div className="pane-section glass-panel">
            <MathInput
              value={expression}
              onChange={setExpression}
              parsed={parsedExpression}
            />
          </div>

          {/* Execution Parameters - HIGH PRIORITY */}
          <div className="pane-section glass-panel execution-params-section">
            <div className="execution-params-header">
              <h3 className="execution-params-title">Parámetros de Ejecución</h3>
              <span className="method-badge-compact">{currentMethod.name}</span>
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

          {/* Method Selector - Simple Dropdown */}
          <div className="pane-section glass-panel">
            <label className="selector-section-label">Cambiar Método</label>
            <select
              value={selectedMethodId}
              onChange={(e) => {
                setSelectedMethodId(e.target.value);
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
          </div>
        </div>

        {/* Right Column: Dynamic Results, Graphs, Tables & Insights */}
        <div className="workspace-right-pane">
          {result ? (
            <div className="results-container">
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
              <FunctionGraph result={null} expression={expression} />

              <div className="placeholder-callout">
                <div className="placeholder-icon-box">
                  <Play size={24} className="placeholder-icon" />
                </div>
                <h4 className="placeholder-title">Listo para Resolver</h4>
                <p className="placeholder-text">
                  Haz clic en <strong>"Calcular Solución"</strong> para ejecutar el método seleccionado, generar la tabla de convergencia completa y visualizar paso a paso la raíz.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
