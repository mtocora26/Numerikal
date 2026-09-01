import React from 'react';
import type { MethodExecutionResult } from '../../domain/types';
import { MathView } from '../MathView/MathView';
import { BookOpen, Lightbulb, CheckCircle2 } from 'lucide-react';
import './EducationalExplanation.css';

interface EducationalExplanationProps {
  result: MethodExecutionResult;
  className?: string;
}

export const EducationalExplanation: React.FC<EducationalExplanationProps> = ({
  result,
  className = '',
}) => {
  const { educationalInsights, explanations } = result;

  return (
    <div className={`educational-panel-card ${className}`}>
      <div className="edu-panel-header">
        <div className="edu-title-group">
          <BookOpen size={18} className="edu-icon" />
          <h4 className="edu-title">Comprensión y Análisis Pedagógico</h4>
        </div>
        <span className="edu-badge">Enfoque Didáctico</span>
      </div>

      {/* Conceptual Summary & Key Formulas */}
      <div className="edu-concepts-grid">
        <div className="concept-box">
          <span className="concept-label">Fundamento Teórico</span>
          <p className="concept-text">{educationalInsights.methodSummary}</p>
        </div>

        <div className="concept-box">
          <span className="concept-label">Fórmula Recursiva Principal</span>
          <div className="formula-display-area">
            <MathView math={educationalInsights.keyFormula} block />
          </div>
        </div>

        <div className="concept-box">
          <span className="concept-label">Condición de Convergencia</span>
          <div className="formula-display-area">
            <MathView math={educationalInsights.convergenceCondition} block />
          </div>
        </div>
      </div>

      {/* Step by Step Walkthrough */}
      {explanations && explanations.length > 0 && (
        <div className="step-walkthrough-section">
          <h5 className="walkthrough-title">
            <Lightbulb size={16} /> Explicación Detallada de las Iteraciones Clave
          </h5>
          <div className="steps-list">
            {explanations.map((step) => (
              <div key={step.stepNumber} className="step-card">
                <div className="step-card-header">
                  <span className="step-number-tag">{step.stepNumber}</span>
                  <span className="step-card-title">{step.title}</span>
                </div>
                <p className="step-desc">{step.description}</p>
                {step.latexFormula && (
                  <div className="step-formula-box">
                    <MathView math={step.latexFormula} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Method Remarks & Tips */}
      {educationalInsights.remarks && educationalInsights.remarks.length > 0 && (
        <div className="remarks-section">
          <h5 className="remarks-title">Observaciones Clave para el Estudiante:</h5>
          <ul className="remarks-list">
            {educationalInsights.remarks.map((rem, idx) => (
              <li key={idx} className="remark-item">
                <CheckCircle2 size={14} className="remark-check" />
                <span>
                  <MathView math={rem} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
