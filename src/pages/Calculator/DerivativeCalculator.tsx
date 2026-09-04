import React, { useMemo, useState } from 'react';
import { derivative, parse } from 'mathjs';
import { AlertTriangle, CheckCircle2, RotateCcw, Sigma } from 'lucide-react';
import { MathInput } from '../../components/MathInput/MathInput';
import { MathView } from '../../components/MathView/MathView';
import { DerivativeStepExplainer } from '../../services/DerivativeStepExplainer';
import { ExpressionParser } from '../../services/ExpressionParser';

const readableExplanation = (ruleName: string): string => {
  if (ruleName === 'Regla de la Suma y Resta') return 'Separamos los términos y derivamos cada uno conservando su signo.';
  if (ruleName === 'Regla del Producto') return 'Derivamos el primer factor manteniendo el segundo y luego el segundo manteniendo el primero.';
  if (ruleName === 'Regla del Múltiplo Constante') return 'La constante se conserva y derivamos la función que depende de x.';
  if (ruleName === 'Regla de la Cadena') return 'Derivamos la función exterior y multiplicamos por la derivada de la función interior.';
  if (ruleName === 'Regla de la Potencia') return 'Multiplicamos por el exponente y reducimos el exponente en una unidad.';
  if (ruleName.includes('Coseno')) return 'La derivada de coseno es menos seno.';
  if (ruleName.includes('Seno')) return 'La derivada de seno es coseno.';
  if (ruleName === 'Regla Exponencial') return 'La derivada de la exponencial conserva la exponencial.';
  if (ruleName === 'Regla de la Constante') return 'La derivada de una constante es cero.';
  return 'Aplicamos la regla de derivación correspondiente a esta expresión.';
};

const cubeRootDerivativeLatex = (expression: string): string | null => {
  const clean = ExpressionParser.sanitize(expression);
  if (!clean.toLowerCase().startsWith('cbrt(') || !clean.endsWith(')')) return null;
  const argument = clean.slice(5, -1);
  try {
    const node = parse(argument);
    const argumentLatex = node.toTex({ parenthesis: 'keep' });
    const derivativeLatex = derivative(node, 'x').toTex({ parenthesis: 'keep' });
    return `\\frac{${derivativeLatex}}{3\\left(${argumentLatex}\\right)^{\\frac{2}{3}}}`;
  } catch {
    return null;
  }
};

export const DerivativeCalculator: React.FC = () => {
  const [expression, setExpression] = useState('x^3 - 4*x - 1');
  const [point, setPoint] = useState<number | null>(null);
  const parsed = useMemo(() => ExpressionParser.parse(expression), [expression]);
  const explanation = useMemo(
    () => parsed.isValid ? DerivativeStepExplainer.explain(expression) : null,
    [expression, parsed.isValid]
  );
  const displayedFirstDerivative = cubeRootDerivativeLatex(expression) || explanation?.d1Latex || parsed.derivativeLatex || '?';

  const values = useMemo(() => {
    if (!parsed.isValid || point === null || !Number.isFinite(point)) return null;
    try {
      const node = parse(ExpressionParser.normalizeForDifferentiation(parsed.rawExpression));
      const secondDerivativeNode = derivative(derivative(node, 'x'), 'x');
      const secondDerivative = secondDerivativeNode.compile().evaluate({ x: point, e: Math.E, pi: Math.PI });
      return {
        functionValue: parsed.evaluate(point),
        firstDerivative: parsed.derivative?.(point) ?? NaN,
        secondDerivative: typeof secondDerivative === 'number' ? secondDerivative : NaN,
      };
    } catch {
      return { functionValue: parsed.evaluate(point), firstDerivative: parsed.derivative?.(point) ?? NaN, secondDerivative: NaN };
    }
  }, [parsed, point]);

  return (
    <div className="derivative-session">
      <div className="derivative-session-header">
        <div>
          <div className="header-badge"><Sigma size={13} /><span>Calculadora simbólica</span></div>
          <h2 className="derivative-session-title">Calcula la derivada de una función</h2>
          <p className="derivative-session-subtitle">Obtén la primera y segunda derivada, y evalúalas en cualquier punto.</p>
        </div>
        <button type="button" className="btn-secondary derivative-reset-btn" onClick={() => { setExpression('x^3 - 4*x - 1'); setPoint(null); }} title="Restablecer">
          <RotateCcw size={16} />
          <span>Restablecer</span>
        </button>
      </div>

      <div className="derivative-grid">
        <div className="derivative-input-column">
          <div className="pane-section glass-panel"><MathInput value={expression} onChange={setExpression} parsed={parsed} /></div>
          <div className="pane-section glass-panel derivative-point-panel">
            <label htmlFor="derivative-point">Evaluación numérica (opcional)</label>
            <p>Escribe un valor de x si también quieres conocer el valor de la función y sus derivadas en ese punto.</p>
            <input id="derivative-point" type="number" value={point ?? ''} onChange={(event) => setPoint(event.target.value === '' ? null : Number(event.target.value))} placeholder="Ej. 2" step="any" />
          </div>
        </div>

        <div className="derivative-results-column">
          {!parsed.isValid ? (
            <div className="derivative-message derivative-error"><AlertTriangle size={18} /><span>{parsed.errorMessage || 'Introduce una expresión válida.'}</span></div>
          ) : (
            <>
              <div className="derivative-formulas glass-panel">
                <div className="derivative-formula-row"><span>Función original</span><MathView math={`f(x) = ${parsed.latex}`} block /></div>
                <div className="derivative-formula-row emphasized"><span>Primera derivada</span><MathView math={`f'(x) = ${displayedFirstDerivative}`} block /></div>
                <div className="derivative-formula-row"><span>Segunda derivada</span><MathView math={`f''(x) = ${explanation?.d2Latex || '?'}`} block /></div>
              </div>
              {point !== null && <div className="derivative-values glass-panel">
                <div className="derivative-values-heading"><CheckCircle2 size={17} /><h3>Evaluación en x = {point}</h3></div>
                <div className="derivative-values-grid">
                  <div><span>f(x)</span><strong>{values && Number.isFinite(values.functionValue) ? values.functionValue.toFixed(6) : 'No definida'}</strong></div>
                  <div><span>f&apos;(x)</span><strong>{values && Number.isFinite(values.firstDerivative) ? values.firstDerivative.toFixed(6) : 'No definida'}</strong></div>
                  <div><span>f&apos;&apos;(x)</span><strong>{values && Number.isFinite(values.secondDerivative) ? values.secondDerivative.toFixed(6) : 'No definida'}</strong></div>
                </div>
              </div>}
              {explanation && explanation.d1Steps.length > 0 && <div className="derivative-steps glass-panel">
                <h3>Proceso de derivación</h3>
                {explanation.d1Steps.map((step) => <div className="derivative-step" key={step.stepNumber}><span className="derivative-step-number">{step.stepNumber}</span><div><strong>{step.ruleName}: {step.title}</strong><MathView math={step.latexFormula} block /><p>{readableExplanation(step.ruleName)}</p></div></div>)}
              </div>}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
