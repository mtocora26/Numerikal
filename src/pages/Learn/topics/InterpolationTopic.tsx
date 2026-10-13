import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MethodFactory } from '../../../factories/MethodFactory';
import { MathView } from '../../../components/MathView/MathView';
import { InterpolationGraph } from '../../../components/InterpolationGraph/InterpolationGraph';
import { LagrangeInterpolation } from '../../../domain/interpolation/Lagrange';
import { StepsGrid, TopicIntro } from './shared';

const INTERPOLATION_EXAMPLE_POINTS = [{ x: 0, y: 7 }, { x: 1, y: 4 }, { x: 2, y: 11 }, { x: 3, y: 34 }];

const LAGRANGE_EXAMPLE = new LagrangeInterpolation().execute({ points: INTERPOLATION_EXAMPLE_POINTS, xStar: 1.5 });

const LAGRANGE_BASIS = 'L_i(x) = \\prod_{j \\neq i} \\frac{x - x_j}{x_i - x_j}';

const LAGRANGE_STEPS = [
  { title: 'Identifica los puntos', text: 'Escribe cada xᵢ y su f(xᵢ). Con n+1 puntos el polinomio es de grado n.' },
  { title: 'Construye cada Lᵢ(x)', text: 'En el numerador va el producto de (x − xⱼ) y en el denominador el de (xᵢ − xⱼ), siempre con j ≠ i.' },
  { title: 'Arma P(x)', text: 'Multiplica cada Lᵢ(x) por su f(xᵢ) y suma: P(x) = f(x₀)L₀(x) + f(x₁)L₁(x) + …' },
  { title: 'Expande y evalúa', text: 'Reduce términos semejantes para obtener el polinomio y sustituye x* para obtener el valor interpolado.' },
];

export const InterpolationTopic: React.FC = () => {
  const lagrangeMeta = MethodFactory.getInterpolationMethods()[0];

  return (
    <>
      <TopicIntro title="¿Qué es la interpolación?">
        Cuando conoces el valor de una función solo en algunos puntos (xᵢ, yᵢ), la interpolación construye el polinomio que
        <strong> pasa exactamente por todos ellos</strong> y lo usa para estimar valores intermedios. A diferencia de la regresión, que
        sigue la tendencia sin tocar cada dato, aquí el polinomio cumple <strong>P(xᵢ) = yᵢ</strong> en todos los puntos.
      </TopicIntro>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Polinomio exacto</span>
          <h2 className="section-block-title">Interpolación de Lagrange</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{lagrangeMeta.difficulty}</span>
                <h3>{lagrangeMeta.name}</h3>
              </div>
              <span className="method-tag">{lagrangeMeta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> Dados n+1 puntos, el polinomio interpolador es la suma de cada f(xᵢ) multiplicado por el
              polinomio base Lᵢ(x), que vale 1 en xᵢ y 0 en los demás nodos.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Polinomio base</span>
              <MathView math={LAGRANGE_BASIS} block />
            </div>
            <div className="method-formula">
              <span className="method-formula-label">Polinomio interpolador</span>
              <MathView math="P_n(x) = \sum_{i=0}^{n} f(x_i)\, L_i(x)" block />
            </div>
            <figure className="method-theory-graph">
              <InterpolationGraph
                points={INTERPOLATION_EXAMPLE_POINTS}
                coefficients={LAGRANGE_EXAMPLE.coefficients}
                interpolated={{ x: LAGRANGE_EXAMPLE.xStar, y: LAGRANGE_EXAMPLE.valueAtXStar }}
              />
              <figcaption className="theory-graph-caption">
                <p>La curva pasa por los cuatro puntos; el punto amarillo es el valor interpolado en x* = 1.5.</p>
                <p className="theory-graph-root">
                  Polinomio obtenido por Numerikal: <MathView math={LAGRANGE_EXAMPLE.expandedLatex} />, con P(1.5) ={' '}
                  {LAGRANGE_EXAMPLE.valueAtXStar}.
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando necesitas una curva que pase exactamente por datos poco ruidosos, o estimar un valor entre dos mediciones.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que los valores de x sean distintos y que x* esté dentro del rango de los datos. Con muchos puntos el polinomio puede oscilar (fenómeno de Runge).</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{lagrangeMeta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo interpolar con Lagrange</h2>
        </div>
        <StepsGrid steps={LAGRANGE_STEPS} />
      </section>
    </>
  );
};
