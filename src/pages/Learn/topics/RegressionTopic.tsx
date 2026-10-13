import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MethodFactory } from '../../../factories/MethodFactory';
import { MathView } from '../../../components/MathView/MathView';
import { RegressionGraph } from '../../../components/RegressionGraph/RegressionGraph';
import { PolynomialRegression } from '../../../domain/regression/PolynomialRegression';
import { StepsGrid, TopicIntro } from './shared';

const REGRESSION_EXAMPLE_POINTS = [
  { x: 0, y: 2.1 }, { x: 1, y: 7.7 }, { x: 2, y: 13.6 },
  { x: 3, y: 27.2 }, { x: 4, y: 40.9 }, { x: 5, y: 61.1 },
];

const REGRESSION_EXAMPLE = new PolynomialRegression().execute({ points: REGRESSION_EXAMPLE_POINTS, degree: 2 });

const NORMAL_SYSTEM_QUADRATIC =
  '\\begin{bmatrix} n & \\sum x_i & \\sum x_i^2 \\\\ \\sum x_i & \\sum x_i^2 & \\sum x_i^3 \\\\ \\sum x_i^2 & \\sum x_i^3 & \\sum x_i^4 \\end{bmatrix}' +
  '\\begin{bmatrix} a_0 \\\\ a_1 \\\\ a_2 \\end{bmatrix} = ' +
  '\\begin{bmatrix} \\sum y_i \\\\ \\sum x_i y_i \\\\ \\sum x_i^2 y_i \\end{bmatrix}';

const REGRESSION_STEPS = [
  { title: 'Arma la tabla de sumatorias', text: 'Calcula xᵢ², xᵢ³, xᵢ⁴, xᵢyᵢ y xᵢ²yᵢ para cada dato y suma cada columna.' },
  { title: 'Plantea el sistema normal', text: 'Con las sumatorias forma el sistema de (m+1)×(m+1) ecuaciones; para grado 2 es de 3×3.' },
  { title: 'Resuelve con Gauss-Jordan', text: 'Reduce la matriz aumentada hasta obtener la identidad; la última columna son a₀, a₁, a₂.' },
  { title: 'Escribe el modelo', text: 'Sustituye los coeficientes en y = a₀ + a₁x + a₂x² y evalúa la calidad con R².' },
];

export const RegressionTopic: React.FC = () => {
  const regressionMeta = MethodFactory.getRegressionMethods()[0];

  return (
    <>
      <TopicIntro title="¿Qué es la regresión?">
        Cuando tienes datos medidos (xᵢ, yᵢ) que no caen exactamente sobre una curva, la regresión busca el
        polinomio que mejor los representa: el que hace mínima la suma de los cuadrados de los residuos
        <strong> Sr = Σ(yᵢ − ŷᵢ)²</strong>. No es una ecuación que se resuelva para x, sino un modelo que se ajusta a los datos.
      </TopicIntro>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Ajuste de curvas</span>
          <h2 className="section-block-title">Regresión Polinomial por Mínimos Cuadrados</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{regressionMeta.difficulty}</span>
                <h3>{regressionMeta.name}</h3>
              </div>
              <span className="method-tag">{regressionMeta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> Ajusta y = a₀ + a₁x + … + aₘxᵐ a un conjunto de datos. Los coeficientes salen de resolver las
              ecuaciones normales. Para un polinomio de segundo grado:
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Sistema normal (grado 2)</span>
              <MathView math={NORMAL_SYSTEM_QUADRATIC} block />
            </div>
            <figure className="method-theory-graph">
              <RegressionGraph points={REGRESSION_EXAMPLE_POINTS} result={REGRESSION_EXAMPLE} />
              <figcaption className="theory-graph-caption">
                <p>Los segmentos punteados son los residuos: el ajuste minimiza la suma de sus cuadrados.</p>
                <p className="theory-graph-root">
                  Modelo obtenido por Numerikal: <MathView math={REGRESSION_EXAMPLE.modelLatex} /> con R² = {REGRESSION_EXAMPLE.r2.toFixed(5)}.
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando tienes más datos que coeficientes y quieres una curva suave que siga la tendencia, no pasar por cada punto.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que haya al menos m+1 valores de x distintos y que R² sea cercano a 1. Un grado muy alto puede sobreajustar.</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{regressionMeta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo ajustar un polinomio</h2>
        </div>
        <StepsGrid steps={REGRESSION_STEPS} />
      </section>
    </>
  );
};
