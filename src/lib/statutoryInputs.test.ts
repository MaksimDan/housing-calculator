import { describe, it, expect } from 'vitest';
import { DEFAULTS } from '../hooks/useCalculatorInputs';
import { LAW_INPUT_KEYS, followLaw, followsLaw, lawValue, withLawValues, stateIncomeTaxRateFor } from './statutoryInputs';
import { STATE_PROPERTY_TAX, estimateStateIncomeTaxRate } from './stateLaw';
import { statutoryInputsFor } from './taxLaw';

const TX_RATE = STATE_PROPERTY_TAX.TX.typicalRate;

describe('inputs the law fills in', () => {
  it("the defaults hold the law's values for the example household in California", () => {
    for (const key of LAW_INPUT_KEYS) {
      expect(lawValue(key, DEFAULTS) === undefined || followsLaw(key, DEFAULTS), key).toBe(true);
    }
    expect(DEFAULTS.state).toBe('CA');
    expect(DEFAULTS.effectiveStateIncomeTaxRate).toBe(estimateStateIncomeTaxRate({
      state: 'CA', year: DEFAULTS.firstTaxYear, status: 'mfj', wages: DEFAULTS.annualSalaryBeforeTax, inflationRate: DEFAULTS.inflationRate,
      earners: DEFAULTS.payrollEarners, federalIncomeTax: DEFAULTS.annualSalaryBeforeTax * DEFAULTS.effectiveFederalTaxRate / 100,
    }));
    expect(DEFAULTS.propertyTaxRate).toBe(STATE_PROPERTY_TAX.CA.typicalRate);
    expect([DEFAULTS.propertyTaxAssessmentCapped, DEFAULTS.propertyTaxAssessmentCap]).toEqual([true, 2]);
  });

  it("a new state moves every field still at the old state's value, without asking", () => {
    const { updates, prompts } = followLaw(DEFAULTS, { state: 'TX' }, true);
    expect(updates).toEqual({ effectiveStateIncomeTaxRate: 0, propertyTaxRate: TX_RATE, propertyTaxAssessmentCap: 10 });
    expect(prompts).toEqual([]);
  });

  it('asks before replacing a value you typed, and leaves it until you answer', () => {
    const mine = { ...DEFAULTS, propertyTaxRate: 1.3, effectiveStateIncomeTaxRate: 8 };
    const { updates, prompts } = followLaw(mine, { state: 'TX' }, true);
    expect(updates).toEqual({ propertyTaxAssessmentCap: 10 });
    expect(prompts).toEqual([
      { key: 'effectiveStateIncomeTaxRate', current: 8, next: 0 },
      { key: 'propertyTaxRate', current: 1.3, next: TX_RATE },
    ]);
  });

  it('a salary change moves the state rate only while it follows the law, and never asks', () => {
    const raise = { annualSalaryBeforeTax: 250000 };
    const expected = stateIncomeTaxRateFor({ ...DEFAULTS, ...raise });
    expect(followLaw(DEFAULTS, raise, false)).toEqual({ updates: { effectiveStateIncomeTaxRate: expected }, prompts: [] });
    // A rate you typed stays yours (the hook never asks about a salary change)
    expect(followLaw({ ...DEFAULTS, effectiveStateIncomeTaxRate: 8 }, raise, false)).toEqual({ updates: {}, prompts: [] });
  });

  it('a state without a cap turns it off and leaves the cap rate alone', () => {
    const { updates } = followLaw(DEFAULTS, { state: 'NJ' }, true);
    expect(updates.propertyTaxAssessmentCapped).toBe(false);
    expect('propertyTaxAssessmentCap' in updates).toBe(false);
    // Back to a capped state: the unused rate takes the new state's cap
    const nj = { ...DEFAULTS, ...updates, state: 'NJ' as const };
    expect(followLaw(nj, { state: 'TX' }, true).updates).toMatchObject({ propertyTaxAssessmentCapped: true, propertyTaxAssessmentCap: 10 });
  });

  it('a cap you set in a state without one is yours: a new state asks first', () => {
    const local = { ...DEFAULTS, state: 'NY' as const, propertyTaxAssessmentCapped: true, propertyTaxAssessmentCap: 6 };
    const { updates, prompts } = followLaw(local, { state: 'CA' }, true);
    expect(updates.propertyTaxAssessmentCap).toBeUndefined();
    expect(prompts).toContainEqual({ key: 'propertyTaxAssessmentCap', current: 6, next: 2 });
  });

  it('tax year and filing status move the federal amounts as before', () => {
    const { updates } = followLaw(DEFAULTS, { filingStatus: 'single' }, true);
    const single = statutoryInputsFor(DEFAULTS.firstTaxYear, 'single', DEFAULTS.inflationRate);
    expect(updates.standardDeduction).toBe(single.standardDeduction);
    expect('saltCap' in updates).toBe(false); // the same cap for single and joint returns
    expect(updates.effectiveStateIncomeTaxRate).toBe(stateIncomeTaxRateFor({ ...DEFAULTS, filingStatus: 'single' }));
    const mfs = statutoryInputsFor(DEFAULTS.firstTaxYear, 'mfs', DEFAULTS.inflationRate);
    expect(followLaw(DEFAULTS, { filingStatus: 'mfs' }, true).updates).toMatchObject({ saltCap: mfs.saltCap, mortgageInterestDeductionCap: 375000 });
    const custom = followLaw({ ...DEFAULTS, standardDeduction: 20000 }, { firstTaxYear: 2026 }, true);
    expect(custom.prompts).toContainEqual({ key: 'standardDeduction', current: 20000, next: 32200 });
  });

  it('never touches a field the change sets itself', () => {
    expect(followLaw(DEFAULTS, { state: 'TX', propertyTaxRate: 2 }, true).updates.propertyTaxRate).toBeUndefined();
  });

  it("withLawValues fills in the law's values except the ones kept", () => {
    const tx = withLawValues({ ...DEFAULTS, state: 'TX' }, key => key === 'propertyTaxRate');
    expect(tx.effectiveStateIncomeTaxRate).toBe(0);
    expect(tx.propertyTaxRate).toBe(DEFAULTS.propertyTaxRate);
    expect(tx.propertyTaxAssessmentCap).toBe(10);
  });
});
