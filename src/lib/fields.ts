import type { HousingCalculatorInputs } from './financialCalculations';
import { calculateMortgageScenario } from './financialCalculations';
import { SALT_SCHEDULE, SALT_CAP_AFTER_SCHEDULE, SALT_PHASEDOWN_RATE, SALT_PHASEDOWN_FLOOR } from './taxLaw';
import { formatUSD } from './format';

// One definition per input: how it is labelled, grouped, ranged and explained.
// Hard limits live in inputValidation.NUMBER_RULES; `soft` is the slider's
// typical range (typed values may go beyond it).

export type InputKey = keyof HousingCalculatorInputs;
export type Unit = 'usd' | 'usdPerMonth' | 'percent' | 'percentPerYear' | 'years' | 'count' | 'toggle' | 'select';
export type Group = 'home' | 'owning' | 'renting' | 'market' | 'taxes' | 'finances' | 'view';

export interface FieldDef {
  key: InputKey;
  label: string;
  unit: Unit;
  group: Group;
  driver?: boolean; // one of the inputs that move the result most (shown up front)
  soft?: { min: number; max: number; step: number };
  help: string | ((inputs: HousingCalculatorInputs) => string);
  hint?: (inputs: HousingCalculatorInputs) => string | null;
  visibleWhen?: (inputs: HousingCalculatorInputs) => boolean;
  // Range searched for the value at which the verdict flips. Only fields
  // whose effect on the buy-minus-rent gap is monotone get one.
  flip?: { min: number; max: number };
}

export const GROUPS: { key: Group; title: string; note?: string }[] = [
  { key: 'home', title: 'Home & loan' },
  { key: 'owning', title: 'Owning costs' },
  { key: 'renting', title: 'Renting' },
  { key: 'market', title: 'Market & growth' },
  { key: 'taxes', title: 'Taxes' },
  { key: 'finances', title: 'Your finances', note: 'Mainly affects whether you can afford it and the size of both totals, much less the buy-vs-rent gap.' },
];

const loan = (i: HousingCalculatorInputs) => i.homePrice * (1 - i.downPaymentPercent / 100);
const pct = (i: HousingCalculatorInputs, rate: number) => i.homePrice * rate / 100;

const saltHelp = () => {
  const years = Object.keys(SALT_SCHEDULE).map(Number).sort();
  const first = years[0], last = years[years.length - 1];
  const s = SALT_SCHEDULE[2026] ?? SALT_SCHEDULE[first];
  return `SALT deduction cap for the selected tax year, filled in from the law when you change the tax year or filing status `
    + `(2026: ${formatUSD(s.cap)}; half for married filing separately). Later years follow current law: the schedule `
    + `${first}-${last} (+1%/yr), reduced by ${SALT_PHASEDOWN_RATE * 100}% of income above ${formatUSD(s.phaseDownThreshold)} (2026, also +1%/yr; `
    + `salary stands in for income) but not below ${formatUSD(SALT_PHASEDOWN_FLOOR)}, then a flat ${formatUSD(SALT_CAP_AFTER_SCHEDULE)} from ${last + 1}. `
    + `Married filing separately halves the threshold and floors.`;
};

