import { describe, it, expect } from 'vitest';
import { calculateProjectionData, calculateMortgageScenario, HousingCalculatorInputs } from './financialCalculations';
import { DEFAULTS } from '../hooks/useCalculatorInputs';
import { formatUSD, formatSignedUSD, formatCompactUSD, formatAxisUSD, formatPercent } from './format';
import { computeVerdict, leadHistory } from './verdict';
import { findFlipThreshold, findFlipThresholds, gapAt } from './thresholds';
import { checkCash } from './cashCheck';
import { monthlyCashFlow, netWorthParts } from './breakdown';
import { evaluatePrepay, breakEvenReturn, tieBand, PREPAY_AMOUNTS } from './prepay';
import { FIELDS, FIELD_BY_KEY, DRIVER_KEYS } from './fields';
import { NUMBER_RULES, BOOLEAN_INPUTS, ENUM_INPUTS } from './inputValidation';

const inputs = (o: Partial<HousingCalculatorInputs> = {}): HousingCalculatorInputs => ({ ...DEFAULTS, firstTaxYear: 2027, ...o });
const rowsFor = (i: HousingCalculatorInputs) => calculateProjectionData(i) as any[];

describe('format', () => {
  it('never prints fractional dollars', () => {
    for (const n of [96383148.642, 603248.15, -0.4, 0.5, 1234.5, -2113742.2]) {
      expect(formatUSD(n)).toMatch(/^-?\$[\d,]+$/);
    }
    expect(formatUSD(96383148.642)).toBe('$96,383,149');
    expect(formatUSD(-0.4)).toBe('$0');
    expect(formatUSD(-2113742)).toBe('-$2,113,742');
    expect(formatSignedUSD(1500)).toBe('+$1,500');
  });

  it('compacts headline amounts to 3 significant figures', () => {
    expect(formatCompactUSD(3816795)).toBe('$3.82M');
    expect(formatCompactUSD(96383149)).toBe('$96.4M');
    expect(formatCompactUSD(750000)).toBe('$750k');
    expect(formatCompactUSD(999700)).toBe('$1M');
    expect(formatCompactUSD(-1570000)).toBe('-$1.57M');
    expect(formatCompactUSD(950)).toBe('$950');
  });

  it('formats axis ticks without "105000k"', () => {
    expect(formatAxisUSD(105000000)).toBe('$105M');
    expect(formatAxisUSD(-35000000)).toBe('-$35M');
    expect(formatAxisUSD(0)).toBe('$0');
    expect(formatPercent(3.9617)).toBe('4%');
  });
});

describe('verdict', () => {
  it('matches the engine at the horizon', () => {
    const i = inputs();
    const rows = rowsFor(i);
    const v = computeVerdict(rows, 30, i.inflationRate, i.firstTaxYear);
    expect(v.gap).toBe(rows[30].buying - rows[30].renting);
    expect(v.winner).toBe(v.gap > 0 ? 'buy' : 'rent');
    expect(v.calendarYear).toBe(2056);
    expect(v.todayGap).toBeCloseTo(Math.abs(v.gap) / 1.03 ** 30, 6);
    expect(v.headline).toContain(formatCompactUSD(Math.abs(v.gap)));
  });

  it('describes a lead that changes hands', () => {
    const rows = [-3, -1, 1, -1, -2, 1, 2].map((g, year) => ({ year, buying: 100 + g, renting: 100 }));
    const v = computeVerdict(rows, 6, 0, 2027);
    expect(leadHistory(rows, 6).crossovers).toEqual([2, 3, 5]);
    expect(v.winner).toBe('buy');
    expect(v.leadSince).toBe(5);
    expect(v.story).toContain('since year 5');
  });

  it('describes a single crossover and a never-crossing lead', () => {
    const one = computeVerdict([-2, -1, 1, 2].map((g, year) => ({ year, buying: 100 + g, renting: 100 })), 3, 0, 2027);
    expect(one.story).toBe('Renting leads at first; buying pulls ahead in year 2 and stays ahead.');
    const none = computeVerdict([-2, -1, -3].map((g, year) => ({ year, buying: 100 + g, renting: 100 })), 2, 0, 2027);
    expect(none.story).toBe('Renting is ahead from the start and stays ahead for all 2 years.');
  });
});

describe('flip thresholds', () => {
  it('each threshold flips the engine\'s sign at +/- epsilon', () => {
    const i = inputs();
    const base = Math.sign(gapAt(i, 30)!);
    const thresholds = findFlipThresholds(i, 30);
    expect(thresholds.map(t => t.key)).toContain('investmentReturn');
    for (const t of thresholds) {
      const eps = Math.max(Math.abs(t.value) * 1e-6, 1e-6);
      const sameSide = t.direction === 'below' ? t.value + eps : t.value - eps;
      const otherSide = t.direction === 'below' ? t.value - eps : t.value + eps;
      expect(Math.sign(gapAt({ ...i, [t.key]: sameSide }, 30)!)).toBe(base);
      expect(Math.sign(gapAt({ ...i, [t.key]: otherSide }, 30)!)).toBe(-base);
    }
  });

  it('returns null when the verdict does not flip in range', () => {
    expect(findFlipThreshold(inputs(), 'investmentReturn', 30, { min: 11, max: 12 })).toBeNull();
  });

  it('only fields with a monotone effect declare a flip range', () => {
    const i = inputs();
    for (const f of FIELDS.filter(x => x.flip)) {
      const { min: lo, max: hi } = f.soft!;
      const gaps = Array.from({ length: 9 }, (_, k) => gapAt({ ...i, [f.key]: lo + (hi - lo) * k / 8 }, 30))
        .filter((g): g is number => g !== null);
      const diffs = gaps.slice(1).map((g, k) => g - gaps[k]);
      const increasing = diffs.every(d => d >= -1), decreasing = diffs.every(d => d <= 1);
      expect(increasing || decreasing, f.key).toBe(true);
    }
  });
});

