import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MethodFactory } from '../../../factories/MethodFactory';
import { MathView } from '../../../components/MathView/MathView';
import { MethodTheoryGraph } from '../../../components/MethodTheoryGraph/MethodTheoryGraph';
import { StepsGrid, TopicIntro } from './shared';

const methodGuidance: Record<string, { definition: string; use: string; checks: string }> = {
  bisection: {
    definition: 'Busca una raíz dividiendo repetidamente un intervalo donde la función cambia de signo.',
    use: 'Úsalo cuando tienes un intervalo [xi, xs] y necesitas un resultado confiable.',
    checks: 'Verifica que f(xi) y f(xs) tengan signos opuestos.',
  },
  'false-position': {
    definition: 'Aproxima la raíz usando la recta que une los extremos del intervalo.',
    use: 'Es una buena opción cuando quieres conservar un intervalo seguro con una aproximación más dirigida.',
    checks: 'Verifica el cambio de signo y observa el error en cada iteración.',
  },
  'newton-raphson': {
    definition: 'Usa la recta tangente de la función para acercarse rápidamente a la raíz.',
    use: 'Úsalo cuando tienes una aproximación inicial razonable y la función es derivable.',
    checks: 'La derivada no debe ser cero o demasiado cercana a cero cerca de la aproximación.',
  },
  secant: {
    definition: 'Usa dos aproximaciones anteriores para construir una recta secante sin calcular la derivada.',
    use: 'Es útil cuando no quieres obtener la derivada simbólica de la función.',
    checks: 'Ingresa dos valores iniciales distintos y revisa si el error disminuye.',
  },
  'fixed-point': {
    definition: 'Reescribe la ecuación como x = g(x) y repite xᵢ₊₁ = g(xᵢ).',
    use: 'Úsalo cuando puedes despejar x de forma que la sucesión sea estable.',
    checks: 'Cerca de la raíz, procura que |g\'(x)| sea menor que 1.',
  },
  'modified-newton-raphson': {
    definition: 'Extiende Newton-Raphson usando la primera y segunda derivada para tratar raíces múltiples.',
    use: 'Úsalo cuando la raíz se repite y Newton-Raphson tradicional pierde velocidad.',
    checks: 'Revisa que el denominador [f\'(x)]² - f(x)f\'\'(x) no sea cero.',
  },
};

// Teoría extendida (texto de clase): descripción, ventajas/desventajas y "regla del método" con sus pasos
interface MethodTheory {
  alias?: string;
  description: string[];
  advantages: string[];
  disadvantages: string[];
  steps: { label?: string; title: string; text: string }[];
}

const methodTheory: Record<string, MethodTheory> = {
  bisection: {
    alias: 'Método del punto medio',
    description: [
      'Es el método más elemental y antiguo para determinar las raíces de una ecuación. Está basado directamente en el teorema de Bolzano.',
      'Consiste en partir de un intervalo [xᵢ, xₛ] tal que f(xᵢ)·f(xₛ) < 0, por lo que sabemos que existe al menos una raíz real. A partir de ese punto se reduce el intervalo sucesivamente hasta hacerlo tan pequeño como exija la precisión buscada.',
    ],
    advantages: [
      'Siempre converge.',
      'Es muy útil como aproximación inicial de otros métodos.',
    ],
    disadvantages: [
      'Su convergencia es muy lenta.',
      'No tiene en cuenta la magnitud de los valores de la función en las aproximaciones xᵣ: solo mira el signo de f(xᵢ)·f(xᵣ). Por eso una aproximación intermedia mejor que la respuesta final puede pasar desapercibida.',
    ],
    steps: [
      { title: 'Elige el intervalo', text: 'Escoge los valores iniciales inferior xᵢ y superior xₛ.' },
      { title: 'Aplica Bolzano', text: 'Verifica que f(xᵢ)·f(xₛ) < 0 para garantizar que la raíz está en el intervalo.' },
      { title: 'Calcula xᵣ', text: 'Determina la primera aproximación a la raíz con xᵣ = (xᵢ + xₛ) / 2.' },
      { title: 'Compara los signos', text: 'Calcula los signos de f(xᵢ) y f(xᵣ) para determinar en qué subintervalo cae la raíz.' },
      { label: '5a', title: 'Si f(xᵢ)·f(xᵣ) < 0', text: 'La raíz está en el subintervalo inferior: haz xₛ = xᵣ y continúa desde el paso 2 hasta alcanzar la raíz con el error pedido.' },
      { label: '5b', title: 'Si f(xᵢ)·f(xᵣ) > 0', text: 'La raíz está en el subintervalo superior: haz xᵢ = xᵣ y continúa desde el paso 2 hasta alcanzar la raíz con el error pedido.' },
    ],
  },
};

