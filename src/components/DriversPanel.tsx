import React, { useState } from 'react';
import type { HousingCalculatorInputs } from '../lib/financialCalculations';
import type { FlipThreshold } from '../lib/thresholds';
import { FIELD_BY_KEY, InputKey } from '../lib/fields';
import { FieldRow } from './FieldRow';
import { formatThresholdValue } from './VerdictHero';

// Shown first on phones; the rest sit behind "more drivers"
const ORDER: InputKey[] = ['homePrice', 'downPaymentPercent', 'effectiveMortgageRate', 'monthlyRent', 'investmentReturn', 'rentIncrease', 'homeAppreciation'];
const ALWAYS_VISIBLE = 5;

interface DriversPanelProps {
  inputs: HousingCalculatorInputs;
  thresholds: FlipThreshold[];
  setInput: (key: InputKey, value: unknown) => void;
  changedKeys: InputKey[];
  resetField: (key: InputKey) => void;
  otherCount: number;
  openAssumptions: () => void;
}

// The inputs that move the buy-vs-rent result most, measured with the engine
export const DriversPanel: React.FC<DriversPanelProps> = ({ inputs, thresholds, setInput, changedKeys, resetField, otherCount, openAssumptions }) => {
  const [showMore, setShowMore] = useState(false);
  return (
    <section aria-labelledby="drivers-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <h2 id="drivers-title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">What drives this</h2>
      <div className="mt-2 space-y-2">
        {ORDER.map((key, i) => {
          const t = thresholds.find(x => x.key === key);
          const note = t ? `flips ${t.direction === 'below' ? 'below' : 'above'} ${formatThresholdValue(key, t.value)}` : undefined;
          return (
            <div key={key} className={i >= ALWAYS_VISIBLE && !showMore ? 'hidden lg:block' : ''}>
              <FieldRow
                def={FIELD_BY_KEY[key]}
                inputs={inputs}
                onChange={(v) => setInput(key, v)}
                changed={changedKeys.includes(key)}
                onReset={() => resetField(key)}
                showSlider
                note={note}
                extra={key === 'investmentReturn' ? (
                  <div className="flex gap-1" role="group" aria-label="Quick picks for investment return">
                    {[5, 7, 10].map(r => (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={inputs.investmentReturn === r}
                        onClick={() => setInput('investmentReturn', r)}
                        className={`rounded-full border px-2 py-0.5 text-xs ${inputs.investmentReturn === r ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-50'} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                ) : undefined}
              />
            </div>
          );
        })}
      </div>
      {!showMore && (
        <button type="button" onClick={() => setShowMore(true)} className="mt-2 text-sm text-blue-700 underline lg:hidden">
          {ORDER.length - ALWAYS_VISIBLE} more drivers
        </button>
      )}
      <button
        type="button"
        onClick={openAssumptions}
        className="mt-3 block text-sm font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
      >
        All {otherCount} other assumptions ↓
      </button>
    </section>
  );
};

export default DriversPanel;
