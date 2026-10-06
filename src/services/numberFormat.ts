/** Número en texto plano: sin ceros sobrantes y en notación científica si es muy pequeño o muy grande. */
export function formatNumber(value: number, significant = 8): string {
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return '0';
  const abs = Math.abs(value);
  if (abs < 1e-4 || abs >= 1e9) return value.toExponential(4);
  return String(Number(value.toPrecision(significant)));
}

/** Número listo para KaTeX (la notación científica se escribe como ×10^n). */
export function formatNumberLatex(value: number, significant = 6): string {
  if (!Number.isFinite(value)) return '\\text{—}';
  const text = formatNumber(value, significant);
  const match = /^(-?[\d.]+)e([+-]?\d+)$/.exec(text);
  return match ? `${match[1]} \\times 10^{${Number(match[2])}}` : text;
}
