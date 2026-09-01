import React from 'react';
import './MathKeyboard.css';

interface MathKeyboardProps {
  onInsert: (symbol: string) => void;
  onClear: () => void;
  onBackspace: () => void;
  className?: string;
}

interface KeyConfig {
  label: string;
  latex?: string;
  value: string;
  type?: 'variable' | 'op' | 'func' | 'const' | 'action';
}

export const MathKeyboard: React.FC<MathKeyboardProps> = ({
  onInsert,
  onClear,
  onBackspace,
  className = '',
}) => {
  const keys: KeyConfig[] = [
    { label: 'x', value: 'x', type: 'variable' },
    { label: 'π', value: 'pi', type: 'const' },
    { label: 'e', value: 'e', type: 'const' },
    { label: '(', value: '(', type: 'op' },
    { label: ')', value: ')', type: 'op' },

    { label: 'x²', value: '^2', type: 'op' },
    { label: 'x³', value: '^3', type: 'op' },
    { label: 'xⁿ', value: '^', type: 'op' },
    { label: '√x', value: 'sqrt(', type: 'func' },
    { label: '÷', value: '/', type: 'op' },

    { label: 'sin', value: 'sin(', type: 'func' },
    { label: 'cos', value: 'cos(', type: 'func' },
    { label: 'tan', value: 'tan(', type: 'func' },
    { label: '×', value: '*', type: 'op' },
    { label: '−', value: '-', type: 'op' },

    { label: 'ln', value: 'ln(', type: 'func' },
    { label: 'log₁₀', value: 'log10(', type: 'func' },
    { label: 'eˣ', value: 'exp(', type: 'func' },
    { label: '+', value: '+', type: 'op' },
  ];

  return (
    <div className={`math-keyboard ${className}`}>
      <div className="math-keyboard-header">
        <span className="math-keyboard-title">Teclado Matemático</span>
        <div className="math-keyboard-actions">
          <button
            type="button"
            className="key-btn key-action"
            onClick={onBackspace}
            title="Borrar carácter"
          >
            ⌫
          </button>
          <button
            type="button"
            className="key-btn key-action"
            onClick={onClear}
            title="Limpiar todo"
          >
            C
          </button>
        </div>
      </div>

      <div className="math-keyboard-grid">
        {keys.map((k, idx) => (
          <button
            key={idx}
            type="button"
            className={`key-btn key-${k.type || 'normal'}`}
            onClick={() => onInsert(k.value)}
          >
            {k.label}
          </button>
        ))}
      </div>
    </div>
  );
};
