import { describe, it, expect } from 'vitest';
import {
  sanitizeInputValue,
  parseUrlValue,
  sanitizeInputs,
  cleanFloat,
  readPersisted,
  writePersisted,
  migrateSavedSettings,
  clearSavedSettings,
  KeyValueStorage,
  SETTINGS_VERSION_KEY,
  SETTINGS_VERSION,
  NUMBER_RULES,
  BOOLEAN_INPUTS,
} from './inputValidation';
import { DEFAULTS } from '../hooks/useCalculatorInputs';
import { calculateProjectionData } from './financialCalculations';

class MemoryStorage implements KeyValueStorage {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.has(k) ? this.data.get(k)! : null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
  get length() { return this.data.size; }
  key(i: number) { return [...this.data.keys()][i] ?? null; }
}

const throwingStorage: KeyValueStorage = {
  getItem() { throw new Error('SecurityError'); },
  setItem() { throw new Error('SecurityError'); },
  removeItem() { throw new Error('SecurityError'); },
  get length(): number { throw new Error('SecurityError'); },
  key() { throw new Error('SecurityError'); },
};

describe('sanitizeInputValue', () => {
  it('covers every input with a rule', () => {
    for (const key of Object.keys(DEFAULTS)) {
      expect(NUMBER_RULES[key] !== undefined || BOOLEAN_INPUTS.has(key)).toBe(true);
      expect(sanitizeInputValue(key, (DEFAULTS as any)[key])).toBe((DEFAULTS as any)[key]);
    }
  });

  it('rejects NaN, Infinity, null, empty and non-numeric values', () => {
    for (const bad of [NaN, Infinity, -Infinity, null, undefined, '', '  ', 'thirty', '750k', '420,000', {}, true]) {
      expect(sanitizeInputValue('homePrice', bad)).toBeUndefined();
    }
  });

  it('clamps out-of-range values', () => {
    expect(sanitizeInputValue('downPaymentPercent', 150)).toBe(100);
    expect(sanitizeInputValue('mortgageYears', 0)).toBe(1);
    expect(sanitizeInputValue('mortgageYears', -5)).toBe(1);
    expect(sanitizeInputValue('xAxisYears', 1e6)).toBe(50);
  });

  it('rounds integer-only fields (no fractional years)', () => {
    expect(sanitizeInputValue('xAxisYears', 10.1)).toBe(10);
    expect(sanitizeInputValue('xAxisYears', 12.5)).toBe(13);
    expect(sanitizeInputValue('mortgageYears', 15.5)).toBe(16);
  });

  it('removes floating-point residue from +/- clicks', () => {
    let dp = 20.7;
    for (let i = 0; i < 7; i++) dp -= 0.1;
    expect(dp).not.toBe(20);
    expect(sanitizeInputValue('downPaymentPercent', dp)).toBe(20);
    expect(cleanFloat(0.1 + 0.2)).toBe(0.3);
    expect(cleanFloat(5.24)).toBe(5.24);
  });

  it('accepts negative growth rates where allowed', () => {
    expect(sanitizeInputValue('homeAppreciation', -2)).toBe(-2);
    expect(sanitizeInputValue('monthlyRent', -2)).toBe(0);
  });

  it('only accepts real booleans for toggles', () => {
    expect(sanitizeInputValue('includeSellingCosts', true)).toBe(true);
    expect(sanitizeInputValue('includeSellingCosts', 'true')).toBeUndefined();
    expect(sanitizeInputValue('includeSellingCosts', null)).toBeUndefined();
  });
});

describe('parseUrlValue', () => {
  it('parses numbers strictly', () => {
    expect(parseUrlValue('homePrice', '750000')).toBe(750000);
    expect(parseUrlValue('homePrice', '')).toBeUndefined();
    expect(parseUrlValue('homePrice', '750k')).toBeUndefined();
    expect(parseUrlValue('homePrice', '1e309')).toBeUndefined();
    expect(parseUrlValue('homePrice', 'NaN')).toBeUndefined();
    expect(parseUrlValue('xAxisYears', '12.5')).toBe(13);
  });

  it('parses booleans', () => {
    expect(parseUrlValue('includeSellingCosts', 'true')).toBe(true);
    expect(parseUrlValue('includeSellingCosts', '1')).toBe(true);
    expect(parseUrlValue('includeSellingCosts', 'false')).toBe(false);
    expect(parseUrlValue('includeSellingCosts', 'yes')).toBeUndefined();
  });
});

