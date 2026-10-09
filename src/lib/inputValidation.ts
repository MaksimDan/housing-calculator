import type { HousingCalculatorInputs } from './financialCalculations';

// Every input path (sliders, Payoff Strategy fields, URL parameters, saved
// settings) funnels through sanitizeInputValue, so the engines never see NaN,
// Infinity, null or out-of-range values. Bounds are deliberately wider than
// the sliders: the Payoff Strategy fields allow e.g. negative growth rates.
type NumberRule = { min: number; max: number; integer?: boolean };

export const NUMBER_RULES: Record<string, NumberRule> = {
  annualSalaryBeforeTax: { min: 0, max: 100_000_000 },
  effectiveFederalTaxRate: { min: 0, max: 100 },
  standardDeduction: { min: 0, max: 10_000_000 },
  initialInvestment: { min: 0, max: 10_000_000_000 },
  monthlyMiscExpenses: { min: 0, max: 10_000_000 },
  homePrice: { min: 0, max: 10_000_000_000 },
  downPaymentPercent: { min: 0, max: 100 },
  effectiveMortgageRate: { min: 0, max: 100 },
  mortgageYears: { min: 1, max: 50, integer: true },
  PMIRate: { min: 0, max: 100 },
  propertyTaxRate: { min: 0, max: 100 },
  melloRoosTaxRate: { min: 0, max: 100 },
  closingCostPercent: { min: 0, max: 100 },
  annualMaintenanceRate: { min: 0, max: 100 },
  monthlyHOAFee: { min: 0, max: 10_000_000 },
  monthlyHomeInsurance: { min: 0, max: 10_000_000 },
  monthlyRent: { min: 0, max: 10_000_000 },
  monthlyRentalIncome: { min: 0, max: 10_000_000 },
  rentDeposit: { min: 0, max: 10_000_000 },
  movingCostBuying: { min: 0, max: 10_000_000 },
  movingCostRenting: { min: 0, max: 10_000_000 },
  monthlyRenterInsurance: { min: 0, max: 10_000_000 },
  monthlyRentUtilities: { min: 0, max: 10_000_000 },
  monthlyPropertyUtilities: { min: 0, max: 10_000_000 },
  homeAppreciation: { min: -50, max: 100 },
  investmentReturn: { min: -50, max: 100 },
  rentIncrease: { min: -50, max: 100 },
  salaryGrowthRate: { min: -50, max: 100 },
  inflationRate: { min: -50, max: 100 },
  propertyTaxAssessmentCap: { min: 0, max: 100 },
  xAxisYears: { min: 1, max: 50, integer: true },
  mortgageInterestDeductionCap: { min: 0, max: 10_000_000_000 },
  saltCap: { min: 0, max: 10_000_000 },
  effectiveStateIncomeTaxRate: { min: 0, max: 100 },
  marginalFederalTaxRate: { min: 0, max: 100 },
  sellingCostPercent: { min: 0, max: 100 },
  annualInvestmentTaxDrag: { min: 0, max: 100 },
  payrollEarners: { min: 1, max: 2, integer: true },
  payoffHorizon: { min: 1, max: 50, integer: true },
  firstTaxYear: { min: 2025, max: 2100, integer: true },
};

export const ENUM_INPUTS: Record<string, readonly string[]> = {
  filingStatus: ['mfj', 'single', 'hoh', 'mfs'],
};

export const BOOLEAN_INPUTS = new Set([
  'useMarginalTaxRate',
  'assumeSaltCapExtension',
  'melloRoosGrowsWithAssessment',
  'includeSellingCosts',
  'includePayrollTax',
]);

// Removes binary floating-point residue (e.g. 19.99999999999999 from repeated
// +/- clicks) without discarding precision a user actually entered.
export const cleanFloat = (value: number) => Number(value.toFixed(10));

// Returns a valid value for the input, or undefined to reject it (the caller
// keeps its previous value).
export const sanitizeInputValue = (key: string, raw: unknown): any => {
  if (BOOLEAN_INPUTS.has(key)) {
    return typeof raw === 'boolean' ? raw : undefined;
  }
  if (ENUM_INPUTS[key]) {
    return typeof raw === 'string' && ENUM_INPUTS[key].includes(raw) ? raw : undefined;
  }
  const rule = NUMBER_RULES[key];
  if (!rule) return undefined;
  let value: number;
  if (typeof raw === 'number') {
    value = raw;
  } else if (typeof raw === 'string' && raw.trim() !== '') {
    value = Number(raw.trim());
  } else {
    return undefined;
  }
  if (!Number.isFinite(value)) return undefined;
  value = Math.min(rule.max, Math.max(rule.min, value));
  return rule.integer ? Math.round(value) : cleanFloat(value);
};

// URL parameters: strict parsing ("750k" and "420,000" are rejected rather
// than silently read as 750 and 420).
export const parseUrlValue = (key: string, raw: string): any => {
  if (BOOLEAN_INPUTS.has(key)) {
    if (raw === 'true' || raw === '1') return true;
    if (raw === 'false' || raw === '0') return false;
    return undefined;
  }
  return sanitizeInputValue(key, raw);
};

