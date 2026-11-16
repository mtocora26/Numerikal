import React from 'react';
import { ArrowRight, Calculator, CircleHelp, GraduationCap } from 'lucide-react';
import { TopicIntro, StepsGrid } from '../Learn/topics/shared';
import './Help.css';

interface HelpProps {
  onOpenMethod: (methodId: string) => void;
  onOpenLearn: () => void;
}

const CHOOSE_ROWS = [
  { have: 'Una ecuación f(x) = 0 y quiero su raíz', family: 'Ecuaciones no lineales', example: 'x³ − 4x − 1 = 0', methodId: 'bisection' },
  { have: 'Un sistema de ecuaciones Ax = b', family: 'Sistemas lineales (Jacobi, Gauss-Seidel)', example: '4x₁ − x₂ = 3, −x₁ + 4x₂ = 3', methodId: 'jacobi' },
  { have: 'Puntos (x, y) y quiero una curva que pase exactamente por todos', family: 'Interpolación (Lagrange, Newton, Neville)', example: '(0, 7), (1, 4), (2, 11), (3, 34)', methodId: 'lagrange' },
  { have: 'Una función conocida y quiero aproximarla cerca de un punto con un polinomio', family: 'Series (Taylor)', example: 'sen(x) cerca de a = 0', methodId: 'taylor' },
  { have: 'Una función y quiero el área bajo su curva entre dos límites', family: 'Integración numérica (Trapecio, Simpson 1/3, 3/8 y Romberg)', example: '∫ sen(x) dx de 0 a π', methodId: 'trapezoid' },
  { have: 'Datos medidos con ruido y quiero la curva que mejor siga la tendencia', family: 'Regresión polinomial', example: 'mediciones de un experimento', methodId: 'polynomial-regression' },
];

const USE_STEPS = [
  { title: 'Elige la familia', text: 'En Métodos, las pestañas de arriba separan los tipos de problema: ecuaciones, sistemas, interpolación, series, integración y regresión.' },
  { title: 'Selecciona el método', text: 'El desplegable del paso 1 muestra la fórmula, la dificultad y cuándo converge o qué requiere cada método.' },
  { title: 'Escribe tu ejercicio', text: 'Función, matriz o tabla de datos, según la familia. La vista previa en LaTeX te confirma cómo se entendió.' },
  { title: 'Calcula y revisa', text: 'Si algo falta o es inválido, un aviso rojo te dice qué corregir y el botón de calcular se desactiva. Un aviso amarillo no impide calcular, solo advierte.' },
];

const EXPRESSIONS = [
  { ok: true, text: 'x^3 - 4*x - 1', note: 'potencias con ^ ; también se entiende 4x como 4*x' },
  { ok: true, text: 'sen(x) + cos(x)', note: 'sen y tg se aceptan en español; también sin y tan' },
  { ok: true, text: 'exp(-x) - x', note: 'e^x y exp(x) significan lo mismo; e y π (pi) son constantes' },
  { ok: true, text: 'ln(x) + sqrt(x)', note: 'ln es el logaritmo natural; log10 es el decimal; cbrt es la raíz cúbica' },
  { ok: false, text: 'x^3 - 4x - ', note: 'incompleta: falta un término al final' },
  { ok: false, text: 'f(x) = x^2 - 4', note: 'escribe solo el lado derecho, sin "f(x) ="' },
  { ok: false, text: 'x**2', note: 'usa ^ para las potencias, no **' },
];

