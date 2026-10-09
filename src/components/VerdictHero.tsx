import React, { forwardRef, useState } from 'react';
import type { HousingCalculatorInputs } from '../lib/financialCalculations';
import type { Verdict } from '../lib/verdict';
import type { FlipThreshold } from '../lib/thresholds';
import type { CashCheck } from '../lib/cashCheck';
import { FIELD_BY_KEY, InputKey } from '../lib/fields';
import { formatCompactUSD, formatUSD } from '../lib/format';
import { BUY_TEXT, RENT_TEXT } from '../lib/colors';
import { NumberField } from './NumberField';
import { Toggle } from './Toggle';
import { FieldRow } from './FieldRow';

const HORIZONS = [5, 10, 15, 20, 30];

export const formatThresholdValue = (key: InputKey, value: number) => {
  const unit = FIELD_BY_KEY[key].unit;
  if (unit === 'usd') return formatUSD(Math.round(value / 1000) * 1000);
  if (unit === 'usdPerMonth') return `${formatUSD(value)}/mo`;
  return `${Number(value.toFixed(2))}%`;
};
export const formatInputValue = (key: InputKey, value: number) => {
  const unit = FIELD_BY_KEY[key].unit;
  if (unit === 'usd') return formatUSD(value);
  if (unit === 'usdPerMonth') return `${formatUSD(value)}/mo`;
  return `${value}%`;
};

const SHORT: Partial<Record<InputKey, string>> = {
  investmentReturn: 'return', monthlyRent: 'rent', homePrice: 'price', homeAppreciation: 'appreciation',
  rentIncrease: 'rent increase', effectiveMortgageRate: 'mortgage rate',
};

interface VerdictHeroProps {
  verdict: Verdict;
  inputs: HousingCalculatorInputs;
  thresholds: FlipThreshold[];
  sellingCostFlip: { gap: number } | null;
  cashCheck: CashCheck;
  showExampleNotice: boolean;
  setInput: (key: InputKey, value: unknown) => void;
  focusField: (key: InputKey) => void;
  changedKeys: InputKey[];
  resetField: (key: InputKey) => void;
}

