import { useEffect, useMemo } from 'react';
import { usePersistedState } from './usePersistedState';
import { calculateProjectionData, HousingCalculatorInputs } from '../lib/financialCalculations';

const DEFAULTS = {
  annualSalaryBeforeTax: 420000,
  effectiveFederalTaxRate: 19.1,
  standardDeduction: 30000,
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
  monthlyRent: 3000,
  monthlyRentalIncome: 1500,
  rentDeposit: 1000,
  movingCostBuying: 0,
  movingCostRenting: 0,
  monthlyRenterInsurance: 25,
  monthlyRentUtilities: 300,
  monthlyPropertyUtilities: 120,
  homeAppreciation: 4.5,
  investmentReturn: 11.71,
  rentIncrease: 4.5,
  salaryGrowthRate: 2.4,
  inflationRate: 3.0,
  propertyTaxAssessmentCap: 2,
  xAxisYears: 30,
  mortgageInterestDeductionCap: 750000,
  saltCap: 40000,
  effectiveStateIncomeTaxRate: 7.5,
  marginalFederalTaxRate: 32,
  useMarginalTaxRate: true,
  melloRoosGrowsWithAssessment: false,
  includeSellingCosts: false,
  sellingCostPercent: 6,
  annualInvestmentTaxDrag: 0.2,
};

// URL param name -> state property name
const URL_PARAM_MAP: Record<string, string> = {
  annualSalary: 'annualSalaryBeforeTax',
  taxRate: 'effectiveFederalTaxRate',
  standardDeduction: 'standardDeduction',
  initialInvestment: 'initialInvestment',
  miscExpenses: 'monthlyMiscExpenses',
  homePrice: 'homePrice',
  downPayment: 'downPaymentPercent',
  mortgageRate: 'effectiveMortgageRate',
  mortgageYears: 'mortgageYears',
  PMIRate: 'PMIRate',
  propertyTaxRate: 'propertyTaxRate',
  melloRoosTaxRate: 'melloRoosTaxRate',
  closingCost: 'closingCostPercent',
  maintenanceRate: 'annualMaintenanceRate',
  hoaFee: 'monthlyHOAFee',
  homeInsurance: 'monthlyHomeInsurance',
  monthlyRent: 'monthlyRent',
  rentalIncome: 'monthlyRentalIncome',
  rentDeposit: 'rentDeposit',
  movingCostBuy: 'movingCostBuying',
  movingCostRent: 'movingCostRenting',
  renterInsurance: 'monthlyRenterInsurance',
  rentUtilities: 'monthlyRentUtilities',
  propertyUtilities: 'monthlyPropertyUtilities',
  appreciation: 'homeAppreciation',
  investmentReturn: 'investmentReturn',
  rentIncrease: 'rentIncrease',
  salaryGrowth: 'salaryGrowthRate',
  inflationRate: 'inflationRate',
  taxAssessmentCap: 'propertyTaxAssessmentCap',
  xAxisYears: 'xAxisYears',
  mortgageInterestCap: 'mortgageInterestDeductionCap',
  saltCap: 'saltCap',
  effectiveStateIncomeTaxRate: 'effectiveStateIncomeTaxRate',
  marginalTaxRate: 'marginalFederalTaxRate',
  useMarginalTaxRate: 'useMarginalTaxRate',
  melloRoosGrows: 'melloRoosGrowsWithAssessment',
  includeSellingCosts: 'includeSellingCosts',
  sellingCostPercent: 'sellingCostPercent',
  investmentTaxDrag: 'annualInvestmentTaxDrag',
};

// Reverse: state property name -> URL param name
const STATE_TO_URL_PARAM = Object.fromEntries(
  Object.entries(URL_PARAM_MAP).map(([urlParam, stateKey]) => [stateKey, urlParam])
);

// Boolean URL params need special parsing (not parseFloat)
const BOOLEAN_URL_PARAMS = new Set(['useMarginalTaxRate', 'melloRoosGrows', 'includeSellingCosts']);

