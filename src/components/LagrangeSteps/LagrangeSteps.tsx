import React from 'react';
import { BookOpen } from 'lucide-react';
import type { LagrangeResult } from '../../domain/interpolation/types';
import { polynomialLatex } from '../../domain/interpolation/polynomial';
import { formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../GaussJordanSteps/GaussJordanSteps.css';

const GENERAL_BASIS = 'L_i(x) = \\prod_{\\substack{j=0 \\\\ j \\neq i}}^{n} \\frac{x - x_j}{x_i - x_j}';
const GENERAL_SUM = 'P_n(x) = \\sum_{i=0}^{n} y_i \\, L_i(x)';

export const LagrangeSteps: React.FC<{ result: LagrangeResult }> = ({ result }) => {
  const { basis, points, xStar } = result;
  const last = points.length - 1;

  return (
    <div className="gauss-steps-card">
      <div className="gauss-steps-header">
        <BookOpen size={18} className="gauss-steps-icon" />
        <h4>Procedimiento: Interpolación de Lagrange</h4>
      </div>

      <section className="gauss-block">
        <h5>1. Identificar los datos</h5>
        <p>Hay {points.length} puntos, así que el polinomio es de grado {last}.</p>
        <div className="gauss-formula-box">
          <MathView
            math={`\\begin{aligned}${points
              .map((p, i) => `x_{${i}} = ${formatNumberLatex(p.x)},\\quad f(x_{${i}}) = ${formatNumberLatex(p.y)}`)
              .join(' \\\\ ')}\\end{aligned}`}
            block
          />
        </div>
      </section>

      <section className="gauss-block">
        <h5>2. Polinomios base Lᵢ(x)</h5>
        <p>Cada Lᵢ vale 1 en su propio nodo xᵢ y 0 en todos los demás:</p>
        <div className="gauss-formula-box">
          <MathView math={GENERAL_BASIS} block />
        </div>
        <div className="gauss-steps-list">
          {basis.map((term) => (
            <div className="gauss-step" key={term.index}>
              <div className="gauss-step-heading">
                <span className="gauss-step-number">{term.index}</span>
                <div><strong>{`L${term.index}(x)`}</strong></div>
              </div>
              <div className="gauss-formula-box">
                <MathView
                  math={
                    `L_{${term.index}}(x) = \\frac{${term.numeratorLatex}}{${term.denominatorLatex}}` +
                    ` = \\frac{${term.numeratorLatex}}{${formatNumberLatex(term.denominator)}}` +
                    ` = ${polynomialLatex(term.coefficients)}`
                  }
                  block
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="gauss-block">
        <h5>3. Armar P(x) = Σ yᵢ·Lᵢ(x)</h5>
        <div className="gauss-formula-box">
          <MathView math={GENERAL_SUM} block />
        </div>
        <p>Con los valores de f(xᵢ):</p>
        <div className="gauss-formula-box">
          <MathView math={result.sumLatex} block />
        </div>
        <p>Al sustituir cada Lᵢ(x) y sumar los términos semejantes queda el polinomio expandido:</p>
        <div className="gauss-formula-box emphasized">
          <MathView math={result.expandedLatex} block />
        </div>
      </section>

      <section className="gauss-block">
        <h5>4. Evaluar en x* = {formatNumberLatex(xStar)}</h5>
        <p>Se evalúa cada base en x* y se combinan con los f(xᵢ):</p>
        <div className="gauss-formula-box">
          <MathView
            math={
              `P(${formatNumberLatex(xStar)}) = ` +
              basis.map((t) => `${formatNumberLatex(t.yi)}\\cdot(${formatNumberLatex(t.valueAtXStar)})`).join(' + ') +
              ` = ${formatNumberLatex(result.valueAtXStar, 8)}`
            }
            block
          />
        </div>
      </section>
    </div>
  );
};
