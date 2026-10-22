import { useEffect, useMemo } from 'react';
import personalConfig from 'virtual:personal-config';
import { usePersistedState } from './usePersistedState';
import { calculateProjectionData, HousingCalculatorInputs, Situation } from '../lib/financialCalculations';
import { FilingStatus, FIRST_PUBLISHED_TAX_YEAR } from '../lib/taxLaw';
import type { StateCode } from '../lib/stateLaw';
import { followLaw, lawValue, sameValue, withLawValues, LawPrompt } from '../lib/statutoryInputs';
import { startingInputs } from '../lib/personalConfig';
import { SITUATIONS, isSituationKey } from '../lib/situation';
import {
  sanitizeInputValue,
  parseUrlValue,
  getBrowserStorage,
  clearSavedSettings,
  writePersisted,
  SETTINGS_VERSION_KEY,
  SETTINGS_VERSION,
} from '../lib/inputValidation';

// Tax year that most of the first 12 months falls in, starting now (a
// purchase, or a sale for an owner): a start in the second half of the year
// is mostly next year's taxes.
const defaultFirstTaxYear = () => {
  const now = new Date();
  return Math.max(FIRST_PUBLISHED_TAX_YEAR, now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear());
};

// General defaults: an example household, married filing jointly, in
// California. Only values that differ from these are saved, so changing a
// default here reaches every visitor who hasn't edited that field. If a stored
// value could be mistaken for a user's edit, add the old default to
// HISTORICAL_DEFAULTS and bump SETTINGS_VERSION in lib/inputValidation.ts.
//
// The inputs the law fills in aren't listed: withLawValues sets them for this
// state, tax year, filing status and salary (the standard deduction, SALT cap
// and interest cap from lib/taxLaw.ts; the state income tax rate, property tax
// rate and assessment cap from lib/stateLaw.ts). See lib/statutoryInputs.ts.
export const DEFAULTS: HousingCalculatorInputs = withLawValues({
  situation: 'renter', // the example household rents today and is thinking of buying
  state: 'CA',
  annualSalaryBeforeTax: 420000,
  // Federal INCOME tax only: TY2026 MFJ tax on $420k less the $32,200 standard
  // deduction is $78,268 (18.6%). Payroll taxes are computed separately.
  effectiveFederalTaxRate: 18.6,
  initialInvestment: 1500000,
  monthlyMiscExpenses: 1000,
  homePrice: 750000,
  downPaymentPercent: 40,
  // An owner's loan today; the same loan as the example purchase
  mortgageBalance: 450000,
  effectiveMortgageRate: 5.24,
  mortgageYears: 30,
  PMIRate: 0.8,
  melloRoosTaxRate: 0.0,
  closingCostPercent: 2.5,
  annualMaintenanceRate: 0.5,
  monthlyHOAFee: 0,
  monthlyHomeInsurance: 150,
  monthlyRent: 3000, // rent for a home comparable to the one being bought
  monthlyRentalIncome: 0, // the general case: the buyer lives in the whole home
  rentDeposit: 1000,
  movingCostBuying: 0,
  movingCostRenting: 0,
  monthlyRenterInsurance: 25,
  // Same utility basket for both households (see the tooltips)
  monthlyRentUtilities: 300,
  monthlyPropertyUtilities: 300,
  homeAppreciation: 4.5,
  investmentReturn: 11.71,
  rentIncrease: 4.5,
  salaryGrowthRate: 2.4,
  inflationRate: 3.0,
  xAxisYears: 30,
  // TY2026 MFJ bracket for ~$356k-$388k of taxable income ($211,400-$403,550)
  marginalFederalTaxRate: 24,
  useMarginalTaxRate: true,
  assumeSaltCapExtension: false, // current law: cap reverts to $10k in 2030
  melloRoosGrowsWithAssessment: false,
  includeSellingCosts: false,
  sellingCostPercent: 6,
  annualInvestmentTaxDrag: 0.2,
  includePayrollTax: true,
  payrollEarners: 2,
  firstTaxYear: defaultFirstTaxYear(),
  filingStatus: 'mfj',
} as HousingCalculatorInputs);