const DATA_TIPS = [
  'Puntos (x, y): una fila por dato. Puedes escribirlos o usar "Pegar datos" con filas copiadas de Excel, CSV o texto (separados por tabulador, coma, punto y coma o espacio).',
  'En interpolación y series, el valor x* y el punto a se escriben con punto o coma decimal (2.5 o 2,5).',
  'Integración: escribe f(x), los límites a < b (también valen pi, 2pi, pi/2…) y el número de subintervalos n, un entero de 1 a 100. Simpson 1/3 necesita n par y Simpson 3/8, n múltiplo de 3. En Romberg el último campo son las filas k de la tabla (1 a 10): la fila i usa 2ⁱ subintervalos y la esquina de la tabla es la mejor aproximación. El valor exacto y el error aparecen cuando Numerikal encuentra la primitiva (polinomios, sen, cos, exp, ln, 1/(ax + b), raíces…); si no, solo verás la aproximación.',
  'Sistemas: elige el tamaño (2×2 a 6×6), llena A, b y el vector inicial x⁽⁰⁾. Un vector inicial de ceros funciona para empezar.',
  'Punto Fijo pide la ecuación despejada x = g(x), no f(x) = 0.',
];

const READ_STEPS = [
  { title: 'Tarjeta de resultado', text: 'Arriba aparece el valor principal (raíz, solución, polinomio o P(x*)), cuántas iteraciones tomó y el motivo de finalización.' },
  { title: 'Tabla', text: 'Cada fila es una iteración con su error. El cálculo termina cuando el error baja de la tolerancia o se llega al máximo de iteraciones.' },
  { title: 'Procedimiento', text: 'En sistemas, interpolación, series, integración y regresión, la pestaña de pasos repite el procedimiento de clase con los valores sustituidos para que lo compares con tu cuaderno.' },
  { title: 'Gráfica', text: 'Muestra la función o los datos con el resultado marcado. Sirve para comprobar que la respuesta tiene sentido a simple vista.' },
];

const GRAPH_ROWS = [
  { family: 'Ecuaciones', text: 'Curva de f(x), la raíz encontrada y la construcción del método (intervalo, rectas secantes o tangentes).' },
  { family: 'Interpolación', text: 'Puntos de los datos, el polinomio que pasa por todos y el punto interpolado (x*, P(x*)) en amarillo.' },
  { family: 'Series', text: 'f(x) en gris y el polinomio P(x) en verde. Se separan al alejarse de a: ahí se ve cuánto error hay.' },
  { family: 'Integración', text: 'La curva de f(x) y el área aproximada sombreada: trapecios en la regla del trapecio, parábolas en Simpson 1/3 y cúbicas en Simpson 3/8. En Romberg se dibuja la partición más fina de la tabla (trapecios). Los puntos verdes son los nodos.' },
  { family: 'Regresión', text: 'Los datos, la curva ajustada y segmentos punteados que son los residuos.' },
];

