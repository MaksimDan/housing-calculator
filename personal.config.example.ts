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
import type { PersonalConfig } from './src/lib/personalConfig';

const personal: PersonalConfig = {
  // The page opens in this situation: 'renter' (you rent and are thinking of
  // buying) or 'owner' (you own and are thinking of selling and renting). The
  // home and rent inputs at this level belong to it; the other situation
  // starts from the defaults unless you give it a block (see the end).
  situation: 'renter',
  annualSalaryBeforeTax: 180000,
  filingStatus: 'single', // 'mfj' | 'single' | 'hoh' | 'mfs'
  payrollEarners: 1,
  // Rates are percentages: 17.7 means 17.7%
  effectiveFederalTaxRate: 17.7, // federal income tax / salary, with the standard deduction
  marginalFederalTaxRate: 24, // your top federal bracket
  effectiveStateIncomeTaxRate: 5,
  initialInvestment: 250000, // savings available today
  // The home you'd buy, and the rent you pay
  homePrice: 600000,
  downPaymentPercent: 20,
  effectiveMortgageRate: 6.25,
  monthlyRent: 2800, // rent for a home comparable to the one you'd buy

  // A home you own goes in an owner block, so its numbers never mix with the
  // purchase above. (If you only own, set situation: 'owner' and put them at
  // the top level instead.) Selling pays sellingCostPercent, 6% by default.
  // owner: {
  //   homePrice: 640000, // what it would sell for today
  //   mortgageBalance: 410000, // what you still owe
  //   effectiveMortgageRate: 3.1, // your loan's rate
  //   mortgageYears: 26.5, // years left (26 years and 6 months)
  //   monthlyRent: 3000, // rent for a home like yours if you sell
  // },
};

export default personal;
