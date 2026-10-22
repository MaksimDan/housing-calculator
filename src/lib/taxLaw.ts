// All statutory tax constants live here, keyed by tax year.
//
// TO ADD A NEW TAX YEAR (e.g. when the IRS publishes the next year's inflation
// adjustments, usually in October/November): add an entry to TAX_YEARS. The
// tax-year dropdown, the engines and the defaults pick it up automatically.
// Years after the newest entry are projected from it with the user's inflation
// rate and are labeled "projected" in the dropdown.

export type FilingStatus = 'mfj' | 'single' | 'hoh' | 'mfs';

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  mfj: 'Married filing jointly', single: 'Single', hoh: 'Head of household', mfs: 'Married filing separately',
};

export interface TaxYearConstants {
  source: string;
  standardDeduction: Record<FilingStatus, number>;
  socialSecurityWageBase: number;
}

export const TAX_YEARS: Record<number, TaxYearConstants> = {
  2025: {
    source: 'OBBBA (P.L. 119-21) standard deduction; SSA 2025 wage base',
    standardDeduction: { mfj: 31500, single: 15750, hoh: 23625, mfs: 15750 },
    socialSecurityWageBase: 176100,
  },
  2026: {
    source: 'IRS Rev. Proc. 2025-32; SSA 2026 wage base',
    standardDeduction: { mfj: 32200, single: 16100, hoh: 24150, mfs: 16100 },
    socialSecurityWageBase: 184500,
  },
};

// SALT cap schedule, IRC 164(b)(7) as amended by OBBBA: the cap and the MAGI
// phase-down threshold each grow to 101% of the prior year through 2029.
// Amounts are for every filing status except married filing separately,
// which gets half (MFS_FACTOR). Years after the last entry use SALT_CAP_AFTER_SCHEDULE.
export const SALT_SCHEDULE: Record<number, { cap: number; phaseDownThreshold: number }> = {
  2025: { cap: 40000, phaseDownThreshold: 500000 },
  2026: { cap: 40400, phaseDownThreshold: 505000 },
  2027: { cap: 40804, phaseDownThreshold: 510050 },
  2028: { cap: 41212.04, phaseDownThreshold: 515150.5 },
  2029: { cap: 41624.16, phaseDownThreshold: 520302.01 },
};
export const SALT_CAP_AFTER_SCHEDULE = 10000; // flat, not indexed
export const SALT_PHASEDOWN_RATE = 0.30; // cap reduced by 30% of MAGI over the threshold...
export const SALT_PHASEDOWN_FLOOR = 10000; // ...but not below this
export const MFS_FACTOR = 0.5;

// Acquisition-debt limit for the mortgage-interest deduction (IRC 163(h)(3)(F))
export const MORTGAGE_INTEREST_DEBT_LIMIT: Record<FilingStatus, number> = {
  mfj: 750000, single: 750000, hoh: 750000, mfs: 375000,
};

// Employee payroll taxes
export const SOCIAL_SECURITY_RATE = 6.2;
export const MEDICARE_RATE = 1.45;
export const ADDITIONAL_MEDICARE_RATE = 0.9;
// Statutory and NOT indexed for inflation (IRC 3101(b)(2))
export const ADDITIONAL_MEDICARE_THRESHOLDS: Record<FilingStatus, number> = {
  mfj: 250000, single: 200000, hoh: 200000, mfs: 125000,
};

// ---------------------------------------------------------------------------
// Lookups (no constants below this line)
// ---------------------------------------------------------------------------

const publishedYears = () => Object.keys(TAX_YEARS).map(Number).sort((a, b) => a - b);
export const FIRST_PUBLISHED_TAX_YEAR = publishedYears()[0];
export const LATEST_PUBLISHED_TAX_YEAR = publishedYears()[publishedYears().length - 1];

export const isProjectedTaxYear = (year: number) => !(year in TAX_YEARS);

