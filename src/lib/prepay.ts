import { calculateMortgageScenario, HousingCalculatorInputs } from './financialCalculations';

export const PREPAY_AMOUNTS = [0, 100, 250, 500, 750, 1000, 1500, 2000, 3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000];

export interface PrepayRow {
  extra: number;
  finalNetWorth: number;
  delta: number; // vs standard payments
  payoffYear: number;
  totalInterestPaid: number;
  taxSavings: number;
  minInvestmentBalance: number; // lowest year-end portfolio over the horizon
  affordable: boolean;
}

// Lowest year-end investment balance over years 1..horizon
export const minYearEndBalance = (inputs: HousingCalculatorInputs, extra: number, horizon: number) => {
  let min = Infinity;
  for (let h = 1; h <= horizon; h++) min = Math.min(min, calculateMortgageScenario(inputs, extra, h).investmentBalance);
  return min;
};

export const evaluatePrepay = (inputs: HousingCalculatorInputs, horizon: number, amounts: number[]): PrepayRow[] => {
  const standard = calculateMortgageScenario(inputs, 0, horizon);
  const standardMin = minYearEndBalance(inputs, 0, horizon);
  return [...new Set(amounts)].sort((a, b) => a - b).map(extra => {
    const s = extra === 0 ? standard : calculateMortgageScenario(inputs, extra, horizon);
    const minBalance = extra === 0 ? standardMin : minYearEndBalance(inputs, extra, horizon);
    return {
      extra,
      finalNetWorth: s.finalNetWorth,
      delta: s.finalNetWorth - standard.finalNetWorth,
      payoffYear: s.payoffYear,
      totalInterestPaid: s.totalInterestPaid,
      taxSavings: s.taxSavings,
      minInvestmentBalance: minBalance,
      // Prepaying must not push savings below where standard payments leave them
      affordable: minBalance >= Math.min(0, standardMin) - 0.5,
    };
  });
};

// Differences within this band are "effectively tied"
export const tieBand = (standardNetWorth: number) => Math.max(10000, 0.005 * Math.abs(standardNetWorth));

// Investment return at which prepaying `extra` breaks even with investing it
export const breakEvenReturn = (inputs: HousingCalculatorInputs, horizon: number, extra: number): number | null => {
  if (extra <= 0) return null;
  const delta = (r: number) => {
    const i = { ...inputs, investmentReturn: r };
    return calculateMortgageScenario(i, extra, horizon).finalNetWorth - calculateMortgageScenario(i, 0, horizon).finalNetWorth;
  };
  let lo = -20 + inputs.annualInvestmentTaxDrag, hi = 50;
  let dLo = delta(lo), dHi = delta(hi);
  if (Math.sign(dLo) === Math.sign(dHi)) return null;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    const d = delta(mid);
    if (Math.sign(d) === Math.sign(dLo)) { lo = mid; dLo = d; } else { hi = mid; dHi = d; }
  }
  return (lo + hi) / 2;
};
