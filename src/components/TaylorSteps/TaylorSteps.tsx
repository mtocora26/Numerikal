import React from 'react';
import { BookOpen, Table } from 'lucide-react';
import type { TaylorResult } from '../../domain/taylor/types';
import { formatNumber, formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../IterationTable/IterationTable.css';
import '../GaussJordanSteps/GaussJordanSteps.css';

const GENERAL_FORMULA =
  "P_n(x) = f(a) + f'(a)(x - a) + \\frac{f''(a)}{2!}(x - a)^2 + \\frac{f'''(a)}{3!}(x - a)^3 + \\cdots + \\frac{f^{(n)}(a)}{n!}(x - a)^n";

const derivativeName = (k: number): string => (k === 0 ? 'f' : k <= 3 ? `f${"'".repeat(k)}` : `f^{(${k})}`);

/** Tabla de derivadas: f⁽ᵏ⁾(x), su valor en a, k! y el coeficiente. */
export const DerivativesTable: React.FC<{ result: TaylorResult }> = ({ result }) => (
  <div className="iteration-table-card">
    <div className="table-header-toolbar">
      <div className="table-title-group">
        <Table size={16} className="title-icon" />
        <h4 className="table-title">Tabla de Derivadas</h4>
        <span className="row-count-badge">a = {formatNumber(result.a)}</span>
      </div>
    </div>

    <div className="table-scroll-container">
      <table className="numerical-table">
        <thead>
          <tr>
            <th className="table-th td-iter"><div className="th-content"><span className="th-label">k</span></div></th>
            <th className="table-th"><div className="th-content"><span className="th-latex"><MathView math="f^{(k)}(x)" /></span></div></th>
            <th className="table-th"><div className="th-content"><span className="th-latex"><MathView math="f^{(k)}(a)" /></span></div></th>
            <th className="table-th"><div className="th-content"><span className="th-latex"><MathView math="k!" /></span></div></th>
            <th className="table-th"><div className="th-content"><span className="th-latex"><MathView math="\frac{f^{(k)}(a)}{k!}" /></span></div></th>
          </tr>
        </thead>
        <tbody>
          {result.terms.map((term) => (
            <tr key={term.order} className="table-row">
              <td className="table-td td-iter">{term.order}</td>
              <td className="table-td"><MathView math={term.derivativeLatex} /></td>
              <td className="table-td">{formatNumber(term.derivativeAtA)}</td>
              <td className="table-td">{term.factorial}</td>
              <td className="table-td">{formatNumber(term.coefficient)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export const TaylorSteps: React.FC<{ result: TaylorResult }> = ({ result }) => {
  const { a, xStar, degree, terms } = result;
  const aLatex = formatNumberLatex(a);

  return (
    <div className="gauss-steps-card">
      <div className="gauss-steps-header">
        <BookOpen size={18} className="gauss-steps-icon" />
        <h4>Procedimiento: Polinomio de {result.isMaclaurin ? 'Maclaurin' : 'Taylor'}</h4>
      </div>

      <section className="gauss-block">
        <h5>1. Función y fórmula</h5>
        <div className="gauss-formula-box">
          <MathView math={`f(x) = ${result.functionLatex}`} block />
        </div>
        <p>
          El polinomio de grado {degree} alrededor de a = {formatNumber(a)} cumple P⁽ᵏ⁾(a) = f⁽ᵏ⁾(a) para k = 0, …, {degree}:
        </p>
        <div className="gauss-formula-box">
          <MathView math={GENERAL_FORMULA} block />
        </div>
        {result.isMaclaurin && <p>Como a = 0, el polinomio se llama de <strong>Maclaurin</strong>.</p>}
      </section>

      <section className="gauss-block">
        <h5>2. Derivar hasta el orden {degree}</h5>
        <div className="gauss-steps-list">
          {terms.map((term) => (
            <div className="gauss-step" key={term.order}>
              <div className="gauss-step-heading">
                <span className="gauss-step-number">{term.order}</span>
                <div><strong>{term.order === 0 ? 'Función original' : `Derivada de orden ${term.order}`}</strong></div>
              </div>
              <div className="gauss-formula-box">
                <MathView
                  math={
                    `${derivativeName(term.order)}(x) = ${term.derivativeLatex}` +
                    ` \\quad\\Rightarrow\\quad ${derivativeName(term.order)}(${aLatex}) = ${formatNumberLatex(term.derivativeAtA)}`
                  }
                  block
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="gauss-block">
        <h5>3. Coeficientes f⁽ᵏ⁾(a) / k!</h5>
        <div className="gauss-formula-box">
          <MathView
            math={`\\begin{aligned}${terms
              .map(
                (t) =>
                  `c_{${t.order}} &= \\frac{${formatNumberLatex(t.derivativeAtA)}}{${t.order}!}` +
                  ` = \\frac{${formatNumberLatex(t.derivativeAtA)}}{${t.factorial}} = ${formatNumberLatex(t.coefficient)}`
              )
              .join(' \\\\ ')}\\end{aligned}`}
            block
          />
        </div>
      </section>

      <section className="gauss-block">
        <h5>4. Armar el polinomio</h5>
        <div className="gauss-formula-box">
          <MathView math={result.substitutedLatex} block />
        </div>
        {!result.isMaclaurin && (
          <>
            <p>Al desarrollar las potencias de (x − {aLatex}) y reducir términos semejantes queda, en potencias de x:</p>
            <div className="gauss-formula-box emphasized">
              <MathView math={result.expandedLatex} block />
            </div>
          </>
        )}
      </section>

      <section className="gauss-block">
        <h5>5. Evaluar en x* = {formatNumberLatex(xStar)}</h5>
        <div className="gauss-formula-box">
          <MathView math={`P(${formatNumberLatex(xStar)}) = ${formatNumberLatex(result.valueAtXStar, 8)}`} block />
        </div>
        {result.exactValue !== null && result.absoluteError !== null && (
          <div className="gauss-formula-box">
            <MathView
              math={
                `f(${formatNumberLatex(xStar)}) = ${formatNumberLatex(result.exactValue, 8)}` +
                `, \\quad \\lvert f(x^*) - P(x^*) \\rvert = ${formatNumberLatex(result.absoluteError)}`
              }
              block
            />
          </div>
        )}
      </section>
    </div>
  );
};
