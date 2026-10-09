import React from 'react';
import { TAX_YEARS, SALT_SCHEDULE, SALT_CAP_AFTER_SCHEDULE, LATEST_PUBLISHED_TAX_YEAR } from '../lib/taxLaw';
import { formatUSD } from '../lib/format';

export const HowCalculated: React.FC = () => {
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
            <p>Two households start with the same savings and the same take-home pay. The <span className="text-blue-700">buyer</span> pays the down payment and closing costs, then the mortgage and the costs of owning; the <span className="text-emerald-700">renter</span> pays rent and keeps the rest invested. Each month, whatever housing and living costs don't use is invested (or drawn from savings when costs exceed pay). Net worth is investments plus home equity (minus selling costs when you count them) for the buyer, and investments plus the security deposit for the renter.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Timing</h3>
            <p>Each year's costs are charged at that year's levels (year 1 uses the amounts you enter), and growth and inflation apply at each year boundary. Balances are reported at the end of each year. Mortgage payments and PMI are charged in the exact months they are owed. Investments compound monthly at the return minus tax drag. Tax savings from itemizing are added to investments at the end of each year.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Taxes</h3>
            <p>Take-home pay deducts federal and state income tax at your effective rates, plus Social Security and Medicare. Each year both households itemize only if their deductions beat the standard deduction: the buyer deducts mortgage interest (prorated above the debt limit) plus property and state income tax up to the SALT cap; the renter deducts state income tax up to the cap. The extra deduction is valued at your marginal rate.</p>
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
          <div>
            <h3 className="font-semibold text-gray-900">Dollars</h3>
            <p>Amounts are nominal: year-N figures are in dollars of that year. The "today's dollars" figures divide by (1 + inflation)<sup>N</sup>.</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Not modelled</h3>
            <ul className="list-disc pl-5">
              <li>Capital-gains tax when selling the home (above the $250k/$500k exclusion) or the investments: net worth is before these taxes.</li>
              <li>Taxes on rental income and the split of deductions when part of the home is rented out.</li>
              <li>Market volatility (returns and appreciation are constant every year), refinancing, moving again, and whether a lender would approve the loan.</li>
              <li>State itemized deductions and the 37%-bracket limit on itemized deductions.</li>
            </ul>
          </div>
        </div>
      </details>
    </section>
  );
};

export default HowCalculated;
