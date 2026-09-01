import React, { useState } from 'react';
import type { IterationColumn, IterationData } from '../../domain/Iteration';
import { MathView } from '../MathView/MathView';
import { Table, Copy, Check, Hash } from 'lucide-react';
import './IterationTable.css';

const trimTrailingZeros = (fixed: string): string => {
  if (!fixed.includes('.')) return fixed;
  return fixed.replace(/0+$/, '').replace(/\.$/, '');
};

interface IterationTableProps {
  columns: IterationColumn[];
  iterations: IterationData[];
  className?: string;
}

export const IterationTable: React.FC<IterationTableProps> = ({
  columns,
  iterations,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  const formatCellValue = (val: unknown, col: IterationColumn): React.ReactNode => {
    if (val === undefined || val === null) return '—';
    if (typeof val === 'string') return val;
    if (typeof val === 'boolean') return val ? 'Sí' : 'No';

    if (typeof val === 'number') {
      if (Number.isNaN(val)) return 'NaN';
      if (!Number.isFinite(val)) return '∞';

      if (col.format === 'sign') {
        return val > 0 ? '+' : val < 0 ? '−' : '0';
      }

      if (col.format === 'integer') {
        return Math.round(val).toString();
      }

      if (col.format === 'scientific' || (Math.abs(val) < 1e-4 && val !== 0)) {
        return val.toExponential(col.precision ? col.precision - 2 : 4);
      }

      if (col.format === 'number') {
        const p = col.precision ?? 6;
        // Only show decimals that were actually calculated, no padded zeros
        return trimTrailingZeros(val.toFixed(p));
      }

      return val.toString();
    }

    return String(val);
  };

  const handleCopyCSV = () => {
    const header = columns.map((c) => c.label).join('\t');
    const rows = iterations.map((row) =>
      columns
        .map((col) => {
          const val = row[col.key];
          return val !== undefined ? String(val) : '';
        })
        .join('\t')
    );
    const text = [header, ...rows].join('\n');

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className={`iteration-table-card ${className}`}>
      <div className="table-header-toolbar">
        <div className="table-title-group">
          <Table size={16} className="title-icon" />
          <h4 className="table-title">Tabla de Iteraciones</h4>
          <span className="row-count-badge">
            <Hash size={12} /> {iterations.length} pasos
          </span>
        </div>

        <button
          type="button"
          className="copy-table-btn"
          onClick={handleCopyCSV}
          title="Copiar datos tabulados al portapapeles"
        >
          {copied ? (
            <>
              <Check size={14} className="text-success" />
              <span>Copiado</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copiar Tabla</span>
            </>
          )}
        </button>
      </div>

      <div className="table-scroll-container">
        <table className="numerical-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="table-th">
                  <div className="th-content">
                    <span className="th-label">{col.label}</span>
                    {col.latexLabel && (
                      <span className="th-latex">
                        <MathView math={col.latexLabel} />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {iterations.map((row, idx) => {
              const isLast = idx === iterations.length - 1;
              return (
                <tr key={idx} className={`table-row ${isLast ? 'row-highlight-final' : ''}`}>
                  {columns.map((col) => (
                    <td key={col.key} className={`table-td ${col.key === 'iteration' ? 'td-iter' : ''}`}>
                      {formatCellValue(row[col.key], col)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
