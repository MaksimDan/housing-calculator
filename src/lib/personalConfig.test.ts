import { describe, it, expect } from 'vitest';
import { startingInputs, syncSavedSettings } from './personalConfig';
import { clearSavedSettings, readPersisted, writePersisted, KeyValueStorage, SETTINGS_VERSION_KEY } from './inputValidation';
import { statutoryInputsFor } from './taxLaw';
import { DEFAULTS, STARTING_INPUTS, PERSONAL_CONFIG } from '../hooks/useCalculatorInputs';

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
}

describe('startingInputs', () => {
  it('is the defaults when there is no personal config (the deployed site, and the tests)', () => {
    expect(startingInputs(DEFAULTS, null)).toEqual({
      inputs: DEFAULTS,
      bySituation: { renter: DEFAULTS, owner: { ...DEFAULTS, situation: 'owner' } },
      personal: null,
      problems: [],
    });
    expect(PERSONAL_CONFIG).toBeNull();
    expect(STARTING_INPUTS).toBe(DEFAULTS);
  });

  it('overrides only the inputs the config sets', () => {
    const { inputs, personal, problems } = startingInputs(DEFAULTS, { homePrice: 900000, monthlyRent: 3800 });
    expect(personal).toEqual({ homePrice: 900000, monthlyRent: 3800 });
    expect(inputs).toEqual({ ...DEFAULTS, homePrice: 900000, monthlyRent: 3800 });
    expect(problems).toEqual([]);
  });

  it('skips unknown inputs and invalid values, and says so', () => {
    const { inputs, personal, problems } = startingInputs(DEFAULTS, {
      homePrise: 900000, filingStatus: 'married', useMarginalTaxRate: 'yes', monthlyRent: 3800,
    });
    expect(personal).toEqual({ monthlyRent: 3800 });
    expect(inputs.filingStatus).toBe(DEFAULTS.filingStatus);
    expect(problems).toEqual([
      'homePrise: 900000 skipped (unknown input)',
      'filingStatus: "married" skipped (invalid value)',
      'useMarginalTaxRate: "yes" skipped (invalid value)',
    ]);
  });

  it('clamps out-of-range numbers like every other input path, and says so', () => {
    const { inputs, problems } = startingInputs(DEFAULTS, { downPaymentPercent: 120, xAxisYears: 29.6 });
    expect(inputs.downPaymentPercent).toBe(100);
    expect(inputs.xAxisYears).toBe(30);
    expect(problems).toEqual(['downPaymentPercent: 120 read as 100', 'xAxisYears: 29.6 read as 30']);
  });

  it("takes the tax amounts for the config's filing status, tax year and inflation", () => {
    const single = startingInputs(DEFAULTS, { filingStatus: 'single' }).inputs;
    const expected = statutoryInputsFor(DEFAULTS.firstTaxYear, 'single', DEFAULTS.inflationRate);
    expect(single.standardDeduction).toBe(expected.standardDeduction);
    expect(single.saltCap).toBe(expected.saltCap);
    expect(startingInputs(DEFAULTS, { filingStatus: 'mfs' }).inputs.mortgageInterestDeductionCap).toBe(375000);

    const later = startingInputs(DEFAULTS, { firstTaxYear: 2028, inflationRate: 2.5 }).inputs;
    expect(later.standardDeduction).toBe(statutoryInputsFor(2028, 'mfj', 2.5).standardDeduction);
    expect(later.saltCap).toBe(41212.04);
  });

  it("keeps an owner's home out of the renter's purchase, and the other way round", () => {
    const { bySituation, problems } = startingInputs(DEFAULTS, {
      situation: 'owner', homePrice: 820000, monthlyRentalIncome: 1200, monthlyRent: 3600, annualSalaryBeforeTax: 310000,
    });
    expect(problems).toEqual([]);
    expect(bySituation.owner).toMatchObject({ situation: 'owner', homePrice: 820000, monthlyRentalIncome: 1200, monthlyRent: 3600 });
    // A fresh purchase: the defaults for the home and rent, the same income
    expect(bySituation.renter).toMatchObject({ situation: 'renter', homePrice: DEFAULTS.homePrice, monthlyRentalIncome: 0, monthlyRent: DEFAULTS.monthlyRent });
    expect(bySituation.renter.annualSalaryBeforeTax).toBe(310000);
  });

  it('takes the other situation\'s home and rent from its block', () => {
    const { inputs, bySituation, personal, problems } = startingInputs(DEFAULTS, {
      situation: 'owner', homePrice: 820000, mortgageBalance: 380000,
      renter: { homePrice: 600000, effectiveMortgageRate: 6.5, monthlyRent: 2100, downPaymentPercent: 20 },
    });
    expect(problems).toEqual([]);
    expect(inputs).toBe(bySituation.owner);
    expect(bySituation.renter).toMatchObject({ homePrice: 600000, effectiveMortgageRate: 6.5, monthlyRent: 2100, downPaymentPercent: 20 });
    expect(bySituation.owner).toMatchObject({ homePrice: 820000, effectiveMortgageRate: DEFAULTS.effectiveMortgageRate, mortgageBalance: 380000 });
    expect(personal).toEqual({ situation: 'owner', homePrice: 820000, mortgageBalance: 380000, renter: { homePrice: 600000, effectiveMortgageRate: 6.5, monthlyRent: 2100, downPaymentPercent: 20 } });
  });

  it('says so when a block sets something that is not its own', () => {
    const { bySituation, problems } = startingInputs(DEFAULTS, {
      renter: { annualSalaryBeforeTax: 1, mortgageBalance: 5, homePrise: 3, monthlyRent: 'x' },
      owner: 7,
    });
    expect(problems).toEqual([
      'renter.annualSalaryBeforeTax: skipped (not a renter home or rent input; set it outside the block)',
      'renter.mortgageBalance: skipped (not a renter home or rent input; set it outside the block)',
      'renter.homePrise: skipped (unknown input)',
      'renter.monthlyRent: "x" skipped (invalid value)',
      'owner: skipped (expected an object of owner inputs)',
    ]);
    expect(bySituation.renter).toEqual(DEFAULTS);
  });

  it("takes an owner's situation and loan", () => {
    const { inputs, problems } = startingInputs(DEFAULTS, { situation: 'owner', mortgageBalance: 412345.67, mortgageYears: 28.33 });
    expect(problems).toEqual([]);
    expect(inputs.situation).toBe('owner');
    expect(inputs.mortgageBalance).toBe(412345.67);
    expect(inputs.mortgageYears).toBe(28.33);
    expect(startingInputs(DEFAULTS, { situation: 'landlord' }).problems).toEqual(['situation: "landlord" skipped (invalid value)']);
  });

  it('keeps a tax amount the config sets itself', () => {
    const { inputs } = startingInputs(DEFAULTS, { filingStatus: 'single', standardDeduction: 20000 });
    expect(inputs.standardDeduction).toBe(20000);
    expect(inputs.saltCap).toBe(statutoryInputsFor(DEFAULTS.firstTaxYear, 'single', DEFAULTS.inflationRate).saltCap);
  });
});

