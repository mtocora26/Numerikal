import React from 'react';
import { BookOpen, Table } from 'lucide-react';
import type { IntegrationResult, RombergResult, Simpson38Result, SimpsonResult } from '../../domain/integration/types';
import { isRombergResult } from '../../domain/integration/types';
import { formatNumber, formatNumberLatex, termLatex } from '../../services/numberFormat';
import { MathView } from '../MathView/MathView';
import '../IterationTable/IterationTable.css';
import '../GaussJordanSteps/GaussJordanSteps.css';
import '../NewtonSteps/NewtonSteps.css';

const TRAPEZOID_FORMULA = 'I \\approx \\frac{h}{2}\\left[f(x_0) + 2\\sum_{i=1}^{n-1} f(x_i) + f(x_n)\\right]';
const SIMPSON_FORMULA =
  'I \\approx \\frac{h}{3}\\left[f(x_0) + 4\\sum_{i=1,3,5}^{n-1} f(x_i) + 2\\sum_{i=2,4,6}^{n-2} f(x_i) + f(x_n)\\right]';

/** Hasta este n se escriben todos los f(xᵢ) en el procedimiento; con más, la lista vive en la pestaña Tabla. */
const MAX_LISTED_NODES = 10;

const SIMPSON38_FORMULA =
  'I \\approx \\frac{3h}{8}\\left[f(x_0) + 3\\sum_{i \\not\\equiv 0\\ (\\mathrm{mod}\\ 3)} f(x_i) + 2\\sum_{i=3,6,9}^{n-3} f(x_i) + f(x_n)\\right]';

/** Lo que cambia entre reglas en el texto: fórmula, explicación, factor que multiplica al corchete y regla simple. */
const RULE_TEXT: Record<string, { formula: string; intro: string; factor: string; simpleN: number; simpleFigure: string }> = {
  trapezoid: {
    formula: TRAPEZOID_FORMULA,
    intro: 'La regla del trapecio reemplaza f por un segmento recto en cada subintervalo y suma el área de los trapecios que se forman:',
    factor: 'h/2',
    simpleN: 1,
    simpleFigure: 'un solo trapecio',
  },
  'simpson-1-3': {
    formula: SIMPSON_FORMULA,
    intro: 'Simpson 1/3 reemplaza f por una parábola en cada par de subintervalos; por eso n debe ser par. Sumando el área bajo todas las parábolas:',
    factor: 'h/3',
    simpleN: 2,
    simpleFigure: 'una sola parábola',
  },
  'simpson-3-8': {
    formula: SIMPSON38_FORMULA,
    intro: 'Simpson 3/8 reemplaza f por una cúbica en cada grupo de tres subintervalos; por eso n debe ser múltiplo de 3. Sumando el área bajo todas las cúbicas:',
    factor: '3h/8',
    simpleN: 3,
    simpleFigure: 'una sola cúbica',
  },
};

const isSimpson13 = (result: IntegrationResult): result is SimpsonResult => result.methodId === 'simpson-1-3';
const isSimpson38 = (result: IntegrationResult): result is Simpson38Result => result.methodId === 'simpson-3-8';/** a + b − c … con los signos bien escritos: "0.5 - 0.25", no "0.5 + -0.25". */
const sumLatex = (values: number[]): string =>
  values.length === 0
    ? '0'
    : values.map((v, i) => (i === 0 ? formatNumberLatex(v) : v < 0 ? ` - ${formatNumberLatex(-v)}` : ` + ${formatNumberLatex(v)}`)).join('');

/** Σ f(xᵢ) para los nodos dados: la suma desarrollada si son pocos y solo el total si son muchos. */
const groupSumLatex = (indices: number[], result: IntegrationResult, total: number): string => {
  if (indices.length > MAX_LISTED_NODES) return formatNumberLatex(total, 8);
  const symbols = indices.map((i) => `f(x_{${i}})`).join(' + ');
  // Con un solo término, "f(x₂) = 1 = 1" repetiría el valor
  if (indices.length === 1) return `${symbols} = ${formatNumberLatex(total, 8)}`;
  return `${symbols} = ${sumLatex(indices.map((i) => result.nodes[i].fx))} = ${formatNumberLatex(total, 8)}`;
};

