import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MethodFactory } from '../../../factories/MethodFactory';
import { MathView } from '../../../components/MathView/MathView';
import { JacobiMethod } from '../../../domain/systems/Jacobi';
import { GaussSeidelMethod } from '../../../domain/systems/GaussSeidel';
import { formatNumberLatex } from '../../../services/numberFormat';
import { StepsGrid, TopicIntro } from './shared';

// Mismo ejemplo que la calculadora: 4x₁ − x₂ = 3, −x₁ + 4x₂ = 3 → x₁ = x₂ = 1
const EXAMPLE_INPUT = {
  a: [[4, -1], [-1, 4]],
  b: [3, 3],
  x0: [0, 0],
  tolerance: 1e-4,
  maxIterations: 50,
  errorType: 'relative' as const,
};

const EXAMPLES = {
  jacobi: new JacobiMethod().execute(EXAMPLE_INPUT),
  'gauss-seidel': new GaussSeidelMethod().execute(EXAMPLE_INPUT),
};

interface SystemMethodTheory {
  scheme: string;
  definition: React.ReactNode;
  use: string;
  checks: string;
  stepsNote?: string;
}

const methodTheory: Record<keyof typeof EXAMPLES, SystemMethodTheory> = {
  jacobi: {
    scheme: 'Es un método de desplazamientos simultáneos: ningún componente de una aproximación se usa hasta que todas las componentes hayan sido calculadas.',
    definition: (
      <>
        Despeja cada incógnita de su propia ecuación y calcula <em>todas</em> las incógnitas nuevas usando solo los
        valores de la iteración anterior.
      </>
    ),
    use: 'En sistemas grandes o con muchos ceros, y cuando la matriz es diagonal dominante.',
    checks: 'Que ningún aᵢᵢ sea cero y que la matriz sea estrictamente diagonal dominante: en cada fila |aᵢᵢ| > Σ|aᵢⱼ| (j ≠ i). Es condición suficiente de convergencia.',
  },
  'gauss-seidel': {
    scheme: 'Es un método de desplazamientos sucesivos: se sustituyen las aproximaciones por las nuevas aproximaciones, a medida que se calculan, hasta alcanzar los valores buscados según la exactitud pedida.',
    definition: (
      <>
        Igual que Jacobi, pero cada incógnita recién calculada se usa <em>de inmediato</em> en las ecuaciones siguientes
        de la misma iteración, en lugar de esperar a la siguiente.
      </>
    ),
    use: 'Cuando la matriz es diagonal dominante y quieres converger en menos iteraciones que con Jacobi.',
    checks: 'Lo mismo que en Jacobi: ningún aᵢᵢ en cero y matriz estrictamente diagonal dominante. El orden de las ecuaciones sí cambia el resultado.',
    stepsNote: 'Utiliza los mismos pasos que el método de Jacobi. La única diferencia está en el paso 4 y en las repeticiones: al calcular cada xᵢ se reemplazan de inmediato los valores nuevos de las incógnitas anteriores (x₁, …, xᵢ₋₁).',
  },
};

const SYSTEM_STEPS = [
  { title: 'Organiza el sistema', text: 'Ordena las ecuaciones para que la matriz de coeficientes sea estrictamente diagonal dominante: es condición suficiente para que el proceso iterativo converja.' },
  { title: 'Despeja las variables', text: 'De la ecuación i despeja xᵢ: xᵢ = (bᵢ − Σ aᵢⱼxⱼ) / aᵢᵢ.' },
  { title: 'Calcula los valores iniciales', text: 'Si no te los dan, usa xᵢ⁽⁰⁾ = bᵢ / aᵢᵢ.' },
  { title: 'Calcula las primeras aproximaciones', text: 'Reemplaza los valores iniciales en las variables despejadas para obtener x⁽¹⁾.' },
  { title: 'Repite hasta el error pedido', text: 'Repite el paso anterior con los últimos valores hasta que el error, calculado como la diferencia entre el último valor y el anterior, sea menor que la tolerancia.' },
];

export const SystemsTopic: React.FC = () => {
  const systemMethods = MethodFactory.getSystemMethods();
  const [methodId, setMethodId] = useState<keyof typeof EXAMPLES>('jacobi');
  const meta = systemMethods.find((m) => m.id === methodId) ?? systemMethods[0];
  const theory = methodTheory[methodId];
  const example = EXAMPLES[methodId];

  return (
    <>
      <TopicIntro title="¿Qué es un método iterativo?">
        En lugar de eliminar incógnitas como Gauss-Jordan, un método iterativo parte de una aproximación
        <strong> x⁽⁰⁾</strong> y la mejora repetidamente con las ecuaciones despejadas, hasta que la diferencia
        entre dos iteraciones es menor que la tolerancia.
      </TopicIntro>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Sistemas de ecuaciones lineales</span>
          <h2 className="section-block-title">Métodos Iterativos para Ax = b</h2>
        </div>

        <div className="method-pills" role="tablist" aria-label="Método">
          {systemMethods.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={m.id === meta.id}
              className={`method-pill ${m.id === meta.id ? 'active' : ''}`}
              onClick={() => setMethodId(m.id as keyof typeof EXAMPLES)}
            >
              {m.name}
            </button>
          ))}
        </div>

        <div className="theory-text-panel">
          <p>{theory.scheme}</p>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card" key={meta.id}>
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{meta.difficulty}</span>
                <h3>{meta.name}</h3>
              </div>
              <span className="method-tag">{meta.tag}</span>
            </div>
            <p className="method-definition"><strong>¿Qué es?</strong> {theory.definition}</p>
            <div className="method-formula">
              <span className="method-formula-label">Fórmula</span>
              <MathView math={meta.latexFormula} block />
            </div>
            <div className="method-formula">
              <span className="method-formula-label">Ejemplo: 4x₁ − x₂ = 3, −x₁ + 4x₂ = 3</span>
              <MathView
                math={`\\begin{aligned}${example.iterationFormulasLatex.map((f) => f.replace(' = ', ' &= ')).join(' \\\\ ')}\\end{aligned}`}
                block
              />
              <p className="theory-graph-root">
                Con el vector inicial dado x⁽⁰⁾ = (0, 0), Numerikal llega a{' '}
                <MathView math={example.solution.map((v, i) => `x_{${i + 1}} \\approx ${formatNumberLatex(v)}`).join(',\\ ')} />{' '}
                en {example.iterationsCount} iteraciones.
              </p>
            </div>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>{theory.use}</p></div>
              <div><strong>¿Qué revisar?</strong><p>{theory.checks}</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{meta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Regla del {meta.name.toLowerCase()}</h2>
        </div>
        {theory.stepsNote && <div className="theory-text-panel"><p>{theory.stepsNote}</p></div>}
        <StepsGrid steps={SYSTEM_STEPS} />
      </section>
    </>
  );
};
