const nok = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });

/** 45 000 kr */
export function formatKr(value: number): string {
  return `${nok.format(Math.round(value))} kr`;
}

export function formatNumber(value: number): string {
  return nok.format(Math.round(value));
}

/** Avrunder estimater slik at de ikke ser mer presise ut enn de er. */
export function roundEstimate(value: number): number {
  if (value <= 0) return 0;
  if (value < 1_000) return Math.round(value / 50) * 50;
  if (value < 10_000) return Math.round(value / 100) * 100;
  return Math.round(value / 1_000) * 1_000;
}

/** 8 000–15 000 kr */
export function formatRange(min: number, max: number): string {
  const lo = roundEstimate(min);
  const hi = roundEstimate(max);
  if (hi <= 0) return '0 kr';
  if (lo === hi) return formatKr(hi);
  if (lo <= 0) return `opptil ${formatKr(hi)}`;
  return `${formatNumber(lo)}–${formatNumber(hi)} kr`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${(value * 100).toLocaleString('nb-NO', { maximumFractionDigits: digits })} %`;
}
