import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MethodFactory } from '../../../factories/MethodFactory';
import { MathView } from '../../../components/MathView/MathView';
import { TaylorGraph } from '../../../components/TaylorGraph/TaylorGraph';
import { TaylorPolynomial } from '../../../domain/taylor/TaylorPolynomial';
import { StepsGrid, TopicIntro } from './shared';

const TAYLOR_EXAMPLE = new TaylorPolynomial().execute({ expression: 'sin(x)', a: 0, degree: 5, xStar: 1.5 });

const TAYLOR_FORMULA =
  "P(x) = f(a) + f'(a)(x - a) + \\frac{f''(a)}{2!}(x - a)^2 + \\frac{f'''(a)}{3!}(x - a)^3 + \\cdots + \\frac{f^{(n)}(a)}{n!}(x - a)^n";

const TAYLOR_CONDITIONS = "P(a) = f(a), \\quad P'(a) = f'(a), \\quad \\ldots, \\quad P^{(n)}(a) = f^{(n)}(a)";

const TAYLOR_STEPS = [
  { title: 'Deriva f hasta el orden n', text: 'Calcula f′, f″, f‴, … f⁽ⁿ⁾ de forma simbólica.' },
  { title: 'Evalúa en a', text: 'Sustituye el punto de expansión en f y en cada derivada: f(a), f′(a), …, f⁽ⁿ⁾(a).' },
  { title: 'Divide entre k!', text: 'Cada coeficiente es f⁽ᵏ⁾(a)/k!, el valor de la derivada entre el factorial de su orden.' },
  { title: 'Arma, evalúa y compara', text: 'Suma los términos con las potencias de (x − a), evalúa en x* y compara con f(x*) para ver el error.' },
];

export const SeriesTopic: React.FC = () => {
  const taylorMeta = MethodFactory.getSeriesMethods()[0];

  return (
    <>
      <TopicIntro title="¿Qué es una serie de Taylor?">
        Si f(x) tiene derivadas hasta el orden n en un punto a, existe un polinomio de grado menor o igual que n que
        <strong> coincide con f y con sus primeras n derivadas en a</strong>. Sirve para aproximar funciones complicadas (sen x, eˣ, ln x)
        con operaciones sencillas, y la aproximación es mejor cerca de a y al subir el grado.
      </TopicIntro>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Aproximación local</span>
          <h2 className="section-block-title">Polinomio de Taylor</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{taylorMeta.difficulty}</span>
                <h3>{taylorMeta.name}</h3>
              </div>
              <span className="method-tag">{taylorMeta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> El polinomio P(x) de grado ≤ n que cumple estas condiciones en x = a. Si a = 0 se llama
              polinomio de <strong>Maclaurin</strong>.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Condiciones</span>
              <MathView math={TAYLOR_CONDITIONS} block />
            </div>
            <div className="method-formula">
              <span className="method-formula-label">Polinomio de Taylor</span>
              <MathView math={TAYLOR_FORMULA} block />
            </div>
            <figure className="method-theory-graph">
              <TaylorGraph result={TAYLOR_EXAMPLE} />
              <figcaption className="theory-graph-caption">
                <p>El polinomio sigue a sen x cerca de a = 0 y se separa al alejarse; el punto amarillo es P(1.5).</p>
                <p className="theory-graph-root">
                  Maclaurin de grado 5 obtenido por Numerikal: <MathView math={TAYLOR_EXAMPLE.expandedLatex} />, con P(1.5) ≈{' '}
                  {TAYLOR_EXAMPLE.valueAtXStar.toFixed(6)} frente a sen(1.5) ≈ {TAYLOR_EXAMPLE.exactValue?.toFixed(6)}.
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando conoces bien f y sus derivadas en un punto y quieres aproximar valores cercanos con un polinomio.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que f y sus derivadas estén definidas en a, que x* no esté muy lejos de a y que el grado n sea suficiente (mira el error).</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{taylorMeta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo construir el polinomio de Taylor</h2>
        </div>
        <StepsGrid steps={TAYLOR_STEPS} />
      </section>
    </>
  );
};
