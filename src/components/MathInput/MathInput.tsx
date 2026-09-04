import React, { useRef, useState } from 'react';
import { MathView } from '../MathView/MathView';
import { MathKeyboard } from '../MathKeyboard/MathKeyboard';
import type { ParsedExpression } from '../../services/ExpressionParser';
import { Sparkles, Keyboard, CheckCircle2, AlertCircle } from 'lucide-react';
import './MathInput.css';

interface MathInputProps {
  value: string;
  onChange: (value: string) => void;
  parsed: ParsedExpression;
  className?: string;
  inputLabel?: string;
  inputSymbol?: string;
  inputPrefix?: string;
}

const PRESETS = [
  { label: 'x³ - 4x - 1', value: 'x^3 - 4*x - 1' },
  { label: 'x³ - x - 2', value: 'x^3 - x - 2' },
  { label: 'e⁻ˣ - x', value: 'exp(-x) - x' },
  { label: 'cos(x) - x', value: 'cos(x) - x' },
  { label: 'x² - 4', value: 'x^2 - 4' },
];

export const MathInput: React.FC<MathInputProps> = ({
  value,
  onChange,
  parsed,
  className = '',
  inputLabel = 'Función Matemática',
  inputSymbol = 'f(x) = 0',
  inputPrefix = 'f(x) =',
}) => {
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInsert = (symbol: string) => {
    if (!inputRef.current) {
      onChange(value + symbol);
      return;
    }

    const start = inputRef.current.selectionStart || value.length;
    const end = inputRef.current.selectionEnd || value.length;
    const newValue = value.substring(0, start) + symbol + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const cursorPosition = start + symbol.length;
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, 10);
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleBackspace = () => {
    if (!inputRef.current) return;
    const start = inputRef.current.selectionStart || value.length;
    const end = inputRef.current.selectionEnd || value.length;

    if (start === end && start > 0) {
      const newValue = value.substring(0, start - 1) + value.substring(end);
      onChange(newValue);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start - 1, start - 1);
        }
      }, 10);
    } else if (start !== end) {
      const newValue = value.substring(0, start) + value.substring(end);
      onChange(newValue);
    }
  };

  return (
    <div className={`math-input-container ${className}`}>
      <div className="math-input-header">
        <label htmlFor="math-input-field" className="math-input-label">
          {inputLabel} <span className="math-symbol">{inputSymbol}</span>
        </label>
        <div className="math-input-tools">
          <button
            type="button"
            className={`keyboard-toggle-btn ${showKeyboard ? 'active' : ''}`}
            onClick={() => setShowKeyboard(!showKeyboard)}
            title="Abrir teclado matemático"
          >
            <Keyboard size={16} />
            <span>Teclado</span>
          </button>
        </div>
      </div>

      {/* Real-time formatted KaTeX equation preview */}
      <div className={`math-preview-card ${parsed.isValid ? 'valid' : value ? 'invalid' : ''}`}>
        <div className="math-preview-label">Visualización formal:</div>
        <div className="math-preview-content">
          {parsed.isValid ? (
            <MathView math={`f(x) = ${parsed.latex || '0'}`} block />
          ) : value ? (
            <span className="math-preview-error">
              <AlertCircle size={14} className="inline-icon" /> Expresión matemática incompleta o inválida
            </span>
          ) : (
            <span className="math-preview-placeholder">Introduce una ecuación (ej: x^3 - 4*x - 1)</span>
          )}
        </div>
        {parsed.isValid && (
          <div className="math-valid-badge">
            <CheckCircle2 size={13} /> Lista para resolver
          </div>
        )}
      </div>

      {/* Raw input field */}
      <div className="input-field-wrapper">
        <span className="input-prefix">{inputPrefix}</span>
        <input
          id="math-input-field"
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="x^3 - 4*x - 1"
          className={`raw-math-input ${parsed.isValid ? 'input-valid' : value ? 'input-invalid' : ''}`}
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button
            type="button"
            className="clear-input-btn"
            onClick={handleClear}
            title="Limpiar"
          >
            ×
          </button>
        )}
      </div>

      {/* Quick example presets - Collapsible */}
      {showPresets && (
        <div className="math-presets-row">
          <span className="presets-title">
            <Sparkles size={12} /> Ejemplos:
          </span>
          <div className="presets-list">
            {PRESETS.map((preset, i) => (
              <button
                key={i}
                type="button"
                className="preset-chip"
                onClick={() => onChange(preset.value)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Toggle presets button */}
      <button
        type="button"
        className="toggle-presets-btn"
        onClick={() => setShowPresets(!showPresets)}
      >
        <Sparkles size={12} />
        <span>{showPresets ? 'Ocultar ejemplos' : 'Mostrar ejemplos'}</span>
      </button>

      {/* Expandable Virtual Math Keyboard */}
      {showKeyboard && (
        <div className="virtual-keyboard-wrapper">
          <MathKeyboard
            onInsert={handleInsert}
            onClear={handleClear}
            onBackspace={handleBackspace}
          />
        </div>
      )}
    </div>
  );
};