describe('sanitizeInputs', () => {
  it('replaces invalid values with defaults so the engine never sees NaN', () => {
    const dirty = { ...DEFAULTS, homePrice: NaN, investmentReturn: Infinity, PMIRate: null, xAxisYears: 10.1 } as any;
    const clean = sanitizeInputs(dirty, DEFAULTS);
    expect(clean.homePrice).toBe(DEFAULTS.homePrice);
    expect(clean.investmentReturn).toBe(DEFAULTS.investmentReturn);
    expect(clean.PMIRate).toBe(DEFAULTS.PMIRate);
    expect(clean.xAxisYears).toBe(10);
    const data = calculateProjectionData(clean) as any[];
    expect(Array.isArray(data)).toBe(true);
    for (const row of data) expect(Number.isFinite(row.buying)).toBe(true);
  });
});

describe('storage helpers', () => {
  it('never throw when storage is blocked', () => {
    expect(() => readPersisted(throwingStorage, 'housing-homePrice')).not.toThrow();
    expect(readPersisted(throwingStorage, 'housing-homePrice')).toBeUndefined();
    expect(() => writePersisted(throwingStorage, 'housing-homePrice', 1)).not.toThrow();
    expect(() => migrateSavedSettings(throwingStorage)).not.toThrow();
    expect(() => clearSavedSettings(throwingStorage)).not.toThrow();
    expect(() => migrateSavedSettings(null)).not.toThrow();
  });

  it('treats unparseable JSON as missing', () => {
    const s = new MemoryStorage();
    s.setItem('housing-homePrice', '{oops');
    expect(readPersisted(s, 'housing-homePrice')).toBeUndefined();
  });

  it('a stored null (from a NaN) is rejected by the sanitizer, not rendered', () => {
    const s = new MemoryStorage();
    s.setItem('housing-homePrice', 'null');
    expect(sanitizeInputValue('homePrice', readPersisted(s, 'housing-homePrice'))).toBeUndefined();
  });
});

describe('migrateSavedSettings', () => {
  it('drops stored values equal to a past default and keeps real edits', () => {
    const s = new MemoryStorage();
    s.setItem('housing-standardDeduction', '30000'); // old default
    s.setItem('housing-saltCap', '40000'); // old default
    s.setItem('housing-marginalTaxRate', '32'); // old default
    s.setItem('housing-taxRate', '40'); // old COMBINED federal+state default
    s.setItem('housing-rentalIncome', '1500'); // old default
    s.setItem('housing-propertyUtilities', '120'); // old default
    s.setItem('housing-homePrice', '910000'); // a user edit
    s.setItem('housing-marginalTaxRate-other', '5'); // unrelated key
    s.setItem('housing-qualityOfLife', '800'); // obsolete key
    migrateSavedSettings(s);
    for (const k of ['housing-standardDeduction', 'housing-saltCap', 'housing-marginalTaxRate',
      'housing-taxRate', 'housing-rentalIncome', 'housing-propertyUtilities', 'housing-qualityOfLife']) {
      expect(s.getItem(k)).toBeNull();
    }
    expect(s.getItem('housing-homePrice')).toBe('910000');
    expect(s.getItem('housing-marginalTaxRate-other')).toBe('5');
    expect(s.getItem(SETTINGS_VERSION_KEY)).toBe(String(SETTINGS_VERSION));
  });

  it('runs only once', () => {
    const s = new MemoryStorage();
    migrateSavedSettings(s);
    s.setItem('housing-marginalTaxRate', '32'); // chosen by the user after migrating
    migrateSavedSettings(s);
    expect(s.getItem('housing-marginalTaxRate')).toBe('32');
  });

  it('clearSavedSettings removes housing- and payoff- keys only', () => {
    const s = new MemoryStorage();
    s.setItem('housing-homePrice', '1');
    s.setItem('payoff-horizon', '10');
    s.setItem('other-app', 'x');
    clearSavedSettings(s);
    expect(s.length).toBe(1);
    expect(s.getItem('other-app')).toBe('x');
  });
});
