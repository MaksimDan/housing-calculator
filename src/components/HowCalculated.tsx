import React from 'react';
import type { HousingCalculatorInputs } from '../lib/financialCalculations';
import { TAX_YEARS, SALT_SCHEDULE, SALT_CAP_AFTER_SCHEDULE, LATEST_PUBLISHED_TAX_YEAR } from '../lib/taxLaw';
import { describeStateIncomeTax, stateName, statePropertyTax, STATE_INCOME_TAX } from '../lib/stateLaw';
import { formatUSD } from '../lib/format';

// The selected state's rules, as the calculator applies them
const StateRules: React.FC<{ inputs: HousingCalculatorInputs }> = ({ inputs }) => {
  const name = stateName(inputs.state);
  const p = statePropertyTax(inputs.state);
  const income = STATE_INCOME_TAX[inputs.state];
  return (
    <div>
      <h3 className="font-semibold text-gray-900">{name}'s rules</h3>
      <ul className="list-disc pl-5">
        <li>
          Income tax: {describeStateIncomeTax(inputs.state, inputs.firstTaxYear, inputs.filingStatus, inputs.inflationRate)}
          {income ? ' Picking the state fills in the state and local income tax rate from this for your salary and filing status; type your own to replace it.' : ''}
          {income?.localNote ? ` ${income.localNote}` : ''}
        </li>
        <li>Property tax: typically {Number(p.typicalRate.toFixed(2))}% of the home's value a year, {p.rateNote}. It fills in the property tax rate for a purchase; use your county's rate if you know it.</li>
        <li>
          Assessments: {p.assessmentLimit
            ? `${p.assessmentLimit.description} The assessed value never grows faster than the home's value.`
            : `no statewide limit, so the assessed value follows the home's value.${p.limitNote ? ` ${p.limitNote}` : ''}`}
        </li>
      </ul>
    </div>
  );
};

