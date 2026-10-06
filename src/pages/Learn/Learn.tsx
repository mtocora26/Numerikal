import React from 'react';
import { BookOpen, CheckCircle2, Compass, Lightbulb, PlayCircle, Sigma } from 'lucide-react';
import { MethodFactory } from '../../factories/MethodFactory';
import { MathView } from '../../components/MathView/MathView';
import { MethodTheoryGraph } from '../../components/MethodTheoryGraph/MethodTheoryGraph';
import { RegressionGraph } from '../../components/RegressionGraph/RegressionGraph';
import { PolynomialRegression } from '../../domain/regression/PolynomialRegression';
import './Learn.css';

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

export const Learn: React.FC = () => {
  const methods = MethodFactory.getAllMethods();
  const regressionMeta = MethodFactory.getRegressionMethods()[0];

  return (
    <div className="learn-container">
      <header className="learn-header">
        <div className="learn-badge">
          <BookOpen size={14} />
          <span>Guía de estudio</span>
        </div>
        <h1 className="learn-title">Ecuaciones No Lineales y Regresión</h1>
        <p className="learn-subtitle">
          Aprende qué hace cada método, qué fórmula utiliza y qué debes revisar antes de ejecutar una solución.
        </p>
      </header>

      <section className="theory-intro glass-panel">
        <div className="theory-intro-icon"><Compass size={24} /></div>
        <div>
          <h2>¿Qué es una ecuación no lineal?</h2>
          <p>
            Es una ecuación en la que la variable aparece en potencias, productos, funciones trigonométricas,
            exponenciales u otras formas que no permiten despejarla fácilmente. El objetivo es encontrar un valor
            aproximado de <strong>x</strong> que haga que <strong>f(x) = 0</strong>.
          </p>
        </div>
      </section>

      <section className="how-to-section">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Antes de comenzar</span>
            <h2 className="section-block-title">¿Cómo usar esta plataforma?</h2>
          </div>
          <Lightbulb size={24} className="section-heading-icon" />
        </div>
        <div className="how-to-grid">
          <div className="how-to-card">
            <span className="how-to-number">1</span>
            <div><h3>Escribe la función</h3><p>Ingresa una expresión como x^3 - 4*x - 1.</p></div>
          </div>
          <div className="how-to-card">
            <span className="how-to-number">2</span>
            <div><h3>Elige el método</h3><p>Selecciona el procedimiento que corresponda a tu problema.</p></div>
          </div>
          <div className="how-to-card">
            <span className="how-to-number">3</span>
            <div><h3>Revisa el resultado</h3><p>Analiza la raíz, el error, la tabla y la gráfica de convergencia.</p></div>
          </div>
        </div>
      </section>

      <section className="methods-theory-section">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Métodos disponibles</span>
            <h2 className="section-block-title">Conoce cada método</h2>
          </div>
          <PlayCircle size={24} className="section-heading-icon" />
        </div>
        <div className="theory-methods-grid">
          {methods.map((method) => {
            const guidance = methodGuidance[method.id];
            return (
              <article className="theory-method-card" key={method.id}>
                <div className="theory-method-header">
                  <div>
                    <span className="method-difficulty">{method.difficulty}</span>
                    <h3>{method.name}</h3>
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
            );
          })}
        </div>
      </section>

      <section className="methods-theory-section" id="regresion">
        <div className="section-heading-row">
          <div>
            <span className="section-kicker">Ajuste de curvas</span>
            <h2 className="section-block-title">Regresión Polinomial por Mínimos Cuadrados</h2>
          </div>
          <Sigma size={24} className="section-heading-icon" />
        </div>

        <div className="theory-intro glass-panel">
          <div className="theory-intro-icon"><Compass size={24} /></div>
          <div>
            <h2>¿Qué es la regresión?</h2>
            <p>
              Cuando tienes datos medidos (xᵢ, yᵢ) que no caen exactamente sobre una curva, la regresión busca el
              polinomio que mejor los representa: el que hace mínima la suma de los cuadrados de los residuos
              <strong> Sr = Σ(yᵢ − ŷᵢ)²</strong>. No es una ecuación que se resuelva para x, sino un modelo que se ajusta a los datos.
            </p>
          </div>
        </div>

        <div className="theory-methods-grid" style={{ gridTemplateColumns: '1fr' }}>
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

        <div className="how-to-grid">
          {REGRESSION_STEPS.map((step, index) => (
            <div className="how-to-card" key={step.title}>
              <span className="how-to-number">{index + 1}</span>
              <div><h3>{step.title}</h3><p>{step.text}</p></div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
