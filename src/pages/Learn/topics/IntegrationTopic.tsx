import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MethodFactory } from '../../../factories/MethodFactory';
import { MathView } from '../../../components/MathView/MathView';
import { IntegrationGraph } from '../../../components/IntegrationGraph/IntegrationGraph';
import { Simpson13Rule } from '../../../domain/integration/Simpson13';
import { Simpson38Rule } from '../../../domain/integration/Simpson38';
import { TrapezoidRule } from '../../../domain/integration/Trapezoid';
import { RombergRule } from '../../../domain/integration/Romberg';
import { StepsGrid, TopicIntro } from './shared';

/** ∫₀^π sen x dx = 2, con la misma partición para comparar ambas reglas. */
const EXAMPLE_INPUT = { expression: 'sin(x)', a: 0, b: Math.PI, n: 4 };
const TRAPEZOID_EXAMPLE = new TrapezoidRule().execute(EXAMPLE_INPUT);
const SIMPSON_EXAMPLE = new Simpson13Rule().execute(EXAMPLE_INPUT);
/** Simpson 3/8 pide n múltiplo de 3, así que el ejemplo usa n = 6 (y se compara con Simpson 1/3 con el mismo n). */
const SIMPSON38_EXAMPLE = new Simpson38Rule().execute({ ...EXAMPLE_INPUT, n: 6 });
const SIMPSON_N6_EXAMPLE = new Simpson13Rule().execute({ ...EXAMPLE_INPUT, n: 6 });
/** Romberg con n = 8 subintervalos (k = 4 filas): llega a 8 decimales de ∫₀¹ eˣ dx = e − 1 con solo 9 evaluaciones de f. */
const ROMBERG_EXAMPLE = new RombergRule().execute({ expression: 'exp(x)', a: 0, b: 1, n: 8 });

const PARTITION = 'h = \\frac{b - a}{n}, \\qquad x_i = a + i\\,h, \\quad i = 0, 1, \\ldots, n';

const TRAPEZOID_ERROR = 'E_T = -\\frac{b - a}{12}\\,h^2\\,f\'\'(\\xi), \\quad \\xi \\in [a, b]';
const SIMPSON_ERROR = 'E_S = -\\frac{b - a}{180}\\,h^4\\,f^{(4)}(\\xi), \\quad \\xi \\in [a, b]';
const SIMPSON38_ERROR = 'E_{3/8} = -\\frac{b - a}{80}\\,h^4\\,f^{(4)}(\\xi), \\quad \\xi \\in [a, b]';

const TRAPEZOID_STEPS = [
  { title: 'Calcula h', text: 'Divide el intervalo en n partes iguales: h = (b − a)/n.' },
  { title: 'Evalúa f en los nodos', text: 'Obtén f(x₀), f(x₁), …, f(xₙ) con xᵢ = a + i·h.' },
  { title: 'Suma con los pesos 1, 2, …, 2, 1', text: 'Los dos extremos entran una vez y todos los nodos interiores entran multiplicados por 2, porque cada uno es lado de dos trapecios.' },
  { title: 'Multiplica por h/2', text: 'El corchete por h/2 da el área total de los trapecios. Compárala con el valor exacto si lo conoces.' },
];

const SIMPSON_STEPS = [
  { title: 'Comprueba que n sea par', text: 'Cada parábola usa tres nodos (dos subintervalos), así que los subintervalos se agrupan de dos en dos.' },
  { title: 'Calcula h y evalúa f en los nodos', text: 'h = (b − a)/n y f(xᵢ) para i = 0, …, n.' },
  { title: 'Suma con los pesos 1, 4, 2, 4, …, 4, 1', text: 'Los extremos pesan 1, los nodos de índice impar pesan 4 (son el centro de cada parábola) y los de índice par interiores pesan 2 (son el borde compartido entre dos parábolas).' },
  { title: 'Multiplica por h/3', text: 'El corchete por h/3 da el área bajo todas las parábolas.' },
];

