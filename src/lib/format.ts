// Display formatting. Dollar amounts are always whole dollars; headlines use
// compact 3-significant-figure amounts, tables and tooltips use exact ones.

const roundDollars = (n: number) => {
  const r = Math.round(n);
  return Object.is(r, -0) ? 0 : r;
};

// "$1,234" / "-$1,234"
export const formatUSD = (n: number): string => {
  if (!Number.isFinite(n)) return '—';
  const r = roundDollars(n);
  return `${r < 0 ? '-' : ''}$${Math.abs(r).toLocaleString('en-US')}`;
};

// "+$1,234" / "-$1,234" / "$0"
export const formatSignedUSD = (n: number): string => {
  const r = roundDollars(n);
  return r > 0 ? `+${formatUSD(r)}` : formatUSD(r);
};

// "$3.82M", "$96.4M", "$750k", "$950"; 3 significant figures
export const formatCompactUSD = (n: number, significant = 3): string => {
  if (!Number.isFinite(n)) return '—';
  const sign = n < 0 ? '-' : '';
  const a = Math.abs(n);
  const units: [number, string][] = [[1e9, 'B'], [1e6, 'M'], [1e3, 'k']];
  for (const [size, suffix] of units) {
    if (a >= size * 0.9995) {
      const scaled = Number((a / size).toPrecision(significant));
      // 999.6k rounds to 1000k: promote to the next unit
      if (scaled >= 1000 && suffix !== 'B') continue;
      return `${sign}$${scaled}${suffix}`;
    }
  }
  return `${sign}$${roundDollars(a)}`;
};

// Axis ticks: compact, no trailing noise ("$105M", "-$35M", "$0")
export const formatAxisUSD = (n: number): string => (n === 0 ? '$0' : formatCompactUSD(n, 3));

export const formatPercent = (n: number, digits = 1): string =>
  Number.isFinite(n) ? `${Number(n.toFixed(digits))}%` : '—';

// Number shown inside an input when it isn't focused ("750,000", "5.24")
export const formatInputNumber = (n: number, maxDecimals = 4): string =>
  Number.isFinite(n) ? n.toLocaleString('en-US', { maximumFractionDigits: maxDecimals }) : '';