// CustomEvent name -> state property name
const EVENT_MAP: Record<string, string> = {
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

export const useCalculatorInputs = () => {
  // Core Financial Inputs
  const [annualSalaryBeforeTax, setAnnualSalaryBeforeTax] = usePersistedState('housing-annualSalary', DEFAULTS.annualSalaryBeforeTax);
  const [effectiveFederalTaxRate, setEffectiveFederalTaxRate] = usePersistedState('housing-taxRate', DEFAULTS.effectiveFederalTaxRate);
  const [standardDeduction, setStandardDeduction] = usePersistedState('housing-standardDeduction', DEFAULTS.standardDeduction);
  const [initialInvestment, setInitialInvestment] = usePersistedState('housing-initialInvestment', DEFAULTS.initialInvestment);
  const [monthlyMiscExpenses, setMonthlyMiscExpenses] = usePersistedState('housing-miscExpenses', DEFAULTS.monthlyMiscExpenses);

  // Property Details
  const [homePrice, setHomePrice] = usePersistedState('housing-homePrice', DEFAULTS.homePrice);
  const [downPaymentPercent, setDownPaymentPercent] = usePersistedState('housing-downPayment', DEFAULTS.downPaymentPercent);
  const [effectiveMortgageRate, setEffectiveMortgageRate] = usePersistedState('housing-mortgageRate', DEFAULTS.effectiveMortgageRate);
  const [mortgageYears, setMortgageYears] = usePersistedState('housing-mortgageYears', DEFAULTS.mortgageYears);
  const [PMIRate, setPMIRate] = usePersistedState('housing-PMIRate', DEFAULTS.PMIRate);
  const [propertyTaxRate, setPropertyTaxRate] = usePersistedState('housing-propertyTaxRate', DEFAULTS.propertyTaxRate);
  const [melloRoosTaxRate, setMelloRoosTaxRate] = usePersistedState('housing-melloRoosTaxRate', DEFAULTS.melloRoosTaxRate);
  const [closingCostPercent, setClosingCostPercent] = usePersistedState('housing-closingCost', DEFAULTS.closingCostPercent);
  const [annualMaintenanceRate, setannualMaintenanceRate] = usePersistedState('housing-maintenanceRate', DEFAULTS.annualMaintenanceRate);
  const [monthlyHOAFee, setMonthlyHOAFee] = usePersistedState('housing-hoaFee', DEFAULTS.monthlyHOAFee);
  const [monthlyHomeInsurance, setMonthlyHomeInsurance] = usePersistedState('housing-homeInsurance', DEFAULTS.monthlyHomeInsurance);

  // Rental Related
  const [monthlyRent, setMonthlyRent] = usePersistedState('housing-monthlyRent', DEFAULTS.monthlyRent);
  const [monthlyRentalIncome, setMonthlyRentalIncome] = usePersistedState('housing-rentalIncome', DEFAULTS.monthlyRentalIncome);
  const [rentDeposit, setRentDeposit] = usePersistedState('housing-rentDeposit', DEFAULTS.rentDeposit);

  // One-time Moving Costs
  const [movingCostBuying, setMovingCostBuying] = usePersistedState('housing-movingCostBuy', DEFAULTS.movingCostBuying);
  const [movingCostRenting, setMovingCostRenting] = usePersistedState('housing-movingCostRent', DEFAULTS.movingCostRenting);

  // Monthly Recurring Expenses
  const [monthlyRenterInsurance, setMonthlyRenterInsurance] = usePersistedState('housing-renterInsurance', DEFAULTS.monthlyRenterInsurance);
  const [monthlyRentUtilities, setMonthlyRentUtilities] = usePersistedState('housing-rentUtilities', DEFAULTS.monthlyRentUtilities);
  const [monthlyPropertyUtilities, setMonthlyPropertyUtilities] = usePersistedState('housing-propertyUtilities', DEFAULTS.monthlyPropertyUtilities);

  // Annual Growth/Return Rates
  const [homeAppreciation, setHomeAppreciation] = usePersistedState('housing-appreciation', DEFAULTS.homeAppreciation);
  const [investmentReturn, setInvestmentReturn] = usePersistedState('housing-investmentReturn', DEFAULTS.investmentReturn);
  const [rentIncrease, setRentIncrease] = usePersistedState('housing-rentIncrease', DEFAULTS.rentIncrease);
  const [salaryGrowthRate, setSalaryGrowthRate] = usePersistedState('housing-salaryGrowth', DEFAULTS.salaryGrowthRate);
  const [inflationRate, setInflationRate] = usePersistedState('housing-inflationRate', DEFAULTS.inflationRate);
  const [propertyTaxAssessmentCap, setPropertyTaxAssessmentCap] = usePersistedState('housing-taxAssessmentCap', DEFAULTS.propertyTaxAssessmentCap);

  // Visualization / Tax
  const [xAxisYears, setXAxisYears] = usePersistedState('housing-xAxisYears', DEFAULTS.xAxisYears);
  const [mortgageInterestDeductionCap, setMortgageInterestDeductionCap] = usePersistedState('housing-mortgageInterestCap', DEFAULTS.mortgageInterestDeductionCap);
  const [saltCap, setSaltCap] = usePersistedState('housing-saltCap', DEFAULTS.saltCap);
  const [effectiveStateIncomeTaxRate, setEffectiveStateIncomeTaxRate] = usePersistedState('housing-effectiveStateIncomeTaxRate', DEFAULTS.effectiveStateIncomeTaxRate);

  // Model settings
  const [marginalFederalTaxRate, setMarginalFederalTaxRate] = usePersistedState('housing-marginalTaxRate', DEFAULTS.marginalFederalTaxRate);
  const [useMarginalTaxRate, setUseMarginalTaxRate] = usePersistedState('housing-useMarginalTaxRate', DEFAULTS.useMarginalTaxRate);
  const [melloRoosGrowsWithAssessment, setMelloRoosGrowsWithAssessment] = usePersistedState('housing-melloRoosGrows', DEFAULTS.melloRoosGrowsWithAssessment);
  const [includeSellingCosts, setIncludeSellingCosts] = usePersistedState('housing-includeSellingCosts', DEFAULTS.includeSellingCosts);
  const [sellingCostPercent, setSellingCostPercent] = usePersistedState('housing-sellingCostPercent', DEFAULTS.sellingCostPercent);
  const [annualInvestmentTaxDrag, setAnnualInvestmentTaxDrag] = usePersistedState('housing-investmentTaxDrag', DEFAULTS.annualInvestmentTaxDrag);

  // Lookup table for data-driven operations (useState setters are stable across renders)
  const setterMap: Record<string, (value: any) => void> = {
    annualSalaryBeforeTax: setAnnualSalaryBeforeTax,
    effectiveFederalTaxRate: setEffectiveFederalTaxRate,
    standardDeduction: setStandardDeduction,
    initialInvestment: setInitialInvestment,
    monthlyMiscExpenses: setMonthlyMiscExpenses,
    homePrice: setHomePrice,
    downPaymentPercent: setDownPaymentPercent,
    effectiveMortgageRate: setEffectiveMortgageRate,
    mortgageYears: setMortgageYears,
    PMIRate: setPMIRate,
    propertyTaxRate: setPropertyTaxRate,
    melloRoosTaxRate: setMelloRoosTaxRate,
    closingCostPercent: setClosingCostPercent,
    annualMaintenanceRate: setannualMaintenanceRate,
    monthlyHOAFee: setMonthlyHOAFee,
    monthlyHomeInsurance: setMonthlyHomeInsurance,
    monthlyRent: setMonthlyRent,
    monthlyRentalIncome: setMonthlyRentalIncome,
    rentDeposit: setRentDeposit,
    movingCostBuying: setMovingCostBuying,
    movingCostRenting: setMovingCostRenting,
    monthlyRenterInsurance: setMonthlyRenterInsurance,
    monthlyRentUtilities: setMonthlyRentUtilities,
    monthlyPropertyUtilities: setMonthlyPropertyUtilities,
    homeAppreciation: setHomeAppreciation,
    investmentReturn: setInvestmentReturn,
    rentIncrease: setRentIncrease,
    salaryGrowthRate: setSalaryGrowthRate,
    inflationRate: setInflationRate,
    propertyTaxAssessmentCap: setPropertyTaxAssessmentCap,
    xAxisYears: setXAxisYears,
    mortgageInterestDeductionCap: setMortgageInterestDeductionCap,
    saltCap: setSaltCap,
    effectiveStateIncomeTaxRate: setEffectiveStateIncomeTaxRate,
    marginalFederalTaxRate: setMarginalFederalTaxRate,
    useMarginalTaxRate: setUseMarginalTaxRate,
    melloRoosGrowsWithAssessment: setMelloRoosGrowsWithAssessment,
    includeSellingCosts: setIncludeSellingCosts,
    sellingCostPercent: setSellingCostPercent,
    annualInvestmentTaxDrag: setAnnualInvestmentTaxDrag,
  };

  // Cross-page parameter updates via CustomEvents (from MortgagePayoffOptimizer)
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

  // Load URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (!urlParams.toString()) return;
    Object.entries(URL_PARAM_MAP).forEach(([urlParam, stateKey]) => {
      const value = urlParams.get(urlParam);
      if (value !== null) {
        if (BOOLEAN_URL_PARAMS.has(urlParam)) {
          setterMap[stateKey](value === 'true' || value === '1');
        } else {
          setterMap[stateKey](parseFloat(value));
        }
      }
    });
  }, []);

  // Single source of truth for the inputs object
  const inputs: HousingCalculatorInputs = useMemo(() => ({
    annualSalaryBeforeTax, effectiveFederalTaxRate, standardDeduction,
    initialInvestment, monthlyMiscExpenses, homePrice, downPaymentPercent,
    effectiveMortgageRate, mortgageYears, PMIRate, propertyTaxRate,
    melloRoosTaxRate, closingCostPercent, annualMaintenanceRate,
    monthlyHOAFee, monthlyHomeInsurance, monthlyRent, monthlyRentalIncome,
    rentDeposit, movingCostBuying, movingCostRenting, monthlyRenterInsurance,
    monthlyRentUtilities, monthlyPropertyUtilities, homeAppreciation,
    investmentReturn, rentIncrease, salaryGrowthRate, inflationRate,
    propertyTaxAssessmentCap, xAxisYears, mortgageInterestDeductionCap,
    saltCap, effectiveStateIncomeTaxRate,
    marginalFederalTaxRate, useMarginalTaxRate, melloRoosGrowsWithAssessment,
    includeSellingCosts, sellingCostPercent, annualInvestmentTaxDrag,
  }), [
    annualSalaryBeforeTax, effectiveFederalTaxRate, standardDeduction,
    initialInvestment, monthlyMiscExpenses, homePrice, downPaymentPercent,
    effectiveMortgageRate, mortgageYears, PMIRate, propertyTaxRate,
    melloRoosTaxRate, closingCostPercent, annualMaintenanceRate,
    monthlyHOAFee, monthlyHomeInsurance, monthlyRent, monthlyRentalIncome,
    rentDeposit, movingCostBuying, movingCostRenting, monthlyRenterInsurance,
    monthlyRentUtilities, monthlyPropertyUtilities, homeAppreciation,
    investmentReturn, rentIncrease, salaryGrowthRate, inflationRate,
    propertyTaxAssessmentCap, xAxisYears, mortgageInterestDeductionCap,
    saltCap, effectiveStateIncomeTaxRate,
    marginalFederalTaxRate, useMarginalTaxRate, melloRoosGrowsWithAssessment,
    includeSellingCosts, sellingCostPercent, annualInvestmentTaxDrag,
  ]);

  const projectionData = useMemo(() => calculateProjectionData(inputs), [inputs]);

  const resetToDefaults = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('housing-')) localStorage.removeItem(key);
    });
    Object.entries(DEFAULTS).forEach(([key, value]) => setterMap[key](value));
  };

  const handleShare = () => {
    const params = new URLSearchParams();
    Object.entries(STATE_TO_URL_PARAM).forEach(([stateKey, urlParam]) => {
      params.append(urlParam, String(inputs[stateKey as keyof HousingCalculatorInputs]));
    });
    const shareUrl = `${window.location.origin}/?${params.toString()}`;
    navigator.clipboard.writeText(shareUrl);
  };

  return {
    inputs,
    projectionData,
    resetToDefaults,
    handleShare,
    inputCardProps: {
      initialInvestment, setInitialInvestment,
      annualSalaryBeforeTax, setAnnualSalaryBeforeTax,
      effectiveFederalTaxRate, setEffectiveFederalTaxRate,
      standardDeduction, setStandardDeduction,
      monthlyMiscExpenses, setMonthlyMiscExpenses,
      mortgageInterestDeductionCap, setMortgageInterestDeductionCap,
      saltCap, setSaltCap,
      effectiveStateIncomeTaxRate, setEffectiveStateIncomeTaxRate,
      homePrice, setHomePrice,
      downPaymentPercent, setDownPaymentPercent,
      closingCostPercent, setClosingCostPercent,
      effectiveMortgageRate, setEffectiveMortgageRate,
      PMIRate, setPMIRate,
      propertyTaxRate, setPropertyTaxRate,
      melloRoosTaxRate, setMelloRoosTaxRate,
      annualMaintenanceRate, setannualMaintenanceRate,
      monthlyHOAFee, setMonthlyHOAFee,
      monthlyHomeInsurance, setMonthlyHomeInsurance,
      monthlyPropertyUtilities, setMonthlyPropertyUtilities,
      monthlyRentalIncome, setMonthlyRentalIncome,
      movingCostBuying, setMovingCostBuying,
      mortgageYears, setMortgageYears,
      monthlyRent, setMonthlyRent,
      rentDeposit, setRentDeposit,
      monthlyRentUtilities, setMonthlyRentUtilities,
      monthlyRenterInsurance, setMonthlyRenterInsurance,
      movingCostRenting, setMovingCostRenting,
      xAxisYears, setXAxisYears,
      homeAppreciation, setHomeAppreciation,
      investmentReturn, setInvestmentReturn,
      rentIncrease, setRentIncrease,
      salaryGrowthRate, setSalaryGrowthRate,
      inflationRate, setInflationRate,
      propertyTaxAssessmentCap, setPropertyTaxAssessmentCap,
      marginalFederalTaxRate, setMarginalFederalTaxRate,
      useMarginalTaxRate, setUseMarginalTaxRate,
      melloRoosGrowsWithAssessment, setMelloRoosGrowsWithAssessment,
      includeSellingCosts, setIncludeSellingCosts,
      sellingCostPercent, setSellingCostPercent,
      annualInvestmentTaxDrag, setAnnualInvestmentTaxDrag,
    },
  };
};
