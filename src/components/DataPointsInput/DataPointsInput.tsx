import React, { useState } from 'react';
import { ClipboardPaste, Plus, Trash2, X } from 'lucide-react';
import { parseDataPoints } from '../../domain/regression/parseDataPoints';
import './DataPointsInput.css';

export interface DataRow {
  x: string;
  y: string;
}

interface DataPointsInputProps {
  rows: DataRow[];
  onChange: (rows: DataRow[]) => void;
  className?: string;
}

const toRows = (points: { x: number; y: number }[]): DataRow[] =>
  points.map((p) => ({ x: String(p.x), y: String(p.y) }));

export const DataPointsInput: React.FC<DataPointsInputProps> = ({ rows, onChange, className = '' }) => {
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);

  const updateCell = (index: number, field: keyof DataRow, value: string) => {
    onChange(rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const addRow = () => onChange([...rows, { x: '', y: '' }]);
  const removeRow = (index: number) => onChange(rows.filter((_, i) => i !== index));

  const applyImport = (text: string): boolean => {
    const { points, invalidLines } = parseDataPoints(text);
    if (points.length === 0) {
      setImportError('No se encontraron pares (x, y). Escribe una pareja por línea, por ejemplo: 1  2.5');
      return false;
    }
    onChange(toRows(points));
    setImportError(
      invalidLines.length > 0
        ? `Se ignoraron las líneas ${invalidLines.join(', ')} porque no son un par x, y válido.`
        : null
    );
    return true;
  };

  // Pegar varias filas directamente sobre una celda (por ejemplo, copiadas desde Excel)
  const handleCellPaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData('text');
    if (!/[\n\t;]/.test(text.trim())) return;
    event.preventDefault();
    applyImport(text);
  };

  return (
    <div className={`data-points-input ${className}`}>
      <div className="data-table-scroll">
        <table className="data-points-table">
          <thead>
            <tr>
              <th className="data-col-index">#</th>
              <th>x</th>
              <th>y</th>
              <th className="data-col-action" aria-label="Acciones" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="data-col-index">{index + 1}</td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`x de la fila ${index + 1}`}
                    value={row.x}
                    placeholder="x"
                    onChange={(e) => updateCell(index, 'x', e.target.value)}
                    onPaste={handleCellPaste}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`y de la fila ${index + 1}`}
                    value={row.y}
                    placeholder="y"
                    onChange={(e) => updateCell(index, 'y', e.target.value)}
                    onPaste={handleCellPaste}
                  />
                </td>
                <td className="data-col-action">
                  <button
                    type="button"
                    className="data-row-remove"
                    onClick={() => removeRow(index)}
                    disabled={rows.length <= 1}
                    title="Quitar fila"
                    aria-label={`Quitar fila ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="data-points-actions">
        <button type="button" className="btn-secondary data-action-btn" onClick={addRow}>
          <Plus size={15} />
          <span>Agregar fila</span>
        </button>
        <button
          type="button"
          className="btn-secondary data-action-btn"
          onClick={() => setShowImport((value) => !value)}
          aria-expanded={showImport}
        >
          {showImport ? <X size={15} /> : <ClipboardPaste size={15} />}
          <span>{showImport ? 'Cerrar' : 'Pegar datos'}</span>
        </button>
      </div>

      {showImport && (
        <div className="data-import-box">
          <label htmlFor="data-import-text">Pega aquí tus datos (Excel, CSV o texto)</label>
          <textarea
            id="data-import-text"
            rows={5}
            value={importText}
            placeholder={'0\t2.1\n1\t7.7\n2\t13.6'}
            onChange={(e) => setImportText(e.target.value)}
          />
          <p className="data-import-hint">Una pareja x, y por línea, separada por tabulador, coma, punto y coma o espacio.</p>
          {importError && <p className="data-import-error" role="alert">{importError}</p>}
          <button
            type="button"
            className="btn-primary data-import-apply"
            onClick={() => {
              if (applyImport(importText)) {
                setImportText('');
                setShowImport(false);
              }
            }}
          >
            Cargar datos
          </button>
        </div>
      )}
      {!showImport && importError && <p className="data-import-error" role="alert">{importError}</p>}
    </div>
  );
};
