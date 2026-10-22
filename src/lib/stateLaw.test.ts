import { describe, it, expect } from 'vitest';
import {
  STATES, STATE_CODES, STATE_INCOME_TAX, STATE_PROPERTY_TAX, StateCode, StateIncomeTax,
  hasWageIncomeTax, stateIncomeTaxYear, stateIncomeTaxOnWages, estimateStateIncomeTaxRate, bracketTax,
  assessmentLimit, describeStateIncomeTax,
} from './stateLaw';
import type { FilingStatus } from './taxLaw';
import { STATE_TAX_CHECKS } from './stateIncomeTax.checks';

const STATUSES: FilingStatus[] = ['single', 'mfj', 'hoh', 'mfs'];
const all = <T,>(v: T) => ({ single: v, mfj: v, hoh: v, mfs: v });

// Runs `fn` with a made-up law standing in for a state's
const withLaw = (code: StateCode, law: StateIncomeTax, fn: () => void) => {
  const saved = STATE_INCOME_TAX[code];
  STATE_INCOME_TAX[code] = law;
  try { fn(); } finally { STATE_INCOME_TAX[code] = saved; }
};

describe('state tables', () => {
  it('cover the 50 states and DC, each in every table', () => {
    expect(STATE_CODES).toHaveLength(51);
    for (const s of STATE_CODES) {
      expect(s in STATE_INCOME_TAX, `${s} income tax`).toBe(true);
      expect(STATE_PROPERTY_TAX[s], `${s} property tax`).toBeDefined();
    }
    expect(Object.keys(STATE_INCOME_TAX).sort()).toEqual([...STATE_CODES].sort());
    expect(Object.keys(STATE_PROPERTY_TAX).sort()).toEqual([...STATE_CODES].sort());
  });

  it('nine states have no income tax on wages', () => {
    expect(STATE_CODES.filter(s => !hasWageIncomeTax(s)).sort()).toEqual(['AK', 'FL', 'NH', 'NV', 'SD', 'TN', 'TX', 'WA', 'WY']);
  });

  it('brackets start at 0 and rise, for every filing status and year', () => {
    for (const s of STATE_CODES) {
      const law = STATE_INCOME_TAX[s];
      if (!law) continue;
      expect(Object.keys(law.years).length, s).toBeGreaterThan(0);
      for (const [year, t] of Object.entries(law.years)) {
        expect(t.source.length, `${s} ${year} source`).toBeGreaterThan(10);
        for (const status of STATUSES) {
          const b = t.brackets[status];
          expect(b?.length, `${s} ${year} ${status}`).toBeGreaterThan(0);
          expect(b[0][0], `${s} ${year} ${status}`).toBe(0);
          for (let i = 1; i < b.length; i++) expect(b[i][0], `${s} ${year} ${status} bracket ${i}`).toBeGreaterThan(b[i - 1][0]);
          for (const [, rate] of b) expect(rate >= 0 && rate <= 15, `${s} ${year} ${status} rate ${rate}`).toBe(true);
        }
      }
      for (const [year, rates] of Object.entries(law.scheduledRates ?? {})) {
        const newest = law.years[Math.max(...Object.keys(law.years).map(Number))];
        for (const status of STATUSES) expect(rates[status].length, `${s} ${year} ${status}`).toBe(newest.brackets[status].length);
      }
    }
  });

  it('property tax entries are plausible and explained', () => {
    for (const s of STATE_CODES) {
      const p = STATE_PROPERTY_TAX[s];
      expect(p.typicalRate > 0.2 && p.typicalRate < 3, `${s} ${p.typicalRate}`).toBe(true);
      expect(p.rateNote.length, s).toBeGreaterThan(10);
      if (p.assessmentLimit) {
        expect(p.assessmentLimit.rate > 0 && p.assessmentLimit.rate <= 15, s).toBe(true);
        expect(p.assessmentLimit.description, s).toContain(STATES[s]);
      }
    }
  });
});

