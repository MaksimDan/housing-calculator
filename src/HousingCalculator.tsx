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

const HousingCalculator = () => {
  const [activeScenario, setActiveScenario] = useState('buying');
  const [showCopied, setShowCopied] = useState(false);

  // Core Financial Inputs
  const [annualSalaryBeforeTax, setAnnualSalaryBeforeTax] = usePersistedState('housing-annualSalary', 120000);
  const [effectiveTaxRate, setEffectiveTaxRate] = usePersistedState('housing-taxRate', 35);
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

  // Read URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.toString()) {
      // Map URL parameters to state setters
      const stateSetters = {
        annualSalary: setAnnualSalaryBeforeTax,
        taxRate: setEffectiveTaxRate,
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
        mortgageInterestCap: setMortgageInterestDeductionCap
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
    params.append('taxRate', effectiveTaxRate);
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
    setEffectiveTaxRate(35);
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
  };

  const projectionData = useMemo(() => {
    const inputs: HousingCalculatorInputs = {
      annualSalaryBeforeTax,
      effectiveTaxRate,
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
    };
    return calculateProjectionData(inputs);
  }, [
    homePrice, downPaymentPercent, effectiveMortgageRate, propertyTaxRate, melloRoosTaxRate,
    monthlyRent, homeAppreciation, investmentReturn, rentIncrease,
    closingCostPercent, monthlyRenterInsurance, monthlyRentUtilities,
    monthlyPropertyUtilities, salaryGrowthRate, initialInvestment,
    annualSalaryBeforeTax, effectiveTaxRate,
    standardDeduction, monthlyRentalIncome, movingCostBuying,
    rentDeposit, PMIRate, annualMaintenanceRate, monthlyQualityOfLife,
    mortgageYears, movingCostRenting, monthlyHOAFee, monthlyHomeInsurance,
    monthlyMiscExpenses, inflationRate, propertyTaxAssessmentCap, xAxisYears
  ]);

  const isValidProjectionData = (data) => Array.isArray(data) && !data.error;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto" style={{ maxWidth: '1843px' }}>
        <div className="mb-8">
          <h1 className="text-2xl font-light text-gray-800 mb-4">
            Build Wealth: Buy vs. Rent Calculator
          </h1>
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
        </div>
        <AffordabilityCheck projectionData={projectionData} />

        <div className="mb-6 flex justify-between items-center">
          {isValidProjectionData(projectionData) && (
            <WealthSummary
              xAxisYears={xAxisYears}
              projectionData={projectionData}
            />
          )}
          <ActionButtons
            resetToDefaults={resetToDefaults}
            handleShare={handleShare}
          />
        </div>

        <InputCards
          initialInvestment={initialInvestment} setInitialInvestment={setInitialInvestment}
          annualSalaryBeforeTax={annualSalaryBeforeTax} setAnnualSalaryBeforeTax={setAnnualSalaryBeforeTax}
          effectiveTaxRate={effectiveTaxRate} setEffectiveTaxRate={setEffectiveTaxRate}
          standardDeduction={standardDeduction} setStandardDeduction={setStandardDeduction}
          monthlyMiscExpenses={monthlyMiscExpenses} setMonthlyMiscExpenses={setMonthlyMiscExpenses}
          mortgageInterestDeductionCap={mortgageInterestDeductionCap} setMortgageInterestDeductionCap={setMortgageInterestDeductionCap}
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
      </div>
    </div>
  );
};

export default HousingCalculator;