export const HowCalculated: React.FC<{ inputs: HousingCalculatorInputs }> = ({ inputs }) => {
  const owner = inputs.situation === 'owner';
  const saltYears = Object.keys(SALT_SCHEDULE).map(Number).sort();
  return (
    <section id="method" aria-labelledby="method-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <details>
        <summary className="cursor-pointer">
          <h2 id="method-title" className="inline text-base font-semibold text-gray-900">How this is calculated</h2>
        </summary>
        <div className="mt-3 space-y-4 text-sm leading-relaxed text-gray-700">
          <div>
            <h3 className="font-semibold text-gray-900">The comparison</h3>
            {owner ? (
              <p>Two versions of you start today with the same savings, the same home and the same take-home pay. If you <span className="text-blue-700">keep</span> the home, you go on paying the mortgage you have and the costs of owning, with no purchase costs, and your equity stays in the home. If you <span className="text-emerald-700">sell and rent</span>, the sale pays the selling costs and the rest of the loan, and what is left joins your savings, less moving costs and the deposit on a rental; from then on you pay rent. Each month, whatever housing and living costs don't use is invested (or drawn from savings when costs exceed pay). Net worth is investments plus home equity (minus the cost of selling later, when you count it) if you keep the home, and investments plus the security deposit if you sell.</p>
            ) : (
              <p>Two households start with the same savings and the same take-home pay. The <span className="text-blue-700">buyer</span> pays the down payment and closing costs, then the mortgage and the costs of owning; the <span className="text-emerald-700">renter</span> pays rent and keeps the rest invested. Each month, whatever housing and living costs don't use is invested (or drawn from savings when costs exceed pay). Net worth is investments plus home equity (minus selling costs when you count them) for the buyer, and investments plus the security deposit for the renter.</p>
            )}
            <p className="mt-1">{owner
              ? 'Already rent and thinking of buying? Choose "I rent" at the top: the buyer then pays a down payment and closing costs instead of carrying an existing loan.'
              : 'Already own and thinking of selling? Choose "I own my home" at the top: keeping the home then carries your loan as it stands, with no purchase costs, and selling pays the selling costs now.'}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Timing</h3>
            <p>Each year's costs are charged at that year's levels (year 1 uses the amounts you enter), and growth and inflation apply at each year boundary. Balances are reported at the end of each year. Mortgage payments and PMI are charged in the exact months they are owed. Investments compound monthly at the return minus tax drag. Tax savings from itemizing are added to investments at the end of each year.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Taxes</h3>
            <p>Take-home pay deducts federal and state income tax at your effective rates, plus Social Security and Medicare. Each year both paths itemize only if their deductions beat the standard deduction: {owner ? 'keeping the home' : 'the buyer'} deducts mortgage interest (prorated above the debt limit) plus property and state income tax up to the SALT cap; {owner ? 'selling and renting' : 'the renter'} deducts state income tax up to the cap. The extra deduction is valued at your marginal rate.</p>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-[28rem] text-xs">
                <caption className="text-left text-gray-600 pb-1">Amounts used (married filing jointly). Years after {LATEST_PUBLISHED_TAX_YEAR} are projected with your inflation rate until the IRS publishes them.</caption>
                <thead><tr className="text-gray-600"><th className="pr-4 text-left font-medium">Tax year</th><th className="pr-4 text-right font-medium">Standard deduction</th><th className="pr-4 text-right font-medium">SS wage base</th><th className="text-right font-medium">SALT cap</th></tr></thead>
                <tbody>
                  {Object.keys(TAX_YEARS).map(Number).sort().map(y => (
                    <tr key={y}><td className="pr-4">{y}</td><td className="pr-4 text-right tabular-nums">{formatUSD(TAX_YEARS[y].standardDeduction.mfj)}</td><td className="pr-4 text-right tabular-nums">{formatUSD(TAX_YEARS[y].socialSecurityWageBase)}</td><td className="text-right tabular-nums">{SALT_SCHEDULE[y] ? formatUSD(SALT_SCHEDULE[y].cap) : formatUSD(SALT_CAP_AFTER_SCHEDULE)}</td></tr>
                  ))}
                  {saltYears.filter(y => !TAX_YEARS[y]).map(y => (
                    <tr key={y} className="text-gray-500"><td className="pr-4">{y}</td><td className="pr-4 text-right">projected</td><td className="pr-4 text-right">projected</td><td className="text-right tabular-nums">{formatUSD(SALT_SCHEDULE[y].cap)}</td></tr>
                  ))}
                  <tr className="text-gray-500"><td className="pr-4">{saltYears[saltYears.length - 1] + 1}+</td><td className="pr-4 text-right">projected</td><td className="pr-4 text-right">projected</td><td className="text-right tabular-nums">{formatUSD(SALT_CAP_AFTER_SCHEDULE)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <StateRules inputs={inputs} />
          <div>
            <h3 className="font-semibold text-gray-900">Dollars</h3>
            <p>Amounts are nominal: year-N figures are in dollars of that year. The "today's dollars" figures divide by (1 + inflation)<sup>N</sup>.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Not modelled</h3>
            <ul className="list-disc pl-5">
              {owner
                ? <li>Capital-gains tax on selling the home, now or later: gains above $250,000 ($500,000 married filing jointly) are taxable even when you lived there 2 of the last 5 years. Also the tax on selling the investments. Net worth is before these taxes.</li>
                : <li>Capital-gains tax when selling the home (above the $250k/$500k exclusion) or the investments: net worth is before these taxes.</li>}
              <li>Taxes on rental income and the split of deductions when part of the home is rented out.</li>
              <li>Market volatility (returns and appreciation are constant every year), refinancing, moving again, and {owner ? 'prepayment penalties on paying off the loan' : 'whether a lender would approve the loan'}.</li>
              <li>State itemized deductions (the mortgage interest and property tax many states let you deduct on the state return) and the 37%-bracket limit on federal itemized deductions.</li>
              <li>Local income taxes that only some cities or counties levy, renter credits, and transfer taxes on buying or selling, which vary by state and city (closing and selling costs are your inputs).</li>
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
};

export default HowCalculated;
