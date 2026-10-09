import React from 'react';
import { formatUSD } from '../lib/format';
import type { InputKey } from '../lib/fields';

interface BlockingStateProps {
  error: any;
  focusField: (key: InputKey) => void;
}

// Replaces the answer when the purchase isn't affordable at all
export const BlockingState: React.FC<BlockingStateProps> = ({ error, focusField }) => {
  const upfront = String(error.error).includes('Insufficient initial investment');
  const items = upfront
    ? [
      ['Needed upfront (down payment, closing, moving)', formatUSD(error.requiredUpfront)],
      ['Savings available', formatUSD(error.availableInvestment)],
      ['Short by', formatUSD(error.requiredUpfront - error.availableInvestment)],
    ]
    : [
      ['Monthly take-home pay', formatUSD(error.monthlyTakeHome)],
      ['Monthly housing costs', formatUSD(error.monthlyHousingCosts)],
      ['Monthly living expenses', formatUSD(error.monthlyMiscExpenses)],
      ...(error.monthlyRentalIncome > 0 ? [['Monthly rental income', formatUSD(-error.monthlyRentalIncome)]] : []),
      ['Short by each month', formatUSD(error.monthlyHousingCosts + error.monthlyMiscExpenses - error.monthlyRentalIncome - error.monthlyTakeHome)],
    ];
  const fixes: [InputKey, string][] = upfront
    ? [['initialInvestment', 'Savings'], ['downPaymentPercent', 'Down payment'], ['homePrice', 'Home price']]
    : [['annualSalaryBeforeTax', 'Salary'], ['homePrice', 'Home price'], ['downPaymentPercent', 'Down payment'], ['monthlyMiscExpenses', 'Living expenses']];
  return (
    <section role="alert" aria-labelledby="blocking-title" className="rounded-xl border-l-4 border-red-600 bg-red-50 p-4 sm:p-6">
      <h2 id="blocking-title" className="text-xl font-semibold text-red-900">Can't compare yet: {upfront ? 'not enough cash upfront' : 'monthly costs exceed take-home pay'}</h2>
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