describe('syncSavedSettings', () => {
  const personal = { homePrice: 900000 };
  const edited = (storage: MemoryStorage) => readPersisted(storage, 'housing-monthlyRent');

  it('does nothing without a config: the deployed site keeps saved edits as before', () => {
    const storage = new MemoryStorage();
    writePersisted(storage, 'housing-monthlyRent', 4100);
    syncSavedSettings(storage, null);
    expect(edited(storage)).toBe(4100);
    expect(storage.data.size).toBe(1);
  });

  it('starts from the config when it first appears, then keeps edits made on it', () => {
    const storage = new MemoryStorage();
    writePersisted(storage, 'housing-monthlyRent', 4100); // made against the defaults
    syncSavedSettings(storage, personal);
    expect(edited(storage)).toBeUndefined();
    expect(readPersisted(storage, SETTINGS_VERSION_KEY)).toBeDefined();

    writePersisted(storage, 'housing-monthlyRent', 4200); // made against the config
    syncSavedSettings(storage, { homePrice: 900000 });
    expect(edited(storage)).toBe(4200);
  });

  it('starts over when the config changes or goes away', () => {
    const storage = new MemoryStorage();
    syncSavedSettings(storage, personal);
    writePersisted(storage, 'housing-monthlyRent', 4200);
    syncSavedSettings(storage, { homePrice: 950000 });
    expect(edited(storage)).toBeUndefined();

    writePersisted(storage, 'housing-monthlyRent', 4300);
    syncSavedSettings(storage, null);
    expect(edited(storage)).toBeUndefined();
    writePersisted(storage, 'housing-monthlyRent', 4400); // and back to normal from there
    syncSavedSettings(storage, null);
    expect(edited(storage)).toBe(4400);
  });

  it('survives Reset all, so edits made after a reset are kept on reload', () => {
    const storage = new MemoryStorage();
    syncSavedSettings(storage, personal);
    clearSavedSettings(storage); // what Reset all does
    writePersisted(storage, 'housing-monthlyRent', 4200);
    syncSavedSettings(storage, personal);
    expect(edited(storage)).toBe(4200);
  });
});
