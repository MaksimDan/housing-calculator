import type { HousingCalculatorInputs } from './financialCalculations';
import { statutoryInputsFor } from './taxLaw';
import { assessmentLimit, estimateStateIncomeTaxRate, statePropertyTax } from './stateLaw';

// Inputs the law fills in: the federal amounts for the tax year and filing
// status (lib/taxLaw.ts) and what the state decides (lib/stateLaw.ts). Each
// stays editable. While a field holds the law's value it keeps following the
// law when what it depends on changes; once you type your own value it is
// yours, and a change of state, tax year or filing status asks before
// replacing it.

type Inputs = HousingCalculatorInputs;
type LawValue = number | boolean;

export interface LawInput {
  key: keyof Inputs;
  // The inputs the law's value depends on
  dependsOn: (keyof Inputs)[];
  // The law's value; undefined when the law sets none (no assessment cap)
  value: (inputs: Inputs) => LawValue | undefined;
  // When the field isn't used (hidden), so it holds nothing of the user's
  unusedWhen?: (inputs: Inputs) => boolean;
  tolerance: number; // values this close count as the same
}

const federal = (i: Inputs) => statutoryInputsFor(i.firstTaxYear, i.filingStatus, i.inflationRate);

// The state income tax on the first tax year's salary, as the calculator's
// effective rate. Earners split a joint salary evenly, as for payroll taxes;
// the federal tax (for the states that deduct it) is the federal rate's.
export const stateIncomeTaxRateFor = (i: Inputs) => estimateStateIncomeTaxRate({
  state: i.state,
  year: i.firstTaxYear,
  status: i.filingStatus,
  wages: i.annualSalaryBeforeTax,
  inflationRate: i.inflationRate,
  earners: i.payrollEarners,
  federalIncomeTax: i.annualSalaryBeforeTax * i.effectiveFederalTaxRate / 100,
});

export const LAW_INPUTS: LawInput[] = [
  { key: 'standardDeduction', dependsOn: ['firstTaxYear', 'filingStatus'], value: i => federal(i).standardDeduction, tolerance: 0.5 },
  { key: 'saltCap', dependsOn: ['firstTaxYear', 'filingStatus'], value: i => federal(i).saltCap, tolerance: 0.5 },
  { key: 'mortgageInterestDeductionCap', dependsOn: ['firstTaxYear', 'filingStatus'], value: i => federal(i).mortgageInterestDeductionCap, tolerance: 0.5 },
  {
    key: 'effectiveStateIncomeTaxRate',
    dependsOn: ['state', 'firstTaxYear', 'filingStatus', 'annualSalaryBeforeTax', 'inflationRate', 'payrollEarners', 'effectiveFederalTaxRate'],
    value: stateIncomeTaxRateFor,
    tolerance: 0.005,
  },
  { key: 'propertyTaxRate', dependsOn: ['state'], value: i => statePropertyTax(i.state).typicalRate, tolerance: 0.005 },
  { key: 'propertyTaxAssessmentCapped', dependsOn: ['state'], value: i => assessmentLimit(i.state) !== null, tolerance: 0 },
  {
    key: 'propertyTaxAssessmentCap',
    dependsOn: ['state'],
    value: i => assessmentLimit(i.state)?.rate,
    unusedWhen: i => !i.propertyTaxAssessmentCapped,
    tolerance: 0.005,
  },
];

export const LAW_INPUT_KEYS = LAW_INPUTS.map(l => l.key);

// Changes that ask before replacing a value you typed
export const ASKING_KEYS: (keyof Inputs)[] = ['state', 'firstTaxYear', 'filingStatus'];

const same = (a: unknown, b: unknown, tolerance: number) =>
  typeof a === 'number' && typeof b === 'number' ? Math.abs(a - b) <= tolerance : Object.is(a, b);

// The law's value for one input, or undefined where the law sets none
export const lawValue = (key: keyof Inputs, inputs: Inputs) => LAW_INPUTS.find(l => l.key === key)?.value(inputs);

// Whether two values of an input are the same (within a law input's tolerance)
export const sameValue = (key: keyof Inputs, a: unknown, b: unknown) =>
  same(a, b, LAW_INPUTS.find(l => l.key === key)?.tolerance ?? 0);

// Whether the field holds the law's value for these inputs
export const followsLaw = (key: keyof Inputs, inputs: Inputs) => {
  const law = LAW_INPUTS.find(l => l.key === key);
  if (!law) return false;
  const value = law.value(inputs);
  return value !== undefined && same(inputs[key], value, law.tolerance);
};

export interface LawPrompt {
  key: keyof Inputs;
  current: LawValue;
  next: LawValue;
}

// What else changes when `changes` are applied to `inputs`: fields that held
// the law's value (or weren't in use) move to the law's new value; customized
// ones are returned as prompts when `ask` is set and otherwise left alone.
// Keys set in `changes` themselves are never touched.
export const followLaw = (inputs: Inputs, changes: Partial<Inputs>, ask: boolean) => {
  const after = { ...inputs, ...changes };
  const updates: Partial<Inputs> = {};
  const prompts: LawPrompt[] = [];
  for (const law of LAW_INPUTS) {
    if (law.key in changes) continue;
    if (!law.dependsOn.some(k => k in changes && !Object.is(changes[k], inputs[k]))) continue;
    const next = law.value(after);
    if (next === undefined) continue;
    const current = inputs[law.key] as LawValue;
    if (same(current, next, law.tolerance)) continue;
    const was = law.value(inputs);
    const following = law.unusedWhen?.(inputs) || (was !== undefined && same(current, was, law.tolerance));
    if (following) (updates as Record<string, LawValue>)[law.key] = next;
    else if (ask) prompts.push({ key: law.key, current, next });
  }
  return { updates, prompts };
};

// `inputs` with every law-filled field that `keep` doesn't name set to the
// law's value (for the defaults and a personal config's starting values)
export const withLawValues = (inputs: Inputs, keep: (key: keyof Inputs) => boolean = () => false): Inputs => {
  const result = { ...inputs };
  for (const law of LAW_INPUTS) {
    if (keep(law.key)) continue;
    const value = law.value(result);
    if (value !== undefined) (result as Record<string, unknown>)[law.key] = value;
  }
  return result;
};
