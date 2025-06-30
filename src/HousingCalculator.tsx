// File: src/HousingCalculator.tsx
import React, { useState, useMemo, useEffect } from "react";
import { HelpCircle } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AnimatedInput } from './AnimatedInput';
import { AffordabilityCheck } from './AffordabilityCheck';
import { DetailedMathCard } from './DetailedMathCard';
import SankeyWealthFlow from './SankeyWealthFlow';
import MortgageAmortizationChart from './MortgageAmortizationChart';

// Custom hook for persisting state in localStorage
const usePersistedState = (key, defaultValue) => {
  // On initial load, check localStorage first, fallback to default
  const [value, setValue] = useState(() => {
    const persistedValue = localStorage.getItem(key);
    return persistedValue !== null ? JSON.parse(persistedValue) : defaultValue;
  });

  // Update localStorage whenever value changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};

const HousingCalculator = () => {
  const [activeScenario, setActiveScenario] = useState('buying');

  // Core Financial Inputs
  const [annualSalaryBeforeTax, setAnnualSalaryBeforeTax] = usePersistedState('housing-annualSalary', 350000);
  const [effectiveTaxRate, setEffectiveTaxRate] = usePersistedState('housing-taxRate', 40);
  const [standardDeduction, setStandardDeduction] = usePersistedState('housing-standardDeduction', 21900);
  const [initialInvestment, setInitialInvestment] = usePersistedState('housing-initialInvestment', 1000000);
  const [monthlyMiscExpenses, setMonthlyMiscExpenses] = usePersistedState('housing-miscExpenses', 3500);

  // Property Details - Inputs that affect purchase costs and ongoing expenses
  const [homePrice, setHomePrice] = usePersistedState('housing-homePrice', 700000);
  const [downPaymentPercent, setDownPaymentPercent] = usePersistedState('housing-downPayment', 20);
  const [effectiveMortgageRate, setEffectiveMortgageRate] = usePersistedState('housing-mortgageRate', 6.5);
  const [mortgageYears, setMortgageYears] = usePersistedState('housing-mortgageYears', 30);
  const [PMIRate, setPMIRate] = usePersistedState('housing-PMIRate', 1);
  const [propertyTaxRate, setPropertyTaxRate] = usePersistedState('housing-propertyTaxRate', 1.2);
  const [melloRoosTaxRate, setMelloRoosTaxRate] = usePersistedState('housing-melloRoosTaxRate', 0);
  const [closingCostPercent, setClosingCostPercent] = usePersistedState('housing-closingCost', 3);
  const [annualMaintenanceRate, setannualMaintenanceRate] = usePersistedState('housing-maintenanceRate', 2);
  const [monthlyHOAFee, setMonthlyHOAFee] = usePersistedState('housing-hoaFee', 0);
  const [monthlyHomeInsurance, setMonthlyHomeInsurance] = usePersistedState('housing-homeInsurance', 100);

  // Rental Related - Inputs for rental scenario and potential rental income
  const [monthlyRent, setMonthlyRent] = usePersistedState('housing-monthlyRent', 2000);
  const [monthlyRentalIncome, setMonthlyRentalIncome] = usePersistedState('housing-rentalIncome', 0);
  const [rentDeposit, setRentDeposit] = usePersistedState('housing-rentDeposit', 500);

  // One-time Moving Costs
  const [movingCostBuying, setMovingCostBuying] = usePersistedState('housing-movingCostBuy', 2000);
  const [movingCostRenting, setMovingCostRenting] = usePersistedState('housing-movingCostRent', 1000);

  // Monthly Recurring Expenses
  const [monthlyRenterInsurance, setMonthlyRenterInsurance] = usePersistedState('housing-renterInsurance', 10);
  const [monthlyRentUtilities, setMonthlyRentUtilities] = usePersistedState('housing-rentUtilities', 150);
  const [monthlyPropertyUtilities, setMonthlyPropertyUtilities] = usePersistedState('housing-propertyUtilities', 200);
  const [monthlyQualityOfLife, setMonthlyQualityOfLife] = usePersistedState('housing-qualityOfLife', 500);

  // Annual Growth/Return Rates
  const [homeAppreciation, setHomeAppreciation] = usePersistedState('housing-appreciation', 4.5);
  const [investmentReturn, setInvestmentReturn] = usePersistedState('housing-investmentReturn', 8);
  const [rentIncrease, setRentIncrease] = usePersistedState('housing-rentIncrease', 3);
  const [salaryGrowthRate, setSalaryGrowthRate] = usePersistedState('housing-salaryGrowth', 3);
  const [inflationRate, setInflationRate] = usePersistedState('housing-inflationRate', 2.5);
  const [propertyTaxAssessmentCap, setPropertyTaxAssessmentCap] = usePersistedState('housing-taxAssessmentCap', 2);

  // UI State for visualization
  const [xAxisYears, setXAxisYears] = usePersistedState('housing-xAxisYears', 30);
  const [activePoint, setActivePoint] = useState(null);

  const [mortgageInterestDeductionCap, setMortgageInterestDeductionCap] = usePersistedState('housing-mortgageInterestCap', 750000);

  const resetToDefaults = () => {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('housing-')) {
        localStorage.removeItem(key);
      }
    });

    setAnnualSalaryBeforeTax(350000);
    setEffectiveTaxRate(40);
    setStandardDeduction(21900);
    setInitialInvestment(1000000);
    setMonthlyMiscExpenses(3500);
    setHomePrice(700000);
    setDownPaymentPercent(20);
    setEffectiveMortgageRate(6.5);
    setMortgageYears(30);
    setPMIRate(1);
    setPropertyTaxRate(1.2);
    setMelloRoosTaxRate(0);
    setClosingCostPercent(3);
    setannualMaintenanceRate(2);
    setMonthlyHOAFee(0);
    setMonthlyHomeInsurance(100);
    setMonthlyRent(2000);
    setMonthlyRentalIncome(0);
    setRentDeposit(500);
    setMovingCostBuying(2000);
    setMovingCostRenting(1000);
    setMonthlyRenterInsurance(10);
    setMonthlyRentUtilities(150);
    setMonthlyPropertyUtilities(200);
    setMonthlyQualityOfLife(500);
    setHomeAppreciation(4.5);
    setInvestmentReturn(8);
    setRentIncrease(3);
    setSalaryGrowthRate(3);
    setInflationRate(2.5);
    setPropertyTaxAssessmentCap(2);
    setXAxisYears(30);
    setMortgageInterestDeductionCap(750000);
  };

  const calculateMonthlyTakeHome = (annualSalary) => {
    const afterTaxAnnual = annualSalary * (1 - effectiveTaxRate / 100);
    return afterTaxAnnual / 12;
  };

  const calculateYearlyMortgageBreakdown = (loanBalance, monthlyPayment, monthlyRate) => {
    let yearlyInterestPaid = 0;
    let yearlyPrincipalPaid = 0;
    let currentBalance = loanBalance;

    for (let month = 0; month < 12; month++) {
      const monthlyInterestPaid = currentBalance * monthlyRate;
      const monthlyPrincipalPaid = monthlyPayment - monthlyInterestPaid;

      yearlyInterestPaid += monthlyInterestPaid;
      yearlyPrincipalPaid += monthlyPrincipalPaid;
      currentBalance -= monthlyPrincipalPaid;
    }

    return {
      yearlyInterestPaid,
      yearlyPrincipalPaid,
      endingBalance: currentBalance,
    };
  };

  // Calculate tax savings from mortgage interest, property taxes, and Mello-Roos taxes
  const calculateTaxSavings = (mortgageInterest, propertyTaxes, melloRoosTaxes, currentStandardDeduction) => {
    // Apply the mortgage interest deduction cap
    const cappedMortgageInterest = Math.min(mortgageInterest, (mortgageInterestDeductionCap / homePrice) * mortgageInterest);

    // Only benefit from itemizing if deductions exceed standard deduction
    const totalItemizedDeductions = cappedMortgageInterest + propertyTaxes + melloRoosTaxes;
    const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
    return extraDeductionBenefit * (effectiveTaxRate / 100);
  };

  const projectionData = useMemo(() => {
    const data = [];

    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);

    let buyingNetWorth = initialInvestment - closingCostsAmount - movingCostBuying;
    let rentingNetWorth = initialInvestment - rentDeposit - movingCostRenting;

    const totalCashNeeded = downPaymentAmount + closingCostsAmount + movingCostBuying;
    if (totalCashNeeded > initialInvestment) {
      return {
        error: "Insufficient initial investment for down payment and closing costs",
        requiredUpfront: totalCashNeeded,
        availableInvestment: initialInvestment
      };
    }

    let currentHomeValue = homePrice;
    let currentAssessedValue = homePrice; // Assessed value for property tax calculations
    let currentMonthlyRent = monthlyRent;
    let currentAnnualSalary = annualSalaryBeforeTax;
    let mortgageBalance = homePrice - downPaymentAmount;
    let currentMonthlyRentalIncome = monthlyRentalIncome;
    let previousBuyingInvestments = buyingNetWorth - (currentHomeValue - mortgageBalance);

    // Initialize inflating expense variables
    let currentMonthlyMiscExpenses = monthlyMiscExpenses;
    let currentMonthlyHOAFee = monthlyHOAFee;
    let currentMonthlyHomeInsurance = monthlyHomeInsurance;
    let currentMonthlyPropertyUtilities = monthlyPropertyUtilities;
    let currentMonthlyRentUtilities = monthlyRentUtilities;
    let currentStandardDeduction = standardDeduction;

    const monthlyInterestRate = effectiveMortgageRate / 100 / 12;
    const totalMonthlyPayments = mortgageYears * 12;
    const monthlyMortgagePayment = (mortgageBalance *
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonthlyPayments))) /
      (Math.pow(1 + monthlyInterestRate, totalMonthlyPayments) - 1);

    const initialMonthlyTakeHome = calculateMonthlyTakeHome(annualSalaryBeforeTax);
    const initialMonthlyPropertyTax = (currentAssessedValue * (propertyTaxRate / 100)) / 12;
    const initialMonthlyMelloRoosTax = (currentAssessedValue * (melloRoosTaxRate / 100)) / 12;
    const initialMonthlyMaintenance = (currentHomeValue * annualMaintenanceRate / 100) / 12;
    const initialMonthlyPMI = downPaymentPercent < 20 ? (mortgageBalance * PMIRate) / 100 / 12 : 0;

    const initialTotalMonthlyHousingCosts =
      monthlyMortgagePayment +
      initialMonthlyPropertyTax +
      initialMonthlyMelloRoosTax +
      currentMonthlyHomeInsurance +
      initialMonthlyMaintenance +
      initialMonthlyPMI +
      currentMonthlyPropertyUtilities +
      currentMonthlyHOAFee;

    const initialTotalMonthlyExpenses = initialTotalMonthlyHousingCosts + currentMonthlyMiscExpenses;

    if (initialTotalMonthlyExpenses > initialMonthlyTakeHome) {
      return {
        error: "Monthly housing costs and living expenses exceed monthly take-home pay",
        monthlyHousingCosts: initialTotalMonthlyHousingCosts,
        monthlyMiscExpenses: currentMonthlyMiscExpenses,
        monthlyTakeHome: initialMonthlyTakeHome
      };
    }

    for (let year = 0; year <= Math.max(mortgageYears, xAxisYears); year++) {
      const mortgageBreakdown = mortgageBalance > 0 ? calculateYearlyMortgageBreakdown(
        mortgageBalance,
        monthlyMortgagePayment,
        monthlyInterestRate
      ) : {
        yearlyInterestPaid: 0,
        yearlyPrincipalPaid: 0,
        endingBalance: 0
      };

      const yearlyPropertyTaxes = currentAssessedValue * (propertyTaxRate / 100);
      const yearlyMelloRoosTaxes = currentAssessedValue * (melloRoosTaxRate / 100);
      const yearlyTaxSavings = calculateTaxSavings(
        mortgageBreakdown.yearlyInterestPaid,
        yearlyPropertyTaxes,
        yearlyMelloRoosTaxes,
        currentStandardDeduction
      );

      const monthlyPropertyTax = yearlyPropertyTaxes / 12;
      const monthlyMelloRoosTax = yearlyMelloRoosTaxes / 12;
      const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate) / 100 / 12;

      const equityPercentOriginal = ((homePrice - mortgageBalance) / homePrice) * 100;
      const monthlyPMI = equityPercentOriginal < 20
        ? (mortgageBalance * PMIRate) / 100 / 12
        : 0;

      const totalMonthlyHomeownerCosts =
        (mortgageBalance > 0 ? monthlyMortgagePayment : 0) +
        monthlyPropertyTax +
        monthlyMelloRoosTax +
        currentMonthlyHomeInsurance +
        monthlyMaintenance +
        monthlyPMI +
        currentMonthlyPropertyUtilities +
        currentMonthlyHOAFee;

      const monthlyTaxBenefit = yearlyTaxSavings / 12;
      const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts -
        currentMonthlyRentalIncome - monthlyTaxBenefit;

      const totalMonthlyRenterCosts =
        currentMonthlyRent + monthlyRenterInsurance + currentMonthlyRentUtilities;

      const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary);

      data.push({
        year,
        buying: Math.round(buyingNetWorth),
        renting: Math.round(rentingNetWorth),
        salary: Math.round(currentAnnualSalary),
        homeEquity: Math.round(currentHomeValue - mortgageBalance),
        investmentsBuying: Math.round(buyingNetWorth - (currentHomeValue - mortgageBalance)),
        investmentsRenting: Math.round(rentingNetWorth),
        homeValue: Math.round(currentHomeValue),
        remainingLoan: Math.round(mortgageBalance),
        yearlyPrincipalPaid: Math.round(mortgageBreakdown.yearlyPrincipalPaid),
        yearlyInterestPaid: Math.round(mortgageBreakdown.yearlyInterestPaid),
        monthlyPayment: Math.round(netMonthlyHomeownerCosts),
        availableMonthlyInvestment: Math.round(monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses),
        monthlyRent: Math.round(currentMonthlyRent),
        annualRentCosts: Math.round(totalMonthlyRenterCosts * 12),
        monthlyRentalIncome: Math.round(currentMonthlyRentalIncome),
        yearlyTaxSavings: Math.round(yearlyTaxSavings),
        monthlyMiscExpenses: Math.round(currentMonthlyMiscExpenses),
      });

      if (year > 0) {
        // Apply growth rates
        currentAnnualSalary *= 1 + salaryGrowthRate / 100;
        currentMonthlyRent *= 1 + rentIncrease / 100;
        currentMonthlyRentalIncome *= 1 + rentIncrease / 100;
        currentHomeValue *= 1 + homeAppreciation / 100;
        currentAssessedValue *= 1 + propertyTaxAssessmentCap / 100;

        // Apply inflation to various expense categories
        const inflationMultiplier = 1 + inflationRate / 100;
        currentMonthlyMiscExpenses *= inflationMultiplier;
        currentMonthlyHOAFee *= inflationMultiplier;
        currentMonthlyHomeInsurance *= inflationMultiplier;
        currentMonthlyPropertyUtilities *= inflationMultiplier;
        currentMonthlyRentUtilities *= inflationMultiplier;
        currentStandardDeduction *= inflationMultiplier;

        const monthlyAvailableForBuyerInvestment = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;
        const monthlyAvailableForRenterInvestment = monthlyTakeHome - totalMonthlyRenterCosts - currentMonthlyMiscExpenses;

        const yearlyHomeownerInvestment = Math.max(0, monthlyAvailableForBuyerInvestment) * 12;
        const yearlyRenterInvestment = Math.max(0, monthlyAvailableForRenterInvestment) * 12;

        mortgageBalance = mortgageBreakdown.endingBalance;

        const yearlyQualityOfLifeBenefit = monthlyQualityOfLife * 12;
        const monthlyReturn = investmentReturn / 100 / 12;
        const monthlyHomeownerInvestment = yearlyHomeownerInvestment / 12;
        const monthlyRenterInvestment = yearlyRenterInvestment / 12;

        let buyingInvestmentBalance = previousBuyingInvestments;
        let rentingInvestmentBalance = rentingNetWorth;

        for (let month = 0; month < 12; month++) {
          buyingInvestmentBalance += monthlyHomeownerInvestment;
          buyingInvestmentBalance *= (1 + monthlyReturn);
          rentingInvestmentBalance += monthlyRenterInvestment;
          rentingInvestmentBalance *= (1 + monthlyReturn);
        }

        buyingInvestmentBalance += yearlyQualityOfLifeBenefit;
        buyingNetWorth = buyingInvestmentBalance + (currentHomeValue - mortgageBalance);
        previousBuyingInvestments = buyingInvestmentBalance;

        rentingNetWorth = rentingInvestmentBalance;
      }
    }
    return data;
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

        <div className="mb-6 flex justify-end">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200 flex items-center gap-2 border border-gray-300"
            title="Reset to Defaults"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
            Reset to Defaults
          </button>
        </div>

        {/* Input Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Financial Parameters Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Financial Parameters</h2>
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Total cash available for down payment, closing costs, and initial investments")} /> Initial Investment Portfolio
                </>
              }
              value={initialInvestment}
              onChange={setInitialInvestment}
              min={0}
              max={5000000}
              step={10000}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Your gross annual salary before taxes and deductions")} /> Annual Salary (before tax)
                </>
              }
              value={annualSalaryBeforeTax}
              onChange={setAnnualSalaryBeforeTax}
              min={50000}
              max={2000000}
              step={10000}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Your overall tax rate (federal + state + local) as a percentage")} /> Effective Tax Rate (${(annualSalaryBeforeTax * (effectiveTaxRate / 100)).toLocaleString()})
                </>
              }
              value={effectiveTaxRate}
              onChange={setEffectiveTaxRate}
              min={1}
              max={100}
              step={1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual standard tax deduction amount for calculating mortgage interest tax savings (adjusted for inflation)")} /> Standard Deduction
                </>
              }
              value={standardDeduction}
              onChange={setStandardDeduction}
              min={10000}
              max={40000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly spending on food, clothing, entertainment, dining out, and personal care (adjusted for inflation)")} /> Monthly Living Expenses
                </>
              }
              value={monthlyMiscExpenses}
              onChange={setMonthlyMiscExpenses}
              min={1000}
              max={10000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Maximum mortgage debt eligible for interest deduction (federal limit is $750k for new loans)")} /> Mortgage Interest Deduction Cap
                </>
              }
              value={mortgageInterestDeductionCap}
              onChange={setMortgageInterestDeductionCap}
              min={0}
              max={1500000}
              step={25000}
              suffix="$"
            />
          </div>

          {/* Property Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Property Details</h2>

            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Total purchase price of the property")} /> Home Price
                </>
              }
              value={homePrice}
              onChange={setHomePrice}
              min={100000}
              max={2000000}
              step={10000}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Percentage of home price paid upfront (20%+ avoids PMI)")} /> Down Payment (${(homePrice * (downPaymentPercent / 100)).toLocaleString()})
                </>
              }
              value={downPaymentPercent}
              onChange={setDownPaymentPercent}
              min={5}
              max={100}
              step={.1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time fees for loan processing, inspections, and legal costs (% of home price)")} /> Closing Costs (${(homePrice * (closingCostPercent / 100)).toLocaleString()})
                </>
              }
              value={closingCostPercent}
              onChange={setClosingCostPercent}
              min={0}
              max={6}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual interest rate on your mortgage loan")} /> Mortgage Rate (${(() => {
                    const loanAmount = homePrice - homePrice * downPaymentPercent / 100;
                    const monthlyRate = effectiveMortgageRate / 100 / 12;
                    const numPayments = mortgageYears * 12;
                    const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
                    const totalPayments = monthlyPayment * numPayments;
                    const totalInterest = totalPayments - loanAmount;
                    return Math.round(totalInterest).toLocaleString();
                  })()} lifetime interest)
                </>
              }
              value={effectiveMortgageRate}
              onChange={setEffectiveMortgageRate}
              min={.1}
              max={15}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual private mortgage insurance rate (required if down payment < 20%)")} /> PMI Rate {downPaymentPercent < 20 ? `(${Math.round((homePrice - homePrice * downPaymentPercent / 100) * PMIRate / 100 / 12).toLocaleString()}/mo)` : '(not required)'}
                </>
              }
              value={PMIRate}
              onChange={setPMIRate}
              min={0}
              max={30}
              step={.5}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual property tax as percentage of home value (varies by location)")} /> Property Tax Rate (${(homePrice * (propertyTaxRate / 100)).toLocaleString()} year 1)
                </>
              }
              value={propertyTaxRate}
              onChange={setPropertyTaxRate}
              min={0.5}
              max={3}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual special assessment tax in some California communities (% of home value)")} /> Mello-Roos Tax Rate (${(homePrice * (melloRoosTaxRate / 100)).toLocaleString()} year 1)
                </>
              }
              value={melloRoosTaxRate}
              onChange={setMelloRoosTaxRate}
              min={0}
              max={2}
              step={0.05}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual maintenance and repairs as percentage of home value (typically 1-3%)")} /> Annual Maintenance Rate (${(homePrice * (annualMaintenanceRate / 100)).toLocaleString()} year 1)
                </>
              }
              value={annualMaintenanceRate}
              onChange={setannualMaintenanceRate}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly homeowners association fees for shared amenities and maintenance (adjusted for inflation)")} /> Monthly HOA Fee
                </>
              }
              value={monthlyHOAFee}
              onChange={setMonthlyHOAFee}
              min={0}
              max={3000}
              step={1}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly homeowners insurance premium (adjusted for inflation)")} /> Monthly Home Insurance
                </>
              }
              value={monthlyHomeInsurance}
              onChange={setMonthlyHomeInsurance}
              min={50}
              max={1000}
              step={10}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly utilities cost for the owned property (gas, electric, water, trash) - adjusted for inflation")} /> Monthly Property Utilities
                </>
              }
              value={monthlyPropertyUtilities}
              onChange={setMonthlyPropertyUtilities}
              min={0}
              max={500}
              step={10}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly after-tax income from renting out part of your property (e.g., ADU, room)")} /> Monthly Rental Income
                </>
              }
              value={monthlyRentalIncome}
              onChange={setMonthlyRentalIncome}
              min={0}
              max={10000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time cost for moving when buying (movers, truck rental, time off work)")} /> Moving Costs
                </>
              }
              value={movingCostBuying}
              onChange={setMovingCostBuying}
              min={0}
              max={10000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Length of mortgage loan in years (15 or 30 years are most common)")} /> Mortgage Term
                </>
              }
              value={mortgageYears}
              onChange={setMortgageYears}
              min={5}
              max={30}
              step={1}
              suffix=" years"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly value you place on homeownership benefits (control, permanence, no landlord)")} /> Monthly Quality of Life Benefit
                </>
              }
              value={monthlyQualityOfLife}
              onChange={setMonthlyQualityOfLife}
              min={0}
              max={10000}
              step={100}
              suffix="$"
            />
          </div>

          {/* Renting Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Renting Details</h2>
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly rental payment for comparable housing")} /> Monthly Rent
                </>
              }
              value={monthlyRent}
              onChange={setMonthlyRent}
              min={1000}
              max={10000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time refundable deposit paid when starting rental lease")} /> Security Deposit
                </>
              }
              value={rentDeposit}
              onChange={setRentDeposit}
              min={0}
              max={5000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly utilities cost for rental property (gas, electric, internet) - adjusted for inflation")} /> Monthly Rent Utilities
                </>
              }
              value={monthlyRentUtilities}
              onChange={setMonthlyRentUtilities}
              min={0}
              max={500}
              step={10}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly renters insurance premium for personal property coverage")} /> Monthly Renter's Insurance
                </>
              }
              value={monthlyRenterInsurance}
              onChange={setMonthlyRenterInsurance}
              min={5}
              max={50}
              step={1}
              suffix="$"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time cost for moving when renting (movers, truck rental, time off work)")} /> Moving Costs
                </>
              }
              value={movingCostRenting}
              onChange={setMovingCostRenting}
              min={0}
              max={5000}
              step={100}
              suffix="$"
            />
          </div>

          {/* Growth Assumptions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Growth Assumptions</h2>

            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Number of years to display in the projection chart")} /> Graph Timeline
                </>
              }
              value={xAxisYears}
              onChange={setXAxisYears}
              min={5}
              max={30}
              step={1}
              suffix=" years"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual rate of home value appreciation (historical average ~3-5%)")} /> Home Appreciation (${(homePrice * (homeAppreciation / 100)).toLocaleString()} year 1)
                </>
              }
              value={homeAppreciation}
              onChange={setHomeAppreciation}
              min={0}
              max={20}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual return on invested funds (stock market historical average ~7-10%)")} /> Investment Return
                </>
              }
              value={investmentReturn}
              onChange={setInvestmentReturn}
              min={1}
              max={50}
              step={0.5}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual percentage increase in rental costs (typically 2-5%)")} /> Annual Rent Increase (${Math.round(monthlyRent * (rentIncrease / 100)).toLocaleString()}/mo year 1)
                </>
              }
              value={rentIncrease}
              onChange={setRentIncrease}
              min={0}
              max={15}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual percentage increase in your salary (promotions, raises, inflation)")} /> Annual Salary Growth (${(annualSalaryBeforeTax * (salaryGrowthRate / 100)).toLocaleString()} year 1)
                </>
              }
              value={salaryGrowthRate}
              onChange={setSalaryGrowthRate}
              min={0}
              max={20}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual inflation rate affecting living expenses, utilities, insurance, HOA fees, and tax deductions (historical average ~2-3%)")} /> Annual Inflation Rate
                </>
              }
              value={inflationRate}
              onChange={setInflationRate}
              min={0}
              max={10}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label={
                <>
                  <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual cap on property tax assessment increases (e.g. California Prop 13 = ~2%). Property taxes grow by this rate.")} /> Property Tax Assessment Cap
                </>
              }
              value={propertyTaxAssessmentCap}
              onChange={setPropertyTaxAssessmentCap}
              min={0}
              max={10}
              step={0.1}
              suffix="%"
            />
          </div>
        </div>

        {isValidProjectionData(projectionData) ? (
          <div className="mt-8 mb-8">
            {/* Tab Headers */}
            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  <button
                    onClick={() => setActiveScenario('buying')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeScenario === 'buying'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      Property Owner Cash Flow
                    </div>
                  </button>
                  <button
                    onClick={() => setActiveScenario('renting')}
                    className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeScenario === 'renting'
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      Renter Cash Flow
                    </div>
                  </button>
                </nav>
              </div>

              {/* Tab Description */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {activeScenario === 'buying' ? (
                  <div>
                    <h3 className="font-medium text-blue-700 mb-2">Property Owner Strategy</h3>
                    <p className="text-sm text-gray-600">
                      Visualizes how your income flows to mortgage payments, property taxes, maintenance,
                      and other homeownership costs. Shows equity building through principal payments and
                      home appreciation, plus investment growth from remaining income.
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-medium text-green-700 mb-2">Renter Strategy</h3>
                    <p className="text-sm text-gray-600">
                      Visualizes how your income flows to rent, utilities, and living expenses.
                      Shows wealth building entirely through investment growth from the larger
                      amount of remaining income after housing costs.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sankey Flow Diagram */}
            <SankeyWealthFlow
              projectionData={projectionData}
              scenario={activeScenario}
              monthlyQualityOfLife={monthlyQualityOfLife}
              xAxisYears={xAxisYears}
            />
          </div>
        ) : null}

        {/* Mortgage Amortization Chart */}
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

        {/* Graph Section with Math Details */}
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

            <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {(() => {
                const findBreakEvenYear = () => {
                  for (let i = 0; i < projectionData.length; i++) {
                    if (projectionData[i].buying > projectionData[i].renting) {
                      return i;
                    }
                  }
                  return null;
                };

                const breakEvenYear = findBreakEvenYear();
                const finalDifference = projectionData[Math.min(xAxisYears, projectionData.length - 1)].buying - projectionData[Math.min(xAxisYears, projectionData.length - 1)].renting;
                const isBuyingBetterAtEnd = finalDifference > 0;

                return (
                  <>
                    <div className={`text-center p-4 rounded-lg ${isBuyingBetterAtEnd
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-green-50 text-green-700 border border-green-200'}`}>
                      {breakEvenYear !== null
                        ? `In year ${breakEvenYear}, buying becomes better than renting${isBuyingBetterAtEnd
                          ? `. By year ${xAxisYears}, you'll have $${Math.abs(
                            finalDifference
                          ).toLocaleString()} more by buying.`
                          : `, but by year ${xAxisYears}, renting becomes better again. You'll have $${Math.abs(
                            finalDifference
                          ).toLocaleString()} more by renting.`
                        }`
                        : `Renting starts better${isBuyingBetterAtEnd
                          ? `, but by year ${xAxisYears}, buying becomes better. You'll have $${Math.abs(
                            finalDifference
                          ).toLocaleString()} more by buying.`
                          : ` and stays better for all ${xAxisYears} years. By the end, you'll have $${Math.abs(
                            finalDifference
                          ).toLocaleString()} more by renting.`
                        }`}
                    </div>

                  </>
                );
              })()}
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={projectionData.slice(0, xAxisYears + 1)}
                    margin={{ top: 30, right: 30, left: 60, bottom: 5 }}
                    onMouseMove={(e) => {
                      if (e.activePayload) {
                        setActivePoint(e.activePayload[0].payload);
                      }
                    }}
                    onMouseLeave={() => setActivePoint(null)}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="year"
                      stroke="#666"
                      label={{
                        value: "Years",
                        position: "insideBottom",
                        offset: -5,
                      }}
                      domain={[0, xAxisYears]}
                    />
                    <YAxis
                      stroke="#666"
                      tickFormatter={(value) => `${Math.abs(value / 1000)}k`}
                      label={{
                        value: "Net Worth",
                        angle: -90,
                        position: "insideLeft",
                        offset: -45,
                      }}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === "difference") {
                          return [`$${Math.abs(value).toLocaleString()}`, "Difference (Buy vs Rent)"];
                        }
                        return [
                          `$${Math.abs(value).toLocaleString()}`,
                          value < 0 ? "Initial Investment/Costs" : "Net Worth",
                        ];
                      }}
                      labelFormatter={(value) => `Year ${value}`}
                    />
                    <Legend
                      verticalAlign="top"
                      height={36}
                      formatter={(value) => {
                        const labels = {
                          buying: "Buy Property & Invest",
                          renting: "Rent & Invest",
                          difference: "Net Worth Difference"
                        };
                        return labels[value] || value;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="buying"
                      name="buying"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="renting"
                      name="renting"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey={(dataPoint) => dataPoint.buying - dataPoint.renting}
                      name="difference"
                      stroke="#9333ea"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

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

        {/* Net Worth Table */}
        {isValidProjectionData(projectionData) ? (

          <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium mb-4">
              Net Worth Comparison Table
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-2 text-left font-medium text-gray-600">
                      Year
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-blue-600">
                      Buying
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-green-600">
                      Renting
                    </th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">
                      Difference
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projectionData.slice(0, xAxisYears + 1).map((row) => {
                    const difference = row.buying - row.renting;
                    return (
                      <tr
                        key={row.year}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="px-4 py-2 text-left text-gray-600">
                          {row.year}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-blue-600">
                          ${Math.abs(row.buying).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-green-600">
                          ${Math.abs(row.renting).toLocaleString()}
                        </td>
                        <td
                          className={`px-4 py-2 text-right font-medium ${difference >= 0 ? "text-blue-600" : "text-green-600"
                            }`}
                        >
                          {difference >= 0 ? "+" : "-"}$
                          {Math.abs(difference).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>) : null}
      </div>
    </div>
  );
};

export default HousingCalculator;