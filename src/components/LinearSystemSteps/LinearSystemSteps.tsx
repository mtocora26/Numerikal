import React from 'react';
import { BookOpen, ListOrdered } from 'lucide-react';
import type { LinearSystemResult } from '../../domain/systems/types';
import { formatNumberLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../GaussJordanSteps/GaussJordanSteps.css';

const paren = (v: number): string => (v < 0 ? `(${formatNumberLatex(v)})` : formatNumberLatex(v));

/** |a₁₁| = 4 > |−1| = 1 */
const dominanceLatex = (row: number[], i: number, dominant: boolean): string => {
  const others = row.filter((_, j) => j !== i).map((v) => `\\lvert ${formatNumberLatex(v)} \\rvert`).join(' + ');
  const sum = row.reduce((acc, v, j) => (j === i ? acc : acc + Math.abs(v)), 0);
  return `\\lvert a_{${i + 1}${i + 1}} \\rvert = ${formatNumberLatex(Math.abs(row[i]))} ${dominant ? '>' : '\\leq'} ${others} = ${formatNumberLatex(sum)}`;
};

/** Primera iteración con los valores de x⁽⁰⁾ sustituidos, como se escribe en el cuaderno. */
const firstIterationLatex = (result: LinearSystemResult, i: number): string => {
  const { a, b, x0, iterations, sequential } = result;
  // Gauss-Seidel sustituye de inmediato los valores ya calculados en esta iteración
  const known = (j: number) => (sequential && j < i ? Number(iterations[1]?.[`x${j + 1}`]) : x0[j]);
  const terms = a[i]
    .map((v, j) => (j === i || v === 0 ? null : ` - ${paren(v)}\\cdot ${paren(known(j))}`))
    .filter(Boolean)
    .join('');
  const value = Number(iterations[1]?.[`x${i + 1}`]);
  return `x_{${i + 1}}^{(1)} = \\frac{${formatNumberLatex(b[i])}${terms}}{${formatNumberLatex(a[i][i])}} = ${formatNumberLatex(value)}`;
};

export const LinearSystemSteps: React.FC<{ result: LinearSystemResult }> = ({ result }) => {
  const { a, dominance, iterationFormulasLatex, x0 } = result;
  const x0Latex = `x^{(0)} = (${x0.map((v) => formatNumberLatex(v)).join(',\\ ')})`;

  return (
    <div className="gauss-steps-card">
      <div className="gauss-steps-header">
        <BookOpen size={18} className="gauss-steps-icon" />
        <h4>Procedimiento: {result.methodName}</h4>
      </div>

      <section className="gauss-block">
        <h5>1. Sistema de ecuaciones</h5>
        <div className="gauss-formula-box">
          <MathView math={result.systemLatex} block />
        </div>
      </section>

      <section className="gauss-block">
        <h5>2. ¿La matriz es diagonal dominante?</h5>
        <p>
          En cada fila se compara el elemento de la diagonal con la suma de los demás (en valor absoluto). Si todas las
          filas cumplen |aᵢᵢ| &gt; Σ|aᵢⱼ|, el método converge para cualquier vector inicial.
        </p>
        <div className="gauss-formula-box">
          <MathView
            math={`\\begin{aligned}${a.map((row, i) => dominanceLatex(row, i, dominance.rows[i].dominant)).join(' \\\\ ')}\\end{aligned}`}
            block
          />
        </div>
        <p>
          {dominance.strictlyDominant
            ? 'Todas las filas cumplen la condición: la matriz es estrictamente diagonal dominante.'
            : 'Al menos una fila no cumple la condición, así que la convergencia no está garantizada. Reordenar las ecuaciones puede ayudar.'}
        </p>
      </section>

      <section className="gauss-block">
        <h5>3. Despejar cada incógnita</h5>
        <p>
          {result.sequential
            ? 'De la ecuación i se despeja xᵢ. En Gauss-Seidel, el lado derecho usa los valores ya calculados en esta iteración (k+1) para las incógnitas anteriores, y los de la iteración anterior (k) para las siguientes:'
            : 'De la ecuación i se despeja xᵢ. En Jacobi, el lado derecho usa solo los valores de la iteración anterior (k):'}
        </p>
        <div className="gauss-formula-box emphasized">
          <MathView math={`\\begin{aligned}${iterationFormulasLatex.map((f) => f.replace(' = ', ' &= ')).join(' \\\\ ')}\\end{aligned}`} block />
        </div>
      </section>

      {result.iterations.length > 1 && (
        <section className="gauss-block">
          <h5><ListOrdered size={15} /> 4. Primera iteración</h5>
          <p>Se parte de <MathView math={x0Latex} /> y se sustituye en cada fórmula{result.sequential ? ', reutilizando cada valor nuevo en las ecuaciones que siguen' : ''}:</p>
          <div className="gauss-formula-box">
            <MathView math={`\\begin{aligned}${a.map((_, i) => firstIterationLatex(result, i).replace(' = ', ' &= ')).join(' \\\\ ')}\\end{aligned}`} block />
          </div>
          <p>
            Se repite con los nuevos valores hasta que el error (el mayor entre las incógnitas) sea menor que la
            tolerancia. Todas las iteraciones están en la tabla.
          </p>
        </section>
      )}
    </div>
  );
};
