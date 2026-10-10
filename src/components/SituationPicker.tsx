import React from 'react';
import type { HousingCalculatorInputs, Situation } from '../lib/financialCalculations';
import { startingPosition } from '../lib/financialCalculations';
import { wordsFor } from '../lib/situation';
import { formatUSD } from '../lib/format';
import { BUY_TEXT, RENT_TEXT } from '../lib/colors';

const OPTIONS: { value: Situation; title: string; question: string }[] = [
  { value: 'renter', title: 'I rent', question: 'Should I buy a home?' },
  { value: 'owner', title: 'I own my home', question: 'Keep it, or sell it and rent?' },
];

// "a", "a and b", "a, b and c"
const listOf = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);

// What each path does with the inputs, in this situation's terms
const describePaths = (i: HousingCalculatorInputs) => {
  const start = startingPosition(i);
  const rent = `Then rent a home like yours for ${formatUSD(i.monthlyRent)}/mo.`;
  if (i.situation === 'owner') {
    const keep = start.loanAmount > 0
      ? `Go on paying your ${formatUSD(start.loanAmount)} mortgage (${i.effectiveMortgageRate}%, ${i.mortgageYears} years left) and the costs of owning; your equity stays in the home.`
      : 'Your home is paid off: pay the costs of owning, and your equity stays in the home.';
    const costs = start.loanAmount > 0 ? `${formatUSD(start.saleCosts)} selling costs and the loan` : `${formatUSD(start.saleCosts)} selling costs`;
    const sell = start.saleProceeds >= 0
      ? `Sell for ${formatUSD(i.homePrice)}, pay ${costs} out of the sale, and invest the ${formatUSD(start.saleProceeds)} left with your savings. ${rent}`
      : `Sell for ${formatUSD(i.homePrice)} and pay ${costs}, ${formatUSD(-start.saleProceeds)} of it from your savings. ${rent}`;
    return { own: keep, rent: sell };
  }
  const upfront = [`${formatUSD(start.downPayment)} down`];
  if (start.closingCosts > 0) upfront.push(`${formatUSD(start.closingCosts)} closing costs`);
  if (i.movingCostBuying > 0) upfront.push(`${formatUSD(i.movingCostBuying)} to move`);
  return {
    own: `Pay ${listOf(upfront)} from your savings, then the mortgage and the costs of owning.`,
    rent: `Keep renting at ${formatUSD(i.monthlyRent)}/mo and keep your savings invested.`,
  };
};

interface SituationPickerProps {
  inputs: HousingCalculatorInputs;
  setSituation: (situation: Situation) => void;
}

// Where you start decides what the two paths are and how the inputs are
// used, so it comes before the answer
export const SituationPicker: React.FC<SituationPickerProps> = ({ inputs, setSituation }) => {
  const words = wordsFor(inputs.situation);
  const paths = describePaths(inputs);
  return (
    <section aria-label="Your situation" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <fieldset>
        <legend className="text-xs font-semibold uppercase tracking-wide text-gray-600">Your situation</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:max-w-2xl">
          {OPTIONS.map(o => {
            const selected = inputs.situation === o.value;
            return (
              <label key={o.value}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-2.5 sm:p-3 focus-within:ring-2 focus-within:ring-blue-500 ${selected ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                <input type="radio" name="situation" value={o.value} checked={selected} onChange={() => setSituation(o.value)}
                  className="mt-1 h-4 w-4 flex-shrink-0 accent-blue-600" />
                <span>
                  <span className="block text-sm font-semibold text-gray-900">{o.title}</span>
                  <span className="block text-sm text-gray-700">{o.question}</span>
                </span>
              </label>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-gray-600">Each keeps its own home, loan and rent; your income, savings, taxes and market assumptions are shared.</p>
      </fieldset>
      {/* Phones: the label runs into its sentence; wider: a label column */}
      <dl className="mt-3 space-y-1 text-sm text-gray-700">
        <div className="sm:flex sm:gap-2">
          <dt className={`inline font-semibold sm:block sm:w-20 sm:flex-shrink-0 ${BUY_TEXT}`}>{words.own.short}<span className="sm:hidden">:</span></dt>{' '}
          <dd className="inline sm:block">{paths.own}</dd>
        </div>
        <div className="sm:flex sm:gap-2">
          <dt className={`inline font-semibold sm:block sm:w-20 sm:flex-shrink-0 ${RENT_TEXT}`}>{words.rent.short}<span className="sm:hidden">:</span></dt>{' '}
          <dd className="inline sm:block">{paths.rent}</dd>
        </div>
      </dl>
    </section>
  );
};

export default SituationPicker;