// On the dev server, personal.config.ts (git-ignored) replaces the example
// household as the starting point; everywhere else this is DEFAULTS.
const start = startingInputs(DEFAULTS, personalConfig);
if (start.problems.length) console.warn(`personal.config.ts:\n  ${start.problems.join('\n  ')}`);
export const STARTING_INPUTS = start.inputs;
// What each situation starts from: the same shared inputs, its own home and rent
export const STARTING_BY_SITUATION = start.bySituation;
export const PERSONAL_CONFIG = start.personal;
const SET_BY_CONFIG = start.explicit;

type InputKey = keyof HousingCalculatorInputs;

// State property -> [localStorage key, URL parameter]. Listed in display order.
const INPUT_KEYS: Record<InputKey, [string, string]> = {
  situation: ['housing-situation', 'situation'],
  state: ['housing-state', 'state'],
  annualSalaryBeforeTax: ['housing-annualSalary', 'annualSalary'],
  effectiveFederalTaxRate: ['housing-taxRate', 'taxRate'],
  standardDeduction: ['housing-standardDeduction', 'standardDeduction'],
  initialInvestment: ['housing-initialInvestment', 'initialInvestment'],
  monthlyMiscExpenses: ['housing-miscExpenses', 'miscExpenses'],
  homePrice: ['housing-homePrice', 'homePrice'],
  downPaymentPercent: ['housing-downPayment', 'downPayment'],
  mortgageBalance: ['housing-mortgageBalance', 'mortgageBalance'],
  effectiveMortgageRate: ['housing-mortgageRate', 'mortgageRate'],
  mortgageYears: ['housing-mortgageYears', 'mortgageYears'],
  PMIRate: ['housing-PMIRate', 'PMIRate'],
  propertyTaxRate: ['housing-propertyTaxRate', 'propertyTaxRate'],
  melloRoosTaxRate: ['housing-melloRoosTaxRate', 'melloRoosTaxRate'],
  closingCostPercent: ['housing-closingCost', 'closingCost'],
  annualMaintenanceRate: ['housing-maintenanceRate', 'maintenanceRate'],
  monthlyHOAFee: ['housing-hoaFee', 'hoaFee'],
  monthlyHomeInsurance: ['housing-homeInsurance', 'homeInsurance'],
  monthlyRent: ['housing-monthlyRent', 'monthlyRent'],
  monthlyRentalIncome: ['housing-rentalIncome', 'rentalIncome'],
  rentDeposit: ['housing-rentDeposit', 'rentDeposit'],
  movingCostBuying: ['housing-movingCostBuy', 'movingCostBuy'],
  movingCostRenting: ['housing-movingCostRent', 'movingCostRent'],
  monthlyRenterInsurance: ['housing-renterInsurance', 'renterInsurance'],
  monthlyRentUtilities: ['housing-rentUtilities', 'rentUtilities'],
  monthlyPropertyUtilities: ['housing-propertyUtilities', 'propertyUtilities'],
  homeAppreciation: ['housing-appreciation', 'appreciation'],
  investmentReturn: ['housing-investmentReturn', 'investmentReturn'],
  rentIncrease: ['housing-rentIncrease', 'rentIncrease'],
  salaryGrowthRate: ['housing-salaryGrowth', 'salaryGrowth'],
  inflationRate: ['housing-inflationRate', 'inflationRate'],
  propertyTaxAssessmentCapped: ['housing-taxAssessmentCapped', 'taxAssessmentCapped'],
  propertyTaxAssessmentCap: ['housing-taxAssessmentCap', 'taxAssessmentCap'],
  xAxisYears: ['housing-xAxisYears', 'xAxisYears'],
  mortgageInterestDeductionCap: ['housing-mortgageInterestCap', 'mortgageInterestCap'],
  saltCap: ['housing-saltCap', 'saltCap'],
  effectiveStateIncomeTaxRate: ['housing-effectiveStateIncomeTaxRate', 'effectiveStateIncomeTaxRate'],
  marginalFederalTaxRate: ['housing-marginalTaxRate', 'marginalTaxRate'],
  useMarginalTaxRate: ['housing-useMarginalTaxRate', 'useMarginalTaxRate'],
  assumeSaltCapExtension: ['housing-assumeSaltCapExtension', 'assumeSaltCapExtension'],
  melloRoosGrowsWithAssessment: ['housing-melloRoosGrows', 'melloRoosGrows'],
  includeSellingCosts: ['housing-includeSellingCosts', 'includeSellingCosts'],
  sellingCostPercent: ['housing-sellingCostPercent', 'sellingCostPercent'],
  annualInvestmentTaxDrag: ['housing-investmentTaxDrag', 'investmentTaxDrag'],
  includePayrollTax: ['housing-includePayrollTax', 'payrollTax'],
  payrollEarners: ['housing-payrollEarners', 'earners'],
  firstTaxYear: ['housing-firstTaxYear', 'firstTaxYear'],
  filingStatus: ['housing-filingStatus', 'filingStatus'],
};

