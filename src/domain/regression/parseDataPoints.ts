import type { DataPoint } from './types';

export interface ParsedDataText {
  points: DataPoint[];
  /** Líneas (1-indexadas) que no se pudieron leer como un par x, y. */
  invalidLines: number[];
}

const toNumber = (text: string): number => Number(text.trim().replace(',', '.'));

/**
 * Lee pares (x, y) pegados desde Excel, CSV o escritos a mano.
 * Acepta tabulador, punto y coma, coma o espacios como separador, y coma decimal.
 */
export function parseDataPoints(text: string): ParsedDataText {
  const points: DataPoint[] = [];
  const invalidLines: number[] = [];

  text.split(/\r?\n/).forEach((line, index) => {
    if (line.trim() === '') return;

    const separator = /[\t;]/.test(line) ? /[\t;]/ : /\s/.test(line.trim()) ? /\s+/ : /,/;
    const cells = line.trim().split(separator).filter((cell) => cell.trim() !== '');
    const [x, y] = cells.map(toNumber);

    if (cells.length === 2 && Number.isFinite(x) && Number.isFinite(y)) {
      points.push({ x, y });
    } else {
      invalidLines.push(index + 1);
    }
  });

  return { points, invalidLines };
}
