import React from 'react';
import { Sigma, Table } from 'lucide-react';
import type { DataPoint, RegressionResult } from '../../domain/regression/types';
import { formatNumber } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../IterationTable/IterationTable.css';
import './RegressionTables.css';

export const SummationTable: React.FC<{ result: RegressionResult }> = ({ result }) => {
  const { columns, rows, totals } = result.summationTable;

  return (
    <div className="iteration-table-card">
      <div className="table-header-toolbar">
        <div className="table-title-group">
          <Sigma size={16} className="title-icon" />
          <h4 className="table-title">Tabla de Sumatorias</h4>
          <span className="row-count-badge">n = {rows.length}</span>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="numerical-table">
          <thead>
            <tr>
              <th className="table-th td-iter">
                <div className="th-content"><span className="th-label">i</span></div>
              </th>
              {columns.map((col) => (
                <th key={col.key} className="table-th">
                  <div className="th-content">
                    <span className="th-label">{col.label}</span>
                    <span className="th-latex"><MathView math={col.latexLabel} /></span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index} className="table-row">
                <td className="table-td td-iter">{index + 1}</td>
                {columns.map((col) => (
                  <td key={col.key} className="table-td">{formatNumber(row[col.key])}</td>
                ))}
              </tr>
            ))}
            <tr className="table-row row-highlight-final summation-total-row">
              <td className="table-td td-iter">Σ</td>
              {columns.map((col) => (
                <td key={col.key} className="table-td">{formatNumber(totals[col.key])}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const ResidualsTable: React.FC<{ result: RegressionResult; points: DataPoint[] }> = ({ result, points }) => (
  <div className="iteration-table-card">
    <div className="table-header-toolbar">
      <div className="table-title-group">
        <Table size={16} className="title-icon" />
        <h4 className="table-title">Residuos del Ajuste</h4>
        <span className="row-count-badge">Sr = {formatNumber(result.sr)}</span>
      </div>
    </div>

    <div className="table-scroll-container">
      <table className="numerical-table">
        <thead>
          <tr>
            {[
              ['i', 'i'],
              ['x', 'x_i'],
              ['y (dato)', 'y_i'],
              ['ŷ (modelo)', '\\hat{y}_i'],
              ['Residuo', 'y_i - \\hat{y}_i'],
              ['Residuo²', '(y_i - \\hat{y}_i)^2'],
              ['(y − ȳ)²', '(y_i - \\bar{y})^2'],
            ].map(([label, latex]) => (
              <th key={label} className="table-th">
                <div className="th-content">
                  <span className="th-label">{label}</span>
                  <span className="th-latex"><MathView math={latex} /></span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i} className="table-row">
              <td className="table-td td-iter">{i + 1}</td>
              <td className="table-td">{formatNumber(p.x)}</td>
              <td className="table-td">{formatNumber(p.y)}</td>
              <td className="table-td">{formatNumber(result.fitted[i])}</td>
              <td className="table-td">{formatNumber(result.residuals[i])}</td>
              <td className="table-td">{formatNumber(result.residuals[i] ** 2)}</td>
              <td className="table-td">{formatNumber((p.y - result.meanY) ** 2)}</td>
            </tr>
          ))}
          <tr className="table-row row-highlight-final summation-total-row">
            <td className="table-td td-iter">Σ</td>
            <td className="table-td" colSpan={4} />
            <td className="table-td">{formatNumber(result.sr)}</td>
            <td className="table-td">{formatNumber(result.st)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);