export const sanitizeInputs = (inputs: HousingCalculatorInputs, defaults: HousingCalculatorInputs): HousingCalculatorInputs => {
  const result: any = {};
  for (const key of Object.keys(defaults)) {
    const clean = sanitizeInputValue(key, (inputs as any)[key]);
    result[key] = clean === undefined ? (defaults as any)[key] : clean;
  }
  return result;
};

// ---------------------------------------------------------------------------
// Storage. Access can throw (site data blocked) or be unavailable, so every
// call is guarded and the app falls back to in-memory state.
// ---------------------------------------------------------------------------

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  readonly length: number;
  key(index: number): string | null;
}

export const getBrowserStorage = (): KeyValueStorage | null => {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
};

export const readPersisted = (storage: KeyValueStorage | null, key: string): unknown => {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
};

export const writePersisted = (storage: KeyValueStorage | null, key: string, value: unknown) => {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage blocked: keep the in-memory value only
  }
};

export const removePersisted = (storage: KeyValueStorage | null, key: string) => {
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch {
    // ignore
  }
};

export const listKeys = (storage: KeyValueStorage | null): string[] => {
  if (!storage) return [];
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const k = storage.key(i);
      if (k !== null) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
};

export const isSettingsKey = (key: string) => key.startsWith('housing-') || key.startsWith('payoff-');

export const clearSavedSettings = (storage: KeyValueStorage | null) => {
  listKeys(storage).filter(isSettingsKey).forEach(k => removePersisted(storage, k));
};

// ---------------------------------------------------------------------------
// Migration of saved settings.
//
// Before settings version 2 the app saved EVERY default on the first visit, so
// a stored value can't be told apart from a default the user never touched,
// and later default fixes (TY2026 tax values, etc.) never reached returning
// visitors. Version 2 only stores values that differ from the current
// defaults. To migrate, drop each stored value that equals a default the app
// shipped at some point (taken from git history); real user edits survive.
// ---------------------------------------------------------------------------

export const SETTINGS_VERSION_KEY = 'housing-settingsVersion';
export const SETTINGS_VERSION = 2;

export const HISTORICAL_DEFAULTS: Record<string, Array<number | boolean>> = {
  'housing-PMIRate': [0.8, 1],
  'housing-annualSalary': [420000, 120000, 350000],
  'housing-appreciation': [4.5],
  'housing-assumeSaltCapExtension': [false],
  'housing-closingCost': [2.5, 3],
  'housing-downPayment': [40, 20],
  'housing-effectiveStateIncomeTaxRate': [7.5, 6.5],
  'housing-hoaFee': [0, 150],
  'housing-homeInsurance': [150, 200, 100],
  'housing-homePrice': [750000, 400000, 875000, 700000],
  'housing-includeSellingCosts': [false],
  'housing-inflationRate': [3, 2.5],
  'housing-initialInvestment': [1500000, 250000, 1000000],
  'housing-investmentReturn': [11.71, 8.5, 8],
  'housing-investmentTaxDrag': [0.2],
  'housing-maintenanceRate': [0.5, 1.5, 2],
  'housing-marginalTaxRate': [32],
  'housing-melloRoosGrows': [false],
  'housing-melloRoosTaxRate': [0, 0.2],
  'housing-miscExpenses': [1000, 4500, 3500],
  'housing-monthlyRent': [3000, 2600, 2000],
  'housing-mortgageInterestCap': [750000],
  'housing-mortgageRate': [5.24, 6.8, 6.5],
  'housing-mortgageYears': [30],
  'housing-movingCostBuy': [0, 3500, 2000],
  'housing-movingCostRent': [0, 2000, 1000],
  'housing-propertyTaxRate': [1.14, 1.15, 1.2],
  'housing-propertyUtilities': [120, 220, 200],
  'housing-rentDeposit': [1000, 2600, 500],
  'housing-rentIncrease': [4.5, 3],
  'housing-rentUtilities': [300, 120, 150],
  'housing-rentalIncome': [1500, 0],
  'housing-renterInsurance': [25, 10],
  'housing-salaryGrowth': [2.4, 3.5, 3],
  'housing-saltCap': [40400, 40000],
  'housing-sellingCostPercent': [6],
  'housing-standardDeduction': [32200, 30000, 20550, 21900],
  // Values 18/35/40 were COMBINED federal + state rates (before 2025-07-05);
  // reading them as federal-only would double-count state tax.
  'housing-taxRate': [19.1, 18, 35, 40],
  'housing-taxAssessmentCap': [2],
  'housing-useMarginalTaxRate': [true],
  'housing-xAxisYears': [30],
  'payoff-horizon': [30],
};

// Keys the app no longer reads
const OBSOLETE_KEYS = ['housing-qualityOfLife', 'housing-stateIncomeTaxRate', 'payoff-extraPayment'];

export const migrateSavedSettings = (storage: KeyValueStorage | null) => {
  if (!storage) return;
  const version = readPersisted(storage, SETTINGS_VERSION_KEY);
  if (typeof version === 'number' && version >= SETTINGS_VERSION) return;
  for (const [key, oldDefaults] of Object.entries(HISTORICAL_DEFAULTS)) {
    const stored = readPersisted(storage, key);
    if (stored === undefined) continue;
    if (oldDefaults.some(d => d === stored)) removePersisted(storage, key);
  }
  OBSOLETE_KEYS.forEach(k => removePersisted(storage, k));
  writePersisted(storage, SETTINGS_VERSION_KEY, SETTINGS_VERSION);
};
