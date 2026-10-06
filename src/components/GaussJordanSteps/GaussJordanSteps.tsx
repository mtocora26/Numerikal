import React from 'react';
import { BookOpen, ListOrdered } from 'lucide-react';
import type { RegressionResult } from '../../domain/regression/types';
import { formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import './GaussJordanSteps.css';

const sup = (k: number): string => (k === 1 ? '' : `^{${k}}`);

const cleanZero = (value: number): number => (Math.abs(value) < 1e-10 ? 0 : value);

const augmentedLatex = (matrix: number[][]): string => {
  const size = matrix.length;
  const rows = matrix.map((row) => row.map((v) => formatNumberLatex(cleanZero(v))).join(' & '));
  return `\\left[\\begin{array}{${'c'.repeat(size)}|c}${rows.join(' \\\\ ')}\\end{array}\\right]`;
};

const powerSumLatex = (k: number): string => (k === 0 ? 'n' : `\\sum x_i${sup(k)}`);
const crossSumLatex = (k: number): string =>
  k === 0 ? '\\sum y_i' : `\\sum x_i${sup(k)} y_i`;

const symbolicSystemLatex = (m: number): string => {
  const indices = Array.from({ length: m + 1 }, (_, i) => i);
  const a = indices.map((i) => indices.map((j) => powerSumLatex(i + j)).join(' & ')).join(' \\\\ ');
  const x = indices.map((i) => `a_{${i}}`).join(' \\\\ ');
  const b = indices.map((i) => crossSumLatex(i)).join(' \\\\ ');
  return `\\begin{bmatrix}${a}\\end{bmatrix}\\begin{bmatrix}${x}\\end{bmatrix}=\\begin{bmatrix}${b}\\end{bmatrix}`;
};

export const GaussJordanSteps: React.FC<{ result: RegressionResult }> = ({ result }) => {
  const { degree, coefficients, steps } = result;

  return (
    <div className="gauss-steps-card">
      <div className="gauss-steps-header">
        <BookOpen size={18} className="gauss-steps-icon" />
        <h4>Sistema Normal y Gauss-Jordan</h4>
      </div>

      <section className="gauss-block">
        <h5>1. Modelo y sistema de ecuaciones normales</h5>
        <p>
          Se busca el polinomio de grado {degree} que minimiza Sr = Σ(yᵢ − ŷᵢ)². Al derivar Sr respecto a cada
          coeficiente e igualar a cero se obtiene un sistema de {degree + 1} ecuaciones con {degree + 1} incógnitas:
        </p>
        <div className="gauss-formula-box">
          <MathView math={symbolicSystemLatex(degree)} block />
        </div>
        <p>Las sumatorias se leen de la última fila de la tabla de sumatorias, con Σx⁰ = n = {result.n}.</p>
      </section>

      <section className="gauss-block">
        <h5><ListOrdered size={15} /> 2. Eliminación de Gauss-Jordan</h5>
        <p>
          Se trabaja columna por columna, empezando por la fila 1: primero se divide la fila pivote entre su pivote
          para obtener un 1 y luego, fila por fila, se resta un múltiplo de la fila pivote para obtener ceros en el
          resto de la columna. Al terminar queda la matriz identidad.
        </p>
        <div className="gauss-steps-list">
          {steps.map((step) => (
            <div className="gauss-step" key={step.stepNumber}>
              <div className="gauss-step-heading">
                <span className="gauss-step-number">{step.stepNumber}</span>
                <div>
                  <strong>{step.title}</strong>
                  <p>{step.description}</p>
                </div>
              </div>
              <div className="gauss-formula-box">
                <MathView math={augmentedLatex(step.matrix)} block />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="gauss-block">
        <h5>3. Solución y modelo</h5>
        <p>La matriz identidad deja los coeficientes en la columna de términos independientes:</p>
        <div className="gauss-solution-grid">
          {coefficients.map((a, k) => (
            <div className="gauss-solution-item" key={k}>
              <MathView math={`a_{${k}} = ${formatNumberLatex(a)}`} />
            </div>
          ))}
        </div>
        <div className="gauss-formula-box emphasized">
          <MathView math={result.modelLatex} block />
        </div>
      </section>
    </div>
  );
};
