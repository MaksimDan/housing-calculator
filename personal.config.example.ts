// Your own starting values for `npm run dev`.
//
// Copy this file to personal.config.ts (git-ignored) and set the inputs you
// want to start from instead of the example household. Anything you leave out
// keeps its default; DEFAULTS in src/hooks/useCalculatorInputs.ts lists every
// input. Only the dev server reads the file: `npm run build`, the tests and
// the deployed site always use the defaults, so your numbers stay on your
// machine.
//
// Saving the file reloads the page with it. Edits made in the page last until
// the file changes or you reset. The standard deduction, SALT cap and
// mortgage-interest cap follow firstTaxYear, filingStatus and inflationRate
// unless you set them here. Anything the app can't use (an unknown input, a
// value out of range) is reported in the browser console.
import type { HousingCalculatorInputs } from './src/lib/financialCalculations';

const personal: Partial<HousingCalculatorInputs> = {
  annualSalaryBeforeTax: 180000,
  filingStatus: 'single', // 'mfj' | 'single' | 'hoh' | 'mfs'
  payrollEarners: 1,
  // Rates are percentages: 17.7 means 17.7%
  effectiveFederalTaxRate: 17.7, // federal income tax / salary, with the standard deduction
  marginalFederalTaxRate: 24, // your top federal bracket
  effectiveStateIncomeTaxRate: 5,
  initialInvestment: 250000, // savings available today
  homePrice: 600000,
  downPaymentPercent: 20,
  effectiveMortgageRate: 6.25,
  monthlyRent: 2800, // rent for a home comparable to the one you'd buy
};

export default personal;