/** Tabla de nodos: xᵢ, f(xᵢ), el coeficiente de la regla y su producto, con el total de la suma ponderada. Solo para las reglas de Newton-Cotes; Romberg muestra su propia tabla. */
export const NodesTable: React.FC<{ result: Exclude<IntegrationResult, RombergResult> }> = ({ result }) => (
  <div className="iteration-table-card">
    <div className="table-header-toolbar">
      <div className="table-title-group">
        <Table size={16} className="title-icon" />
        <h4 className="table-title">Tabla de Nodos</h4>
        <span className="row-count-badge">h = {formatNumber(result.h)}</span>
      </div>
    </div>

    <div className="table-scroll-container">
      <table className="numerical-table">
        <thead>
          <tr>
            <th className="table-th td-iter"><div className="th-content"><span className="th-label">i</span></div></th>
            <th className="table-th"><div className="th-content"><span className="th-latex"><MathView math="x_i" /></span></div></th>
            <th className="table-th"><div className="th-content"><span className="th-latex"><MathView math="f(x_i)" /></span></div></th>
            <th className="table-th"><div className="th-content"><span className="th-label">Coeficiente</span></div></th>
            <th className="table-th"><div className="th-content"><span className="th-latex"><MathView math="c_i \cdot f(x_i)" /></span></div></th>
          </tr>
        </thead>
        <tbody>
          {result.nodes.map((node) => (
            <tr key={node.index} className="table-row">
              <td className="table-td td-iter">{node.index}</td>
              <td className="table-td">{formatNumber(node.x)}</td>
              <td className="table-td">{formatNumber(node.fx)}</td>
              <td className="table-td">{node.coefficient}</td>
              <td className="table-td">{formatNumber(node.weighted)}</td>
            </tr>
          ))}
          <tr className="table-row">
            <td className="table-td td-iter">Σ</td>
            <td className="table-td" />
            <td className="table-td" />
            <td className="table-td" />
            <td className="table-td"><strong>{formatNumber(result.weightedSum)}</strong></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export const IntegrationSteps: React.FC<{ result: IntegrationResult }> = ({ result }) => {
  if (isRombergResult(result)) return <RombergSteps result={result} />;
  const { a, b, n, h, nodes } = result;
  const text = RULE_TEXT[result.methodId];
  const factorValue = isSimpson38(result) ? (3 * h) / 8 : isSimpson13(result) ? h / 3 : h / 2;
  const aLatex = termLatex(a);
  const bLatex = formatNumberLatex(b);
  const listNodes = n <= MAX_LISTED_NODES;

  const oddIndices = nodes.filter((node) => node.coefficient === 4).map((node) => node.index);
  const evenIndices = nodes.filter((node) => node.coefficient === 2 && node.index > 0 && node.index < n).map((node) => node.index);
  const tripleIndices = nodes.filter((node) => node.coefficient === 3).map((node) => node.index);
  const innerIndices = nodes.slice(1, n).map((node) => node.index);

  return (
    <div className="gauss-steps-card">
      <div className="gauss-steps-header">
        <BookOpen size={18} className="gauss-steps-icon" />
        <h4>Procedimiento: {result.methodName}</h4>
      </div>

      <section className="gauss-block">
        <h5>1. Integral y fórmula</h5>
        <div className="gauss-formula-box">
          <MathView math={`I = \\int_{${formatNumberLatex(a)}}^{${bLatex}} ${result.functionLatex}\\,dx`} block />
        </div>
        <p>{text.intro}</p>
        <div className="gauss-formula-box">
          <MathView math={text.formula} block />
        </div>
        {n === text.simpleN && (
          <p>Con n = {n} se usa la <strong>regla simple</strong>: {text.simpleFigure} para todo el intervalo.</p>
        )}
      </section>

      <section className="gauss-block">
        <h5>2. Ancho del subintervalo</h5>
        <div className="gauss-formula-box">
          <MathView math={`h = \\frac{b - a}{n} = \\frac{${bLatex} - ${aLatex}}{${n}} = ${formatNumberLatex(h, 8)}`} block />
        </div>
      </section>

      <section className="gauss-block">
        <h5>3. Nodos y valores de f</h5>
        {listNodes ? (
          <>
            <p>Los nodos son xᵢ = a + i·h, para i = 0, …, {n}:</p>
            <div className="gauss-formula-box">
              <MathView
                math={`\\begin{aligned}${nodes
                  .map((node) => `x_{${node.index}} &= ${formatNumberLatex(node.x)} & f(x_{${node.index}}) &= ${formatNumberLatex(node.fx)}`)
                  .join(' \\\\ ')}\\end{aligned}`}
                block
              />
            </div>
          </>
        ) : (
          <p>Son {n + 1} nodos xᵢ = a + i·h, con i = 0, …, {n}. Todos los xᵢ y f(xᵢ) están en la pestaña <strong>Tabla</strong>.</p>
        )}
      </section>

      <section className="gauss-block">
        <h5>4. Sumas de la regla</h5>
        <div className="gauss-formula-box">
          <MathView
            math={`f(x_0) + f(x_{${n}}) = ${termLatex(nodes[0].fx)} + ${termLatex(nodes[n].fx)} = ${formatNumberLatex(result.endsSum, 8)}`}
            block
          />
        </div>
        {isSimpson13(result) ? (
          <>
            <div className="gauss-formula-box">
              <MathView math={`\\sum_{i\\ \\text{impar}} f(x_i) = ${groupSumLatex(oddIndices, result, result.oddSum)}`} block />
            </div>
            {evenIndices.length > 0 && (
              <div className="gauss-formula-box">
                <MathView math={`\\sum_{i\\ \\text{par}} f(x_i) = ${groupSumLatex(evenIndices, result, result.evenSum)}`} block />
              </div>
            )}
          </>
        ) : isSimpson38(result) ? (
          <>
            <div className="gauss-formula-box">
              <MathView math={`\\sum_{i\\ \\text{no múltiplo de 3}} f(x_i) = ${groupSumLatex(tripleIndices, result, result.tripleSum)}`} block />
            </div>
            {evenIndices.length > 0 && (
              <div className="gauss-formula-box">
                <MathView math={`\\sum_{i\\ \\text{múltiplo de 3}} f(x_i) = ${groupSumLatex(evenIndices, result, result.sharedSum)}`} block />
              </div>
            )}
          </>
        ) : (
          innerIndices.length > 0 && (
            <div className="gauss-formula-box">
              <MathView math={`\\sum_{i=1}^{${n - 1}} f(x_i) = ${groupSumLatex(innerIndices, result, result.innerSum)}`} block />
            </div>
          )
        )}
      </section>

      <section className="gauss-block">
        <h5>5. Sustituir y calcular</h5>
        <div className="gauss-formula-box emphasized">
          <MathView math={result.substitutedLatex} block />
        </div>
        <p>
          El corchete vale {formatNumber(result.weightedSum)} y se multiplica por {text.factor} = {formatNumber(factorValue)}.
        </p>
      </section>

      <ExactComparisonSection
        result={result}
        refineHint={
          result.methodId === 'trapezoid'
            ? 'Prueba duplicar n y observa cómo baja el error (unas 4 veces en funciones suaves).'
            : 'Prueba duplicar n y observa cómo baja el error (unas 16 veces en funciones suaves).'
        }
      />
    </div>
  );
};

/** Última sección del procedimiento: valor exacto con la primitiva y errores, o la explicación de por qué no hay. */
const ExactComparisonSection: React.FC<{ result: IntegrationResult; refineHint: string }> = ({ result, refineHint }) => (
  <section className="gauss-block">
    <h5>Comparar con el valor exacto</h5>
    {result.exactValue !== null && result.antiderivativeLatex !== null && result.antiderivativeAtA !== null && result.antiderivativeAtB !== null && result.trueError !== null && result.absoluteError !== null ? (
      <>
        <p>
          Esta integral tiene primitiva, así que su valor real se calcula exacto con el teorema fundamental del cálculo
          (I = F(b) − F(a)), sin usar otra aproximación:
        </p>
        <div className="gauss-formula-box">
          <MathView math={`F(x) = ${result.antiderivativeLatex}`} block />
        </div>
        <div className="gauss-formula-box">
          <MathView
            math={
              `I = F(${formatNumberLatex(result.b)}) - F(${formatNumberLatex(result.a)}) = ${formatNumberLatex(result.antiderivativeAtB, 8)} - ${termLatex(result.antiderivativeAtA, 8)}` +
              ` = ${formatNumberLatex(result.exactValue, 8)}`
            }
            block
          />
        </div>
        <p>El error verdadero es lo que le falta (o le sobra) a la aproximación:</p>
        <div className="gauss-formula-box">
          <MathView
            math={
              `E_t = I - I_{aprox} = ${formatNumberLatex(result.trueError)}` +
              `, \\quad \\lvert E_t \\rvert = ${formatNumberLatex(result.absoluteError)}` +
              (result.relativeError === null ? '' : `, \\quad \\varepsilon_t = \\left\\lvert \\frac{E_t}{I} \\right\\rvert \\cdot 100\\,\\% = ${formatNumberLatex(result.relativeError * 100)}\\,\\%`)
            }
            block
          />
        </div>
        <p>
          {result.trueError > 0 ? 'La aproximación queda por debajo del valor exacto. ' : result.trueError < 0 ? 'La aproximación queda por encima del valor exacto. ' : ''}
          {refineHint}
        </p>
      </>
    ) : (
      <p>
        Numerikal no encontró una primitiva de esta función en [{formatNumber(result.a)}, {formatNumber(result.b)}]: puede que no exista en forma elemental
        (como e^(−x²) o sen(x)/x) o que no se cumplan las condiciones para aplicar F(b) − F(a) (por ejemplo, un polo dentro del intervalo).
        Por eso no hay valor exacto para comparar y no se usa una aproximación en su lugar.
      </p>
    )}
  </section>
);

const ROMBERG_EXTRAPOLATION = 'R_{k,j} = R_{k,j-1} + \\frac{R_{k,j-1} - R_{k-1,j-1}}{4^{j-1} - 1}';
const ROMBERG_RECURRENCE = 'R_{k,1} = \\frac{1}{2}\\left[R_{k-1,1} + h_{k-1}\\sum_{i=1}^{2^{k-2}} f\\!\\left(a + (2i-1)\\,s_k\\right)\\right], \\quad s_k = \\frac{H}{2^{k-1}}';

/** Encabezado de columna de la tabla: R(k, j) con el divisor de clase (3, 15, 63…). */
const rombergColumnHeader = (j: number): string =>
  j <= 1 ? 'R_{k,1}' : `R_{k,${j}}\\ \\left(/ ${4 ** (j - 1) - 1}\\right)`;

/** Hasta esta cantidad de celdas se desarrollan todas las extrapolaciones; con más, solo las últimas filas. */
const MAX_SHOWN_DERIVATIONS = 21;

/** Tabla triangular de Romberg como en clase: fila k = trapecio con 2^(k−1) subintervalos y sus extrapolaciones; la esquina inferior derecha va resaltada. */
export const RombergTable: React.FC<{ result: RombergResult }> = ({ result }) => {
  const { rows, k, h } = result;

  return (
    <div className="iteration-table-card">
      <div className="table-header-toolbar">
        <div className="table-title-group">
          <Table size={16} className="title-icon" />
          <h4 className="table-title">Tabla de Romberg</h4>
          <span className="row-count-badge">k = {k} filas · h mínimo = {formatNumber(h)}</span>
        </div>
      </div>

      <div className="table-scroll-container">
        <table className="numerical-table">
          <thead>
            <tr>
              <th className="table-th td-iter"><div className="th-content"><span className="th-label">k</span></div></th>
              <th className="table-th"><div className="th-content"><span className="th-label">Subintervalos</span></div></th>
              {rows.map((row) => (
                <th key={row.k} className="table-th">
                  <div className="th-content">
                    <span className="th-label">Columna {row.k}</span>
                    <span className="th-latex"><MathView math={rombergColumnHeader(row.k)} /></span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.k} className="table-row">
                <td className="table-td td-iter">{row.k}</td>
                <td className="table-td">{row.subintervals}</td>
                {rows.map((_, j) => {
                  const entry = row.entries[j];
                  return (
                    <td key={j} className={`table-td ${row.k === k && j === k - 1 ? 'newton-coefficient-cell' : ''}`}>
                      {entry ? formatNumber(entry.value, 8) : ''}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="newton-table-note">
        La celda resaltada R<sub>{k},{k}</sub> es la mejor aproximación: {k - 1} extrapolaciones sobre el trapecio con {rows[k - 1].subintervals} subintervalos.
      </p>
    </div>
  );
};

const RombergSteps: React.FC<{ result: RombergResult }> = ({ result }) => {
  const { a, b, k, rows, nodes } = result;
  const H = b - a;
  // Con pocas celdas se muestran todas las extrapolaciones; con muchas, solo las últimas filas (el resto vive en la pestaña Tabla)
  const shownRows = rows.reduce((total, row) => total + row.entries.length, 0) <= MAX_SHOWN_DERIVATIONS ? rows.slice(1) : rows.slice(-2);

  return (
    <div className="gauss-steps-card">
      <div className="gauss-steps-header">
        <BookOpen size={18} className="gauss-steps-icon" />
        <h4>Procedimiento: {result.methodName}</h4>
      </div>

      <section className="gauss-block">
        <h5>1. Integral y método</h5>
        <div className="gauss-formula-box">
          <MathView math={`I = \\int_{${formatNumberLatex(a)}}^{${formatNumberLatex(b)}} ${result.functionLatex}\\,dx`} block />
        </div>
        <p>
          Romberg refina el trapecio y corrige su error sin dibujar figuras nuevas. Con H = {formatNumberLatex(H)} y el n de la
          partición más fina ({nodes.length - 1} subintervalos), la tabla tiene k = {k} fila{k === 1 ? '' : 's'}: la primera columna
          es el trapecio refinado (cada fila duplica la partición) y las demás aplican la <strong>extrapolación de Richardson</strong>:
        </p>
        <div className="gauss-formula-box">
          <MathView math={ROMBERG_EXTRAPOLATION} block />
        </div>
        <p>Los divisores salen de 4^(j−1) − 1: 3, 15, 63… La celda R(k, j) es exacta para polinomios de grado 2j − 1, así que la diagonal gana dos órdenes de h con cada fila.</p>
      </section>

      <section className="gauss-block">
        <h5>2. Primera columna: trapecio refinado</h5>
        <p>La primera celda es la regla simple y las demás se llenan por recurrencia con los puntos nuevos:</p>
        <div className="gauss-formula-box">
          <MathView math={`R_{1,1} = \\frac{H}{2}\\left[f(a) + f(b)\\right] = ${formatNumberLatex(rows[0].entries[0].value, 8)}`} block />
        </div>
        <div className="gauss-formula-box">
          <MathView math={ROMBERG_RECURRENCE} block />
        </div>
        <div className="gauss-formula-box">
          <MathView
            math={`\\begin{aligned}${rows
              .slice(1)
              .map((row) => {
                const stride = (nodes.length - 1) / row.subintervals;
                const newPoints = Array.from({ length: row.subintervals / 2 }, (_, i) => `f(${formatNumberLatex(nodes[(2 * (i + 1) - 1) * stride].x, 8)})`);
                return `R_{${row.k},1} &= ${formatNumberLatex(row.entries[0].value, 8)} & \\left(h_{k-1} = ${formatNumberLatex(H / (row.subintervals / 2), 8)},\\ \\text{nuevos: } ${newPoints.join(',\\ }')}\\right)`;
              })
              .join(' \\\\ ')}\\end{aligned}`}
            block
          />
        </div>
        {rows.length > 8 && <p>La lista completa de puntos nuevos por fila está en la pestaña <strong>Tabla</strong>.</p>}
      </section>

      {k > 1 && (
        <section className="gauss-block">
          <h5>3. Extrapolación de Richardson</h5>
          {shownRows.length < rows.length - 1 && <p>Se muestran las últimas filas; la tabla completa está en la pestaña <strong>Tabla</strong>.</p>}
          <div className="gauss-steps-list">
            {shownRows.map((row) => (
              <div className="gauss-step" key={row.k}>
                <div className="gauss-step-heading">
                  <span className="gauss-step-number">{row.k}</span>
                  <div><strong>Fila {row.k}: con {row.subintervals} subintervalos</strong></div>
                </div>
                <div className="gauss-formula-box">
                  <MathView
                    math={`\\begin{aligned}${row.entries
                      .slice(1)
                      .map((entry) => {
                        const divisor = 4 ** (entry.j - 1) - 1;
                        const left = row.entries[entry.j - 2].value;
                        const above = rows[row.k - 2].entries[entry.j - 2].value;
                        return (
                          `R_{${row.k},${entry.j}} &= ${formatNumberLatex(left, 8)} + \\frac{${formatNumberLatex(left, 8)} - (${formatNumberLatex(above, 8)})}{${formatNumberLatex(divisor)}}` +
                          ` = ${formatNumberLatex(entry.value, 8)}`
                        );
                      })
                      .join(' \\\\ ')}\\end{aligned}`}
                    block
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="gauss-block">
        <h5>4. Mejor aproximación</h5>
        <p>La esquina inferior derecha de la tabla es la celda con más extrapolaciones y la mejor aproximación de la integral:</p>
        <div className="gauss-formula-box emphasized">
          <MathView math={`\\int_{${formatNumberLatex(a)}}^{${formatNumberLatex(b)}} ${result.functionLatex}\\,dx \\approx R_{${k},${k}} = ${formatNumberLatex(result.value, 8)}`} block />
        </div>
        <p className="newton-note">
          Con {k} filas se evalúan f en {nodes.length} nodos (n = {nodes.length - 1}), menos de lo que pide una regla directa con esta precisión.
        </p>
      </section>

      <ExactComparisonSection
        result={result}
        refineHint="Prueba duplicar n y observa cómo baja el error: sobre la diagonal cada fila gana dos órdenes de h en funciones suaves."
      />
    </div>
  );
};
