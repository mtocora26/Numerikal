import type { LinearSystemRows } from './MatrixInput';

/** Al elegir otra dimensión, no reutiliza datos de la matriz anterior. */
export const emptySystemRows = (n: number): LinearSystemRows => ({
  a: Array.from({ length: n }, () => Array.from({ length: n }, () => '')),
  b: Array.from({ length: n }, () => ''),
  x0: Array.from({ length: n }, () => ''),
});

/** Acepta decimales (con coma o punto) y, solo para x⁽⁰⁾, cocientes escritos como fracciones. */
export const parseSystemNumber = (text: string): number =>
  text.trim() === '' ? NaN : Number(text.trim().replace(',', '.'));

const operand = '[+-]?(?:\\d+(?:[.,]\\d*)?|[.,]\\d+)(?:[eE][+-]?\\d+)?';
const fractionPattern = new RegExp(`^\\s*(${operand})\\s*/\\s*(${operand})\\s*$`);

export const parseInitialValue = (text: string): number => {
  const fraction = fractionPattern.exec(text);
  if (!fraction) return parseSystemNumber(text);
  const denominator = parseSystemNumber(fraction[2]);
  return denominator === 0 ? NaN : parseSystemNumber(fraction[1]) / denominator;
};

export const canUseDiagonalQuotients = ({ a, b }: LinearSystemRows): boolean =>
  b.every((text, i) => Number.isFinite(parseSystemNumber(text)) &&
    Number.isFinite(parseSystemNumber(a[i]?.[i] ?? '')) && parseSystemNumber(a[i][i]) !== 0);

/** Conserva bᵢ/aᵢᵢ como cociente, sin redondear el vector inicial a un decimal largo. */
export const diagonalQuotients = (rows: LinearSystemRows): string[] | null =>
  canUseDiagonalQuotients(rows)
    ? rows.b.map((text, i) => `${text.trim()}/${rows.a[i][i].trim()}`)
    : null;