const SIMPSON38_STEPS = [
  { title: 'Comprueba que n sea múltiplo de 3', text: 'Cada cúbica usa cuatro nodos (tres subintervalos), así que los subintervalos se agrupan de tres en tres.' },
  { title: 'Calcula h y evalúa f en los nodos', text: 'h = (b − a)/n y f(xᵢ) para i = 0, …, n.' },
  { title: 'Suma con los pesos 1, 3, 3, 2, 3, 3, 2, …, 3, 3, 1', text: 'Los extremos pesan 1, los nodos de índice múltiplo de 3 interiores pesan 2 (son el borde compartido entre dos cúbicas) y todos los demás pesan 3.' },
  { title: 'Multiplica por 3h/8', text: 'El corchete por 3h/8 da el área bajo todas las cúbicas.' },
];

const ROMBERG_ERROR = 'R_{k,j} \\text{ es exacta para polinomios de grado } 2j - 1: \\quad E \\sim O\\left(h^{2j}\\right)';

const ROMBERG_STEPS = [
  { title: 'Parte del trapecio simple', text: 'Con H = b − a, la primera celda es R(1,1) = (H/2)·[f(a) + f(b)]: un solo trapecio. La tabla se numera desde 1, como en clase.' },
  { title: 'Llena la primera columna por recurrencia', text: 'Cada fila duplica la partición y solo evalúa f en los puntos nuevos: R(k,1) = ½·[R(k−1,1) + h_ant·Σ f(a + (2i−1)·s)], con h_ant = H/2^(k−2) (el h del renglón de arriba), s = H/2^(k−1) e i = 1, …, 2^(k−2).' },
  { title: 'Extrapola con Richardson', text: 'Cada celda combina su vecina izquierda con la de la fila anterior: R(k,j) = R(k,j−1) + (R(k,j−1) − R(k−1,j−1))/(4^(j−1) − 1). Los divisores son 3, 15, 63… y cada columna elimina el término siguiente del error del trapecio.' },
  { title: 'Lee la esquina inferior derecha', text: 'El profe da n subintervalos (potencia de 2) y la tabla tiene K = log₂(n) + 1 filas: la celda R(K,K) acumula todas las extrapolaciones y es la mejor aproximación, exacta para polinomios de grado 2K − 1.' },
];

