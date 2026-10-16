import React from 'react';
import { BookOpen, Table } from 'lucide-react';
import type { NevilleResult } from '../../domain/interpolation/types';
import { formatNumber, formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../IterationTable/IterationTable.css';
import '../RegressionTables/RegressionTables.css';
import '../GaussJordanSteps/GaussJordanSteps.css';
import '../NewtonSteps/NewtonSteps.css';

const headerLatex = (k: number): string => `P_{i,i${k === 0 ? '' : `+${k}`}}`;

/** Tabla de Neville como en clase: una fila por nodo, una columna por orden; el valor final P₀,ₙ va resaltado. */
export const NevilleTable: React.FC<{ result: NevilleResult }> = ({ result }) => {
  const { columns, points } = result;
  const last = columns.length - 1;

  return (
    <div className="iteration-table-card">
      <div className="table-header-toolbar">
        <div className="table-title-group">
          <Table size={16} className="title-icon" />
          <h4 className="table-title">Tabla de Neville</h4>
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
                    <span className="th-label">Columna {k + 1}</span>
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
                    <td key={k} className={`table-td ${entry && i === 0 && k === last ? 'newton-coefficient-cell' : ''}`}>
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
        El valor resaltado (última columna) es P₀,ₙ(x*): el valor del polinomio interpolante en x*.
      </p>
    </div>
  );
};

export const NevilleSteps: React.FC<{ result: NevilleResult }> = ({ result }) => {
  const { columns, points, xStar } = result;
  const last = columns.length - 1;

  return (
    <div className="gauss-steps-card">
      <div className="gauss-steps-header">
        <BookOpen size={18} className="gauss-steps-icon" />
        <h4>Procedimiento: Interpolación de Neville</h4>
      </div>

      <section className="gauss-block">
        <h5>1. Identificar los datos</h5>
        <p>
          Hay {points.length} puntos y se evalúa en x* = {formatNumberLatex(xStar)}. La primera columna de la tabla son los
          valores P<sub>i,i</sub> = f(xᵢ):
        </p>
        <div className="gauss-formula-box">
          <MathView
            math={`\\begin{aligned}${points
              .map((p, i) => `x_{${i}} = ${formatNumberLatex(p.x)},\\quad P_{${i},${i}} = ${formatNumberLatex(p.y)}`)
              .join(' \\\\ ')}\\end{aligned}`}
            block
          />
        </div>
      </section>

      <section className="gauss-block">
        <h5>2. Llenar la tabla con la recurrencia</h5>
        <p>Cada columna se calcula con la anterior, sustituyendo x* y los nodos:</p>
        <div className="gauss-formula-box">
          <MathView math={result.recurrenceLatex} block />
        </div>
        <div className="gauss-steps-list">
          {columns.slice(1).map((column, idx) => (
            <div className="gauss-step" key={idx}>
              <div className="gauss-step-heading">
                <span className="gauss-step-number">{idx + 1}</span>
                <div><strong>Columna {idx + 2}: P<sub>i,i+{idx + 1}</sub></strong></div>
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
      </section>

      <section className="gauss-block">
        <h5>3. Valor final</h5>
        <p>La última columna tiene un solo valor, P<sub>0,{last}</sub>, que es el polinomio de grado {last} evaluado en x*:</p>
        <div className="gauss-formula-box emphasized">
          <MathView math={`P(${formatNumberLatex(xStar)}) = P_{0,${last}} = ${formatNumberLatex(result.valueAtXStar, 8)}`} block />
        </div>
      </section>

      <section className="gauss-block">
        <h5>4. Polinomio expandido (opcional)</h5>
        <p>Neville no necesita el polinomio para dar el valor; al aplicar la misma recurrencia a los polinomios se obtiene:</p>
        <div className="gauss-formula-box">
          <MathView math={result.expandedLatex} block />
        </div>
        <p className="newton-note">Es el mismo polinomio que dan Lagrange y Newton con estos datos.</p>
      </section>
    </div>
  );
};