describe('breakdowns add up to the engine', () => {
  it.each([inputs(), inputs({ monthlyRentalIncome: 1500, downPaymentPercent: 10, monthlyHOAFee: 300, melloRoosTaxRate: 0.3, includeSellingCosts: true })])(
    'net-worth parts and monthly cash flows', (i) => {
      const rows = rowsFor(i);
      for (const y of [0, 1, 7, 15, 30]) {
        const parts = netWorthParts(rows[y]);
        expect(Math.abs(parts.buy.reduce((a, p) => a + p.value, 0) - rows[y].buying)).toBeLessThanOrEqual(2);
        expect(Math.abs(parts.rent.reduce((a, p) => a + p.value, 0) - rows[y].renting)).toBeLessThanOrEqual(2);
        if (y === 0) continue;
        const cf = monthlyCashFlow(rows[y]);
        expect(Math.abs(cf.buy.reduce((a, s) => a + s.value, 0) - cf.buyIncome)).toBeLessThanOrEqual(6);
        expect(Math.abs(cf.rent.reduce((a, s) => a + s.value, 0) - cf.rentIncome)).toBeLessThanOrEqual(3);
      }
    });
});

describe('cash check', () => {
  it('passes for the defaults with no warnings', () => {
    const c = checkCash(inputs(), rowsFor(inputs()), 30);
    expect(c.tests.every(t => t.pass)).toBe(true);
    expect(c.warnings).toEqual([]);
  });

  it('warns when the renter runs short in later years', () => {
    const i = inputs({ annualSalaryBeforeTax: 90000, monthlyRent: 4500, rentIncrease: 6, salaryGrowthRate: 0, homePrice: 400000, downPaymentPercent: 20 });
    const rows = rowsFor(i);
    expect(Array.isArray(rows)).toBe(true);
    const c = checkCash(i, rows, 30);
    expect(c.warnings.some(w => w.includes('renting costs more'))).toBe(true);
  });
});

describe('prepay', () => {
  it('the standard row equals the main projection\'s buy result', () => {
    const i = inputs();
    for (const h of [5, 10, 30]) {
      const [standard] = evaluatePrepay(i, h, [0]);
      expect(Math.abs(standard.finalNetWorth - rowsFor(i)[h].buying)).toBeLessThanOrEqual(5);
    }
  });

  it('delta signs match a direct engine comparison and the break-even return flips them', () => {
    const i = inputs();
    const [, row] = evaluatePrepay(i, 30, [0, 1000]);
    const direct = calculateMortgageScenario(i, 1000, 30).finalNetWorth - calculateMortgageScenario(i, 0, 30).finalNetWorth;
    expect(row.delta).toBeCloseTo(direct, 6);
    const be = breakEvenReturn(i, 30, 1000)!;
    const d = (r: number) => evaluatePrepay({ ...i, investmentReturn: r }, 30, [0, 1000])[1].delta;
    expect(Math.sign(d(be + 0.01))).toBe(-1);
    expect(Math.sign(d(be - 0.01))).toBe(1);
  });

  it('flags amounts the household cannot fund', () => {
    const i = inputs({ annualSalaryBeforeTax: 150000, effectiveFederalTaxRate: 12, effectiveStateIncomeTaxRate: 5, marginalFederalTaxRate: 22,
      monthlyMiscExpenses: 2000, homePrice: 500000, downPaymentPercent: 20, initialInvestment: 125000, effectiveMortgageRate: 6.5,
      investmentReturn: 4, annualInvestmentTaxDrag: 0 });
    const rows = evaluatePrepay(i, 10, PREPAY_AMOUNTS);
    expect(rows.find(r => r.extra === 10000)!.affordable).toBe(false);
    expect(rows.find(r => r.extra === 0)!.affordable).toBe(true);
    expect(tieBand(1e6)).toBe(10000);
  });
});

describe('field registry', () => {
  it('covers exactly the inputs, each with a validation rule', () => {
    expect(new Set(FIELDS.map(f => f.key))).toEqual(new Set(Object.keys(DEFAULTS)));
    for (const f of FIELDS) {
      expect(NUMBER_RULES[f.key] !== undefined || BOOLEAN_INPUTS.has(f.key) || ENUM_INPUTS[f.key] !== undefined, f.key).toBe(true);
    }
  });

  it('soft ranges sit inside the hard limits', () => {
    for (const f of FIELDS) {
      if (!f.soft || !NUMBER_RULES[f.key]) continue;
      expect(f.soft.min, f.key).toBeGreaterThanOrEqual(NUMBER_RULES[f.key].min);
      expect(f.soft.max, f.key).toBeLessThanOrEqual(NUMBER_RULES[f.key].max);
    }
  });

  it('has the seven drivers and help for every field', () => {
    expect(DRIVER_KEYS).toHaveLength(7);
    for (const f of FIELDS) {
      const help = typeof f.help === 'function' ? f.help(DEFAULTS) : f.help;
      expect(help.length, f.key).toBeGreaterThan(10);
    }
    expect(FIELD_BY_KEY.saltCap.help instanceof Function ? (FIELD_BY_KEY.saltCap.help as any)(DEFAULTS) : '').toContain('$40,400');
  });
});
