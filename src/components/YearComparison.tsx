import React, { useState } from 'react';
import { formatUSD, formatSignedUSD } from '../lib/format';
import { netWorthParts } from '../lib/breakdown';
import { BUY_TEXT, RENT_TEXT } from '../lib/colors';

interface YearComparisonProps {
  rows: any[];
  horizon: number;
  selectedYear: number;
  onSelectYear: (year: number) => void;
  calendarYear: (year: number) => number;
  inflationRate: number;
  includeSellingCosts: boolean;
}

const diffClass = (d: number) => (d > 0 ? BUY_TEXT : d < 0 ? RENT_TEXT : 'text-gray-700');
const diffText = (d: number) => (d > 0 ? `Buy ${formatSignedUSD(d)}` : d < 0 ? `Rent +${formatUSD(-d)}` : '$0');

// Buy | Rent | Difference for the selected year, with an all-years table.
// The parts are the engine's own fields and are checked to add up.
export const YearComparison: React.FC<YearComparisonProps> = ({ rows, horizon, selectedYear, onSelectYear, calendarYear, inflationRate, includeSellingCosts }) => {
  const [allYears, setAllYears] = useState(false);
  const row = rows[selectedYear];
  const flowRow = rows[Math.max(1, selectedYear)] ?? row;
  const flowYear = Math.max(1, selectedYear);
  const parts = netWorthParts(row);
  const buySum = parts.buy.reduce((a, p) => a + p.value, 0);
  const rentSum = parts.rent.reduce((a, p) => a + p.value, 0);
  const balanced = Math.abs(buySum - row.buying) <= 2 && Math.abs(rentSum - row.renting) <= 2;
  const deflator = Math.pow(1 + inflationRate / 100, selectedYear);

  const line = (label: string, buy: number | null, rent: number | null, opts: { bold?: boolean; diff?: boolean; note?: string } = {}) => (
    <tr className={opts.bold ? 'border-t border-gray-300 font-semibold' : ''}>
      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-gray-700">{label}{opts.note && <span className="block text-xs text-gray-500">{opts.note}</span>}</th>
      <td className="py-1.5 px-3 text-right tabular-nums">{buy === null ? '—' : formatUSD(buy)}</td>
      <td className="py-1.5 px-3 text-right tabular-nums">{rent === null ? '—' : formatUSD(rent)}</td>
      <td className={`py-1.5 pl-3 text-right tabular-nums ${opts.diff && buy !== null && rent !== null ? diffClass(buy - rent) : 'text-gray-400'}`}>
        {opts.diff && buy !== null && rent !== null ? diffText(buy - rent) : ''}
      </td>
    </tr>
  );

  return (
    <section id="year-table" aria-labelledby="year-table-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="year-table-title" className="text-base font-semibold text-gray-900">
          Year {selectedYear}, side by side <span className="text-sm font-normal text-gray-600">({calendarYear(selectedYear)} dollars)</span>
        </h2>
        <button type="button" aria-expanded={allYears} onClick={() => setAllYears(a => !a)} className="text-sm text-blue-700 hover:underline">
          {allYears ? 'Hide all years' : 'All years'}
        </button>
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-600">
              <th scope="col" className="py-1.5 pr-3 text-left font-medium"><span className="sr-only">Item</span></th>
              <th scope="col" className={`py-1.5 px-3 text-right font-medium ${BUY_TEXT}`}>Buy</th>
              <th scope="col" className={`py-1.5 px-3 text-right font-medium ${RENT_TEXT}`}>Rent</th>
              <th scope="col" className="py-1.5 pl-3 text-right font-medium">Difference</th>
            </tr>
          </thead>
          <tbody>
            {line('Home value', row.homeValue, null)}
            {line('Mortgage left', -row.remainingLoan, null, { note: 'Home equity = home value − mortgage left' })}
            {line('Investments', row.investmentsBuying, row.investmentsRenting, { diff: true })}
            {line('Security deposit', null, row.renting - row.investmentsRenting)}
            {includeSellingCosts && line('Selling costs', -row.sellingCosts, null)}
            {line('Net worth', row.buying, row.renting, { bold: true, diff: true })}
            <tr>
              <td colSpan={4} className="pt-1 text-xs text-gray-600">
                ≈ {formatUSD(row.buying / deflator)} vs {formatUSD(row.renting / deflator)} in today's dollars ·{' '}
                {balanced ? 'parts add up to net worth ✓' : 'parts do not add up'} · before taxes on selling the home or investments
              </td>
            </tr>
            <tr><th colSpan={4} scope="rowgroup" className="pt-4 pb-1 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">During year {flowYear}</th></tr>
            {line('Housing cost per month', flowRow.monthlyPayment, flowRow.annualRentCosts / 12, { diff: false, note: 'Buy: mortgage, taxes, insurance, maintenance, PMI, utilities, HOA, less rental income' })}
            {line('Invested per month', flowRow.availableMonthlyInvestment, flowRow.availableMonthlyRenterInvestment, { diff: true })}
            {line('Tax saved by itemizing', flowRow.yearlyTaxSavings, flowRow.renterYearlyTaxSavings, { diff: true, note: 'Credited to investments at year end' })}
          </tbody>
        </table>
      </div>
      {allYears && (
        <div className="mt-4 max-h-96 overflow-auto rounded border border-gray-200">
          <table className="w-full min-w-[28rem] text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="text-xs uppercase tracking-wide text-gray-600">
                <th scope="col" className="px-3 py-1.5 text-left font-medium">Year</th>
                <th scope="col" className={`px-3 py-1.5 text-right font-medium ${BUY_TEXT}`}>Buy</th>
                <th scope="col" className={`px-3 py-1.5 text-right font-medium ${RENT_TEXT}`}>Rent</th>
                <th scope="col" className="px-3 py-1.5 text-right font-medium">Difference</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, horizon + 1).map((r: any) => {
                const d = r.buying - r.renting;
                return (
                  <tr key={r.year} className={r.year === selectedYear ? 'bg-blue-50' : 'hover:bg-gray-50'}>
                    <th scope="row" className="px-3 py-1 text-left font-normal">
                      <button type="button" onClick={() => onSelectYear(r.year)} className="text-blue-700 hover:underline" aria-label={`Select year ${r.year}`}>{r.year}</button>
                    </th>
                    <td className="px-3 py-1 text-right tabular-nums">{formatUSD(r.buying)}</td>
                    <td className="px-3 py-1 text-right tabular-nums">{formatUSD(r.renting)}</td>
                    <td className={`px-3 py-1 text-right tabular-nums ${diffClass(d)}`}>{diffText(d)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default YearComparison;