const ROOTS_STEPS = [
  { title: 'Escribe la función', text: 'Ingresa una expresión como x^3 - 4*x - 1.' },
  { title: 'Elige el método', text: 'Selecciona el procedimiento que corresponda a tu problema.' },
  { title: 'Revisa el resultado', text: 'Analiza la raíz, el error, la tabla y la gráfica de convergencia.' },
];

export const RootsTopic: React.FC = () => {
  const methods = MethodFactory.getAllMethods();
  const [methodId, setMethodId] = useState(methods[0].id);
  const method = methods.find((m) => m.id === methodId) ?? methods[0];
  const guidance = methodGuidance[method.id];
  const theory = methodTheory[method.id];

  return (
    <>
      <TopicIntro title="¿Qué es una ecuación no lineal?">
        Es una ecuación en la que la variable aparece en potencias, productos, funciones trigonométricas,
        exponenciales u otras formas que no permiten despejarla fácilmente. El objetivo es encontrar un valor
        aproximado de <strong>x</strong> que haga que <strong>f(x) = 0</strong>.
      </TopicIntro>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Métodos disponibles</span>
          <h2 className="section-block-title">Conoce cada método</h2>
        </div>

        <div className="method-pills" role="tablist" aria-label="Método">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={m.id === method.id}
              className={`method-pill ${m.id === method.id ? 'active' : ''}`}
              onClick={() => setMethodId(m.id)}
            >
              {m.name}
            </button>
          ))}
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card" key={method.id}>
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{method.difficulty}</span>
                <h3>{method.name}</h3>
                {theory?.alias && <span className="method-alias">También conocido como: {theory.alias}</span>}
              </div>
              <span className="method-tag">{method.tag}</span>
            </div>
            <p className="method-definition"><strong>¿Qué es?</strong> {guidance.definition}</p>
            <div className="method-formula">
              <span className="method-formula-label">Fórmula</span>
              <MathView math={method.latexFormula} block />
            </div>
            <MethodTheoryGraph methodId={method.id} />
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>{guidance.use}</p></div>
              <div><strong>¿Qué revisar?</strong><p>{guidance.checks}</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{method.recommendedConvergence}</span>
            </div>
          </article>
        </div>

        {theory && (
          <>
            <div className="theory-text-panel">
              {theory.description.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              <div className="method-guidance-row">
                <div>
                  <strong>Ventajas</strong>
                  <ul>{theory.advantages.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
                <div>
                  <strong>Desventajas</strong>
                  <ul>{theory.disadvantages.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              </div>
            </div>
            <div>
              <span className="section-kicker">Paso a paso</span>
              <h3 className="section-block-title">Regla del método de {method.name}</h3>
            </div>
            <StepsGrid steps={theory.steps} />
          </>
        )}
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Antes de comenzar</span>
          <h2 className="section-block-title">¿Cómo usar esta plataforma?</h2>
        </div>
        <StepsGrid steps={ROOTS_STEPS} />
      </section>
    </>
  );
};