describe('state income tax on wages', () => {
  const law: StateIncomeTax = {
    indexed: true,
    years: {
      2026: {
        source: 'test law',
        brackets: { ...all([[0, 2], [10000, 5]] as const), mfj: [[0, 2], [20000, 5]] },
        standardDeduction: { ...all(3000), mfj: 6000 },
        exemption: { ...all(1000), mfj: 2000 },
        credit: all(100),
        creditPhaseDown: { from: all(100000), to: all(200000) },
        surtax: { rate: 1, over: all(1000000) },
      },
    },
    scheduledRates: { 2028: { ...all([2, 4] as const) } },
  };

  const tax = (status: FilingStatus, wages: number, o: { year?: number; earners?: number } = {}) =>
    stateIncomeTaxOnWages({ state: 'TX', year: o.year ?? 2026, status, wages, inflationRate: 3, earners: o.earners });

  it('taxes wages less the deductions and exemptions, less credits', () => {
    withLaw('TX', law, () => {
      // 50,000 - 3,000 - 1,000 = 46,000: 10,000 at 2% + 36,000 at 5% = 2,000, less the 100 credit
      expect(tax('single', 50000).total).toBeCloseTo(1900, 6);
      expect(estimateStateIncomeTaxRate({ state: 'TX', year: 2026, status: 'single', wages: 50000, inflationRate: 3 })).toBe(3.8);
    });
  });

  it('phases a credit down linearly over its income range', () => {
    withLaw('TX', law, () => {
      const at = (wages: number) => tax('single', wages).total;
      const taxable = (wages: number) => bracketTax(law.years[2026].brackets.single, wages - 4000);
      expect(at(150000)).toBeCloseTo(taxable(150000) - 50, 6);
      expect(at(250000)).toBeCloseTo(taxable(250000), 6);
    });
  });

  it('adds a surtax on taxable income over its threshold', () => {
    withLaw('TX', law, () => {
      const t = tax('mfj', 1508000).total;
      // taxable 1,500,000: 20,000 at 2% + 1,480,000 at 5% + 1% of 500,000
      expect(t).toBeCloseTo(400 + 74000 + 5000, 6);
    });
  });

  it('projects later years: indexed amounts grow with inflation, enacted rates apply', () => {
    withLaw('TX', law, () => {
      const y2027 = stateIncomeTaxYear('TX', 2027, 3)!;
      expect(y2027.projected).toBe(true);
      expect(y2027.brackets.single[1][0]).toBeCloseTo(10300, 6);
      expect(y2027.standardDeduction!.mfj).toBeCloseTo(6180, 6);
      expect(y2027.brackets.single[1][1]).toBe(5);
      const y2029 = stateIncomeTaxYear('TX', 2029, 3)!;
      expect(y2029.brackets.single[1]).toEqual([10000 * 1.03 ** 3, 4]);
      withLaw('TX', { ...law, indexed: false }, () => {
        expect(stateIncomeTaxYear('TX', 2029, 3)!.brackets.single[1][0]).toBe(10000);
      });
    });
  });

  it('adds the local income tax every county levies, on the same taxable income', () => {
    withLaw('TX', { ...law, local: { rate: 3, note: 'a 3% county tax' } }, () => {
      const t = tax('single', 50000);
      expect(t.localTax).toBeCloseTo(46000 * 0.03, 6);
      expect(t.total).toBeCloseTo(1900 + 1380, 6);
      expect(describeStateIncomeTax('TX', 2026, 'single', 3)).toContain('a 3% county tax');
      expect(describeStateIncomeTax('TX', 2026, 'single', 3)).toMatch(/^2% to 5% of taxable income in 2026, plus 1% on taxable income over \$1,000,000/);
    });
  });

  it('is 0 without a wage tax or a salary', () => {
    expect(estimateStateIncomeTaxRate({ state: 'TX', year: 2026, status: 'mfj', wages: 420000, inflationRate: 3 })).toBe(0);
    expect(estimateStateIncomeTaxRate({ state: 'CA', year: 2026, status: 'mfj', wages: 0, inflationRate: 3 })).toBe(0);
  });

  it('uses a printed row base where the state has one (Ohio)', () => {
    expect(bracketTax([[0, 0], [26050, 2.75, 332]], 26050)).toBe(0);
    expect(bracketTax([[0, 0], [26050, 2.75, 332]], 98100)).toBeCloseTo(2313.375, 6);
  });

  it('phases amounts down in steps, bands and segments', () => {
    const steps: StateIncomeTax = { ...law, years: { 2026: { ...law.years[2026], credit: undefined, creditPhaseDown: undefined,
      exemption: all(15000), exemptionPhaseDown: { from: all(30000), to: all(45000), step: 1000 } } } };
    withLaw('TX', steps, () => {
      // $1,000 less for each $1,000 of income over $30,000, or fraction thereof
      expect(tax('single', 44000).taxable).toBe(44000 - 3000 - 1000);
      expect(tax('single', 44001).taxable).toBe(44001 - 3000);
    });
    const bands: StateIncomeTax = { ...law, years: { 2026: { ...law.years[2026], exemption: all(2000),
      exemptionPhaseDown: { bands: all([[40000, 2000], [Infinity, 0]] as const) } } } };
    withLaw('TX', bands, () => {
      expect(tax('single', 40000).taxable).toBe(40000 - 3000 - 2000);
      expect(tax('single', 40001).taxable).toBe(40001 - 3000);
    });
    const points: StateIncomeTax = { ...law, years: { 2026: { ...law.years[2026], exemption: undefined,
      standardDeductionPhaseDown: { points: all([[100000, 3000], [200000, 1000], [300000, 0]] as const) } } } };
    withLaw('TX', points, () => {
      expect(tax('single', 150000).taxable).toBe(150000 - 2000);
      expect(tax('single', 250000).taxable).toBe(250000 - 500);
    });
  });

  it('splits a joint salary between two earners where the law looks at each', () => {
    const perEarner: StateIncomeTax = { ...law, years: { 2026: { ...law.years[2026], rules: [{ kind: 'bracketsPerEarner' },
      { kind: 'earnerDeduction', rate: 10, max: 1000 }, { kind: 'twoEarnerCredit', rate: 3, maxWages: 16000 }] } } };
    withLaw('TX', perEarner, () => {
      // one earner: 100,000 - 6,000 - 2,000 - 1,000 = 91,000 through the joint brackets, less the 100 credit
      expect(tax('mfj', 100000, { earners: 1 }).stateTax).toBeCloseTo(400 + 71000 * 0.05 - 100, 6);
      // two: each deducts 1,000; each half of 90,000 through the brackets; less 100 and 3% of 16,000
      expect(tax('mfj', 100000, { earners: 2 }).stateTax).toBeCloseTo(2 * (400 + 25000 * 0.05) - 100 - 480, 6);
      expect(tax('single', 100000, { earners: 2 }).stateTax).toBe(tax('single', 100000, { earners: 1 }).stateTax);
    });
  });
});

describe('the estimate reproduces hand-worked state tax', () => {
  it.each(STATE_TAX_CHECKS.map(c => [
    `${c.state} ${c.year} ${c.status} $${c.wages.toLocaleString('en-US')}${c.earners > 1 ? ', two earners' : ''}`, c,
  ] as const))('%s', (_, c) => {
    const { stateTax } = stateIncomeTaxOnWages({ ...c, inflationRate: 3 });
    // Official tax tables price $50 or $100 rows at their midpoint
    expect(Math.abs(stateTax - c.tax), `computed ${stateTax.toFixed(2)}`).toBeLessThanOrEqual(c.official ? 5 : 1);
  });
});

describe('assessment limits', () => {
  it("California's Prop 13 is tied to inflation", () => {
    expect(assessmentLimit('CA')).toMatchObject({ rate: 2, inflationLinked: true });
  });
});
