import { describe, expect, it } from 'vitest';
import { xTickCount } from './graphEngine';

describe('xTickCount', () => {
  it('mantiene 8 divisiones en pantallas anchas', () => {
    expect(xTickCount(820)).toBe(8);
    expect(xTickCount(512)).toBe(8);
  });

  it('reduce las divisiones cuando el gráfico es estrecho', () => {
    expect(xTickCount(250)).toBe(3);
    expect(xTickCount(190)).toBe(2);
  });

  it('nunca baja de 2 divisiones', () => {
    expect(xTickCount(10)).toBe(2);
    expect(xTickCount(0)).toBe(2);
  });

  it('deja al menos ~64 px por etiqueta', () => {
    for (let width = 130; width <= 900; width += 10) {
      expect(width / xTickCount(width)).toBeGreaterThanOrEqual(64);
    }
  });
});
