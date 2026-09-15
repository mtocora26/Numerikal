import React from 'react';
import { BookOpen, CheckCircle2, Compass, Lightbulb, PlayCircle } from 'lucide-react';
import { MethodFactory } from '../../factories/MethodFactory';
import { MathView } from '../../components/MathView/MathView';
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

export const Learn: React.FC = () => {
  const methods = MethodFactory.getAllMethods();

  return (
    <div className="learn-container">
      <header className="learn-header">
        <div className="learn-badge">
          <BookOpen size={14} />
          <span>Guía de estudio</span>
        </div>
        <h1 className="learn-title">Teoría: solución de ecuaciones no lineales</h1>
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
                  <span>Fórmula</span>
                  <MathView math={method.latexFormula} block />
                </div>
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
    </div>
  );
};
