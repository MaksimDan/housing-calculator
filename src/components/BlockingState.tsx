import React from 'react';
import { formatUSD } from '../lib/format';
import type { InputKey } from '../lib/fields';

interface BlockingStateProps {
  error: any;
  focusField: (key: InputKey) => void;
}

// Replaces the answer when the comparison can't run at all: the purchase
// isn't affordable, or (for an owner) selling needs more cash than there is
export const BlockingState: React.FC<BlockingStateProps> = ({ error, focusField }) => {
  let title: string;
  let items: string[][];
  let fixes: [InputKey, string][];
  if (error.kind === 'sale') {
    const left = error.availableInvestment + error.salePrice - error.saleCosts - error.mortgageBalance - error.movingCost - error.rentDeposit;
    title = 'selling needs more cash than you have';
    items = [
      ['Sale price', formatUSD(error.salePrice)],
      ['Selling costs', formatUSD(-error.saleCosts)],
      ['Mortgage payoff', formatUSD(-error.mortgageBalance)],
      ...(error.movingCost > 0 ? [['Moving costs', formatUSD(-error.movingCost)]] : []),
      ['Security deposit', formatUSD(-error.rentDeposit)],
      ['Savings', formatUSD(error.availableInvestment)],
      ['Short by', formatUSD(-left)],
    ];
    fixes = [['homePrice', 'Home value'], ['mortgageBalance', 'Mortgage balance'], ['initialInvestment', 'Savings'], ['sellingCostPercent', 'Selling costs']];
  } else if (error.kind === 'upfront') {
    title = 'not enough cash upfront';
    items = [
      ['Needed upfront (down payment, closing, moving)', formatUSD(error.requiredUpfront)],
      ['Savings available', formatUSD(error.availableInvestment)],
      ['Short by', formatUSD(error.requiredUpfront - error.availableInvestment)],
    ];
    fixes = [['initialInvestment', 'Savings'], ['downPaymentPercent', 'Down payment'], ['homePrice', 'Home price']];
  } else {
    title = 'monthly costs exceed take-home pay';
    items = [
      ['Monthly take-home pay', formatUSD(error.monthlyTakeHome)],
      ['Monthly housing costs', formatUSD(error.monthlyHousingCosts)],
      ['Monthly living expenses', formatUSD(error.monthlyMiscExpenses)],
      ...(error.monthlyRentalIncome > 0 ? [['Monthly rental income', formatUSD(-error.monthlyRentalIncome)]] : []),
      ['Short by each month', formatUSD(error.monthlyHousingCosts + error.monthlyMiscExpenses - error.monthlyRentalIncome - error.monthlyTakeHome)],
    ];
    fixes = [['annualSalaryBeforeTax', 'Salary'], ['homePrice', 'Home price'], ['downPaymentPercent', 'Down payment'], ['monthlyMiscExpenses', 'Living expenses']];
  }
  return (
    <section role="alert" aria-labelledby="blocking-title" className="rounded-xl border-l-4 border-red-600 bg-red-50 p-4 sm:p-6">
      <h2 id="blocking-title" className="text-xl font-semibold text-red-900">Can't compare yet: {title}</h2>
      <dl className="mt-3 max-w-lg space-y-1 text-sm">
        {items.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4"><dt className="text-red-900">{k}</dt><dd className="font-medium tabular-nums text-red-950">{v}</dd></div>
        ))}
      </dl>
      <p className="mt-4 text-sm text-red-900">
        Fix it:{' '}
        {fixes.map(([key, label], i) => (
          <React.Fragment key={key}>
            {i > 0 && ' · '}
            <button type="button" onClick={() => focusField(key)} className="font-medium underline">{label}</button>
          </React.Fragment>
        ))}
      </p>
    </section>
  );
};

export default BlockingState;
