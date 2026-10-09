import React, { useState } from 'react';
import { Info, RotateCcw } from 'lucide-react';
import type { HousingCalculatorInputs } from '../lib/financialCalculations';
import { FieldDef, fieldHelp, fieldId } from '../lib/fields';
import { NumberField } from './NumberField';
import { Toggle } from './Toggle';

interface FieldRowProps {
  def: FieldDef;
  inputs: HousingCalculatorInputs;
  onChange: (value: any) => void;
  onReset?: () => void;
  changed?: boolean;
  showSlider?: boolean;
  note?: React.ReactNode; // e.g. the value at which the verdict flips
  extra?: React.ReactNode; // e.g. quick-pick buttons
}

// One labelled input: typed field (plus an optional slider for quick
// exploration), inline help, a live hint, and a changed marker with reset.
export const FieldRow: React.FC<FieldRowProps> = ({ def, inputs, onChange, onReset, changed, showSlider, note, extra }) => {
  const [helpOpen, setHelpOpen] = useState(false);
  const id = fieldId(def.key);
  const helpId = `${id}-help`;
  const hintId = `${id}-hint`;
  const value = inputs[def.key] as any;
  const hint = def.hint ? def.hint(inputs) : null;
  const describedBy = [hint || note ? hintId : null, helpOpen ? helpId : null].filter(Boolean).join(' ') || undefined;

  const infoButton = (
    <button
      type="button"
      aria-expanded={helpOpen}
      aria-controls={helpId}
      aria-label={`About ${def.label}`}
      onClick={() => setHelpOpen(o => !o)}
      className="rounded p-0.5 text-gray-500 hover:text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <Info className="w-4 h-4" aria-hidden="true" />
    </button>
  );

  const changedMarker = changed && onReset ? (
    <button
      type="button"
      onClick={onReset}
      title="Reset to default"
      aria-label={`Reset ${def.label} to default`}
      className="ml-auto flex items-center gap-1 rounded px-1 text-xs text-amber-700 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden="true" />
      <RotateCcw className="w-3 h-3" aria-hidden="true" />
    </button>
  ) : null;

  const help = helpOpen ? (
    <p id={helpId} className="mt-1 rounded bg-gray-50 p-2 text-xs leading-relaxed text-gray-700">{fieldHelp(def, inputs)}</p>
  ) : null;

  if (def.unit === 'toggle') {
    return (
      <div className="py-1">
        <div className="flex items-center gap-1">
          <Toggle id={id} checked={!!value} onChange={onChange} label={def.label} describedBy={describedBy} />
          {infoButton}
          {changedMarker}
        </div>
        {help}
      </div>
    );
  }

  const soft = def.soft;
  const sliderValue = soft ? Math.min(soft.max, Math.max(soft.min, value)) : value;

  return (
    <div className="py-1">
      <div className="flex items-center gap-1">
        <label htmlFor={id} className="text-sm font-medium text-gray-800">{def.label}</label>
        {infoButton}
        {changedMarker}
      </div>
      {def.unit === 'count' ? (
        <div role="group" aria-labelledby={id} className="mt-1 inline-flex rounded-md border border-gray-300 overflow-hidden">
          {Array.from({ length: (soft?.max ?? 2) - (soft?.min ?? 1) + 1 }, (_, i) => (soft?.min ?? 1) + i).map((n, i) => (
            <button
              key={n}
              id={i === 0 ? id : undefined}
              type="button"
              aria-pressed={value === n}
              onClick={() => onChange(n)}
              className={`px-3 py-1 text-sm ${value === n ? 'bg-blue-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
            >
              {n}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex items-center gap-2">
          <NumberField id={id} value={value} onCommit={onChange} unit={def.unit} ariaDescribedBy={describedBy} className="w-36 flex-shrink-0" />
          {extra}
        </div>
      )}
      {showSlider && soft && def.unit !== 'count' && (
        // Mouse/touch shortcut only: it writes a value only when dragged, and
        // keyboard users use the typed field (so it is skipped in tab order).
        <input
          type="range"
          tabIndex={-1}
          aria-hidden="true"
          min={soft.min}
          max={soft.max}
          step={soft.step}
          value={sliderValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="mt-2"
        />
      )}
      {(hint || note) && (
        <p id={hintId} className="mt-1 text-xs text-gray-600">
          {hint}{hint && note ? ' · ' : ''}{note}
        </p>
      )}
      {help}
    </div>
  );
};

export default FieldRow;
