import { useEffect, useMemo } from 'react';
import { usePersistedState } from './usePersistedState';
import { calculateProjectionData, HousingCalculatorInputs } from '../lib/financialCalculations';
import { FilingStatus, statutoryInputsFor, FIRST_PUBLISHED_TAX_YEAR } from '../lib/taxLaw';
import {
  sanitizeInputValue,
  parseUrlValue,
  getBrowserStorage,
  clearSavedSettings,
  writePersisted,
  SETTINGS_VERSION_KEY,
  SETTINGS_VERSION,
} from '../lib/inputValidation';

// Tax year that most of the first 12 months of ownership falls in, for a
// purchase made now: a closing in the second half of the year is mostly next
// year's taxes.
const defaultFirstTaxYear = () => {
  const now = new Date();
  return Math.max(FIRST_PUBLISHED_TAX_YEAR, now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear());
};

const DEFAULT_INFLATION = 3.0;
const DEFAULT_TAX_YEAR = defaultFirstTaxYear();
// Standard deduction, SALT cap and interest cap for the default tax year,
// from the table in lib/taxLaw.ts
const DEFAULT_TAX_AMOUNTS = statutoryInputsFor(DEFAULT_TAX_YEAR, 'mfj', DEFAULT_INFLATION);

// General defaults (married filing jointly). Only values that
// differ from these are saved, so changing a default here reaches every
// visitor who hasn't edited that field. If a stored value could be mistaken
// for a user's edit, add the old default to HISTORICAL_DEFAULTS and bump
// SETTINGS_VERSION in lib/inputValidation.ts.
export const DEFAULTS: HousingCalculatorInputs = {
  annualSalaryBeforeTax: 420000,
  // Federal INCOME tax only: TY2026 MFJ tax on $420k less the $32,200 standard
  // deduction is $78,268 (18.6%). Payroll taxes are computed separately.
  effectiveFederalTaxRate: 18.6,
  standardDeduction: DEFAULT_TAX_AMOUNTS.standardDeduction,
  initialInvestment: 1500000,
  monthlyMiscExpenses: 1000,
  homePrice: 750000,
  downPaymentPercent: 40,
  effectiveMortgageRate: 5.24,
  mortgageYears: 30,
  PMIRate: 0.8,
  propertyTaxRate: 1.14,
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
  inflationRate: DEFAULT_INFLATION,
  propertyTaxAssessmentCap: 2,
  xAxisYears: 30,
  mortgageInterestDeductionCap: DEFAULT_TAX_AMOUNTS.mortgageInterestDeductionCap,
  saltCap: DEFAULT_TAX_AMOUNTS.saltCap,
  effectiveStateIncomeTaxRate: 7.5,
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
  firstTaxYear: DEFAULT_TAX_YEAR,
  filingStatus: 'mfj',
};

type InputKey = keyof HousingCalculatorInputs;

// State property -> [localStorage key, URL parameter]. Listed in display order.
const INPUT_KEYS: Record<InputKey, [string, string]> = {
  annualSalaryBeforeTax: ['housing-annualSalary', 'annualSalary'],
  effectiveFederalTaxRate: ['housing-taxRate', 'taxRate'],
  standardDeduction: ['housing-standardDeduction', 'standardDeduction'],
  initialInvestment: ['housing-initialInvestment', 'initialInvestment'],
  monthlyMiscExpenses: ['housing-miscExpenses', 'miscExpenses'],
  homePrice: ['housing-homePrice', 'homePrice'],
  downPaymentPercent: ['housing-downPayment', 'downPayment'],
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

export interface TaxOverridePrompt {
  key: 'standardDeduction' | 'saltCap' | 'mortgageInterestDeductionCap';
  current: number;
  next: number;
}

const TAX_AMOUNT_KEYS = ['standardDeduction', 'saltCap', 'mortgageInterestDeductionCap'] as const;

export const useCalculatorInputs = () => {
  // One persisted, sanitized state per input. INPUT_NAMES is a constant, so
  // the hook order is stable across renders.
  const state = {} as Record<InputKey, any>;
  const setterMap = {} as Record<InputKey, (value: any) => void>;
  for (const name of INPUT_NAMES) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = usePersistedState<any>(
      INPUT_KEYS[name][0],
      DEFAULTS[name],
      (raw) => sanitizeInputValue(name, raw)
    );
    state[name] = value;
    setterMap[name] = setValue;
  }

  // Load URL parameters on mount, then drop them from the address bar so a
  // reload doesn't re-apply the link over later edits.
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.toString()) return;
    for (const name of INPUT_NAMES) {
      const raw = urlParams.get(INPUT_KEYS[name][1]);
      if (raw === null) continue;
      const value = parseUrlValue(name, raw);
      if (value !== undefined) setterMap[name](value);
    }
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
    } catch {
      // ignore (e.g. sandboxed frames)
    }
  }, []);

  // Single source of truth for the inputs object
  const stateValues = INPUT_NAMES.map(name => state[name]);
  const inputs: HousingCalculatorInputs = useMemo(
    () => ({ ...state }) as HousingCalculatorInputs,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    stateValues
  );

  const projectionData = useMemo(() => calculateProjectionData(inputs), [inputs]);

  const changedKeys = useMemo(
    () => INPUT_NAMES.filter(name => !Object.is(inputs[name], DEFAULTS[name])),
    [inputs]
  );

  const setInput = (key: InputKey, value: unknown) => setterMap[key](value);
  const setMany = (values: Partial<HousingCalculatorInputs>) => {
    for (const [key, value] of Object.entries(values)) setterMap[key as InputKey](value);
  };
  const resetField = (key: InputKey) => setterMap[key](DEFAULTS[key]);

  // Resets every input; returns the previous inputs so the caller can undo.
  const resetAll = (): HousingCalculatorInputs => {
    const previous = { ...inputs };
    const storage = getBrowserStorage();
    clearSavedSettings(storage);
    writePersisted(storage, SETTINGS_VERSION_KEY, SETTINGS_VERSION);
    for (const name of INPUT_NAMES) setterMap[name](DEFAULTS[name]);
    return previous;
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

  // Tax year and filing status fill in that year's statutory amounts from the
  // table in lib/taxLaw.ts. Fields still at the statutory amount for the
  // previous year/status update automatically; customized ones are returned
  // so the UI can ask before overwriting them.
  const applyTaxAmounts = (fromYear: number, fromStatus: FilingStatus, toYear: number, toStatus: FilingStatus): TaxOverridePrompt[] => {
    const before = statutoryInputsFor(fromYear, fromStatus, state.inflationRate);
    const after = statutoryInputsFor(toYear, toStatus, state.inflationRate);
    const prompts: TaxOverridePrompt[] = [];
    for (const key of TAX_AMOUNT_KEYS) {
      if (Math.abs(state[key] - before[key]) < 0.5) {
        setterMap[key](after[key]);
      } else if (Math.abs(state[key] - after[key]) >= 0.5) {
        prompts.push({ key, current: state[key], next: after[key] });
      }
    }
    return prompts;
  };
  const changeTaxYear = (year: number) => {
    setterMap.firstTaxYear(year);
    return applyTaxAmounts(state.firstTaxYear, state.filingStatus, year, state.filingStatus);
  };
  const changeFilingStatus = (status: FilingStatus) => {
    setterMap.filingStatus(status);
    return applyTaxAmounts(state.firstTaxYear, state.filingStatus, state.firstTaxYear, status);
  };

  return {
    inputs,
    projectionData,
    changedKeys,
    setInput,
    setMany,
    resetField,
    resetAll,
    share,
    changeTaxYear,
    changeFilingStatus,
  };
};
