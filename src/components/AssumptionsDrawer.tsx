import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HousingCalculatorInputs } from '../lib/financialCalculations';
import { FIELDS, GROUPS, InputKey, FIELD_BY_KEY } from '../lib/fields';
import { FieldRow } from './FieldRow';
import { Toggle } from './Toggle';

const FILING_LABELS: Record<string, string> = { mfj: 'Married filing jointly', single: 'Single', hoh: 'Head of household', mfs: 'Married filing separately' };

interface AssumptionsDrawerProps {
  inputs: HousingCalculatorInputs;
  open: boolean;
  setOpen: (open: boolean) => void;
  setInput: (key: InputKey, value: unknown) => void;
  setMany: (values: Partial<HousingCalculatorInputs>) => void;
  changedKeys: InputKey[];
  resetField: (key: InputKey) => void;
}

// Every input that isn't a driver, grouped by the question it answers
export const AssumptionsDrawer: React.FC<AssumptionsDrawerProps> = ({ inputs, open, setOpen, setInput, setMany, changedKeys, resetField }) => {
  const [rentUtilitiesDiffer, setRentUtilitiesDiffer] = useState(inputs.monthlyRentUtilities !== inputs.monthlyPropertyUtilities);
  const fields = FIELDS.filter(f => !f.driver && f.group !== 'view');
  const changedHere = changedKeys.filter(k => fields.some(f => f.key === k)).length;
  const summary = [
    `Stay ${inputs.xAxisYears} yrs`,
    `return ${inputs.investmentReturn}%`,
    `appreciation ${inputs.homeAppreciation}%`,
    `rent +${inputs.rentIncrease}%/yr`,
    `selling costs ${inputs.includeSellingCosts ? `${inputs.sellingCostPercent}%` : 'off'}`,
    `${FILING_LABELS[inputs.filingStatus]} ${inputs.firstTaxYear}`,
    inputs.useMarginalTaxRate ? `${inputs.marginalFederalTaxRate}% marginal` : `${inputs.effectiveFederalTaxRate}% effective rate for deductions`,
  ].join(' · ');

  const row = (key: InputKey, onChange?: (v: any) => void) => (
    <FieldRow key={key} def={FIELD_BY_KEY[key]} inputs={inputs} onChange={onChange ?? ((v) => setInput(key, v))}
      changed={changedKeys.includes(key)} onReset={() => resetField(key)} />
  );

  return (
    <section id="assumptions" aria-labelledby="assumptions-title" className="scroll-mt-4 rounded-xl border border-gray-200 bg-white shadow-sm">
      <h2 id="assumptions-title">
        <button type="button" aria-expanded={open} aria-controls="assumptions-panel" onClick={() => setOpen(!open)}
          className="flex w-full items-start justify-between gap-3 p-4 text-left hover:bg-gray-50 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
          <span>
            <span className="block text-base font-semibold text-gray-900">All assumptions{changedHere > 0 && <span className="ml-2 text-sm font-normal text-amber-700">({changedHere} changed)</span>}</span>
            <span className="mt-0.5 block text-xs text-gray-600">{summary}</span>
          </span>
          <ChevronDown className={`mt-1 h-5 w-5 flex-shrink-0 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      </h2>
      {open && (
        <div id="assumptions-panel" className="grid gap-4 px-4 pb-4 md:grid-cols-2 xl:grid-cols-3">
          {GROUPS.map(g => {
            const groupFields = fields.filter(f => f.group === g.key && (!f.visibleWhen || f.visibleWhen(inputs)));
            return (
              <fieldset key={g.key} className="rounded-lg border border-gray-200 p-3">
                <legend className="px-1 text-sm font-semibold text-gray-900">{g.title}</legend>
                {g.note && <p className="mb-1 text-xs text-gray-600">{g.note}</p>}
                {g.key === 'taxes' && (
                  <p className="mb-1 text-xs text-gray-600">Tax year {inputs.firstTaxYear} · {FILING_LABELS[inputs.filingStatus]} (change at the top of the page).</p>
                )}
                <div className="space-y-1">
                  {groupFields.map(f => {
                    if (f.key === 'monthlyPropertyUtilities') {
                      return (
                        <div key={f.key}>
                          {row('monthlyPropertyUtilities', (v) => (rentUtilitiesDiffer ? setInput('monthlyPropertyUtilities', v) : setMany({ monthlyPropertyUtilities: v, monthlyRentUtilities: v })))}
                          <Toggle checked={rentUtilitiesDiffer} label="Renting utilities differ"
                            onChange={(on) => { setRentUtilitiesDiffer(on); if (!on) setInput('monthlyRentUtilities', inputs.monthlyPropertyUtilities); }} />
                        </div>
                      );
                    }
                    if (f.key === 'monthlyRentUtilities' && !rentUtilitiesDiffer) return null;
                    return row(f.key);
                  })}
                </div>
              </fieldset>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default AssumptionsDrawer;
