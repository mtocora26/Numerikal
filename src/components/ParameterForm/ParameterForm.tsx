import React, { useEffect, useState } from 'react';
import type { MethodParameterDef, ErrorType } from '../../domain/types';
import { MathView } from '../MathView/MathView';
import { Sliders, HelpCircle } from 'lucide-react';
import './ParameterForm.css';

const TOLERANCE_PRESETS = [0.01, 0.001, 0.0001, 0.000001, 1e-8];

interface NumberFieldProps {
  id: string;
  value: number;
  step?: string | number;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
  onValueChange: (value: number) => void;
}

// Keeps its own text so users can freely clear/retype (e.g. delete a lone "0")
// without the controlled numeric value snapping the input back on every keystroke.
const NumberField: React.FC<NumberFieldProps> = ({
  id,
  value,
  step,
  min,
  max,
  placeholder,
  className,
  onValueChange,
}) => {
  const [raw, setRaw] = useState<string>(Number.isNaN(value) ? '' : String(value));

  useEffect(() => {
    setRaw(Number.isNaN(value) ? '' : String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <input
      id={id}
      type="number"
      step={step ?? 'any'}
      min={min}
      max={max}
      value={raw}
      placeholder={placeholder}
      className={className}
      onChange={(e) => {
        const text = e.target.value;
        setRaw(text);
        const num = parseFloat(text);
        onValueChange(num);
      }}
      onBlur={() => {
        if (raw.trim() === '' || Number.isNaN(parseFloat(raw))) {
          setRaw(String(value));
        }
      }}
    />
  );
};

interface ParameterFormProps {
  parameters: MethodParameterDef[];
  values: Record<string, number>;
  onChangeParam: (name: string, value: number) => void;
  tolerance: number;
  onChangeTolerance: (tol: number) => void;
  maxIterations: number;
  onChangeMaxIterations: (max: number) => void;
  errorType: ErrorType;
  onChangeErrorType: (type: ErrorType) => void;
  evaluateExpression?: (x: number) => number;
  requiresSignChange?: boolean;
  className?: string;
}

export const ParameterForm: React.FC<ParameterFormProps> = ({
  parameters,
  values,
  onChangeParam,
  tolerance,
  onChangeTolerance,
  maxIterations,
  onChangeMaxIterations,
  errorType,
  onChangeErrorType,
  evaluateExpression,
  requiresSignChange = false,
  className = '',
}) => {
  const isCustomTolerance = !TOLERANCE_PRESETS.includes(tolerance);
  const [showCustomTolerance, setShowCustomTolerance] = useState(isCustomTolerance);

  // Live f(value) per parameter, used for the sign preview badges below each field
  const paramSigns: Record<string, number> = {};
  if (evaluateExpression) {
    for (const param of parameters) {
      const val = values[param.name] ?? param.defaultValue;
      if (!Number.isNaN(val)) {
        const fVal = evaluateExpression(val);
        if (Number.isFinite(fVal)) {
          paramSigns[param.name] = fVal;
        }
      }
    }
  }

  // Bolzano check: with two bracket params (xi/xs) same-sign f values mean no guaranteed root
  const bracketNames = ['xi', 'xs'];
  const hasBracket = bracketNames.every((n) => n in paramSigns);
  const signMismatch =
    requiresSignChange && hasBracket && paramSigns.xi * paramSigns.xs > 0;

  return (
    <div className={`parameter-form-container ${className}`}>
      <div className="form-header">
        <h4 className="form-title">
          <Sliders size={16} /> Parámetros de Ejecución
        </h4>
      </div>

      {/* Dynamic method-specific parameters (e.g. [a, b] or x0) */}
      <div className="method-params-grid">
        {parameters.map((param) => {
          const val = values[param.name] ?? param.defaultValue;
          const fVal = paramSigns[param.name];
          const isBracketField = signMismatch && bracketNames.includes(param.name);
          return (
            <div key={param.name} className="param-field-group">
              <div className="param-label-row">
                <label htmlFor={`param-${param.name}`} className="param-label">
                  {param.latexLabel ? (
                    <MathView math={param.latexLabel} />
                  ) : (
                    param.label
                  )}
                  <span className="param-subname">({param.name})</span>
                </label>
                <span className="param-tooltip-trigger" title={param.description}>
                  <HelpCircle size={13} />
                </span>
              </div>
              <NumberField
                id={`param-${param.name}`}
                value={val}
                step={param.step}
                placeholder={param.placeholder}
                className={`param-number-input ${isBracketField ? 'input-sign-invalid' : ''}`}
                onValueChange={(num) => onChangeParam(param.name, num)}
              />
              {fVal !== undefined && (
                <span className={`live-sign-badge ${fVal > 0 ? 'sign-positive' : fVal < 0 ? 'sign-negative' : 'sign-zero'}`}>
                  f({param.name}) {fVal > 0 ? '>' : fVal < 0 ? '<' : '='} 0
                </span>
              )}
            </div>
          );
        })}
      </div>

      {signMismatch && (
        <div className="sign-mismatch-alert">
          <HelpCircle size={14} />
          <span>
            f(xi) y f(xs) tienen el <strong>mismo signo</strong>: Bolzano no garantiza una raíz en este intervalo. Ajusta xi o xs.
          </span>
        </div>
      )}

      {/* Stopping conditions: Tolerance, Max Iterations, Error Type */}
      <div className="stopping-conditions-grid">
        <div className="param-field-group">
          <div className="param-label-row">
            <label htmlFor="param-tolerance" className="param-label">
              Tolerancia <span className="param-subname">(Tol)</span>
            </label>
          </div>
          <select
            id="param-tolerance"
            value={showCustomTolerance ? 'custom' : tolerance}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setShowCustomTolerance(true);
                return;
              }
              setShowCustomTolerance(false);
              onChangeTolerance(parseFloat(e.target.value));
            }}
            className="param-select-input"
          >
            <option value={0.01}>0.01 (10⁻² - Rápida)</option>
            <option value={0.001}>0.001 (10⁻³ - Estándar)</option>
            <option value={0.0001}>0.0001 (10⁻⁴ - Precisa)</option>
            <option value={0.000001}>0.000001 (10⁻⁶ - Alta precisión)</option>
            <option value={1e-8}>10⁻⁸ (Máxima precisión)</option>
            <option value="custom">Personalizada (ingresar manualmente)</option>
          </select>
          {showCustomTolerance && (
            <NumberField
              id="param-tolerance-custom"
              value={tolerance}
              step="any"
              placeholder="Ej. 0.0005"
              className="param-number-input custom-tolerance-input"
              onValueChange={(num) => onChangeTolerance(num)}
            />
          )}
        </div>

        <div className="param-field-group">
          <div className="param-label-row">
            <label htmlFor="param-max-iter" className="param-label">
              Máx. Iteraciones
            </label>
          </div>
          <NumberField
            id="param-max-iter"
            value={maxIterations}
            min={1}
            max={500}
            step={1}
            className="param-number-input"
            onValueChange={(num) => onChangeMaxIterations(Number.isNaN(num) ? NaN : Math.trunc(num))}
          />
        </div>

        <div className="param-field-group">
          <div className="param-label-row">
            <label htmlFor="param-error-type" className="param-label">
              Tipo de Error
            </label>
          </div>
          <select
            id="param-error-type"
            value={errorType}
            onChange={(e) => onChangeErrorType(e.target.value as ErrorType)}
            className="param-select-input"
          >
            <option value="relative">Error Relativo (|xr - xr_ant| / |xr|)</option>
            <option value="absolute">Error Absoluto (|xr - xr_ant|)</option>
            <option value="percentage">Error Porcentual (%)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