export const IntegrationTopic: React.FC = () => {
  const [trapezoidMeta, simpsonMeta, simpson38Meta, rombergMeta] = MethodFactory.getIntegrationMethods();

  return (
    <>
      <TopicIntro title="¿Qué es la integración numérica?">
        La integral definida <strong>I = ∫ f(x) dx</strong> entre a y b es el área bajo la curva de f. Cuando no hay una antiderivada
        sencilla, o solo conoces f en algunos puntos, se <strong>aproxima el área</strong>: se divide [a, b] en n subintervalos de ancho
        h = (b − a)/n y en cada uno se reemplaza f por una figura fácil de integrar. Las reglas del trapecio y de Simpson pertenecen a la
        familia de Newton-Cotes: usan nodos igualmente espaciados. Romberg parte del trapecio y lo corrige con extrapolación para
        alcanzar más precisión con las mismas evaluaciones de f.
      </TopicIntro>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Punto de partida</span>
          <h2 className="section-block-title">La partición de [a, b]</h2>
        </div>
        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <p className="method-definition">
              <strong>¿Qué es?</strong> Los n + 1 nodos x₀ = a, …, xₙ = b dividen el intervalo en pedazos iguales. Ambas reglas usan los
              mismos nodos y los mismos valores f(xᵢ): cambia solo la figura que se dibuja entre ellos y, por tanto, los pesos de la suma.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Ancho y nodos</span>
              <MathView math={PARTITION} block />
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Segmentos rectos</span>
          <h2 className="section-block-title">Regla del Trapecio</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{trapezoidMeta.difficulty}</span>
                <h3>{trapezoidMeta.name}</h3>
              </div>
              <span className="method-tag">{trapezoidMeta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> En cada subintervalo se une (xᵢ, f(xᵢ)) con (xᵢ₊₁, f(xᵢ₊₁)) por una recta y se suma el área de los
              trapecios resultantes. Con n = 1 es la <strong>regla simple</strong>: un solo trapecio de a a b.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Regla compuesta</span>
              <MathView math={trapezoidMeta.latexFormula} block />
            </div>
            <div className="method-formula">
              <span className="method-formula-label">Error de truncamiento</span>
              <MathView math={TRAPEZOID_ERROR} block />
            </div>
            <figure className="method-theory-graph">
              <IntegrationGraph result={TRAPEZOID_EXAMPLE} />
              <figcaption className="theory-graph-caption">
                <p>Los cuatro trapecios quedan por debajo de la curva sen x: al ser cóncava, las cuerdas siempre la subestiman.</p>
                <p className="theory-graph-root">
                  Numerikal obtiene <MathView math={`\\int_0^{\\pi} \\sin x\\,dx \\approx ${TRAPEZOID_EXAMPLE.value.toFixed(6)}`} /> con n = 4, frente al valor
                  exacto 2 (error {TRAPEZOID_EXAMPLE.absoluteError?.toFixed(6)}).
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando quieres una aproximación rápida y fácil de verificar a mano, cuando f solo se conoce en puntos tabulados, o cuando f no es muy suave.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que f esté definida en todos los nodos y que n sea suficiente: el error baja con h², así que duplicar n lo reduce unas 4 veces. Es exacta si f es una recta.</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{trapezoidMeta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo integrar con el trapecio</h2>
        </div>
        <StepsGrid steps={TRAPEZOID_STEPS} />
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Parábolas</span>
          <h2 className="section-block-title">Regla de Simpson 1/3</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{simpsonMeta.difficulty}</span>
                <h3>{simpsonMeta.name}</h3>
              </div>
              <span className="method-tag">{simpsonMeta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> Por cada tres nodos consecutivos pasa una parábola y se integra esa parábola en lugar de f. Como
              cada una cubre dos subintervalos, <strong>n debe ser par</strong>. Con n = 2 es la <strong>regla simple</strong>: una sola parábola de a a b.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Regla compuesta</span>
              <MathView math={simpsonMeta.latexFormula} block />
            </div>
            <div className="method-formula">
              <span className="method-formula-label">Error de truncamiento</span>
              <MathView math={SIMPSON_ERROR} block />
            </div>
            <figure className="method-theory-graph">
              <IntegrationGraph result={SIMPSON_EXAMPLE} />
              <figcaption className="theory-graph-caption">
                <p>Dos parábolas siguen la curva mucho más de cerca que cuatro trapecios con los mismos nodos.</p>
                <p className="theory-graph-root">
                  Numerikal obtiene <MathView math={`\\int_0^{\\pi} \\sin x\\,dx \\approx ${SIMPSON_EXAMPLE.value.toFixed(6)}`} /> con n = 4 (error{' '}
                  {SIMPSON_EXAMPLE.absoluteError?.toFixed(6)}), frente a {TRAPEZOID_EXAMPLE.value.toFixed(6)} del trapecio.
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando f es suave y quieres más precisión con los mismos nodos que el trapecio. Es exacta para polinomios de hasta grado 3.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que n sea par y que f esté definida en todos los nodos. Su error depende de f⁗: si f cambia bruscamente, la ventaja sobre el trapecio se reduce.</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{simpsonMeta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo integrar con Simpson 1/3</h2>
        </div>
        <StepsGrid steps={SIMPSON_STEPS} />
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Cúbicas</span>
          <h2 className="section-block-title">Regla de Simpson 3/8</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{simpson38Meta.difficulty}</span>
                <h3>{simpson38Meta.name}</h3>
              </div>
              <span className="method-tag">{simpson38Meta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> Por cada cuatro nodos consecutivos pasa una cúbica y se integra esa cúbica en lugar de f. Como
              cada una cubre tres subintervalos, <strong>n debe ser múltiplo de 3</strong>. Con n = 3 es la <strong>regla simple</strong>: una sola cúbica de a a b.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Regla compuesta</span>
              <MathView math={simpson38Meta.latexFormula} block />
            </div>
            <div className="method-formula">
              <span className="method-formula-label">Error de truncamiento</span>
              <MathView math={SIMPSON38_ERROR} block />
            </div>
            <figure className="method-theory-graph">
              <IntegrationGraph result={SIMPSON38_EXAMPLE} />
              <figcaption className="theory-graph-caption">
                <p>Dos cúbicas (seis subintervalos) siguen la curva casi sin separarse de ella; los nodos 0, 3 y 6 son los bordes de cada cúbica.</p>
                <p className="theory-graph-root">
                  Numerikal obtiene <MathView math={`\\int_0^{\\pi} \\sin x\\,dx \\approx ${SIMPSON38_EXAMPLE.value.toFixed(6)}`} /> con n = 6 (error{' '}
                  {SIMPSON38_EXAMPLE.absoluteError?.toFixed(6)}), frente a {SIMPSON_N6_EXAMPLE.value.toFixed(6)} de Simpson 1/3 con el mismo n.
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando n es múltiplo de 3, o cuando n es impar: se aplica 3/8 a tres subintervalos (al inicio o al final) y Simpson 1/3 al resto, que sí queda par.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que n sea múltiplo de 3 y que f esté definida en todos los nodos. Tiene el mismo orden de error que Simpson 1/3 (h⁴), pero con el mismo h su constante (1/80) es mayor que la de 1/3 (1/180): si n es par, Simpson 1/3 suele ser más precisa.</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{simpson38Meta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo integrar con Simpson 3/8</h2>
        </div>
        <StepsGrid steps={SIMPSON38_STEPS} />
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Extrapolación de Richardson</span>
          <h2 className="section-block-title">Integración de Romberg</h2>
        </div>

        <div className="theory-methods-grid theory-methods-grid-single">
          <article className="theory-method-card">
            <div className="theory-method-header">
              <div>
                <span className="method-difficulty">{rombergMeta.difficulty}</span>
                <h3>{rombergMeta.name}</h3>
              </div>
              <span className="method-tag">{rombergMeta.tag}</span>
            </div>
            <p className="method-definition">
              <strong>¿Qué es?</strong> En lugar de dibujar otra figura, Romberg <strong>corrige el error del trapecio</strong>. Llena una tabla
              triangular: la primera columna es el trapecio compuesto con 1, 2, 4, 8… subintervalos y cada celda de las demás columnas combina dos
              vecinos de la columna anterior para cancelar el término principal del error. La esquina inferior derecha de la tabla es la mejor
              aproximación.
            </p>
            <div className="method-formula">
              <span className="method-formula-label">Extrapolación de Richardson</span>
              <MathView math={rombergMeta.latexFormula} block />
            </div>
            <div className="method-formula">
              <span className="method-formula-label">Orden de la celda R(k, j)</span>
              <MathView math={ROMBERG_ERROR} block />
            </div>
            <figure className="method-theory-graph">
              <IntegrationGraph result={ROMBERG_EXAMPLE} />
              <figcaption className="theory-graph-caption">
                <p>Romberg reutiliza la misma partición del trapecio: la gráfica muestra los 8 trapecios de la partición más fina, cuyos valores alimentan toda la tabla.</p>
                <p className="theory-graph-root">
                  Para ∫₀¹ eˣ dx = e − 1, Numerikal obtiene <MathView math={`R_{4,4} \\approx ${ROMBERG_EXAMPLE.value.toFixed(10)}`} /> con n = 8 subintervalos
                  (k = 4 filas, error {ROMBERG_EXAMPLE.absoluteError?.toExponential(2)}), con 9 evaluaciones de f.
                </p>
              </figcaption>
            </figure>
            <div className="method-guidance-row">
              <div><strong>¿Cuándo usarlo?</strong><p>Cuando f es suave y quieres muchas cifras correctas sin cambiar de método: la diagonal crece dos órdenes de h por fila, más rápido que cualquier regla de Newton-Cotes con las mismas evaluaciones.</p></div>
              <div><strong>¿Qué revisar?</strong><p>Que n sea potencia de 2 (1, 2, 4, 8… hasta 512): cada fila duplica la partición de la anterior. Que f esté definida en los nodos de esa partición más fina y que sea suave: si f tiene picos o derivadas que saltan, la extrapolación pierde fuerza y conviene más bien subir n en Simpson o el trapecio.</p></div>
            </div>
            <div className="method-convergence">
              <CheckCircle2 size={16} />
              <span>{rombergMeta.recommendedConvergence}</span>
            </div>
          </article>
        </div>
      </section>

      <section className="methods-theory-section">
        <div>
          <span className="section-kicker">Paso a paso</span>
          <h2 className="section-block-title">Cómo integrar con Romberg</h2>
        </div>
        <StepsGrid steps={ROMBERG_STEPS} />
      </section>
    </>
  );
};
