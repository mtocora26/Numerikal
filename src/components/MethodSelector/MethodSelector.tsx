import React from 'react';
import type { MethodMetadata } from '../../factories/MethodFactory';
import { MathView } from '../MathView/MathView';
import { Check } from 'lucide-react';
import './MethodSelector.css';

interface MethodSelectorProps {
  methods: MethodMetadata[];
  selectedMethodId: string;
  onSelectMethod: (methodId: string) => void;
  className?: string;
}

export const MethodSelector: React.FC<MethodSelectorProps> = ({
  methods,
  selectedMethodId,
  onSelectMethod,
  className = '',
}) => {
  return (
    <div className={`method-selector-container ${className}`}>
      <label className="selector-section-label">Selecciona el Método Numérico</label>
      <div className="methods-cards-grid">
        {methods.map((method) => {
          const isSelected = method.id === selectedMethodId;
          return (
            <div
              key={method.id}
              className={`method-option-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectMethod(method.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectMethod(method.id);
                }
              }}
            >
              <div className="method-card-header">
                <span className="method-icon">{method.icon}</span>
                <span className="method-badge">{method.tag}</span>
                {isSelected && (
                  <span className="selected-indicator">
                    <Check size={14} />
                  </span>
                )}
              </div>

              <h4 className="method-card-title">{method.name}</h4>

              <div className="method-card-formula">
                <span className="formula-label">Fórmula:</span>
                <MathView math={method.latexFormula} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