// Published constants for the year, or the newest published year's constants
// indexed forward with the inflation rate.
export const taxYearConstants = (year: number, inflationRate: number): TaxYearConstants => {
  if (TAX_YEARS[year]) return TAX_YEARS[year];
  const baseYear = year > LATEST_PUBLISHED_TAX_YEAR ? LATEST_PUBLISHED_TAX_YEAR : FIRST_PUBLISHED_TAX_YEAR;
  const base = TAX_YEARS[baseYear];
  const factor = Math.pow(1 + inflationRate / 100, year - baseYear);
  const standardDeduction = {} as Record<FilingStatus, number>;
  for (const status of Object.keys(base.standardDeduction) as FilingStatus[]) {
    standardDeduction[status] = base.standardDeduction[status] * factor;
  }
  return {
    source: `projected from ${baseYear}`,
    standardDeduction,
    socialSecurityWageBase: base.socialSecurityWageBase * factor,
  };
};

const statusFactor = (status: FilingStatus) => (status === 'mfs' ? MFS_FACTOR : 1);
const lastScheduleYear = () => Math.max(...Object.keys(SALT_SCHEDULE).map(Number));
const firstScheduleYear = () => Math.min(...Object.keys(SALT_SCHEDULE).map(Number));

// Statutory SALT cap (before any income phase-down) for a tax year
export const statutorySaltCap = (year: number, status: FilingStatus) => {
  const entry = SALT_SCHEDULE[Math.max(year, firstScheduleYear())];
  return (entry ? entry.cap : SALT_CAP_AFTER_SCHEDULE) * statusFactor(status);
};

// SALT cap for a tax year. firstYearCap is the user's cap for the first tax
// year; later years follow the statutory schedule in proportion. With
// assumeExtension, the last scheduled year's rules continue instead of the
// reversion. Salary stands in for MAGI.
export const saltCapForYear = (
  firstYearCap: number,
  firstTaxYear: number,
  taxYear: number,
  assumeExtension: boolean,
  magi: number = 0,
  status: FilingStatus = 'mfj'
) => {
  const last = lastScheduleYear();
  const floor = SALT_PHASEDOWN_FLOOR * statusFactor(status);
  if (taxYear > last && !assumeExtension) {
    return Math.min(firstYearCap, SALT_CAP_AFTER_SCHEDULE * statusFactor(status));
  }
  const clampYear = (y: number) => Math.min(Math.max(y, firstScheduleYear()), last);
  const entry = SALT_SCHEDULE[clampYear(taxYear)];
  const firstEntry = SALT_SCHEDULE[clampYear(firstTaxYear)];
  const scheduledCap = firstYearCap * (entry.cap / firstEntry.cap);
  const threshold = entry.phaseDownThreshold * statusFactor(status);
  const reduction = SALT_PHASEDOWN_RATE * Math.max(0, magi - threshold);
  return Math.max(Math.min(scheduledCap, floor), scheduledCap - reduction);
};

// Values the tax inputs should take for a tax year and filing status (what
// the tax-year and filing-status dropdowns fill in)
export const statutoryInputsFor = (year: number, status: FilingStatus, inflationRate: number) => ({
  standardDeduction: Math.round(taxYearConstants(year, inflationRate).standardDeduction[status]),
  saltCap: Math.round(statutorySaltCap(year, status) * 100) / 100,
  mortgageInterestDeductionCap: MORTGAGE_INTEREST_DEBT_LIMIT[status],
});

// Options for the tax-year dropdown: published years plus a few projected ones
export const taxYearOptions = (extraProjectedYears = 4) => {
  const years = publishedYears();
  for (let y = LATEST_PUBLISHED_TAX_YEAR + 1; y <= LATEST_PUBLISHED_TAX_YEAR + extraProjectedYears; y++) years.push(y);
  return years.map(year => ({ year, projected: isProjectedTaxYear(year) }));
};
