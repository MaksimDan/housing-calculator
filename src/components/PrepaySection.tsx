import React, { useMemo, useState } from 'react';
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ReferenceDot, ResponsiveContainer } from 'recharts';
import type { HousingCalculatorInputs } from '../lib/financialCalculations';
import { startingPosition } from '../lib/financialCalculations';
import { wordsFor } from '../lib/situation';
import { evaluatePrepay, breakEvenReturn, tieBand, PREPAY_AMOUNTS } from '../lib/prepay';
import { formatAxisUSD, formatUSD } from '../lib/format';
import type { InputKey } from '../lib/fields';
import { NumberField } from './NumberField';

interface PrepaySectionProps {
  inputs: HousingCalculatorInputs;
  rows: any[] | null; // null when the comparison can't run (e.g. the purchase isn't affordable)
  horizon: number;
  focusField: (key: InputKey) => void;
}

// "If you buy (or keep it): prepay or invest?" on the same inputs as the main
// comparison. Extra payments are limited to what the owning path has left over
// each month, and a plan that would run savings below zero is never recommended.
export const PrepaySection: React.FC<PrepaySectionProps> = ({ inputs, rows, horizon, focusField }) => {
  const owner = inputs.situation === 'owner';
  const words = wordsFor(inputs.situation);
  const loan = startingPosition(inputs).loanAmount;
  const surplus = rows ? Math.max(0, Math.floor(rows[1].availableMonthlyInvestment / 50) * 50) : 0;
  const [requested, setRequested] = useState(1000);
  const extra = Math.max(0, Math.min(requested, surplus));

  const analysis = useMemo(() => {
    if (!rows || loan <= 0 || surplus <= 0) return null;
    const grid = PREPAY_AMOUNTS.filter(a => a <= surplus).concat(surplus, extra);
    const evaluated = evaluatePrepay(inputs, horizon, grid);
    const standard = evaluated.find(r => r.extra === 0)!;
    const chosen = evaluated.find(r => r.extra === extra)!;
    const affordable = evaluated.filter(r => r.affordable);
    const best = affordable.reduce((a, b) => (b.finalNetWorth > a.finalNetWorth ? b : a), standard);
    return { evaluated, standard, chosen, best, band: tieBand(standard.finalNetWorth), breakEven: breakEvenReturn(inputs, horizon, Math.max(extra, 100)) };
  }, [inputs, rows, horizon, loan, surplus, extra]);

  const netReturn = inputs.investmentReturn - inputs.annualInvestmentTaxDrag;
  const using: { key: InputKey; text: string }[] = [
    { key: owner ? 'mortgageBalance' : 'homePrice', text: `${formatUSD(loan)} loan` },
    { key: 'effectiveMortgageRate', text: `${inputs.effectiveMortgageRate}%` },
    { key: 'mortgageYears', text: `${inputs.mortgageYears} yrs${owner ? ' left' : ''}` },
    { key: 'investmentReturn', text: `${inputs.investmentReturn}% return − ${inputs.annualInvestmentTaxDrag}% drag` },
    { key: 'xAxisYears', text: `compared after ${horizon} yrs` },
  ];

  let body: React.ReactNode;
  if (!rows) {
    body = <p className="text-sm text-gray-700">{owner
      ? 'Resolve the problem above first: with the current inputs, selling needs more cash than you have.'
      : "Resolve the cash check above first: this purchase isn't affordable with the current inputs."}</p>;
  } else if (loan <= 0) {
    body = <p className="text-sm text-gray-700">{owner ? 'No mortgage: your home is paid off, so there is nothing to prepay.' : 'No mortgage: with a 100% down payment there is nothing to prepay.'}</p>;
  } else if (surplus <= 0 || !analysis) {
    body = <p className="text-sm text-gray-700">In year 1 nothing is left over after housing and living costs, so there is no extra cash to put toward the mortgage.</p>;
  } else {
    const { standard, chosen, best, band, breakEven, evaluated } = analysis;
    const delta = chosen.delta;
    const tied = Math.abs(delta) < band;
    const interestSaved = standard.totalInterestPaid - chosen.totalInterestPaid;
    const deductionLost = standard.taxSavings - chosen.taxSavings;
    const sentence = extra === 0
      ? 'Set an extra monthly amount to compare.'
      : tied
        ? `Effectively a tie: prepaying ${formatUSD(extra)}/mo changes net worth by ${formatUSD(delta)} after ${horizon} years (within ${formatUSD(band)}).`
        : delta < 0
          ? `Investing the extra ${formatUSD(extra)}/mo instead of prepaying leaves you ${formatUSD(-delta)} richer after ${horizon} years.`
          : `Prepaying ${formatUSD(extra)}/mo leaves you ${formatUSD(delta)} richer after ${horizon} years than investing it.`;
    const chartData = evaluated.filter((r, i, a) => a.findIndex(x => x.extra === r.extra) === i).map(r => ({ extra: r.extra, delta: r.delta }));
    body = (
      <>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <label htmlFor="prepay-extra" className="text-sm font-medium text-gray-800">Extra toward the mortgage</label>
          <NumberField id="prepay-extra" value={extra} onCommit={(v) => setRequested(Math.max(0, v))} unit="usdPerMonth" className="w-36" ariaDescribedBy="prepay-extra-hint" />
          <input type="range" tabIndex={-1} aria-hidden="true" min={0} max={surplus} step={50} value={extra}
            onChange={(e) => setRequested(Number(e.target.value))} className="flex-1 min-w-[10rem]" />
          <span id="prepay-extra-hint" className="text-xs text-gray-600">$0 … {formatUSD(surplus)} (what's left over each month in year 1)</span>
        </div>

        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4" role="status" aria-live="polite">
          <p className="text-base font-semibold text-gray-900">{sentence}</p>
          {extra > 0 && (
            <p className="mt-1 text-sm text-gray-700">
              Prepaying: mortgage paid off in year {chosen.payoffYear} (instead of {standard.payoffYear}) · {formatUSD(interestSaved)} less interest · {formatUSD(deductionLost)} less in deduction savings (years 1–{horizon}).
            </p>
          )}
          {!chosen.affordable && <p className="mt-1 text-sm text-amber-800">This amount runs your savings below zero in some year, so it isn't a realistic plan.</p>}
          <p className="mt-2 text-sm text-gray-700">
            Why: the mortgage costs {inputs.effectiveMortgageRate}% (guaranteed) while investments are expected to earn {Number(netReturn.toFixed(2))}% after tax drag (not guaranteed).
            {breakEven !== null && ` Prepaying comes out ahead only if returns are below about ${breakEven.toFixed(1)}%.`}
          </p>
          {best.extra !== extra && Math.abs(best.delta - delta) >= band && (
            <p className="mt-1 text-sm text-gray-700">Highest net worth among affordable amounts: {best.extra === 0 ? 'no extra payments' : `${formatUSD(best.extra)}/mo`}.</p>
          )}
        </div>

        <div className="mt-4 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 16 }} accessibilityLayer>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="extra" type="number" domain={[0, surplus]} tickFormatter={formatAxisUSD} tick={{ fontSize: 12, fill: '#4b5563' }}
                label={{ value: 'Extra per month', position: 'insideBottom', offset: -8, fontSize: 12, fill: '#4b5563' }} />
              <YAxis tickFormatter={formatAxisUSD} width={64} tick={{ fontSize: 12, fill: '#4b5563' }} />
              <Tooltip formatter={(v: number) => [formatUSD(v), 'Net worth vs standard payments']} labelFormatter={(l) => `${formatUSD(Number(l))}/mo extra`} />
              <ReferenceArea y1={-band} y2={band} fill="#e5e7eb" fillOpacity={0.6} />
              <ReferenceLine y={0} stroke="#374151" strokeWidth={2} />
              <Line type="monotone" dataKey="delta" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2 }} isAnimationActive={false} />
              <ReferenceDot x={extra} y={delta} r={5} fill="#7c3aed" stroke="white" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-gray-600">Net worth after {horizon} years compared with standard payments; the grey band counts as a tie.</p>

        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-blue-700">See all amounts</summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[36rem] text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-600">
                  <th scope="col" className="py-1.5 pr-3 text-left font-medium">Extra/mo</th>
                  <th scope="col" className="py-1.5 px-3 text-right font-medium">Net worth after {horizon} yrs</th>
                  <th scope="col" className="py-1.5 px-3 text-right font-medium">vs standard</th>
                  <th scope="col" className="py-1.5 px-3 text-right font-medium">Paid off (year)</th>
                  <th scope="col" className="py-1.5 pl-3 text-right font-medium">Interest, yrs 1–{horizon}</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map(({ extra: x }) => {
                  const r = evaluated.find(e => e.extra === x)!;
                  return (
                    <tr key={x} className={r.affordable ? '' : 'text-gray-400'}>
                      <td className="py-1 pr-3">{x === 0 ? 'Standard' : formatUSD(x)}{r.extra === best.extra && <span className="ml-1 rounded bg-green-100 px-1 text-xs text-green-800">highest</span>}{!r.affordable && ' (not affordable)'}</td>
                      <td className="py-1 px-3 text-right tabular-nums">{formatUSD(r.finalNetWorth)}</td>
                      <td className="py-1 px-3 text-right tabular-nums">{x === 0 ? '—' : formatUSD(r.delta)}</td>
                      <td className="py-1 px-3 text-right tabular-nums">{r.payoffYear}</td>
                      <td className="py-1 pl-3 text-right tabular-nums">{formatUSD(r.totalInterestPaid)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-gray-600">Standard = your {words.own.short} result ({formatUSD(standard.finalNetWorth)}). Net worth is before taxes on selling.</p>
          </div>
        </details>
      </>
    );
  }

  return (
    <section id="prepay" aria-labelledby="prepay-title" className="scroll-mt-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 id="prepay-title" className="text-base font-semibold text-gray-900">{words.ifOwning}: pay the mortgage off faster, or invest?</h2>
      <p className="mt-1 text-sm text-gray-700">
        Using your inputs:{' '}
        {using.map((u, i) => (
          <React.Fragment key={u.key}>
            {i > 0 && ' · '}
            <button type="button" onClick={() => focusField(u.key)} className="underline decoration-dotted underline-offset-2 hover:text-gray-900">{u.text}</button>
          </React.Fragment>
        ))}
      </p>
      {body}
    </section>
  );
};

export default PrepaySection;
