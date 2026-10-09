import { useEffect, useMemo } from 'react';
import { usePersistedState } from './usePersistedState';
import { calculateProjectionData, HousingCalculatorInputs, FilingStatus } from '../lib/financialCalculations';
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
  return Math.max(2026, now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear());
};

// TY2026 statutory amounts by filing status (Rev. Proc. 2025-32; OBBBA SALT
// cap; IRC 163(h)(3)(F) acquisition-debt limit). Picking a filing status sets
// these inputs; the user can still edit them.
export const FILING_STATUS_AMOUNTS: Record<FilingStatus, { standardDeduction: number; saltCap: number; mortgageInterestDeductionCap: number }> = {
  mfj: { standardDeduction: 32200, saltCap: 40400, mortgageInterestDeductionCap: 750000 },
  single: { standardDeduction: 16100, saltCap: 40400, mortgageInterestDeductionCap: 750000 },
  hoh: { standardDeduction: 24150, saltCap: 40400, mortgageInterestDeductionCap: 750000 },
  mfs: { standardDeduction: 16100, saltCap: 20200, mortgageInterestDeductionCap: 375000 },
};

// General defaults (married filing jointly, tax year 2026). Only values that
// differ from these are saved, so changing a default here reaches every
// visitor who hasn't edited that field. If a stored value could be mistaken
// for a user's edit, add the old default to HISTORICAL_DEFAULTS and bump
// SETTINGS_VERSION in lib/inputValidation.ts.
export const DEFAULTS: HousingCalculatorInputs = {
  annualSalaryBeforeTax: 420000,
  // Federal INCOME tax only: TY2026 MFJ tax on $420k less the $32,200 standard
  // deduction is $78,268 (18.6%). Payroll taxes are computed separately.
  effectiveFederalTaxRate: 18.6,
  standardDeduction: 32200, // TY2026 MFJ (IRS Rev. Proc. 2025-32)
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
  inflationRate: 3.0,
  propertyTaxAssessmentCap: 2,
  xAxisYears: 30,
  mortgageInterestDeductionCap: 750000,
  saltCap: 40400, // TY2026 (OBBBA: $40k for 2025, indexed +1%/yr through 2029)
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
  firstTaxYear: defaultFirstTaxYear(),
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

// CustomEvent name -> state property name (from MortgagePayoffOptimizer)
const EVENT_MAP: Record<string, InputKey> = {
  updateInvestmentReturn: 'investmentReturn',
  updateMortgageRate: 'effectiveMortgageRate',
  updateFederalTaxRate: 'effectiveFederalTaxRate',
  updateStateTaxRate: 'effectiveStateIncomeTaxRate',
  updateInflationRate: 'inflationRate',
  updateHomePrice: 'homePrice',
  updateDownPayment: 'downPaymentPercent',
  updateMortgageYears: 'mortgageYears',
  updateHomeAppreciation: 'homeAppreciation',
  updatePropertyTaxRate: 'propertyTaxRate',
  updateSalaryGrowth: 'salaryGrowthRate',
  updatePMIRate: 'PMIRate',
  updateAnnualSalary: 'annualSalaryBeforeTax',
  updateStandardDeduction: 'standardDeduction',
  updateSaltCap: 'saltCap',
  updateMortgageInterestCap: 'mortgageInterestDeductionCap',
};

const setterName = (key: string) => `set${key[0].toUpperCase()}${key.slice(1)}`;

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

  // Cross-page parameter updates via CustomEvents (from MortgagePayoffOptimizer).
  // Values are sanitized by the setters; invalid ones are ignored.
  useEffect(() => {
    const handlers = Object.entries(EVENT_MAP).map(([eventName, stateKey]) => {
      const handler = (e: CustomEvent) => setterMap[stateKey](e.detail.value);
      window.addEventListener(eventName, handler as EventListener);
      return [eventName, handler] as const;
    });
    return () => {
      handlers.forEach(([eventName, handler]) => {
        window.removeEventListener(eventName, handler as EventListener);
      });
    };
  }, []);

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

  const resetToDefaults = () => {
    const storage = getBrowserStorage();
    clearSavedSettings(storage);
    writePersisted(storage, SETTINGS_VERSION_KEY, SETTINGS_VERSION);
    for (const name of INPUT_NAMES) setterMap[name](DEFAULTS[name]);
  };

  const handleShare = () => {
    const params = new URLSearchParams();
    for (const name of INPUT_NAMES) {
      params.append(INPUT_KEYS[name][1], String(inputs[name]));
    }
    const shareUrl = `${window.location.origin}/?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const inputCardProps: Record<string, any> = {};
  for (const name of INPUT_NAMES) {
    inputCardProps[name] = state[name];
    inputCardProps[setterName(name)] = setterMap[name];
  }
  // Changing filing status also sets that status's statutory amounts
  inputCardProps.setFilingStatus = (status: FilingStatus) => {
    const amounts = FILING_STATUS_AMOUNTS[status];
    if (!amounts) return;
    setterMap.filingStatus(status);
    setterMap.standardDeduction(amounts.standardDeduction);
    setterMap.saltCap(amounts.saltCap);
    setterMap.mortgageInterestDeductionCap(amounts.mortgageInterestDeductionCap);
  };

  return {
    inputs,
    projectionData,
    resetToDefaults,
    handleShare,
    inputCardProps,
  };
};
