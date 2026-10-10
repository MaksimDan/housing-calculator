import type { HousingCalculatorInputs } from './financialCalculations';
import { startingPosition } from './financialCalculations';
import { formatUSD } from './format';
import { wordsFor } from './situation';

export interface CashCheck {
  tests: { label: string; detail: string; pass: boolean }[];
  warnings: string[];
}

// What "affordable" means here, spelled out, plus later-year problems the
// year-1 check can't see. Reads only engine output rows.
export const checkCash = (inputs: HousingCalculatorInputs, rows: any[], horizon: number): CashCheck => {
  const words = wordsFor(inputs.situation);
  const start = startingPosition(inputs);
  const year1 = rows[1] ?? rows[0];
  const startTest = inputs.situation === 'owner'
    ? {
      label: 'Selling today',
      detail: `A ${formatUSD(inputs.homePrice)} sale less ${formatUSD(start.saleCosts)} selling costs and the ${formatUSD(start.loanAmount)} loan leaves ${formatUSD(start.saleProceeds)}`
        + `; with your ${formatUSD(inputs.initialInvestment)} savings, less ${inputs.movingCostRenting ? `${formatUSD(inputs.movingCostRenting)} moving and ` : ''}the ${formatUSD(inputs.rentDeposit)} deposit, ${formatUSD(start.rentingInvestment)} is invested.`,
      pass: start.rentingInvestment >= 0,
    }
    : {
      label: 'Upfront cash',
      detail: `Needs ${formatUSD(start.upfrontCash)} (down payment ${formatUSD(start.downPayment)}, closing ${formatUSD(start.closingCosts)}${inputs.movingCostBuying ? `, moving ${formatUSD(inputs.movingCostBuying)}` : ''}); you have ${formatUSD(inputs.initialInvestment)}.`,
      pass: start.upfrontCash <= inputs.initialInvestment,
    };
  const surplus = year1.availableMonthlyInvestment;
  const tests = [
    startTest,
    {
      label: `Year-1 monthly budget (${words.own.lower})`,
      detail: surplus >= 0
        ? `Take-home ${formatUSD(year1.monthlyTakeHome)}/mo covers housing ${formatUSD(year1.monthlyPayment)}/mo (net of rental income) and living expenses ${formatUSD(year1.monthlyMiscExpenses)}/mo, leaving ${formatUSD(surplus)}/mo to invest.`
        : `Take-home ${formatUSD(year1.monthlyTakeHome)}/mo doesn't cover housing ${formatUSD(year1.monthlyPayment)}/mo (net of rental income) and living expenses ${formatUSD(year1.monthlyMiscExpenses)}/mo; ${formatUSD(-surplus)}/mo comes out of savings.`,
      pass: surplus >= 0,
    },
  ];
  const warnings: string[] = [];
  const last = Math.min(horizon, rows.length - 1);
  const firstYear = (pred: (r: any) => boolean) => {
    for (let y = 1; y <= last; y++) if (pred(rows[y])) return y;
    return null;
  };
  const buyerShort = firstYear(r => r.availableMonthlyInvestment < 0);
  if (buyerShort) warnings.push(`From year ${buyerShort}, ${words.own.lower} costs more each month than take-home pay allows; the shortfall is drawn from savings.`);
  const renterShort = firstYear(r => r.availableMonthlyRenterInvestment < 0);
  if (renterShort) warnings.push(`From year ${renterShort}, ${words.rent.lower} costs more each month than take-home pay allows; the shortfall is drawn from savings.`);
  const buyerNeg = firstYear(r => r.investmentsBuying < 0);
  if (buyerNeg) warnings.push(`In year ${buyerNeg}, savings run out ${words.own.who}; the model then borrows at the investment return, which no lender offers.`);
  const renterNeg = firstYear(r => r.investmentsRenting < 0);
  if (renterNeg) warnings.push(`In year ${renterNeg}, savings run out ${words.rent.who}; the model then borrows at the investment return, which no lender offers.`);
  return { tests, warnings };
};
