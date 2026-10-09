import React, { useState } from 'react';
import { formatInputNumber } from '../lib/format';
import type { Unit } from '../lib/fields';

const PREFIX: Partial<Record<Unit, string>> = { usd: '$', usdPerMonth: '$' };
const SUFFIX: Partial<Record<Unit, string>> = { usdPerMonth: '/mo', percent: '%', percentPerYear: '%/yr', years: 'yrs' };

export const parseTyped = (text: string): number | null => {
  const cleaned = text.replace(/[$,%\s]/g, '').replace(/\/(mo|yr)$/i, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

interface NumberFieldProps {
  id: string;
  value: number;
  onCommit: (value: number) => void;
  unit?: Unit;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}

// Typed number entry. Keeps the draft text while editing and commits only on
// blur or Enter (partial input like "", "-" or "1." never reaches the engine);
// Escape reverts.
export const NumberField: React.FC<NumberFieldProps> = ({ id, value, onCommit, unit, ariaLabel, ariaDescribedBy, className = '' }) => {
  const [draft, setDraft] = useState<string | null>(null);
  const prefix = unit ? PREFIX[unit] : undefined;
  const suffix = unit ? SUFFIX[unit] : undefined;

  const commit = () => {
    if (draft === null) return;
    const parsed = parseTyped(draft);
    if (parsed !== null && parsed !== value) onCommit(parsed);
    setDraft(null);
  };

  return (
    <div className={`flex items-center rounded-md border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${className}`}>
      {prefix && <span className="pl-2 text-gray-500 text-sm select-none" aria-hidden="true">{prefix}</span>}
      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        value={draft ?? formatInputNumber(value)}
        onFocus={(e) => { setDraft(String(value)); e.currentTarget.select(); }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { commit(); setDraft(null); }
          if (e.key === 'Escape') setDraft(null);
        }}
        className="w-full min-w-0 bg-transparent px-2 py-1.5 text-sm text-gray-900 tabular-nums focus:outline-none"
      />
      {suffix && <span className="pr-2 text-gray-500 text-sm select-none whitespace-nowrap" aria-hidden="true">{suffix}</span>}
    </div>
  );
};

export default NumberField;
