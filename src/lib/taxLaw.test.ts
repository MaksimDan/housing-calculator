import { describe, it, expect } from 'vitest';
import {
  TAX_YEARS, SALT_SCHEDULE, LATEST_PUBLISHED_TAX_YEAR, taxYearConstants, statutoryInputsFor,
  statutorySaltCap, taxYearOptions, isProjectedTaxYear, saltCapForYear,
} from './taxLaw';

describe('tax-year table', () => {
  it('has the published TY2026 amounts', () => {
    expect(TAX_YEARS[2026].standardDeduction).toEqual({ mfj: 32200, single: 16100, hoh: 24150, mfs: 16100 });
    expect(TAX_YEARS[2026].socialSecurityWageBase).toBe(184500);
  });

  it('SALT schedule grows 1%/yr (statute: 101% of the prior year)', () => {
    const years = Object.keys(SALT_SCHEDULE).map(Number).sort();
    for (let i = 1; i < years.length; i++) {
      const prev = SALT_SCHEDULE[years[i - 1]], cur = SALT_SCHEDULE[years[i]];
      expect(cur.cap).toBeCloseTo(prev.cap * 1.01, 1);
      expect(cur.phaseDownThreshold).toBeCloseTo(prev.phaseDownThreshold * 1.01, 1);
    }
  });

  it('projects unpublished years from the newest published one', () => {
    const y = LATEST_PUBLISHED_TAX_YEAR + 2;
    expect(isProjectedTaxYear(y)).toBe(true);
    expect(taxYearConstants(y, 3).standardDeduction.mfj)
      .toBeCloseTo(TAX_YEARS[LATEST_PUBLISHED_TAX_YEAR].standardDeduction.mfj * 1.03 ** 2, 6);
  });

  it('fills in the inputs for a year and filing status', () => {
    expect(statutoryInputsFor(2026, 'mfj', 3)).toEqual({ standardDeduction: 32200, saltCap: 40400, mortgageInterestDeductionCap: 750000 });
    expect(statutoryInputsFor(2026, 'mfs', 3)).toEqual({ standardDeduction: 16100, saltCap: 20200, mortgageInterestDeductionCap: 375000 });
    expect(statutoryInputsFor(2030, 'mfj', 3).saltCap).toBe(10000);
    expect(statutorySaltCap(2027, 'mfj')).toBe(40804);
  });

  it('dropdown lists published years plus projected ones', () => {
    const options = taxYearOptions();
    for (const year of Object.keys(TAX_YEARS).map(Number)) {
      expect(options).toContainEqual({ year, projected: false });
    }
    expect(options.filter(o => o.projected).length).toBe(4);
  });

  it('a first-year cap set from the table follows the statute in later years', () => {
    expect(saltCapForYear(40804, 2027, 2029, false)).toBeCloseTo(41624.16, 2);
    expect(saltCapForYear(40804, 2027, 2030, false)).toBe(10000);
  });

  it('adding a year to the table needs no code changes (lookups are data-driven)', () => {
    TAX_YEARS[2099] = { source: 'test', standardDeduction: { mfj: 1, single: 2, hoh: 3, mfs: 4 }, socialSecurityWageBase: 5 };
    try {
      expect(taxYearConstants(2099, 3).socialSecurityWageBase).toBe(5);
      expect(statutoryInputsFor(2099, 'hoh', 3).standardDeduction).toBe(3);
    } finally {
      delete TAX_YEARS[2099];
    }
  });
});