const INPUT_NAMES = Object.keys(INPUT_KEYS) as InputKey[];

// An owner's home and rent inputs are saved under their own keys; a renter's
// keep the keys they had before there were situations
const storageKey = (name: InputKey, situation: Situation) =>
  situation === 'owner' && isSituationKey(name) ? INPUT_KEYS[name][0].replace(/^housing-/, 'housing-owner-') : INPUT_KEYS[name][0];

// Everything an Undo of Reset all puts back
export interface InputsSnapshot {
  shared: Partial<HousingCalculatorInputs>;
  bySituation: Record<Situation, Partial<HousingCalculatorInputs>>;
}

export type { LawPrompt };

// Links made before there was a state were California's rules (an
// assessment cap tied to inflation), so they open in California
const LEGACY_LINK: Partial<HousingCalculatorInputs> = { state: 'CA', propertyTaxAssessmentCapped: true };

export const useCalculatorInputs = () => {
  // One persisted, sanitized state per shared input, and one per situation
  // for each home and rent input. The loops run over constants, so the hook
  // order is stable across renders.
  const shared = {} as Record<InputKey, any>;
  const setShared = {} as Record<InputKey, (value: any) => void>;
  const own = { renter: {}, owner: {} } as Record<Situation, Record<InputKey, any>>;
  const setOwn = { renter: {}, owner: {} } as Record<Situation, Record<InputKey, (value: any) => void>>;
  for (const name of INPUT_NAMES) {
    const sanitize = (raw: unknown) => sanitizeInputValue(name, raw);
    if (isSituationKey(name)) {
      for (const s of SITUATIONS) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        [own[s][name], setOwn[s][name]] = usePersistedState<any>(storageKey(name, s), STARTING_BY_SITUATION[s][name], sanitize);
      }
    } else {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      [shared[name], setShared[name]] = usePersistedState<any>(INPUT_KEYS[name][0], STARTING_INPUTS[name], sanitize);
    }
  }
  const situation = shared.situation as Situation;
  const valueIn = (name: InputKey, s: Situation) => (isSituationKey(name) ? own[s][name] : shared[name]);
  const setterIn = (name: InputKey, s: Situation) => (isSituationKey(name) ? setOwn[s][name] : setShared[name]);

  // Load URL parameters on mount, then drop them from the address bar so a
  // reload doesn't re-apply the link over later edits.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.toString()) return;
    // A link's home and rent belong to the situation it was made in
    const linked: Situation = parseUrlValue('situation', urlParams.get(INPUT_KEYS.situation[1]) ?? '') ?? situation;
    if (!urlParams.has(INPUT_KEYS.state[1])) {
      for (const [name, value] of Object.entries(LEGACY_LINK)) {
        if (!urlParams.has(INPUT_KEYS[name as InputKey][1])) setterIn(name as InputKey, linked)(value);
      }
    }
    for (const name of INPUT_NAMES) {
      const raw = urlParams.get(INPUT_KEYS[name][1]);
      if (raw === null) continue;
      const value = parseUrlValue(name, raw);
      if (value !== undefined) setterIn(name, linked)(value);
    }
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    } catch {
      // ignore (e.g. sandboxed frames)
    }
  }, []);

  // Single source of truth for the inputs object: the shared inputs and this
  // situation's home and rent
  const viewValues = INPUT_NAMES.map(name => valueIn(name, situation));
  const inputs: HousingCalculatorInputs = useMemo(
    () => Object.fromEntries(INPUT_NAMES.map((name, i) => [name, viewValues[i]])) as HousingCalculatorInputs,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    viewValues
  );

  const projectionData = useMemo(() => calculateProjectionData(inputs), [inputs]);

  // What a field counts as changed from, and what its reset returns to: its
  // starting value (the defaults or your personal config), except that an
  // input the law fills in which the config doesn't set starts from the law's
  // value for the inputs as they are now (a new state or tax year moves it)
  const startingValue = (name: InputKey) => {
    const start = name === 'situation' ? STARTING_INPUTS.situation : STARTING_BY_SITUATION[inputs.situation][name];
    if (SET_BY_CONFIG[inputs.situation].has(name)) return start;
    return lawValue(name, inputs) ?? start;
  };
  const changedKeys = useMemo(
    () => INPUT_NAMES.filter(name => !sameValue(name, inputs[name], startingValue(name))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [inputs]
  );

  // The inputs as a situation sees them: the shared ones and its own home and rent
  const viewOf = (s: Situation) =>
    Object.fromEntries(INPUT_NAMES.map(name => [name, valueIn(name, s)])) as HousingCalculatorInputs;

  // Applies changes to this situation's inputs and moves the inputs the law
  // fills in along with them (lib/statutoryInputs.ts), in both situations'
  // homes. Returns the ones you had customized when `ask` is set (a change of
  // state, tax year or filing status), so the page can ask before replacing
  // them; other changes (salary, inflation) only move the ones still
  // following the law.
  const apply = (changes: Partial<HousingCalculatorInputs>, ask = false): LawPrompt[] => {
    const clean: Partial<HousingCalculatorInputs> = {};
    for (const [key, raw] of Object.entries(changes)) {
      const value = sanitizeInputValue(key, raw);
      if (value !== undefined) (clean as Record<string, unknown>)[key] = value;
    }
    const { updates, prompts } = followLaw(inputs, clean, ask);
    for (const [key, value] of Object.entries({ ...clean, ...updates })) setterIn(key as InputKey, situation)(value);
    for (const s of SITUATIONS) {
      if (s === situation) continue;
      for (const [key, value] of Object.entries(followLaw(viewOf(s), clean, false).updates)) {
        if (isSituationKey(key)) setOwn[s][key as InputKey](value);
      }
    }
    return prompts;
  };

  const setInput = (key: InputKey, value: unknown) => { apply({ [key]: value }); };
  const setMany = (values: Partial<HousingCalculatorInputs>) => { apply(values); };
  const resetField = (key: InputKey) => { apply({ [key]: startingValue(key) }); };

  // Resets every input, in both situations, but not the situation itself (an
  // owner who resets still owns); returns what was there so the caller can undo.
  const resetAll = (): InputsSnapshot => {
    const previous = { shared: { ...shared }, bySituation: { renter: { ...own.renter }, owner: { ...own.owner } } };
    const storage = getBrowserStorage();
    clearSavedSettings(storage);
    writePersisted(storage, SETTINGS_VERSION_KEY, SETTINGS_VERSION);
    // Clearing the saved settings dropped the situation too
    if (situation !== STARTING_INPUTS.situation) writePersisted(storage, INPUT_KEYS.situation[0], situation);
    for (const name of INPUT_NAMES) {
      if (isSituationKey(name)) for (const s of SITUATIONS) setOwn[s][name](STARTING_BY_SITUATION[s][name]);
      else if (name !== 'situation') setShared[name](STARTING_INPUTS[name]);
    }
    return previous;
  };
  const restore = (saved: InputsSnapshot) => {
    for (const [name, value] of Object.entries(saved.shared)) setShared[name as InputKey](value);
    for (const s of SITUATIONS) {
      for (const [name, value] of Object.entries(saved.bySituation[s])) setOwn[s][name as InputKey](value);
    }
  };

  // Copies a link that reproduces these inputs (and the current section).
  const share = async (): Promise<{ ok: boolean; url: string }> => {
    const params = new URLSearchParams();
    for (const name of INPUT_NAMES) {
      params.append(INPUT_KEYS[name][1], String(inputs[name]));
    }
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}${window.location.hash}`;
    try {
      await navigator.clipboard.writeText(url);
      return { ok: true, url };
    } catch {
      return { ok: false, url };
    }
  };

  // State, tax year and filing status fill in what the law says for them
  // (lib/taxLaw.ts, lib/stateLaw.ts); the fields you customized come back as
  // prompts
  const changeState = (state: StateCode) => apply({ state }, true);
  const changeTaxYear = (year: number) => apply({ firstTaxYear: year }, true);
  const changeFilingStatus = (status: FilingStatus) => apply({ filingStatus: status }, true);

  return {
    inputs,
    projectionData,
    changedKeys,
    setInput,
    setMany,
    resetField,
    resetAll,
    restore,
    share,
    changeState,
    changeTaxYear,
    changeFilingStatus,
  };
};
