import type { HousingCalculatorInputs, Situation } from './financialCalculations';
import { statutoryInputsFor } from './taxLaw';
import { FIELDS } from './fields';
import { SITUATIONS, SITUATION_KEYS, isSituationKey } from './situation';
import {
  KeyValueStorage,
  sanitizeInputValue,
  readPersisted,
  writePersisted,
  removePersisted,
  clearSavedSettings,
  SETTINGS_VERSION_KEY,
  SETTINGS_VERSION,
} from './inputValidation';

// A personal config (personal.config.ts, which only the dev server reads; see
// personal-config.js) replaces the example household as the starting point:
// what loads, what Reset returns to, and what counts as changed.

const TAX_AMOUNT_KEYS = ['standardDeduction', 'saltCap', 'mortgageInterestDeductionCap'] as const;

// Any inputs, plus optional `renter` and `owner` blocks holding that
// situation's home and rent inputs (see SITUATION_KEYS)
export type PersonalConfig = Partial<HousingCalculatorInputs> & Partial<Record<Situation, Partial<HousingCalculatorInputs>>>;

export interface StartingInputs {
  // The page as it opens, in the config's situation
  inputs: HousingCalculatorInputs;
  // What each situation starts from: the same shared inputs, and its own home
  // and rent inputs
  bySituation: Record<Situation, HousingCalculatorInputs>;
  // The values the config set, after validation; null without a config
  personal: PersonalConfig | null;
  // Entries that were skipped or adjusted, for a console warning
  problems: string[];
}

// What a `renter` or `owner` block may set: that situation's home and rent
// inputs, and the inputs only it has (a renter's down payment, an owner's
// mortgage balance)
const blockKeys = (situation: Situation) =>
  new Set<string>([...SITUATION_KEYS, ...FIELDS.filter(f => f.only === situation).map(f => f.key)]);

// Overlays a personal config on the defaults. Home and rent inputs at the top
// level belong to the situation the config opens in; the other situation
// starts from the defaults, or from its block. Unknown keys and invalid
// values are skipped; out-of-range numbers are clamped, as for every other
// input path. Both are reported. The statutory tax amounts follow the config's
// tax year, filing status and inflation rate unless it sets them itself.
export const startingInputs = (
  defaults: HousingCalculatorInputs,
  config: Record<string, unknown> | null
): StartingInputs => {
  if (!config) {
    const bySituation = { renter: { ...defaults, situation: 'renter' }, owner: { ...defaults, situation: 'owner' } } as Record<Situation, HousingCalculatorInputs>;
    return { inputs: defaults, bySituation, personal: null, problems: [] };
  }
  const problems: string[] = [];
  const read = (name: string, key: string, raw: unknown) => {
    const known = key in defaults;
    const clean = known ? sanitizeInputValue(key, raw) : undefined;
    if (clean === undefined) problems.push(`${name}: ${JSON.stringify(raw)} skipped (${known ? 'invalid value' : 'unknown input'})`);
    else if (!Object.is(clean, raw)) problems.push(`${name}: ${JSON.stringify(raw)} read as ${JSON.stringify(clean)}`);
    return clean;
  };
  const top: Record<string, unknown> = {};
  const blocks: Record<Situation, Record<string, unknown>> = { renter: {}, owner: {} };
  for (const [key, raw] of Object.entries(config)) {
    if (key === 'renter' || key === 'owner') {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        problems.push(`${key}: skipped (expected an object of ${key} inputs)`);
        continue;
      }
      const allowed = blockKeys(key);
      for (const [k, r] of Object.entries(raw)) {
        if (!allowed.has(k)) {
          problems.push(`${key}.${k}: skipped (${k in defaults ? `not a ${key} home or rent input; set it outside the block` : 'unknown input'})`);
          continue;
        }
        const clean = read(`${key}.${k}`, k, r);
        if (clean !== undefined) blocks[key][k] = clean;
      }
      continue;
    }
    const clean = read(key, key, raw);
    if (clean !== undefined) top[key] = clean;
  }

  const situation = (top.situation ?? defaults.situation) as Situation;
  const shared: Record<string, unknown> = {};
  const own: Record<Situation, Record<string, unknown>> = { renter: {}, owner: {} };
  for (const [k, v] of Object.entries(top)) (isSituationKey(k) ? own[situation] : shared)[k] = v;
  for (const s of SITUATIONS) {
    // A block's own-situation-only inputs (an owner's balance) are single inputs
    for (const [k, v] of Object.entries(blocks[s])) (isSituationKey(k) ? own[s] : shared)[k] = v;
  }
  const statutory = statutoryInputsFor(
    (shared.firstTaxYear ?? defaults.firstTaxYear) as number,
    (shared.filingStatus ?? defaults.filingStatus) as HousingCalculatorInputs['filingStatus'],
    (shared.inflationRate ?? defaults.inflationRate) as number
  );
  const make = (s: Situation) => {
    const inputs = { ...defaults, ...shared, ...own[s], situation: s } as HousingCalculatorInputs;
    for (const key of TAX_AMOUNT_KEYS) {
      if (!(key in shared)) inputs[key] = statutory[key];
    }
    return inputs;
  };
  const bySituation = { renter: make('renter'), owner: make('owner') };
  const personal: Record<string, unknown> = { ...top };
  for (const s of SITUATIONS) if (Object.keys(blocks[s]).length) personal[s] = blocks[s];
  return { inputs: bySituation[situation], bySituation, personal: personal as PersonalConfig, problems };
};

// Not a settings key (see isSettingsKey), so Reset all keeps it
const PERSONAL_CONFIG_KEY = 'personal-config';

// Saved settings are differences from the starting values, so they only mean
// something against the starting values they were made on. When a personal
// config appears, changes or goes away, saved edits are cleared and the page
// starts from the new values. Without a config (the deployed site) this does
// nothing.
export const syncSavedSettings = (
  storage: KeyValueStorage | null,
  personal: Partial<HousingCalculatorInputs> | null
) => {
  if (!storage) return;
  const current = personal ? JSON.stringify(personal) : undefined;
  if (readPersisted(storage, PERSONAL_CONFIG_KEY) === current) return;
  clearSavedSettings(storage);
  writePersisted(storage, SETTINGS_VERSION_KEY, SETTINGS_VERSION);
  if (current === undefined) removePersisted(storage, PERSONAL_CONFIG_KEY);
  else writePersisted(storage, PERSONAL_CONFIG_KEY, current);
};
