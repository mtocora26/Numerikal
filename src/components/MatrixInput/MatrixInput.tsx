import React from 'react';
import '../DataPointsInput/DataPointsInput.css';
import './MatrixInput.css';
import { canUseDiagonalQuotients, diagonalQuotients, emptySystemRows } from './systemInput';

/** Valores tal como se escriben en las celdas (texto), para poder borrar y reescribir libremente. */
export interface LinearSystemRows {
  a: string[][];
  b: string[];
  x0: string[];
}

interface MatrixInputProps {
  value: LinearSystemRows;
  onChange: (value: LinearSystemRows) => void;
  minSize: number;
  maxSize: number;
}

const sub = (i: number) => String(i + 1);

export const MatrixInput: React.FC<MatrixInputProps> = ({ value, onChange, minSize, maxSize }) => {
  const n = value.a.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  const setA = (i: number, j: number, text: string) =>
    onChange({ ...value, a: value.a.map((row, r) => (r === i ? row.map((v, c) => (c === j ? text : v)) : row)) });
  const setB = (i: number, text: string) => onChange({ ...value, b: value.b.map((v, r) => (r === i ? text : v)) });
  const setX0 = (i: number, text: string) => onChange({ ...value, x0: value.x0.map((v, r) => (r === i ? text : v)) });

  return (
    <div className="matrix-input">
      <div className="matrix-size-row">
        <label htmlFor="matrix-size">Número de ecuaciones</label>
        <select
          id="matrix-size"
          className="param-select-input"
          value={n}
          onChange={(e) => onChange(emptySystemRows(Number(e.target.value)))}
        >
          {Array.from({ length: maxSize - minSize + 1 }, (_, k) => minSize + k).map((size) => (
            <option key={size} value={size}>{size}×{size}</option>
          ))}
        </select>
      </div>

      <div className="data-table-scroll matrix-table-scroll">
        <table className="data-points-table matrix-table">
          <thead>
            <tr>
              <th className="data-col-index">Ec.</th>
              {indices.map((j) => (
                <th key={j}>x{sub(j)}</th>
              ))}
              <th className="matrix-col-b">b</th>
            </tr>
          </thead>
          <tbody>
            {indices.map((i) => (
              <tr key={i}>
                <td className="data-col-index">{i + 1}</td>
                {indices.map((j) => (
                  <td key={j} className={i === j ? 'matrix-cell-diagonal' : undefined}>
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`a${sub(i)}${sub(j)}, coeficiente de x${sub(j)} en la ecuación ${i + 1}`}
                      value={value.a[i][j]}
                      placeholder="0"
                      onChange={(e) => setA(i, j, e.target.value)}
                    />
                  </td>
                ))}
                <td className="matrix-col-b">
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`b${sub(i)}, término independiente de la ecuación ${i + 1}`}
                    value={value.b[i]}
                    placeholder="0"
                    onChange={(e) => setB(i, e.target.value)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="matrix-initial-block">
        <div className="matrix-initial-header">
          <span className="matrix-initial-label">Vector inicial x⁽⁰⁾</span>
          <button
            type="button"
            className="matrix-initial-preset"
            onClick={() => {
              const x0 = diagonalQuotients(value);
              if (x0) onChange({ ...value, x0 });
            }}
            disabled={!canUseDiagonalQuotients(value)}
            title="Calcula xᵢ⁽⁰⁾ = bᵢ / aᵢᵢ con los valores actuales de A y b"
          >
            Usar bᵢ/aᵢᵢ
          </button>
        </div>
        <div className="matrix-initial-grid">
          {indices.map((i) => (
            <label key={i} className="matrix-initial-field">
              <span>x{sub(i)}</span>
              <input
                type="text"
                inputMode="decimal"
                aria-label={`Valor inicial de x${sub(i)}`}
                value={value.x0[i]}
                placeholder="Ej. 3/4"
                onChange={(e) => setX0(i, e.target.value)}
              />
            </label>
          ))}
        </div>
      </div>

      <p className="matrix-hint">En x⁽⁰⁾ puedes escribir fracciones (p. ej. 3/4) o decimales. Para usar bᵢ/aᵢᵢ, completa A y b con números válidos y una diagonal distinta de cero.</p>
    </div>
  );
};