export const FIELDS: FieldDef[] = [
  // --- Drivers (shown beside the chart) ---
  {
    key: 'homePrice', label: 'Home price', unit: 'usd', group: 'home', driver: true,
    soft: { min: 100000, max: 3000000, step: 10000 }, flip: { min: 50000, max: 10000000 },
    help: 'Purchase price of the home.',
  },
  {
    key: 'downPaymentPercent', label: 'Down payment', unit: 'percent', group: 'home', driver: true,
    soft: { min: 3, max: 100, step: 0.5 },
    help: 'Share of the price paid upfront. Below 20%, the lender charges PMI until the balance falls to 80% of the price.',
    hint: (i) => formatUSD(pct(i, i.downPaymentPercent)),
  },
  {
    key: 'effectiveMortgageRate', label: 'Mortgage rate', unit: 'percent', group: 'home', driver: true,
    soft: { min: 2, max: 10, step: 0.05 }, flip: { min: 0, max: 30 },
    help: 'Annual interest rate on the mortgage (APR).',
    hint: (i) => {
      if (loan(i) <= 0) return 'No mortgage (cash purchase)';
      const s = calculateMortgageScenario(i, 0, i.mortgageYears);
      return `${formatUSD(s.totalInterestPaid)} interest over ${i.mortgageYears} years`;
    },
  },
  {
    key: 'monthlyRent', label: 'Monthly rent', unit: 'usdPerMonth', group: 'renting', driver: true,
    soft: { min: 500, max: 15000, step: 50 }, flip: { min: 0, max: 100000 },
    help: 'Rent for a home comparable to the one you would buy. If you enter rental income (renting out part of the home), use the rent for housing like the part you would live in yourself; otherwise the comparison credits the buyer for space the renter is paying for.',
  },
  {
    key: 'rentIncrease', label: 'Rent increase', unit: 'percentPerYear', group: 'renting', driver: true,
    soft: { min: 0, max: 10, step: 0.1 }, flip: { min: -10, max: 30 },
    help: 'Annual rent growth, applied from year 2. Also grows any rental income.',
    hint: (i) => `${formatUSD(i.monthlyRent * i.rentIncrease / 100)}/mo more in year 2`,
  },
  {
    key: 'homeAppreciation', label: 'Home appreciation', unit: 'percentPerYear', group: 'market', driver: true,
    soft: { min: -2, max: 10, step: 0.1 }, flip: { min: -20, max: 40 },
    help: 'Annual growth in the home\'s market value. Long-run US home prices have risen roughly 3-5%/yr nominal.',
    hint: (i) => `${formatUSD(pct(i, i.homeAppreciation))} in year 1`,
  },
  {
    key: 'investmentReturn', label: 'Investment return', unit: 'percentPerYear', group: 'market', driver: true,
    soft: { min: 0, max: 15, step: 0.1 }, flip: { min: -20, max: 50 },
    help: 'Expected annual return on invested savings, in nominal terms (before inflation). US stocks returned about 10%/yr nominal (about 7% after inflation) from 1928 to 2025. The default is part of the example household, not a forecast.',
    hint: (i) => `Net ${Number((i.investmentReturn - i.annualInvestmentTaxDrag).toFixed(2))}% after ${i.annualInvestmentTaxDrag}% tax drag`,
  },

  // --- Home & loan ---
  {
    key: 'mortgageYears', label: 'Mortgage term', unit: 'years', group: 'home',
    soft: { min: 5, max: 40, step: 1 },
    help: 'Length of the loan. 15 and 30 years are most common.',
  },
  {
    key: 'closingCostPercent', label: 'Closing costs', unit: 'percent', group: 'home',
    soft: { min: 0, max: 6, step: 0.1 },
    help: 'One-time fees at purchase (loan fees, title, inspections), as a share of the price.',
    hint: (i) => formatUSD(pct(i, i.closingCostPercent)),
  },
  {
    key: 'PMIRate', label: 'PMI rate', unit: 'percent', group: 'home',
    soft: { min: 0, max: 2, step: 0.05 },
    visibleWhen: (i) => i.downPaymentPercent < 20,
    help: 'Annual private mortgage insurance, as a share of the original loan. Charged while the balance is above 80% of the price.',
    hint: (i) => `${formatUSD(loan(i) * i.PMIRate / 100 / 12)}/mo while owed`,
  },
  {
    key: 'movingCostBuying', label: 'Moving costs (if buying)', unit: 'usd', group: 'home',
    soft: { min: 0, max: 20000, step: 100 },
    help: 'One-time cost of moving into the home you buy.',
  },
  {
    key: 'sellingCostPercent', label: 'Selling costs', unit: 'percent', group: 'home',
    soft: { min: 0, max: 12, step: 0.5 },
    visibleWhen: (i) => i.includeSellingCosts,
    help: 'Agent fees and closing costs when you sell, as a share of the home value at the end of the period (typically 6-10%).',
  },

  // --- Owning costs ---
  {
    key: 'propertyTaxRate', label: 'Property tax rate', unit: 'percent', group: 'owning',
    soft: { min: 0.2, max: 3, step: 0.01 },
    help: 'Annual property tax as a share of assessed value.',
    hint: (i) => `${formatUSD(pct(i, i.propertyTaxRate))} in year 1`,
  },
  {
    key: 'propertyTaxAssessmentCap', label: 'Assessment growth cap', unit: 'percentPerYear', group: 'owning',
    soft: { min: 0, max: 10, step: 0.1 },
    help: 'Cap on yearly growth of the assessed value (California Prop 13: 2%). Assessed value grows at the lesser of inflation and this cap, so values above the inflation rate have no effect.',
  },
  {
    key: 'melloRoosTaxRate', label: 'Mello-Roos rate', unit: 'percent', group: 'owning',
    soft: { min: 0, max: 2, step: 0.01 },
    help: 'Special assessment in some California communities, as a share of the price. Treated as not SALT-deductible (conservative); a documented maintenance or bond-interest portion can be deductible.',
    hint: (i) => (i.melloRoosTaxRate > 0 ? `${formatUSD(pct(i, i.melloRoosTaxRate))} in year 1` : null),
  },
  {
    key: 'melloRoosGrowsWithAssessment', label: 'Mello-Roos grows with assessed value', unit: 'toggle', group: 'owning',
    visibleWhen: (i) => i.melloRoosTaxRate > 0,
    help: 'Off: the assessment stays at its year-1 amount. On: it grows with the assessed value.',
  },
  {
    key: 'annualMaintenanceRate', label: 'Maintenance', unit: 'percentPerYear', group: 'owning',
    soft: { min: 0, max: 4, step: 0.1 },
    help: 'Annual maintenance and repairs, as a share of the current home value (often quoted as 1-3%).',
    hint: (i) => `${formatUSD(pct(i, i.annualMaintenanceRate))} in year 1`,
  },
  {
    key: 'monthlyHOAFee', label: 'HOA fee', unit: 'usdPerMonth', group: 'owning',
    soft: { min: 0, max: 2000, step: 10 },
    help: 'Homeowners association dues. Grow with inflation.',
  },
  {
    key: 'monthlyHomeInsurance', label: 'Home insurance', unit: 'usdPerMonth', group: 'owning',
    soft: { min: 0, max: 1000, step: 10 },
    help: 'Homeowners insurance premium. Grows with inflation.',
  },
  {
    key: 'monthlyPropertyUtilities', label: 'Utilities', unit: 'usdPerMonth', group: 'owning',
    soft: { min: 0, max: 1000, step: 10 },
    help: 'Gas, electric, water/sewer, trash and internet for the home you buy. Grows with inflation.',
  },
  {
    key: 'monthlyRentalIncome', label: 'Rental income from the home', unit: 'usdPerMonth', group: 'owning',
    soft: { min: 0, max: 5000, step: 50 },
    help: 'After-tax income from renting out part of the home you buy (an ADU or a room). If you enter this, set Monthly rent to the rent for housing like the part you would live in, not the whole property.',
    hint: (i) => (i.monthlyRentalIncome > 0 ? 'Monthly rent should then exclude the rented-out space' : null),
  },

  // --- Renting ---
  {
    key: 'monthlyRentUtilities', label: 'Utilities (renting)', unit: 'usdPerMonth', group: 'renting',
    soft: { min: 0, max: 1000, step: 10 },
    help: 'Same list as the owned home (gas, electric, water/sewer, trash, internet); leave out anything the rent includes. Grows with inflation.',
  },
  {
    key: 'monthlyRenterInsurance', label: 'Renters insurance', unit: 'usdPerMonth', group: 'renting',
    soft: { min: 0, max: 100, step: 1 },
    help: 'Renters insurance premium. Grows with inflation.',
  },
  {
    key: 'rentDeposit', label: 'Security deposit', unit: 'usd', group: 'renting',
    soft: { min: 0, max: 20000, step: 100 },
    help: 'Refundable deposit. Counted in the renter\'s net worth at face value; it earns nothing.',
  },
  {
    key: 'movingCostRenting', label: 'Moving costs (if renting)', unit: 'usd', group: 'renting',
    soft: { min: 0, max: 10000, step: 100 },
    help: 'One-time cost of moving into the rental.',
  },

  // --- Market & growth ---
  {
    key: 'annualInvestmentTaxDrag', label: 'Investment tax drag', unit: 'percentPerYear', group: 'market',
    soft: { min: 0, max: 3, step: 0.05 },
    help: 'Yearly return lost to taxes on dividends and realized gains in a taxable account (0% in a 401k/IRA). Subtracted from the investment return for both paths.',
  },
  {
    key: 'inflationRate', label: 'Inflation', unit: 'percentPerYear', group: 'market',
    soft: { min: 0, max: 8, step: 0.1 },
    help: 'General inflation. Grows living expenses, insurance, utilities, HOA dues and the standard deduction, and converts results to today\'s dollars.',
  },
  {
    key: 'salaryGrowthRate', label: 'Salary growth', unit: 'percentPerYear', group: 'market',
    soft: { min: 0, max: 10, step: 0.1 },
    help: 'Annual raise, applied from year 2.',
  },

  // --- Taxes ---
  {
    key: 'standardDeduction', label: 'Standard deduction', unit: 'usd', group: 'taxes',
    soft: { min: 10000, max: 40000, step: 50 },
    help: 'Standard deduction for the selected tax year, filled in from the IRS tables when you change the tax year or filing status (2026: $32,200 married filing jointly; $16,100 single or married filing separately; $24,150 head of household). Later years grow with inflation.',
  },
  {
    key: 'saltCap', label: 'SALT cap', unit: 'usd', group: 'taxes',
    soft: { min: 0, max: 50000, step: 100 },
    help: saltHelp,
  },
  {
    key: 'assumeSaltCapExtension', label: 'Assume the SALT cap is extended past 2029', unit: 'toggle', group: 'taxes',
    help: 'Off (current law): the elevated cap rises 1%/yr through 2029, then reverts to a flat $10,000. On: the 2029 rules continue after 2029. 2026-2029 are the same either way.',
  },
  {
    key: 'mortgageInterestDeductionCap', label: 'Mortgage interest debt limit', unit: 'usd', group: 'taxes',
    soft: { min: 0, max: 1500000, step: 25000 },
    help: 'Mortgage debt whose interest is deductible ($750,000; $375,000 married filing separately). Interest on a larger loan is prorated.',
  },
  {
    key: 'effectiveFederalTaxRate', label: 'Federal income tax (effective)', unit: 'percent', group: 'taxes',
    soft: { min: 0, max: 40, step: 0.1 },
    help: 'Total federal income tax divided by salary. Excludes Social Security and Medicare, which are calculated separately unless you turn that off.',
    hint: (i) => `${formatUSD(i.annualSalaryBeforeTax * i.effectiveFederalTaxRate / 100)}/yr`,
  },
  {
    key: 'effectiveStateIncomeTaxRate', label: 'State income tax (effective)', unit: 'percent', group: 'taxes',
    soft: { min: 0, max: 15, step: 0.1 },
    help: 'Total state income tax divided by salary. Also counts toward the SALT deduction for both paths.',
    hint: (i) => `${formatUSD(i.annualSalaryBeforeTax * i.effectiveStateIncomeTaxRate / 100)}/yr`,
  },
  {
    key: 'useMarginalTaxRate', label: 'Value deductions at the marginal rate', unit: 'toggle', group: 'taxes',
    help: 'Deductions reduce tax at your marginal (bracket) rate, not your average rate. Off: the effective federal rate is used.',
  },
  {
    key: 'marginalFederalTaxRate', label: 'Marginal federal rate', unit: 'percent', group: 'taxes',
    soft: { min: 10, max: 37, step: 1 },
    visibleWhen: (i) => i.useMarginalTaxRate,
    help: 'Your federal tax bracket.',
  },
  {
    key: 'includePayrollTax', label: 'Deduct Social Security & Medicare', unit: 'toggle', group: 'taxes',
    help: 'Employee payroll taxes: Social Security 6.2% of each earner\'s wages up to the yearly wage base, Medicare 1.45%, and 0.9% Additional Medicare Tax above $250,000 (married filing jointly). Turn off only if your federal rate already includes them.',
  },
  {
    key: 'payrollEarners', label: 'Wage earners', unit: 'count', group: 'taxes',
    soft: { min: 1, max: 2, step: 1 },
    visibleWhen: (i) => i.includePayrollTax,
    help: 'People earning the salary (split evenly). Each pays Social Security up to their own wage base.',
  },

  // --- Your finances ---
  {
    key: 'initialInvestment', label: 'Savings available', unit: 'usd', group: 'finances',
    soft: { min: 0, max: 5000000, step: 10000 },
    help: 'Cash and investments you have today. Pays the down payment, closing and moving costs; the rest stays invested.',
  },
  {
    key: 'annualSalaryBeforeTax', label: 'Household salary', unit: 'usd', group: 'finances',
    soft: { min: 0, max: 2000000, step: 5000 },
    help: 'Gross annual salary before taxes.',
  },
  {
    key: 'monthlyMiscExpenses', label: 'Living expenses', unit: 'usdPerMonth', group: 'finances',
    soft: { min: 0, max: 20000, step: 50 },
    help: 'Monthly spending other than housing (food, transport, etc.). Same for both paths; grows with inflation.',
  },

  // --- View settings (controlled from the answer panel / header) ---
  { key: 'xAxisYears', label: 'How long will you stay?', unit: 'years', group: 'view', soft: { min: 1, max: 50, step: 1 }, help: 'Years until the comparison is made.' },
  { key: 'includeSellingCosts', label: 'Count selling costs', unit: 'toggle', group: 'view', help: 'Subtract the cost of selling the home from the buyer\'s net worth.' },
  { key: 'firstTaxYear', label: 'Tax year', unit: 'select', group: 'view', help: 'Tax year of the first year of ownership.' },
  { key: 'filingStatus', label: 'Filing status', unit: 'select', group: 'view', help: 'Federal filing status.' },
];

export const FIELD_BY_KEY = Object.fromEntries(FIELDS.map(f => [f.key, f])) as Record<InputKey, FieldDef>;
export const DRIVER_KEYS = FIELDS.filter(f => f.driver).map(f => f.key);

export const fieldHelp = (f: FieldDef, inputs: HousingCalculatorInputs) => (typeof f.help === 'function' ? f.help(inputs) : f.help);
export const fieldId = (key: string) => `field-${key}`;
