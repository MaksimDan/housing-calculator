import type { HousingCalculatorInputs } from './financialCalculations';
import { formatUSD } from './format';

export interface CashCheck {
  tests: { label: string; detail: string; pass: boolean }[];
  warnings: string[];
}

// What "affordable" means here, spelled out, plus later-year problems the
// year-1 check can't see. Reads only engine output rows.
export const checkCash = (inputs: HousingCalculatorInputs, rows: any[], horizon: number): CashCheck => {
  const down = inputs.homePrice * inputs.downPaymentPercent / 100;
  const closing = inputs.homePrice * inputs.closingCostPercent / 100;
  const upfront = down + closing + inputs.movingCostBuying;
  const year1 = rows[1] ?? rows[0];
  const tests = [
    {
      label: 'Upfront cash',
      detail: `Needs ${formatUSD(upfront)} (down payment ${formatUSD(down)}, closing ${formatUSD(closing)}${inputs.movingCostBuying ? `, moving ${formatUSD(inputs.movingCostBuying)}` : ''}); you have ${formatUSD(inputs.initialInvestment)}.`,
      pass: upfront <= inputs.initialInvestment,
    },
    {
      label: 'Year-1 monthly budget (buying)',
      detail: `Take-home ${formatUSD(year1.monthlyTakeHome)}/mo covers housing ${formatUSD(year1.monthlyPayment)}/mo (net of rental income) and living expenses ${formatUSD(year1.monthlyMiscExpenses)}/mo, leaving ${formatUSD(year1.availableMonthlyInvestment)}/mo to invest.`,
      pass: year1.availableMonthlyInvestment >= 0,
    },
  ];
  const warnings: string[] = [];
  const last = Math.min(horizon, rows.length - 1);
  const firstYear = (pred: (r: any) => boolean) => {
    for (let y = 1; y <= last; y++) if (pred(rows[y])) return y;
    return null;
  };
  const buyerShort = firstYear(r => r.availableMonthlyInvestment < 0);
  if (buyerShort) warnings.push(`From year ${buyerShort}, buying costs more each month than take-home pay allows; the shortfall is drawn from savings.`);
  const renterShort = firstYear(r => r.availableMonthlyRenterInvestment < 0);
  if (renterShort) warnings.push(`From year ${renterShort}, renting costs more each month than take-home pay allows; the shortfall is drawn from savings.`);
  const buyerNeg = firstYear(r => r.investmentsBuying < 0);
  if (buyerNeg) warnings.push(`In year ${buyerNeg} the buyer's savings run out; the model then borrows at the investment return, which no lender offers.`);
  const renterNeg = firstYear(r => r.investmentsRenting < 0);
  if (renterNeg) warnings.push(`In year ${renterNeg} the renter's savings run out; the model then borrows at the investment return, which no lender offers.`);
  return { tests, warnings };
};
