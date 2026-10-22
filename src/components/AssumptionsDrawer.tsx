import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HousingCalculatorInputs } from '../lib/financialCalculations';
import { GROUPS, InputKey, fieldFor, fieldsFor, groupTitle } from '../lib/fields';
import { FILING_STATUS_LABELS } from '../lib/taxLaw';
import { stateName } from '../lib/stateLaw';
import { FieldRow } from './FieldRow';
import { Toggle } from './Toggle';

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
  const owner = inputs.situation === 'owner';
  const fields = fieldsFor(inputs.situation, inputs.state).filter(f => !f.driver && f.group !== 'view');
  const changedHere = changedKeys.filter(k => fields.some(f => f.key === k)).length;
  const summary = [
    `${owner ? 'Keep' : 'Stay'} ${inputs.xAxisYears} yrs`,
    `return ${inputs.investmentReturn}%`,
    `appreciation ${inputs.homeAppreciation}%`,
    `rent +${inputs.rentIncrease}%/yr`,
    owner
      ? `selling costs ${inputs.sellingCostPercent}% now${inputs.includeSellingCosts ? ' and later' : ''}`
      : `selling costs ${inputs.includeSellingCosts ? `${inputs.sellingCostPercent}%` : 'off'}`,
    `${stateName(inputs.state)}, ${FILING_STATUS_LABELS[inputs.filingStatus].toLowerCase()} ${inputs.firstTaxYear}`,
    inputs.useMarginalTaxRate ? `${inputs.marginalFederalTaxRate}% marginal` : `${inputs.effectiveFederalTaxRate}% effective rate for deductions`,
  ].join(' · ');

  const row = (key: InputKey, onChange?: (v: any) => void) => (
    <FieldRow key={key} def={fieldFor(key, inputs.situation, inputs.state)} inputs={inputs} onChange={onChange ?? ((v) => setInput(key, v))}
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
                <legend className="px-1 text-sm font-semibold text-gray-900">{groupTitle(g, inputs.situation)}</legend>
                {g.note && <p className="mb-1 text-xs text-gray-600">{g.note}</p>}
                {(g.key === 'taxes' || g.key === 'owning') && (
                  <p className="mb-1 text-xs text-gray-600">
                    {g.key === 'taxes'
                      ? `${stateName(inputs.state)} · tax year ${inputs.firstTaxYear} · ${FILING_STATUS_LABELS[inputs.filingStatus].toLowerCase()}`
                      : `Property tax rules for ${stateName(inputs.state)}`} (change at the top of the page).
                  </p>
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
