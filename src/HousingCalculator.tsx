// File: src/HousingCalculator.tsx
import React, { useState, useMemo, useEffect } from "react";
import { AffordabilityCheck } from './components/AffordabilityCheck';
import { DetailedMathCard } from './components/DetailedMathCard';
import SankeyWealthFlow from './components/SankeyWealthFlow';
import MortgageAmortizationChart from './components/MortgageAmortizationChart';
import InputCards from './components/InputCards';
import { usePersistedState } from './hooks/usePersistedState';
import { calculateProjectionData, HousingCalculatorInputs } from './lib/financialCalculations';
import { WealthSummary } from './components/WealthSummary';
import { ActionButtons } from './components/ActionButtons';
import { ScenarioTabs } from './components/ScenarioTabs';
import { NetWorthChart } from './components/NetWorthChart';
import { NetWorthTable } from './components/NetWorthTable';
import { TaxSavingsSummary } from './components/TaxSavingsSummary';
import { MortgagePayoffOptimizer } from './components/MortgagePayoffOptimizer';

const HousingCalculator = () => {
  const [activeScenario, setActiveScenario] = useState('buying');
  const [showCopied, setShowCopied] = useState(false);
  const [currentPage, setCurrentPage] = useState('calculator');

  // Core Financial Inputs
  const [annualSalaryBeforeTax, setAnnualSalaryBeforeTax] = usePersistedState('housing-annualSalary', 120000);
  const [effectiveFederalTaxRate, setEffectiveFederalTaxRate] = usePersistedState('housing-taxRate', 18);
  const [standardDeduction, setStandardDeduction] = usePersistedState('housing-standardDeduction', 20550);
  const [initialInvestment, setInitialInvestment] = usePersistedState('housing-initialInvestment', 250000);
  const [monthlyMiscExpenses, setMonthlyMiscExpenses] = usePersistedState('housing-miscExpenses', 1000);

  // Property Details
  const [homePrice, setHomePrice] = usePersistedState('housing-homePrice', 400000);
  const [downPaymentPercent, setDownPaymentPercent] = usePersistedState('housing-downPayment', 20);
  const [effectiveMortgageRate, setEffectiveMortgageRate] = usePersistedState('housing-mortgageRate', 6.8);
  const [mortgageYears, setMortgageYears] = usePersistedState('housing-mortgageYears', 30);
  const [PMIRate, setPMIRate] = usePersistedState('housing-PMIRate', 0.8);
  const [propertyTaxRate, setPropertyTaxRate] = usePersistedState('housing-propertyTaxRate', 1.15);
  const [melloRoosTaxRate, setMelloRoosTaxRate] = usePersistedState('housing-melloRoosTaxRate', 0.0);
  const [closingCostPercent, setClosingCostPercent] = usePersistedState('housing-closingCost', 2.5);
  const [annualMaintenanceRate, setannualMaintenanceRate] = usePersistedState('housing-maintenanceRate', .5);
  const [monthlyHOAFee, setMonthlyHOAFee] = usePersistedState('housing-hoaFee', 150);
  const [monthlyHomeInsurance, setMonthlyHomeInsurance] = usePersistedState('housing-homeInsurance', 200);

  // Rental Related
  const [monthlyRent, setMonthlyRent] = usePersistedState('housing-monthlyRent', 2600);
  const [monthlyRentalIncome, setMonthlyRentalIncome] = usePersistedState('housing-rentalIncome', 0);
  const [rentDeposit, setRentDeposit] = usePersistedState('housing-rentDeposit', 2600);

  // One-time Moving Costs
  const [movingCostBuying, setMovingCostBuying] = usePersistedState('housing-movingCostBuy', 3500);
  const [movingCostRenting, setMovingCostRenting] = usePersistedState('housing-movingCostRent', 2000);

  // Monthly Recurring Expenses
  const [monthlyRenterInsurance, setMonthlyRenterInsurance] = usePersistedState('housing-renterInsurance', 25);
  const [monthlyRentUtilities, setMonthlyRentUtilities] = usePersistedState('housing-rentUtilities', 120);
  const [monthlyPropertyUtilities, setMonthlyPropertyUtilities] = usePersistedState('housing-propertyUtilities', 220);
  const [monthlyQualityOfLife, setMonthlyQualityOfLife] = usePersistedState('housing-qualityOfLife', 800);

  // Annual Growth/Return Rates
  const [homeAppreciation, setHomeAppreciation] = usePersistedState('housing-appreciation', 4.5);
  const [investmentReturn, setInvestmentReturn] = usePersistedState('housing-investmentReturn', 8.5);
  const [rentIncrease, setRentIncrease] = usePersistedState('housing-rentIncrease', 4.5);
  const [salaryGrowthRate, setSalaryGrowthRate] = usePersistedState('housing-salaryGrowth', 3.5);
  const [inflationRate, setInflationRate] = usePersistedState('housing-inflationRate', 3.0);
  const [propertyTaxAssessmentCap, setPropertyTaxAssessmentCap] = usePersistedState('housing-taxAssessmentCap', 2);

  // UI State for visualization
  const [xAxisYears, setXAxisYears] = usePersistedState('housing-xAxisYears', 30);
  const [activePoint, setActivePoint] = useState(null);

  const [mortgageInterestDeductionCap, setMortgageInterestDeductionCap] = usePersistedState('housing-mortgageInterestCap', 750000);
  const [saltCap, setSaltCap] = usePersistedState('housing-saltCap', 40000);
  const [effectiveStateIncomeTaxRate, setEffectiveStateIncomeTaxRate] = usePersistedState('housing-effectiveStateIncomeTaxRate', 6.5);

  // Handle cross-page parameter updates
  useEffect(() => {
    const handleInvestmentReturn = (e: CustomEvent) => setInvestmentReturn(e.detail.value);
    const handleMortgageRate = (e: CustomEvent) => setEffectiveMortgageRate(e.detail.value);
    const handleFederalTaxRate = (e: CustomEvent) => setEffectiveFederalTaxRate(e.detail.value);
    const handleStateTaxRate = (e: CustomEvent) => setEffectiveStateIncomeTaxRate(e.detail.value);
    const handleInflationRate = (e: CustomEvent) => setInflationRate(e.detail.value);
    const handleHomePrice = (e: CustomEvent) => setHomePrice(e.detail.value);
    const handleDownPayment = (e: CustomEvent) => setDownPaymentPercent(e.detail.value);
    const handleMortgageYears = (e: CustomEvent) => setMortgageYears(e.detail.value);
    const handleHomeAppreciation = (e: CustomEvent) => setHomeAppreciation(e.detail.value);
    const handlePropertyTaxRate = (e: CustomEvent) => setPropertyTaxRate(e.detail.value);
    const handleSalaryGrowth = (e: CustomEvent) => setSalaryGrowthRate(e.detail.value);
    const handlePMIRate = (e: CustomEvent) => setPMIRate(e.detail.value);
    const handleAnnualSalary = (e: CustomEvent) => setAnnualSalaryBeforeTax(e.detail.value);
    const handleStandardDeduction = (e: CustomEvent) => setStandardDeduction(e.detail.value);
    const handleSaltCap = (e: CustomEvent) => setSaltCap(e.detail.value);
    const handleMortgageInterestCap = (e: CustomEvent) => setMortgageInterestDeductionCap(e.detail.value);

    window.addEventListener('updateInvestmentReturn', handleInvestmentReturn as EventListener);
    window.addEventListener('updateMortgageRate', handleMortgageRate as EventListener);
    window.addEventListener('updateFederalTaxRate', handleFederalTaxRate as EventListener);
    window.addEventListener('updateStateTaxRate', handleStateTaxRate as EventListener);
    window.addEventListener('updateInflationRate', handleInflationRate as EventListener);
    window.addEventListener('updateHomePrice', handleHomePrice as EventListener);
    window.addEventListener('updateDownPayment', handleDownPayment as EventListener);
    window.addEventListener('updateMortgageYears', handleMortgageYears as EventListener);
    window.addEventListener('updateHomeAppreciation', handleHomeAppreciation as EventListener);
    window.addEventListener('updatePropertyTaxRate', handlePropertyTaxRate as EventListener);
    window.addEventListener('updateSalaryGrowth', handleSalaryGrowth as EventListener);
    window.addEventListener('updatePMIRate', handlePMIRate as EventListener);
    window.addEventListener('updateAnnualSalary', handleAnnualSalary as EventListener);
    window.addEventListener('updateStandardDeduction', handleStandardDeduction as EventListener);
    window.addEventListener('updateSaltCap', handleSaltCap as EventListener);
    window.addEventListener('updateMortgageInterestCap', handleMortgageInterestCap as EventListener);

    return () => {
      window.removeEventListener('updateInvestmentReturn', handleInvestmentReturn as EventListener);
      window.removeEventListener('updateMortgageRate', handleMortgageRate as EventListener);
      window.removeEventListener('updateFederalTaxRate', handleFederalTaxRate as EventListener);
      window.removeEventListener('updateStateTaxRate', handleStateTaxRate as EventListener);
      window.removeEventListener('updateInflationRate', handleInflationRate as EventListener);
      window.removeEventListener('updateHomePrice', handleHomePrice as EventListener);
      window.removeEventListener('updateDownPayment', handleDownPayment as EventListener);
      window.removeEventListener('updateMortgageYears', handleMortgageYears as EventListener);
      window.removeEventListener('updateHomeAppreciation', handleHomeAppreciation as EventListener);
      window.removeEventListener('updatePropertyTaxRate', handlePropertyTaxRate as EventListener);
      window.removeEventListener('updateSalaryGrowth', handleSalaryGrowth as EventListener);
      window.removeEventListener('updatePMIRate', handlePMIRate as EventListener);
      window.removeEventListener('updateAnnualSalary', handleAnnualSalary as EventListener);
      window.removeEventListener('updateStandardDeduction', handleStandardDeduction as EventListener);
      window.removeEventListener('updateSaltCap', handleSaltCap as EventListener);
      window.removeEventListener('updateMortgageInterestCap', handleMortgageInterestCap as EventListener);
    };
  }, []);

  // Read URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.toString()) {
      // Map URL parameters to state setters
      const stateSetters = {
        annualSalary: setAnnualSalaryBeforeTax,
        taxRate: setEffectiveFederalTaxRate,
        standardDeduction: setStandardDeduction,
        initialInvestment: setInitialInvestment,
        miscExpenses: setMonthlyMiscExpenses,
        homePrice: setHomePrice,
        downPayment: setDownPaymentPercent,
        mortgageRate: setEffectiveMortgageRate,
        mortgageYears: setMortgageYears,
        PMIRate: setPMIRate,
        propertyTaxRate: setPropertyTaxRate,
        melloRoosTaxRate: setMelloRoosTaxRate,
        closingCost: setClosingCostPercent,
        maintenanceRate: setannualMaintenanceRate,
        hoaFee: setMonthlyHOAFee,
        homeInsurance: setMonthlyHomeInsurance,
        monthlyRent: setMonthlyRent,
        rentalIncome: setMonthlyRentalIncome,
        rentDeposit: setRentDeposit,
        movingCostBuy: setMovingCostBuying,
        movingCostRent: setMovingCostRenting,
        renterInsurance: setMonthlyRenterInsurance,
        rentUtilities: setMonthlyRentUtilities,
        propertyUtilities: setMonthlyPropertyUtilities,
        qualityOfLife: setMonthlyQualityOfLife,
        appreciation: setHomeAppreciation,
        investmentReturn: setInvestmentReturn,
        rentIncrease: setRentIncrease,
        salaryGrowth: setSalaryGrowthRate,
        inflationRate: setInflationRate,
        taxAssessmentCap: setPropertyTaxAssessmentCap,
        xAxisYears: setXAxisYears,
        mortgageInterestCap: setMortgageInterestDeductionCap,
        saltCap: setSaltCap,
        effectiveStateIncomeTaxRate: setEffectiveStateIncomeTaxRate
      };

      // Apply each parameter from URL
      Object.entries(stateSetters).forEach(([param, setter]) => {
        const value = urlParams.get(param);
        if (value !== null) {
          setter(parseFloat(value));
        }
      });
    }
  }, []); // Only run on mount

  const handleShare = () => {
    const params = new URLSearchParams();

    // Add all current values to URL parameters
    params.append('annualSalary', annualSalaryBeforeTax);
    params.append('taxRate', effectiveFederalTaxRate);
    params.append('standardDeduction', standardDeduction);
    params.append('initialInvestment', initialInvestment);
    params.append('miscExpenses', monthlyMiscExpenses);
    params.append('homePrice', homePrice);
    params.append('downPayment', downPaymentPercent);
    params.append('mortgageRate', effectiveMortgageRate);
    params.append('mortgageYears', mortgageYears);
    params.append('PMIRate', PMIRate);
    params.append('propertyTaxRate', propertyTaxRate);
    params.append('melloRoosTaxRate', melloRoosTaxRate);
    params.append('closingCost', closingCostPercent);
    params.append('maintenanceRate', annualMaintenanceRate);
    params.append('hoaFee', monthlyHOAFee);
    params.append('homeInsurance', monthlyHomeInsurance);
    params.append('monthlyRent', monthlyRent);
    params.append('rentalIncome', monthlyRentalIncome);
    params.append('rentDeposit', rentDeposit);
    params.append('movingCostBuy', movingCostBuying);
    params.append('movingCostRent', movingCostRenting);
    params.append('renterInsurance', monthlyRenterInsurance);
    params.append('rentUtilities', monthlyRentUtilities);
    params.append('propertyUtilities', monthlyPropertyUtilities);
    params.append('qualityOfLife', monthlyQualityOfLife);
    params.append('appreciation', homeAppreciation);
    params.append('investmentReturn', investmentReturn);
    params.append('rentIncrease', rentIncrease);
    params.append('salaryGrowth', salaryGrowthRate);
    params.append('inflationRate', inflationRate);
    params.append('taxAssessmentCap', propertyTaxAssessmentCap);
    params.append('xAxisYears', xAxisYears);
    params.append('mortgageInterestCap', mortgageInterestDeductionCap);
    params.append('saltCap', saltCap);
    params.append('effectiveStateIncomeTaxRate', effectiveStateIncomeTaxRate);

    const shareUrl = `${window.location.origin}/?${params.toString()}`;

    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    });
  };

  const resetToDefaults = () => {
    // Clear the persisted state from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('housing-')) {
        localStorage.removeItem(key);
      }
    });

    // Reset state variables to their initial default values
    setAnnualSalaryBeforeTax(120000);
    setEffectiveFederalTaxRate(18);
    setStandardDeduction(20550);
    setInitialInvestment(250000);
    setMonthlyMiscExpenses(1000);

    setHomePrice(400000);
    setDownPaymentPercent(20);
    setEffectiveMortgageRate(6.8);
    setMortgageYears(30);
    setPMIRate(0.8);
    setPropertyTaxRate(1.15);
    setMelloRoosTaxRate(0.0);
    setClosingCostPercent(2.5);
    setannualMaintenanceRate(.5);
    setMonthlyHOAFee(150);
    setMonthlyHomeInsurance(200);

    setMonthlyRent(2600);
    setMonthlyRentalIncome(0);
    setRentDeposit(2600);

    setMovingCostBuying(3500);
    setMovingCostRenting(2000);

    setMonthlyRenterInsurance(25);
    setMonthlyRentUtilities(120);
    setMonthlyPropertyUtilities(220);
    setMonthlyQualityOfLife(800);

    setHomeAppreciation(4.5);
    setInvestmentReturn(8.5);
    setRentIncrease(4.5);
    setSalaryGrowthRate(3.5);
    setInflationRate(3.0);
    setPropertyTaxAssessmentCap(2);

    setXAxisYears(30);
    setMortgageInterestDeductionCap(750000);
    setSaltCap(40000);
    setEffectiveStateIncomeTaxRate(6.5);
  };

  const projectionData = useMemo(() => {
    const inputs: HousingCalculatorInputs = {
      annualSalaryBeforeTax,
      effectiveFederalTaxRate,
      standardDeduction,
      initialInvestment,
      monthlyMiscExpenses,
      homePrice,
      downPaymentPercent,
      effectiveMortgageRate,
      mortgageYears,
      PMIRate,
      propertyTaxRate,
      melloRoosTaxRate,
      closingCostPercent,
      annualMaintenanceRate,
      monthlyHOAFee,
      monthlyHomeInsurance,
      monthlyRent,
      monthlyRentalIncome,
      rentDeposit,
      movingCostBuying,
      movingCostRenting,
      monthlyRenterInsurance,
      monthlyRentUtilities,
      monthlyPropertyUtilities,
      monthlyQualityOfLife,
      homeAppreciation,
      investmentReturn,
      rentIncrease,
      salaryGrowthRate,
      inflationRate,
      propertyTaxAssessmentCap,
      xAxisYears,
      mortgageInterestDeductionCap,
      saltCap,
      effectiveStateIncomeTaxRate,
    };
    return calculateProjectionData(inputs);
  }, [
    homePrice, downPaymentPercent, effectiveMortgageRate, propertyTaxRate, melloRoosTaxRate,
    monthlyRent, homeAppreciation, investmentReturn, rentIncrease,
    closingCostPercent, monthlyRenterInsurance, monthlyRentUtilities,
    monthlyPropertyUtilities, salaryGrowthRate, initialInvestment,
    annualSalaryBeforeTax, effectiveFederalTaxRate,
    standardDeduction, monthlyRentalIncome, movingCostBuying,
    rentDeposit, PMIRate, annualMaintenanceRate, monthlyQualityOfLife,
    mortgageYears, movingCostRenting, monthlyHOAFee, monthlyHomeInsurance,
    monthlyMiscExpenses, inflationRate, propertyTaxAssessmentCap, xAxisYears,
    saltCap, effectiveStateIncomeTaxRate
  ]);

  const isValidProjectionData = (data) => Array.isArray(data) && !data.error;

  const inputs: HousingCalculatorInputs = {
    annualSalaryBeforeTax,
    effectiveFederalTaxRate,
    standardDeduction,
    initialInvestment,
    monthlyMiscExpenses,
    homePrice,
    downPaymentPercent,
    effectiveMortgageRate,
    mortgageYears,
    PMIRate,
    propertyTaxRate,
    melloRoosTaxRate,
    closingCostPercent,
    annualMaintenanceRate,
    monthlyHOAFee,
    monthlyHomeInsurance,
    monthlyRent,
    monthlyRentalIncome,
    rentDeposit,
    movingCostBuying,
    movingCostRenting,
    monthlyRenterInsurance,
    monthlyRentUtilities,
    monthlyPropertyUtilities,
    monthlyQualityOfLife,
    homeAppreciation,
    investmentReturn,
    rentIncrease,
    salaryGrowthRate,
    inflationRate,
    propertyTaxAssessmentCap,
    xAxisYears,
    mortgageInterestDeductionCap,
    saltCap,
    effectiveStateIncomeTaxRate,
  };

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto" style={{ maxWidth: '1843px' }}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-light text-gray-800">
                Build Wealth: Buy vs. Rent Calculator
              </h1>
              <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
                <p className="font-medium mb-1">Important Assumptions:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Home equity assumes no selling costs (realtor fees, closing costs typically 6-10%)</li>
                  <li>• Investment returns are pre-tax (ignores capital gains and dividend taxes)</li>
                  <li>• Tax rates should be "effective" rates including all taxes (federal, state, FICA, deductions)</li>
                </ul>
              </div>
            </div>
            
            <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentPage('calculator')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'calculator'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Buy vs Rent
              </button>
              <button
                onClick={() => setCurrentPage('payoff')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'payoff'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Payoff Strategy
              </button>
            </nav>
          </div>
          
          {currentPage === 'calculator' && (
            <>
              <p className="text-sm text-gray-600 mb-2">
                Compare long-term wealth building strategies through property ownership versus renting:
              </p>
              <ul className="text-sm text-gray-600 list-disc pl-5">
                <li className="mb-2">
                  <span className="text-blue-500 font-medium">Property Owner Strategy</span>:
                  Combines home equity growth through mortgage payments and appreciation, plus investment returns from remaining income after housing costs. Accounts for tax benefits, maintenance costs, and potential rental income.
                </li>
                <li className="mb-2">
                  <span className="text-green-500 font-medium">Renter Strategy</span>:
                  Focuses on building wealth through investment returns from income saved after rental expenses, without the responsibilities of property ownership.
                </li>
              </ul>
            </>
          )}
          
          {currentPage === 'payoff' && (
            <p className="text-sm text-gray-600">
              Optimize your mortgage payoff strategy to maximize net worth by analyzing the trade-off between paying down debt versus investing extra cash.
            </p>
          )}
        </div>
        
        {currentPage === 'payoff' ? (
          <MortgagePayoffOptimizer inputs={inputs} />
        ) : (
          <>
            <AffordabilityCheck projectionData={projectionData} />

            <div className="mb-6 flex justify-between items-center">
              <div className="flex gap-6">
                {isValidProjectionData(projectionData) && (
                  <WealthSummary
                    xAxisYears={xAxisYears}
                    projectionData={projectionData}
                  />
                )}
                {isValidProjectionData(projectionData) && projectionData[0] && (
                  <TaxSavingsSummary
                    yearlyTaxSavings={projectionData[0].yearlyTaxSavings}
                    totalItemizedDeductions={projectionData[0].totalItemizedDeductions}
                    effectiveFederalTaxRate={effectiveFederalTaxRate}
                  />
                )}
              </div>
              <ActionButtons
                resetToDefaults={resetToDefaults}
                handleShare={handleShare}
              />
            </div>

        <InputCards
          initialInvestment={initialInvestment} setInitialInvestment={setInitialInvestment}
          annualSalaryBeforeTax={annualSalaryBeforeTax} setAnnualSalaryBeforeTax={setAnnualSalaryBeforeTax}
          effectiveFederalTaxRate={effectiveFederalTaxRate} setEffectiveFederalTaxRate={setEffectiveFederalTaxRate}
          standardDeduction={standardDeduction} setStandardDeduction={setStandardDeduction}
          monthlyMiscExpenses={monthlyMiscExpenses} setMonthlyMiscExpenses={setMonthlyMiscExpenses}
          mortgageInterestDeductionCap={mortgageInterestDeductionCap} setMortgageInterestDeductionCap={setMortgageInterestDeductionCap}
          saltCap={saltCap} setSaltCap={setSaltCap}
          effectiveStateIncomeTaxRate={effectiveStateIncomeTaxRate} setEffectiveStateIncomeTaxRate={setEffectiveStateIncomeTaxRate}
          homePrice={homePrice} setHomePrice={setHomePrice}
          downPaymentPercent={downPaymentPercent} setDownPaymentPercent={setDownPaymentPercent}
          closingCostPercent={closingCostPercent} setClosingCostPercent={setClosingCostPercent}
          effectiveMortgageRate={effectiveMortgageRate} setEffectiveMortgageRate={setEffectiveMortgageRate}
          PMIRate={PMIRate} setPMIRate={setPMIRate}
          propertyTaxRate={propertyTaxRate} setPropertyTaxRate={setPropertyTaxRate}
          melloRoosTaxRate={melloRoosTaxRate} setMelloRoosTaxRate={setMelloRoosTaxRate}
          annualMaintenanceRate={annualMaintenanceRate} setannualMaintenanceRate={setannualMaintenanceRate}
          monthlyHOAFee={monthlyHOAFee} setMonthlyHOAFee={setMonthlyHOAFee}
          monthlyHomeInsurance={monthlyHomeInsurance} setMonthlyHomeInsurance={setMonthlyHomeInsurance}
          monthlyPropertyUtilities={monthlyPropertyUtilities} setMonthlyPropertyUtilities={setMonthlyPropertyUtilities}
          monthlyRentalIncome={monthlyRentalIncome} setMonthlyRentalIncome={setMonthlyRentalIncome}
          movingCostBuying={movingCostBuying} setMovingCostBuying={setMovingCostBuying}
          mortgageYears={mortgageYears} setMortgageYears={setMortgageYears}
          monthlyQualityOfLife={monthlyQualityOfLife} setMonthlyQualityOfLife={setMonthlyQualityOfLife}
          monthlyRent={monthlyRent} setMonthlyRent={setMonthlyRent}
          rentDeposit={rentDeposit} setRentDeposit={setRentDeposit}
          monthlyRentUtilities={monthlyRentUtilities} setMonthlyRentUtilities={setMonthlyRentUtilities}
          monthlyRenterInsurance={monthlyRenterInsurance} setMonthlyRenterInsurance={setMonthlyRenterInsurance}
          movingCostRenting={movingCostRenting} setMovingCostRenting={setMovingCostRenting}
          xAxisYears={xAxisYears} setXAxisYears={setXAxisYears}
          homeAppreciation={homeAppreciation} setHomeAppreciation={setHomeAppreciation}
          investmentReturn={investmentReturn} setInvestmentReturn={setInvestmentReturn}
          rentIncrease={rentIncrease} setRentIncrease={setRentIncrease}
          salaryGrowthRate={salaryGrowthRate} setSalaryGrowthRate={setSalaryGrowthRate}
          inflationRate={inflationRate} setInflationRate={setInflationRate}
          propertyTaxAssessmentCap={propertyTaxAssessmentCap} setPropertyTaxAssessmentCap={setPropertyTaxAssessmentCap}
        />

        {isValidProjectionData(projectionData) ? (
          <div className="mt-8 mb-8">
            <ScenarioTabs
              activeScenario={activeScenario}
              setActiveScenario={setActiveScenario}
            />
            <SankeyWealthFlow
              projectionData={projectionData}
              scenario={activeScenario}
              monthlyQualityOfLife={monthlyQualityOfLife}
              xAxisYears={xAxisYears}
            />
          </div>
        ) : null}

        {isValidProjectionData(projectionData) && (
          <div className="mb-8">
            <MortgageAmortizationChart
              projectionData={projectionData}
              mortgageYears={mortgageYears}
              homePrice={homePrice}
              downPaymentPercent={downPaymentPercent}
              effectiveMortgageRate={effectiveMortgageRate}
            />
          </div>
        )}

        {isValidProjectionData(projectionData) ? (
          <div className="grid grid-cols-4 gap-6">
            <div className="space-y-4">
              <DetailedMathCard
                data={activePoint || projectionData[0]}
                previousYearData={activePoint ?
                  projectionData[Math.max(0, projectionData.findIndex(d => d === activePoint) - 1)]
                  : null
                }
                showBuying={true}
              />
            </div>
            <NetWorthChart
              projectionData={projectionData}
              xAxisYears={xAxisYears}
              setActivePoint={setActivePoint}
            />
            <div className="space-y-4">
              <DetailedMathCard
                data={activePoint || projectionData[0]}
                previousYearData={activePoint ?
                  projectionData[Math.max(0, projectionData.findIndex(d => d === activePoint) - 1)]
                  : null
                }
                showBuying={false}
              />
            </div>
          </div>) : null}

            {isValidProjectionData(projectionData) ? (
              <NetWorthTable
                projectionData={projectionData}
                xAxisYears={xAxisYears}
              />
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};

export default HousingCalculator;