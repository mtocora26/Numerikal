import React from 'react';
import { BookOpen, Table } from 'lucide-react';
import type { NewtonResult } from '../../domain/interpolation/types';
import { formatNumber, formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../IterationTable/IterationTable.css';
import '../RegressionTables/RegressionTables.css';
import '../GaussJordanSteps/GaussJordanSteps.css';
import './NewtonSteps.css';

const GENERAL_DIFFERENCE =
  'f[x_i, \\ldots, x_{i+k}] = \\frac{f[x_{i+1}, \\ldots, x_{i+k}] - f[x_i, \\ldots, x_{i+k-1}]}{x_{i+k} - x_i}';

const headerLatex = (k: number): string =>
  k === 0 ? 'f[x_i]' : k === 1 ? 'f[x_i, x_{i+1}]' : `f[x_i, \\ldots, x_{i+${k}}]`;

/** Tabla triangular: una fila por nodo y una columna por orden; la primera fila (coeficientes) va resaltada. */
export const DividedDifferencesTable: React.FC<{ result: NewtonResult }> = ({ result }) => {
  const { columns, points } = result;

  return (
    <div className="iteration-table-card">
      <div className="table-header-toolbar">
        <div className="table-title-group">
          <Table size={16} className="title-icon" />
          <h4 className="table-title">Tabla de Diferencias Divididas</h4>
          <span className="row-count-badge">n = {points.length}</span>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="numerical-table">
          <thead>
            <tr>
              <th className="table-th td-iter"><div className="th-content"><span className="th-label">i</span></div></th>
              <th className="table-th"><div className="th-content"><span className="th-latex"><MathView math="x_i" /></span></div></th>
              {columns.map((_, k) => (
                <th key={k} className="table-th">
                  <div className="th-content">
                    <span className="th-label">{k === 0 ? 'f(xᵢ)' : `Orden ${k}`}</span>
                    <span className="th-latex"><MathView math={headerLatex(k)} /></span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={i} className="table-row">
                <td className="table-td td-iter">{i}</td>
                <td className="table-td">{formatNumber(p.x)}</td>
                {columns.map((column, k) => {
                  const entry = column[i];
                  return (
                    <td key={k} className={`table-td ${entry && i === 0 ? 'newton-coefficient-cell' : ''}`}>
                      {entry ? formatNumber(entry.value) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="newton-table-note">
        Los valores resaltados (primera fila) son los coeficientes del polinomio de Newton.
      </p>
    </div>
  );
};

export const NewtonSteps: React.FC<{ result: NewtonResult }> = ({ result }) => {
  const { columns, points, xStar, newtonCoefficients } = result;

  return (
    <div className="gauss-steps-card">
      <div className="gauss-steps-header">
        <BookOpen size={18} className="gauss-steps-icon" />
        <h4>Procedimiento: Diferencias Divididas de Newton</h4>
      </div>

      <section className="gauss-block">
        <h5>1. Identificar los datos</h5>
        <p>Hay {points.length} puntos, así que el polinomio es de grado {points.length - 1}.</p>
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
        <h5>2. Calcular las diferencias divididas</h5>
        <p>Cada columna se obtiene de la anterior; las diferencias de orden 0 son los valores f(xᵢ):</p>
        <div className="gauss-formula-box">
          <MathView math={GENERAL_DIFFERENCE} block />
        </div>
        <div className="gauss-steps-list">
          {columns.slice(1).map((column, idx) => (
            <div className="gauss-step" key={idx}>
              <div className="gauss-step-heading">
                <span className="gauss-step-number">{idx + 1}</span>
                <div><strong>Diferencias de orden {idx + 1}</strong></div>
              </div>
              <div className="gauss-formula-box">
                <MathView
                  math={`\\begin{aligned}${column.map((e) => e.formulaLatex).join(' \\\\ ')}\\end{aligned}`}
                  block
                />
              </div>
            </div>
          ))}
        </div>
        <p>La primera fila de la tabla (resaltada en la pestaña <strong>Tabla</strong>) da los coeficientes:</p>
        <div className="gauss-formula-box">
          <MathView
            math={newtonCoefficients.map((c, k) => `${columns[k][0].labelLatex} = ${formatNumberLatex(c)}`).join(',\\quad ')}
            block
          />
        </div>
      </section>

      <section className="gauss-block">
        <h5>3. Armar el polinomio de Newton</h5>
        <div className="gauss-formula-box">
          <MathView math={result.symbolicLatex} block />
        </div>
        <p>Con los valores de la tabla y los nodos:</p>
        <div className="gauss-formula-box">
          <MathView math={result.substitutedLatex} block />
        </div>
        <p>Al multiplicar y reducir términos semejantes queda el polinomio expandido:</p>
        <div className="gauss-formula-box emphasized">
          <MathView math={result.expandedLatex} block />
        </div>
        <p className="newton-note">
          Es el mismo polinomio que da Lagrange con estos datos: solo cambia la forma de construirlo.
        </p>
      </section>

      <section className="gauss-block">
        <h5>4. Evaluar en x* = {formatNumberLatex(xStar)}</h5>
        <div className="gauss-formula-box">
          <MathView math={`P(${formatNumberLatex(xStar)}) = ${formatNumberLatex(result.valueAtXStar, 8)}`} block />
        </div>
      </section>
    </div>
  );
};