const COMMON_ERRORS = [
  { problem: 'Mismo signo en el intervalo (Bisección, Falsa Posición)', cause: 'f(xi) y f(xs) tienen el mismo signo, así que no hay garantía de raíz entre ellos.', fix: 'Prueba otros límites hasta que f cambie de signo entre xi y xs.' },
  { problem: 'La función no está definida en el punto', cause: 'El punto cae donde f no existe, por ejemplo ln(x) en 0 o 1/x en 0.', fix: 'Mueve el punto inicial o el intervalo a donde f esté definida.' },
  { problem: 'Tangente horizontal (Newton-Raphson)', cause: 'f′(xi) es casi cero y el método puede salirse de rumbo.', fix: 'Cambia el punto inicial.' },
  { problem: 'Punto Fijo podría diverger', cause: 'No se cumple |g′(x)| < 1 en el valor inicial.', fix: 'Despeja otra g(x) o cambia el valor inicial.' },
  { problem: 'La matriz no es diagonal dominante (Jacobi, Gauss-Seidel)', cause: 'No está garantizado que el método converja.', fix: 'Reordena las ecuaciones para que el elemento de la diagonal domine su fila.' },
  { problem: 'Valores de x repetidos (Interpolación)', cause: 'Un polinomio no puede pasar por dos puntos con la misma x y distinta y.', fix: 'Quita o corrige la fila repetida.' },
  { problem: 'Menos puntos de los necesarios', cause: 'La interpolación necesita al menos 2 puntos y un polinomio de grado m necesita m + 1 valores de x distintos.', fix: 'Agrega datos o baja el grado.' },
  { problem: 'Derivada demasiado larga (Taylor)', cause: 'En funciones racionales como 1/(1+x²), la derivada crece muy rápido con el orden.', fix: 'Baja el grado o usa una función más simple.' },
  { problem: 'Simpson 1/3 con n impar', cause: 'Cada parábola cubre dos subintervalos, así que n debe ser par.', fix: 'Usa n = 2, 4, 6… (con n = 2 es la regla simple).' },
  { problem: 'Simpson 3/8 con n que no es múltiplo de 3', cause: 'Cada cúbica cubre tres subintervalos, así que n debe ser 3, 6, 9…', fix: 'Usa un n múltiplo de 3 (con n = 3 es la regla simple).' },
  { problem: 'Romberg con un k fuera de rango', cause: 'En Romberg el último campo son las filas de la tabla, no subintervalos: cada fila duplica la partición y con k filas la más fina tiene 2^(k−1) subintervalos.', fix: 'Usa un entero de 1 a 10; con k = 4 o 5 ya se alcanzan muchas cifras correctas en funciones suaves.' },
  { problem: 'Límites invertidos o iguales (Integración)', cause: 'Los métodos exigen a < b.', fix: 'Escribe el menor como límite inferior; si necesitas ∫ de b a a, calcula de a a b y cambia el signo.' },
  { problem: 'La función no está definida en un nodo (Integración)', cause: 'Alguno de los puntos xᵢ = a + i·h cae donde f no existe, por ejemplo ln(x) en 0 o 1/x en 0.', fix: 'Cambia los límites o el número de subintervalos para que ningún nodo caiga ahí.' },
  { problem: 'Sin valor exacto ni error (Integración)', cause: 'Numerikal no encontró una primitiva de f: puede que no exista en forma elemental (como e^(−x²) o sen(x)/x), que ninguna de sus reglas la cubra, o que haya un polo dentro del intervalo (como 1/x entre −1 y 2).', fix: 'La aproximación sigue siendo válida. Para el error, calcula la integral a mano o con otra herramienta y compara; Numerikal no sustituye el valor exacto por otra aproximación.' },
  { problem: 'Muchos puntos u oscilaciones (Interpolación)', cause: 'Con 8 o más puntos el polinomio puede oscilar entre los nodos (fenómeno de Runge).', fix: 'Usa menos puntos o ajusta una regresión de grado bajo.' },
  { problem: 'Extrapolación', cause: 'x* está fuera del rango de los datos y el resultado es poco confiable.', fix: 'Usa un x* dentro del rango, o interprétalo con cuidado.' },
];

