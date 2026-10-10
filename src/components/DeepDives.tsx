import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import type { HousingCalculatorInputs } from '../lib/financialCalculations';
import { monthlyCashFlow, Segment } from '../lib/breakdown';
import { SituationWords, wordsFor } from '../lib/situation';
import { formatAxisUSD, formatUSD } from '../lib/format';
import { BUY_COLOR, RENT_COLOR, BUY_TEXT, RENT_TEXT } from '../lib/colors';
import { MortgageAmortizationChart } from './MortgageAmortizationChart';

const SEGMENT_COLORS: Record<string, string> = {
  'Mortgage interest': '#f97316', 'Mortgage principal': '#2563eb', 'Property tax': '#a855f7', 'Mello-Roos': '#c084fc',
  PMI: '#ef4444', Insurance: '#64748b', Maintenance: '#94a3b8', Utilities: '#0ea5e9', HOA: '#f59e0b',
  Rent: '#f97316', 'Living expenses': '#d1d5db', Invested: '#10b981', 'Drawn from savings': '#dc2626',
};

const Bars: React.FC<{ title: string; segments: Segment[]; scale: number; titleClass: string; income: string }> = ({ title, segments, scale, titleClass, income }) => {
  const positive = segments.filter(s => s.value > 0);
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={`text-sm font-semibold ${titleClass}`}>{title}</h3>
        <span className="text-xs text-gray-600">{income}</span>
      </div>
      <div className="mt-1 flex h-6 w-full overflow-hidden rounded" aria-hidden="true">
        {positive.map(s => (
          <div key={s.label} style={{ width: `${(s.value / scale) * 100}%`, backgroundColor: SEGMENT_COLORS[s.label] ?? '#9ca3af' }} title={`${s.label}: ${formatUSD(s.value)}/mo`} />
        ))}
      </div>
      <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
        {segments.map(s => (
          <li key={s.label} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-gray-700">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SEGMENT_COLORS[s.label] ?? '#9ca3af' }} aria-hidden="true" />
              {s.label}
            </span>
            <span className={`tabular-nums ${s.kind === 'drawdown' ? 'text-red-700' : 'text-gray-900'}`}>{formatUSD(s.value)}/mo</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CashFlow: React.FC<{ rows: any[]; year: number; words: SituationWords }> = ({ rows, year, words }) => {
  const y = Math.max(1, year);
  const cf = monthlyCashFlow(rows[y]);
  const scale = Math.max(cf.buyIncome, cf.rentIncome, 1);
  const buyInvest = rows[y].availableMonthlyInvestment, rentInvest = rows[y].availableMonthlyRenterInvestment;
  const diff = buyInvest - rentInvest;
  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-700">
        Monthly cash in year {y}. Take-home pay is the same either way; whatever housing doesn't use is invested.{' '}
        <span className="font-medium">{diff === 0 ? 'Both invest the same amount.' : `${formatUSD(Math.abs(diff))}/mo less is invested ${diff < 0 ? words.own.who : words.rent.who}.`}</span>
        {rows[y].yearlyTaxSavings > 0 || rows[y].renterYearlyTaxSavings > 0 ? ' Tax savings from itemizing are added at year end and are not shown here.' : ''}
      </p>
      <Bars title={words.own.short} segments={cf.buy} scale={scale} titleClass={BUY_TEXT}
        income={`take-home ${formatUSD(rows[y].monthlyTakeHome)}${cf.rentalIncome > 0 ? ` + rental income ${formatUSD(cf.rentalIncome)}` : ''}/mo`} />
      <Bars title={words.rent.short} segments={cf.rent} scale={scale} titleClass={RENT_TEXT} income={`take-home ${formatUSD(rows[y].monthlyTakeHome)}/mo`} />
    </div>
  );
};

const TaxesByYear: React.FC<{ rows: any[]; horizon: number; year: number; words: SituationWords }> = ({ rows, horizon, year, words }) => {
  const data = rows.slice(1, horizon + 1).map((r: any) => ({ year: r.year, buy: r.yearlyTaxSavings, rent: r.renterYearlyTaxSavings }));
  const totalBuy = data.reduce((a, d) => a + d.buy, 0), totalRent = data.reduce((a, d) => a + d.rent, 0);
  const firstZero = data.findIndex((d, i) => i > 0 && d.buy === 0 && data[i - 1].buy > 0);
  return (
    <div>
      <p className="text-sm text-gray-700">
        Extra tax saved by itemizing deductions instead of taking the standard deduction: {formatUSD(totalBuy)} {words.own.who} and {formatUSD(totalRent)} {words.rent.who} over {horizon} years.
        {firstZero > 0 && ` Itemizing stops paying off ${words.own.who} in year ${data[firstZero].year}, when it no longer beats the standard deduction (the SALT cap drops to $10,000 in 2030 under current law).`}
      </p>
      <div className="mt-3 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#4b5563' }} />
            <YAxis tickFormatter={formatAxisUSD} width={56} tick={{ fontSize: 12, fill: '#4b5563' }} />
            <Tooltip formatter={(v: number, name: string) => [formatUSD(v), name]} labelFormatter={(l) => `Year ${l}`} />
            <Legend />
            <ReferenceLine x={Math.max(1, year)} stroke="#6b7280" strokeDasharray="4 4" />
            <Bar dataKey="buy" name={words.own.short} fill={BUY_COLOR} isAnimationActive={false} />
            <Bar dataKey="rent" name={words.rent.short} fill={RENT_COLOR} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

const TABS = [
  { key: 'cash', label: 'Monthly cash flow' },
  { key: 'taxes', label: 'Taxes by year' },
  { key: 'mortgage', label: 'Mortgage' },
] as const;

interface DeepDivesProps {
  rows: any[];
  inputs: HousingCalculatorInputs;
  horizon: number;
  selectedYear: number;
}

export const DeepDives: React.FC<DeepDivesProps> = ({ rows, inputs, horizon, selectedYear }) => {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('cash');
  const words = wordsFor(inputs.situation);
  return (
    <section aria-labelledby="deep-dives-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 id="deep-dives-title" className="text-base font-semibold text-gray-900">Dig deeper</h2>
      <div role="tablist" aria-label="Details" className="mt-3 flex flex-wrap gap-1 border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.key} id={`tab-${t.key}`} role="tab" type="button" aria-selected={tab === t.key} aria-controls={`panel-${t.key}`}
            onClick={() => setTab(t.key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === t.key ? 'border-blue-600 font-medium text-blue-700' : 'border-transparent text-gray-700 hover:text-gray-900'} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
            {t.label}
          </button>
        ))}
      </div>
      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-4">
        {tab === 'cash' && <CashFlow rows={rows} year={selectedYear} words={words} />}
        {tab === 'taxes' && <TaxesByYear rows={rows} horizon={horizon} year={selectedYear} words={words} />}
        {tab === 'mortgage' && <MortgageAmortizationChart projectionData={rows} inputs={inputs} />}
      </div>
    </section>
  );
};

export default DeepDives;
