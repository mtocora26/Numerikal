import React, { useMemo } from 'react';
import type { MethodExecutionResult } from '../../domain/types';
import { MathView } from '../MathView/MathView';
import { FormattedMathText } from '../MathView/FormattedMathText';
import { DerivativeStepExplainer } from '../../services/DerivativeStepExplainer';
import { BookOpen, Lightbulb, CheckCircle2, Sparkles } from 'lucide-react';
import './EducationalExplanation.css';

interface EducationalExplanationProps {
  result: MethodExecutionResult;
  className?: string;
}

export const EducationalExplanation: React.FC<EducationalExplanationProps> = ({
  result,
  className = '',
}) => {
  const { educationalInsights, explanations, methodId, expression } = result;

  const needsDerivatives = methodId === 'newton-raphson' || methodId === 'modified-newton-raphson';

  const derivSteps = useMemo(() => {
    if (!needsDerivatives || !expression) return null;
    return DerivativeStepExplainer.explain(expression);
  }, [needsDerivatives, expression]);

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
          <p className="concept-text">
            <FormattedMathText text={educationalInsights.methodSummary} />
          </p>
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

      {/* Derivative Step-by-Step Breakdown for Newton / Newton Modificado */}
      {derivSteps && derivSteps.isValid && (
        <div className="step-walkthrough-section">
          <h5 className="walkthrough-title">
            <Sparkles size={16} /> Obtención Paso a Paso de las Derivadas Necesarias
          </h5>
          <div className="deriv-edu-steps-grid">
            {/* First derivative */}
            <div className="deriv-edu-col">
              <span className="col-badge d1-badge">Primera Derivada f'(x)</span>
              <div className="steps-list">
                {derivSteps.d1Steps.map((step) => (
                  <div key={step.stepNumber} className="step-card">
                    <div className="step-card-header">
                      <span className="step-number-tag">{step.stepNumber}</span>
                      <span className="step-card-title">{step.ruleName}</span>
                    </div>
                    <div className="step-formula-box">
                      <MathView math={step.latexFormula} />
                    </div>
                    <p className="step-desc">
                      <FormattedMathText text={step.explanation} />
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Second derivative if modified newton */}
            {methodId === 'modified-newton-raphson' && (
              <div className="deriv-edu-col">
                <span className="col-badge d2-badge">Segunda Derivada f''(x)</span>
                <div className="steps-list">
                  {derivSteps.d2Steps.map((step) => (
                    <div key={step.stepNumber} className="step-card">
                      <div className="step-card-header">
                        <span className="step-number-tag d2-tag-bg">{step.stepNumber}</span>
                        <span className="step-card-title">{step.ruleName}</span>
                      </div>
                      <div className="step-formula-box">
                        <MathView math={step.latexFormula} />
                      </div>
                      <p className="step-desc">
                        <FormattedMathText text={step.explanation} />
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
                <p className="step-desc">
                  <FormattedMathText text={step.description} />
                </p>
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
                <CheckCircle2 size={16} className="remark-check" />
                <span className="remark-text">
                  <FormattedMathText text={rem} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