export const Help: React.FC<HelpProps> = ({ onOpenMethod, onOpenLearn }) => (
  <div className="learn-container help-container">
    <header className="learn-header">
      <div className="learn-badge">
        <CircleHelp size={14} />
        <span>Ayuda</span>
      </div>
      <h1 className="learn-title">Cómo usar Numerikal</h1>
      <p className="learn-subtitle">
        Qué puedes resolver, cómo escribir tu ejercicio y cómo leer la solución.
      </p>
    </header>

    <TopicIntro title="¿Qué es Numerikal?">
      Un entorno educativo para resolver problemas de métodos numéricos <strong>paso a paso</strong>: ecuaciones no lineales,
      sistemas lineales, interpolación, series de Taylor, integración numérica y regresión. No solo da la respuesta: muestra el procedimiento, las
      tablas y la gráfica para que puedas comparar con lo que haces en clase.
    </TopicIntro>

    <section className="methods-theory-section">
      <div>
        <span className="section-kicker">Para empezar</span>
        <h2 className="section-block-title">¿Qué familia necesito?</h2>
      </div>
      <div className="help-table-wrap">
        <table className="help-table">
          <thead>
            <tr><th>Tengo…</th><th>Uso…</th><th>Ejemplo</th><th aria-label="Abrir" /></tr>
          </thead>
          <tbody>
            {CHOOSE_ROWS.map((row) => (
              <tr key={row.methodId}>
                <td>{row.have}</td>
                <td><strong>{row.family}</strong></td>
                <td>{row.example}</td>
                <td>
                  <button type="button" className="btn-secondary help-open-btn" onClick={() => onOpenMethod(row.methodId)}>
                    <span>Abrir</span>
                    <ArrowRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    <section className="methods-theory-section">
      <div>
        <span className="section-kicker">Flujo básico</span>
        <h2 className="section-block-title">Resolver un ejercicio</h2>
      </div>
      <StepsGrid steps={USE_STEPS} />
    </section>

    <section className="methods-theory-section">
      <div>
        <span className="section-kicker">Entradas</span>
        <h2 className="section-block-title">Cómo escribir tu ejercicio</h2>
      </div>
      <div className="help-card glass-panel">
        <h3>Funciones</h3>
        <ul className="help-example-list">
          {EXPRESSIONS.map((item) => (
            <li key={item.text} className={item.ok ? 'help-ok' : 'help-bad'}>
              <code>{item.text}</code>
              <span>{item.ok ? 'Válido' : 'Inválido'} · {item.note}</span>
            </li>
          ))}
        </ul>
        <p className="help-note">El botón <strong>Teclado</strong> del editor inserta funciones y símbolos sin escribirlos.</p>
      </div>
      <div className="help-card glass-panel">
        <h3>Datos, matrices y parámetros</h3>
        <ul className="help-plain-list">
          {DATA_TIPS.map((tip) => <li key={tip}>{tip}</li>)}
        </ul>
        <p className="help-note">
          La <strong>tolerancia</strong> es el error por debajo del cual el método se detiene; el <strong>tipo de error</strong>
          (absoluto, relativo o porcentual) define cómo se mide.
        </p>
      </div>
    </section>

    <section className="methods-theory-section">
      <div>
        <span className="section-kicker">Resultados</span>
        <h2 className="section-block-title">Cómo interpretar la solución</h2>
      </div>
      <StepsGrid steps={READ_STEPS} />
    </section>

    <section className="methods-theory-section">
      <div>
        <span className="section-kicker">Gráficas</span>
        <h2 className="section-block-title">Cómo leer las gráficas</h2>
      </div>
      <div className="help-card glass-panel">
        <ul className="help-plain-list">
          {GRAPH_ROWS.map((row) => (
            <li key={row.family}><strong>{row.family}:</strong> {row.text}</li>
          ))}
        </ul>
      </div>
    </section>

    <section className="methods-theory-section">
      <div>
        <span className="section-kicker">Si algo no funciona</span>
        <h2 className="section-block-title">Errores y avisos más comunes</h2>
      </div>
      <div className="help-errors">
        {COMMON_ERRORS.map((item) => (
          <article className="help-error-card glass-panel" key={item.problem}>
            <h3>{item.problem}</h3>
            <p><strong>Por qué:</strong> {item.cause}</p>
            <p><strong>Qué hacer:</strong> {item.fix}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="home-next-step help-next" aria-label="Siguientes pasos">
      <span className="home-next-step-label">¿Y la teoría detrás de cada método?</span>
      <p>La sección Teoría explica la fórmula, cuándo usar cada método y qué revisar, con un ejemplo y su gráfica.</p>
      <div className="help-next-actions">
        <button type="button" className="btn-secondary" onClick={onOpenLearn}>
          <GraduationCap size={16} />
          Ir a Teoría
        </button>
        <button type="button" className="btn-primary" onClick={() => onOpenMethod('bisection')}>
          <Calculator size={16} />
          Abrir Métodos
        </button>
      </div>
    </section>
  </div>
);
