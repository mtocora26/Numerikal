import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MethodFactory } from '../../../factories/MethodFactory';
import { MathView } from '../../../components/MathView/MathView';
import { DividedDifferencesTable } from '../../../components/NewtonSteps/NewtonSteps';
import { NevilleTable } from '../../../components/NevilleSteps/NevilleSteps';
import { InterpolationGraph } from '../../../components/InterpolationGraph/InterpolationGraph';
import { LagrangeInterpolation } from '../../../domain/interpolation/Lagrange';
import { NewtonDividedDifferences } from '../../../domain/interpolation/NewtonDividedDifferences';
import { NevilleInterpolation } from '../../../domain/interpolation/Neville';
import { StepsGrid, TopicIntro } from './shared';

const INTERPOLATION_EXAMPLE_POINTS = [{ x: 0, y: 7 }, { x: 1, y: 4 }, { x: 2, y: 11 }, { x: 3, y: 34 }];

const LAGRANGE_EXAMPLE = new LagrangeInterpolation().execute({ points: INTERPOLATION_EXAMPLE_POINTS, xStar: 1.5 });

const NEWTON_EXAMPLE = new NewtonDividedDifferences().execute({ points: INTERPOLATION_EXAMPLE_POINTS, xStar: 1.5 });

const NEVILLE_EXAMPLE = new NevilleInterpolation().execute({ points: INTERPOLATION_EXAMPLE_POINTS, xStar: 1.5 });

const NEWTON_DIFFERENCE =
  'f[x_i, \\ldots, x_{i+k}] = \\frac{f[x_{i+1}, \\ldots, x_{i+k}] - f[x_i, \\ldots, x_{i+k-1}]}{x_{i+k} - x_i}';

const LAGRANGE_BASIS = 'L_i(x) = \\prod_{j \\neq i} \\frac{x - x_j}{x_i - x_j}';

const LAGRANGE_STEPS = [
  { title: 'Identifica los puntos', text: 'Escribe cada xᵢ y su f(xᵢ). Con n+1 puntos el polinomio es de grado n.' },
  { title: 'Construye cada Lᵢ(x)', text: 'En el numerador va el producto de (x − xⱼ) y en el denominador el de (xᵢ − xⱼ), siempre con j ≠ i.' },
  { title: 'Arma P(x)', text: 'Multiplica cada Lᵢ(x) por su f(xᵢ) y suma: P(x) = f(x₀)L₀(x) + f(x₁)L₁(x) + …' },
  { title: 'Expande y evalúa', text: 'Reduce términos semejantes para obtener el polinomio y sustituye x* para obtener el valor interpolado.' },
];

const NEWTON_STEPS = [
  { title: 'Identifica los puntos', text: 'Escribe cada xᵢ y su f(xᵢ); estos últimos son las diferencias de orden 0.' },
  { title: 'Llena la tabla triangular', text: 'Cada columna se calcula restando dos valores consecutivos de la anterior y dividiendo entre la diferencia de los nodos extremos.' },
  { title: 'Toma la primera fila', text: 'f[x₀], f[x₀,x₁], f[x₀,x₁,x₂], … son los coeficientes del polinomio de Newton.' },
  { title: 'Arma, expande y evalúa', text: 'Multiplica cada coeficiente por (x − x₀)(x − x₁)… , suma, reduce términos y sustituye x*.' },
];

const NEVILLE_STEPS = [
  { title: 'Identifica los puntos', text: 'Escribe cada xᵢ y su f(xᵢ). La primera columna de la tabla es P(i,i) = f(xᵢ).' },
  { title: 'Calcula la columna siguiente', text: 'Cada P(i,j) combina dos valores de la columna anterior: (x* − xᵢ)·P(i+1,j) − (x* − xⱼ)·P(i,j−1), todo dividido entre xⱼ − xᵢ.' },
  { title: 'Repite hasta quedar con un valor', text: 'Cada columna tiene un valor menos que la anterior; la última tiene solo P(0,n).' },
  { title: 'Lee el resultado', text: 'P(0,n) es el valor del polinomio interpolante en x*. No hace falta construir el polinomio.' },
];

export const InterpolationTopic: React.FC = () => {
  const [lagrangeMeta, newtonMeta, nevilleMeta] = MethodFactory.getInterpolationMethods();

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
      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">El mismo polinomio, otra construcción</span>
          <h2 className="section-block-title">Diferencias Divididas de Newton</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{newtonMeta.difficulty}</span>
                <h3>{newtonMeta.name}</h3>
              </div>
              <span className="method-tag">{newtonMeta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> Construye el polinomio interpolador con los coeficientes f[x₀], f[x₀,x₁], … que salen de
              la primera fila de una tabla triangular de diferencias divididas.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Diferencia dividida</span>
              <MathView math={NEWTON_DIFFERENCE} block />
            </div>
            <div className="method-formula">
              <span className="method-formula-label">Polinomio de Newton</span>
              <MathView math={newtonMeta.latexFormula} block />
            </div>
            <figure className="method-theory-graph">
              <DividedDifferencesTable result={NEWTON_EXAMPLE} />
              <figcaption className="theory-graph-caption">
                <p>Con los mismos datos del ejemplo, la primera fila es 7, −3, 5, 1.</p>
                <p className="theory-graph-root">
                  Polinomio obtenido por Numerikal: <MathView math={NEWTON_EXAMPLE.substitutedLatex} />, que al expandirse es{' '}
                  <MathView math={NEWTON_EXAMPLE.expandedLatex} />: el mismo de Lagrange.
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando puedes agregar datos después: añadir un punto solo agrega una diagonal a la tabla y un término al polinomio, sin rehacer lo anterior.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que los valores de x sean distintos (la división entre xᵢ₊ₖ − xᵢ no puede ser 0). Si las últimas diferencias dan 0, los datos vienen de un polinomio de menor grado.</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{newtonMeta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo interpolar con diferencias divididas</h2>
        </div>
        <StepsGrid steps={NEWTON_STEPS} />
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Evaluar sin construir el polinomio</span>
          <h2 className="section-block-title">Interpolación de Neville</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{nevilleMeta.difficulty}</span>
                <h3>{nevilleMeta.name}</h3>
              </div>
              <span className="method-tag">{nevilleMeta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> Evalúa en x* el polinomio que pasa por los puntos llenando una tabla triangular. P(i,j) es el
              valor en x* del polinomio que pasa solo por los nodos xᵢ, …, xⱼ; cada columna mejora la anterior usando un nodo más.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Recurrencia de Neville</span>
              <MathView math={nevilleMeta.latexFormula} block />
            </div>
            <figure className="method-theory-graph">
              <NevilleTable result={NEVILLE_EXAMPLE} />
              <figcaption className="theory-graph-caption">
                <p>Con los mismos datos y x* = 1.5, la última columna da P(0,3) = {NEVILLE_EXAMPLE.valueAtXStar}.</p>
                <p className="theory-graph-root">
                  Coincide con Lagrange y Newton: P(1.5) = {LAGRANGE_EXAMPLE.valueAtXStar}.
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando solo necesitas el valor en un x* y no el polinomio completo. Para evaluar en otro x* hay que rehacer la tabla.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que los valores de x sean distintos (se divide entre xⱼ − xᵢ) y no confundir el orden de los factores: (x* − xᵢ) multiplica a P(i+1,j).</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{nevilleMeta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo interpolar con Neville</h2>
        </div>
        <StepsGrid steps={NEVILLE_STEPS} />
      </section>
    </>
  );
};
