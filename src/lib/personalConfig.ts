import type { HousingCalculatorInputs } from './financialCalculations';
import { statutoryInputsFor } from './taxLaw';
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

export interface StartingInputs {
  inputs: HousingCalculatorInputs;
  // The values the config set, after validation; null without a config
  personal: Partial<HousingCalculatorInputs> | null;
  // Entries that were skipped or adjusted, for a console warning
  problems: string[];
}

// Overlays a personal config on the defaults. Unknown keys and invalid values
// are skipped; out-of-range numbers are clamped, as for every other input
// path. Both are reported. The statutory tax amounts follow the config's tax
// year, filing status and inflation rate unless it sets them itself.
export const startingInputs = (
  defaults: HousingCalculatorInputs,
  config: Record<string, unknown> | null
): StartingInputs => {
  if (!config) return { inputs: defaults, personal: null, problems: [] };
  const personal: Record<string, unknown> = {};
  const problems: string[] = [];
  for (const [key, raw] of Object.entries(config)) {
    const known = key in defaults;
    const clean = known ? sanitizeInputValue(key, raw) : undefined;
    if (clean === undefined) {
      problems.push(`${key}: ${JSON.stringify(raw)} skipped (${known ? 'invalid value' : 'unknown input'})`);
      continue;
    }
    if (!Object.is(clean, raw)) problems.push(`${key}: ${JSON.stringify(raw)} read as ${JSON.stringify(clean)}`);
    personal[key] = clean;
  }
  const inputs = { ...defaults, ...personal } as HousingCalculatorInputs;
  const statutory = statutoryInputsFor(inputs.firstTaxYear, inputs.filingStatus, inputs.inflationRate);
  for (const key of TAX_AMOUNT_KEYS) {
    if (!(key in personal)) inputs[key] = statutory[key];
  }
  return { inputs, personal: personal as Partial<HousingCalculatorInputs>, problems };
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