// The answer, first: who comes out ahead, by how much, why it might flip,
// and the two choices that most change it (how long you stay, selling costs).
export const VerdictHero = forwardRef<HTMLElement, VerdictHeroProps>(({
  verdict, inputs, thresholds, sellingCostFlip, cashCheck, showExampleNotice, setInput, focusField, changedKeys, resetField,
}, ref) => {
  const [showFinances, setShowFinances] = useState(false);
  const [showCashDetails, setShowCashDetails] = useState(false);
  const winnerClass = verdict.winner === 'buy' ? BUY_TEXT : verdict.winner === 'rent' ? RENT_TEXT : 'text-gray-900';
  const other = verdict.winner === 'buy' ? 'Renting' : 'Buying';
  const top = thresholds.slice(0, 3);
  const nearest = top[0] ? Math.abs(top[0].value - (inputs[top[0].key] as number)) / Math.max(Math.abs(inputs[top[0].key] as number), 1) : Infinity;
  const custom = !HORIZONS.includes(inputs.xAxisYears);
  const cashOk = cashCheck.tests.every(t => t.pass) && cashCheck.warnings.length === 0;

  return (
    <section ref={ref} aria-labelledby="verdict-headline" className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
      <div role="status" aria-live="polite">
        <h2 id="verdict-headline" className={`text-2xl sm:text-3xl font-semibold leading-tight ${winnerClass}`}>
          {verdict.headline}
        </h2>
      </div>
      <p className="mt-2 text-sm text-gray-700">
        {verdict.winner !== 'tie' && Number.isFinite(verdict.gapPctOfLoser) && <>{verdict.gapPctOfLoser.toFixed(1)}% more net worth · </>}
        in {verdict.calendarYear} dollars (≈ {formatCompactUSD(verdict.todayGap)} in today's dollars) · {verdict.story}
      </p>
      {verdict.winner !== 'tie' && top.length > 0 && (
        <p className="mt-2 text-sm text-gray-700">
          <span className="font-medium">{nearest < 0.2 ? 'Close call: ' : ''}{other} would win if </span>
          {top.map((t, i) => (
            <React.Fragment key={t.key}>
              {i > 0 && ' · '}
              <button
                type="button"
                onClick={() => focusField(t.key)}
                className="underline decoration-dotted underline-offset-2 hover:text-gray-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {SHORT[t.key] ?? FIELD_BY_KEY[t.key].label.toLowerCase()} {t.direction === 'below' ? '<' : '>'} {formatThresholdValue(t.key, t.value)}
              </button>
              <span className="text-gray-500"> (you: {formatInputValue(t.key, inputs[t.key] as number)})</span>
            </React.Fragment>
          ))}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-labelledby="stay-label">
          <span id="stay-label" className="text-sm font-medium text-gray-800">How long will you stay?</span>
          {HORIZONS.map(h => (
            <button
              key={h}
              type="button"
              aria-pressed={inputs.xAxisYears === h}
              onClick={() => setInput('xAxisYears', h)}
              className={`min-w-[2.75rem] rounded-md border px-2.5 py-1.5 text-sm ${inputs.xAxisYears === h ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 bg-white text-gray-800 hover:bg-gray-50'} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1`}
            >
              {h}
            </button>
          ))}
          <NumberField
            id="field-xAxisYears"
            value={inputs.xAxisYears}
            onCommit={(v) => setInput('xAxisYears', v)}
            unit="years"
            ariaLabel="Years you will stay (custom)"
            className={`w-24 ${custom ? 'ring-2 ring-blue-600' : ''}`}
          />
        </div>
        <Toggle
          id="field-includeSellingCosts"
          checked={inputs.includeSellingCosts}
          onChange={(v) => setInput('includeSellingCosts', v)}
          label={`Count selling costs (${inputs.sellingCostPercent}%)`}
        />
      </div>
      {sellingCostFlip && (
        <p className="mt-2 text-sm text-amber-800">
          Counting selling costs ({inputs.sellingCostPercent}%) would flip this: {sellingCostFlip.gap > 0 ? 'buying' : 'renting'} would be ahead by {formatUSD(Math.abs(sellingCostFlip.gap))} after {verdict.horizon} years.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-start gap-2 text-sm">
        {showExampleNotice && (
          <button
            type="button"
            aria-expanded={showFinances}
            onClick={() => setShowFinances(s => !s)}
            className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-gray-700 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            Example household: {formatCompactUSD(inputs.initialInvestment)} saved, {formatCompactUSD(inputs.annualSalaryBeforeTax)} income · <span className="font-medium text-blue-700">Enter yours</span>
          </button>
        )}
        <button
          type="button"
          aria-expanded={showCashDetails}
          onClick={() => setShowCashDetails(s => !s)}
          className={`rounded-full border px-3 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${cashOk ? 'border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100' : 'border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100'}`}
        >
          {cashOk ? '✓ Cash check' : `⚠ Cash check: ${cashCheck.warnings.length} warning${cashCheck.warnings.length === 1 ? '' : 's'}`}
        </button>
      </div>
      {showFinances && (
        <div className="mt-3 grid gap-x-6 sm:grid-cols-3">
          {(['initialInvestment', 'annualSalaryBeforeTax', 'monthlyMiscExpenses'] as InputKey[]).map(key => (
            <FieldRow
              key={key}
              def={FIELD_BY_KEY[key]}
              inputs={inputs}
              onChange={(v) => setInput(key, v)}
              changed={changedKeys.includes(key)}
              onReset={() => resetField(key)}
            />
          ))}
        </div>
      )}
      {showCashDetails && (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm text-gray-700">
          <ul className="space-y-1">
            {cashCheck.tests.map(t => <li key={t.label}>{t.pass ? '✓' : '✕'} <span className="font-medium">{t.label}:</span> {t.detail}</li>)}
            {cashCheck.warnings.map(w => <li key={w} className="text-amber-900">⚠ {w}</li>)}
          </ul>
          <p className="mt-2 text-xs text-gray-600">This checks cash flow only, not whether a lender would approve the loan or what reserves you should keep.</p>
        </div>
      )}
    </section>
  );
});
VerdictHero.displayName = 'VerdictHero';

export default VerdictHero;
