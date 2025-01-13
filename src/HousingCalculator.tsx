import React, { useState, useMemo } from "react";
import { HelpCircle } from "lucide-react";
import { TrendingUp, TrendingDown, Home, DollarSign, Percent } from 'lucide-react';
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

const AffordabilityCheck = ({ projectionData }) => {
  if (!projectionData) return null;

  if (projectionData.error) {
    // Format currency values
    const formatCurrency = (value) => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
      }).format(value);
    };

    // Extract numerical details from error message
    let details = null;

    if (projectionData.error.includes("Monthly housing costs exceed")) {
      details = {
        title: "Monthly Costs Exceed Income",
        items: [
          {
            label: "Monthly Take-Home Pay",
            value: formatCurrency(projectionData.monthlyTakeHome || 0)
          },
          {
            label: "Monthly Housing Costs",
            value: formatCurrency(projectionData.monthlyHousingCosts || 0)
          },
          {
            label: "Monthly Shortfall",
            value: formatCurrency((projectionData.monthlyHousingCosts || 0) - (projectionData.monthlyTakeHome || 0))
          }
        ]
      };
    } else if (projectionData.error.includes("Insufficient initial investment")) {
      details = {
        title: "Insufficient Down Payment",
        items: [
          {
            label: "Required Upfront Costs",
            value: formatCurrency(projectionData.requiredUpfront || 0)
          },
          {
            label: "Available Investment",
            value: formatCurrency(projectionData.availableInvestment || 0)
          },
          {
            label: "Shortfall",
            value: formatCurrency((projectionData.requiredUpfront || 0) - (projectionData.availableInvestment || 0))
          }
        ]
      };
    }

    return (
      <div className="w-full mb-4">
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex flex-col">
            <div className="ml-3">
              <h3 className="text-red-800 font-medium">Cannot Afford Property</h3>
              <div className="text-red-700 text-sm mb-2">
                {projectionData.error}
              </div>
              {details && (
                <div className="mt-2 bg-white bg-opacity-50 rounded p-3">
                  <h4 className="text-red-800 font-medium text-sm mb-2">{details.title}</h4>
                  <div className="space-y-2 max-w-lg">
                    {details.items.map((item, index) => (
                      <div key={index} className="grid" style={{ gridTemplateColumns: 'auto 120px' }}>
                        <span className="text-red-700 text-sm">{item.label}</span>
                        <span className="text-red-800 font-medium text-sm text-right">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mb-4">
      <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-green-800 font-medium">Property is Affordable</h3>
            <div className="text-green-700 text-sm">
              Your income and savings are sufficient for this property based on the current settings.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const DetailedMathCard = ({ data, showBuying, previousYearData }) => {
  if (!data) return null;

  const formatCurrency = (num) => {
    if (num === undefined || num === null) return '$0';
    return `${Math.abs(num).toLocaleString()}`;
  };

  const formatPercent = (num) => {
    if (num === undefined || num === null) return '0.0%';
    return `${Number(num).toFixed(1)}%`;
  };

  const calculateYearOverYearChange = (current, previous) => {
    if (current === undefined || current === null ||
      previous === undefined || previous === null ||
      previous === 0) {
      return null;
    }
    return ((current - previous) / previous) * 100;
  };

  const yearlyChanges = previousYearData ? {
    homeValue: calculateYearOverYearChange(data.homeValue, previousYearData.homeValue),
    netWorthBuying: calculateYearOverYearChange(data.buying, previousYearData.buying),
    netWorthRenting: calculateYearOverYearChange(data.renting, previousYearData.renting),
    homeEquity: calculateYearOverYearChange(data.homeEquity, previousYearData.homeEquity),
    investmentsBuying: calculateYearOverYearChange(data.investmentsBuying, previousYearData.investmentsBuying),
    investmentsRenting: calculateYearOverYearChange(data.investmentsRenting, previousYearData.investmentsRenting),
    remainingLoan: calculateYearOverYearChange(data.remainingLoan, previousYearData.remainingLoan)
  } : null;

  const renderChangeIndicator = (change) => {
    if (change === null) return null;
    return (
      <div className="text-xs text-gray-500 flex items-center gap-1">
        {change > 0 ? (
          <TrendingUp className="w-3 h-3 text-green-500" />
        ) : (
          <TrendingDown className="w-3 h-3 text-red-500" />
        )}
        {formatPercent(change)} from previous year
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          Financial Summary - Year {data.year}
        </h3>
        <span className="text-sm text-gray-500">
          Annual Salary: {formatCurrency(data.salary)}
        </span>
      </div>

      {showBuying ? (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h4 className="flex items-center gap-2 text-blue-600 font-medium mb-3">
              <Home className="w-4 h-4" /> Property Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Current Home Value</div>
                <div className="font-medium">{formatCurrency(data.homeValue)}</div>
                {renderChangeIndicator(yearlyChanges?.homeValue)}
              </div>
              <div>
                <div className="text-sm text-gray-600">Remaining Mortgage</div>
                <div className="font-medium">{formatCurrency(data.remainingLoan)}</div>
                {renderChangeIndicator(yearlyChanges?.remainingLoan)}
              </div>
            </div>
          </div>

          <div className="border-b pb-4">
            <h4 className="flex items-center gap-2 text-blue-600 font-medium mb-3">
              <DollarSign className="w-4 h-4" /> Financial Position
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Home Equity</span>
                  <span className="font-medium">{formatCurrency(data.homeEquity)}</span>
                </div>
                <div className="text-xs text-gray-500">= Home Value - Remaining Mortgage</div>
                {renderChangeIndicator(yearlyChanges?.homeEquity)}
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Investment Portfolio</span>
                  <span className="font-medium">{formatCurrency(data.investmentsBuying)}</span>
                </div>
                <div className="text-xs text-gray-500">Return Rate: {data.investmentReturn}%</div>
                {renderChangeIndicator(yearlyChanges?.investmentsBuying)}
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax Benefits</span>
                  <span className="font-medium">{formatCurrency(data.yearlyTaxSavings)}</span>
                </div>
                <div className="text-xs text-gray-500">From mortgage interest & property tax deductions</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline">
              <h4 className="text-lg font-semibold text-blue-600">Total Net Worth</h4>
              <span className="text-xl font-bold">{formatCurrency(data.buying)}</span>
            </div>
            {renderChangeIndicator(yearlyChanges?.netWorthBuying)}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="border-b pb-4">
            <h4 className="flex items-center gap-2 text-green-600 font-medium mb-3">
              <DollarSign className="w-4 h-4" /> Financial Position
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Investment Portfolio</span>
                  <span className="font-medium">{formatCurrency(data.investmentsRenting)}</span>
                </div>
                <div className="text-xs text-gray-500">Return Rate: {data.investmentReturn}%</div>
                {renderChangeIndicator(yearlyChanges?.investmentsRenting)}
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Annual Housing Costs</span>
                  <span className="font-medium">{formatCurrency(data.annualRentCosts)}</span>
                </div>
                <div className="text-xs text-gray-500">Including rent, utilities, and insurance</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-baseline">
              <h4 className="text-lg font-semibold text-green-600">Total Net Worth</h4>
              <span className="text-xl font-bold">{formatCurrency(data.renting)}</span>
            </div>
            {renderChangeIndicator(yearlyChanges?.netWorthRenting)}
          </div>
        </div>
      )}

      <div className="pt-4 border-t">
        <h4 className="flex items-center gap-2 text-gray-600 font-medium mb-2">
          <Percent className="w-4 h-4" /> Investment Metrics
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Investment Rate</div>
            <div className="font-medium">{data.investmentRate}% of income</div>
          </div>
          <div>
            <div className="text-gray-600">Annual Investment</div>
            <div className="font-medium">
              {formatCurrency((data.salary * data.investmentRate) / 100)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ANNUAL_HOMEOWNERS_INSURANCE_RATE = 0.0065;

const HousingCalculator = () => {
  // Financial Inputs
  const [annualSalaryBeforeTax, setAnnualSalaryBeforeTax] = useState(350000);
  const [effectiveTaxRate, setEffectiveTaxRate] = useState(40);
  const [standardDeduction, setStandardDeduction] = useState(21900);
  const [investmentRate, setInvestmentRate] = useState(20);
  const [initialInvestment, setInitialInvestment] = useState(1000000);

  // Property Details
  const [homePrice, setHomePrice] = useState(700000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [mortgageYears, setMortgageYears] = useState(30);
  const [PMIRate, setPMIRate] = useState(1);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [closingCostPercent, setClosingCostPercent] = useState(3);
  const [annualMaintainanceRate, setAnnualMaintainanceRate] = useState(1);

  // Rental Related
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [monthlyRentalIncome, setMonthlyRentalIncome] = useState(0);
  const [rentDeposit, setRentDeposit] = useState(500);

  // Moving Costs
  const [movingCostBuying, setMovingCostBuying] = useState(2000);
  const [movingCostRenting, setMovingCostRenting] = useState(1000);

  // Monthly Expenses
  const [monthlyRenterInsurance, setMonthlyRenterInsurance] = useState(10);
  const [monthlyRentUtilities, setMonthlyRentUtilities] = useState(150);
  const [monthlyPropertyUtilities, setMonthlyPropertyUtilities] = useState(200);
  const [monthyQualityOfLife, setMonthyQualityOfLife] = useState(500);

  // Growth Rates
  const [homeAppreciation, setHomeAppreciation] = useState(4.5);
  const [investmentReturn, setInvestmentReturn] = useState(8);
  const [rentIncrease, setRentIncrease] = useState(3);
  const [salaryGrowthRate, setSalaryGrowthRate] = useState(3);

  // UI State
  const [xAxisYears, setXAxisYears] = useState(30);
  const [activePoint, setActivePoint] = useState(null);

  // Helper Functions
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

  const calculateTaxSavings = (mortgageInterest, propertyTaxes) => {
    const totalItemizedDeductions = mortgageInterest + propertyTaxes;
    const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - standardDeduction);
    return extraDeductionBenefit * (effectiveTaxRate / 100);
  };

  const projectionData = useMemo(() => {
    const data = [];

    // Initial Setup
    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);
    const totalUpfrontCosts = downPaymentAmount + closingCostsAmount + movingCostBuying;

    // Validate initial investment
    if (totalUpfrontCosts > initialInvestment) {
      return {
        error: "Insufficient initial investment for down payment and closing costs",
        requiredUpfront: totalUpfrontCosts,
        availableInvestment: initialInvestment
      };
    }

    // Initialize Financial Positions
    let buyingNetWorth = initialInvestment - totalUpfrontCosts;
    let rentingNetWorth = initialInvestment - rentDeposit - movingCostRenting;

    // Initialize Tracking Variables
    let currentHomeValue = homePrice;
    let currentMonthlyRent = monthlyRent;
    let currentAnnualSalary = annualSalaryBeforeTax;
    let mortgageBalance = homePrice - downPaymentAmount;
    let currentMonthlyRentalIncome = monthlyRentalIncome;

    // Calculate Monthly Mortgage Payment
    const monthlyInterestRate = mortgageRate / 100 / 12;
    const totalMonthlyPayments = mortgageYears * 12;
    const monthlyMortgagePayment = (mortgageBalance *
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonthlyPayments))) /
      (Math.pow(1 + monthlyInterestRate, totalMonthlyPayments) - 1);

    // Validate Affordability
    const initialMonthlyTakeHome = calculateMonthlyTakeHome(annualSalaryBeforeTax);
    const initialMonthlyPropertyTax = (currentHomeValue * (propertyTaxRate / 100)) / 12;
    const initialMonthlyHomeInsurance = (currentHomeValue * ANNUAL_HOMEOWNERS_INSURANCE_RATE) / 12;
    const initialMonthlyMaintenance = (currentHomeValue * annualMaintainanceRate / 100) / 12;
    const initialMonthlyPMI = downPaymentPercent < 20 ? (mortgageBalance * PMIRate) / 100 / 12 : 0;

    const initialTotalMonthlyHousingCosts =
      monthlyMortgagePayment +
      initialMonthlyPropertyTax +
      initialMonthlyHomeInsurance +
      initialMonthlyMaintenance +
      initialMonthlyPMI +
      monthlyPropertyUtilities;

    if (initialTotalMonthlyHousingCosts > initialMonthlyTakeHome) {
      return {
        error: "Monthly housing costs exceed monthly take-home pay",
        monthlyHousingCosts: initialTotalMonthlyHousingCosts,
        monthlyTakeHome: initialMonthlyTakeHome
      };
    }

    // Year-by-Year Calculations
    for (let year = 0; year <= mortgageYears; year++) {
      const mortgageBreakdown = calculateYearlyMortgageBreakdown(
        mortgageBalance,
        monthlyMortgagePayment,
        monthlyInterestRate
      );

      // Calculate Yearly Values
      const yearlyPropertyTaxes = currentHomeValue * (propertyTaxRate / 100);
      const yearlyTaxSavings = calculateTaxSavings(
        mortgageBreakdown.yearlyInterestPaid,
        yearlyPropertyTaxes
      );

      // Calculate Monthly Costs
      const monthlyPropertyTax = yearlyPropertyTaxes / 12;
      const monthlyHomeInsurance = (currentHomeValue * ANNUAL_HOMEOWNERS_INSURANCE_RATE) / 12;
      const monthlyMaintenance = (currentHomeValue * annualMaintainanceRate) / 100 / 12;
      const currentEquityPercent = ((currentHomeValue - mortgageBalance) / currentHomeValue) * 100;
      const monthlyPMI = currentEquityPercent < 20
        ? (mortgageBalance * PMIRate) / 100 / 12
        : 0;

      const totalMonthlyHomeownerCosts =
        monthlyMortgagePayment +
        monthlyPropertyTax +
        monthlyHomeInsurance +
        monthlyMaintenance +
        monthlyPMI +
        monthlyPropertyUtilities;

      const monthlyTaxBenefit = yearlyTaxSavings / 12;
      const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts -
        currentMonthlyRentalIncome - monthlyTaxBenefit;

      const totalMonthlyRenterCosts =
        currentMonthlyRent + monthlyRenterInsurance + monthlyRentUtilities;

      const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary);

      // Update Values for Next Year
      if (year > 0) {
        currentAnnualSalary *= 1 + salaryGrowthRate / 100;

        const monthlyAvailableForInvestment = monthlyTakeHome - netMonthlyHomeownerCosts;
        const desiredMonthlyInvestment = monthlyTakeHome * (investmentRate / 100);
        const actualMonthlyInvestment = Math.max(0, Math.min(
          desiredMonthlyInvestment,
          monthlyAvailableForInvestment
        ));

        const yearlyHomeownerInvestment = actualMonthlyInvestment * 12;
        const previousHomeValue = currentHomeValue;
        currentHomeValue *= 1 + homeAppreciation / 100;
        const yearlyEquityFromAppreciation = currentHomeValue - previousHomeValue;

        mortgageBalance = mortgageBreakdown.endingBalance;

        const previousBuyingInvestments = buyingNetWorth - (currentHomeValue - mortgageBalance);
        const yearlyQualityOfLifeBenefit = monthyQualityOfLife * 12;

        // Update Net Worth Calculations
        buyingNetWorth =
          previousBuyingInvestments * (1 + investmentReturn / 100) +
          yearlyHomeownerInvestment +
          yearlyEquityFromAppreciation +
          mortgageBreakdown.yearlyPrincipalPaid +
          yearlyQualityOfLifeBenefit +
          (currentHomeValue - mortgageBalance);

        currentMonthlyRentalIncome *= 1 + rentIncrease / 100;
        currentMonthlyRent *= 1 + rentIncrease / 100;

        const yearlyRenterInvestment =
          (monthlyTakeHome - totalMonthlyRenterCosts) * 12 * (investmentRate / 100);

        rentingNetWorth =
          rentingNetWorth * (1 + investmentReturn / 100) +
          yearlyRenterInvestment;
      }

      // Store Year's Data
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
        availableMonthlyInvestment: Math.round(monthlyTakeHome - netMonthlyHomeownerCosts),
        investmentRate,
        investmentReturn,
        annualRentCosts: Math.round(totalMonthlyRenterCosts * 12),
        monthlyRentalIncome: Math.round(currentMonthlyRentalIncome),
        yearlyTaxSavings: Math.round(yearlyTaxSavings),
      });
    }
    return data;
  }, [
    homePrice, downPaymentPercent, mortgageRate, propertyTaxRate,
    monthlyRent, homeAppreciation, investmentReturn, rentIncrease,
    closingCostPercent, monthlyRenterInsurance, monthlyRentUtilities,
    monthlyPropertyUtilities, salaryGrowthRate, initialInvestment,
    annualSalaryBeforeTax, effectiveTaxRate, investmentRate,
    standardDeduction, monthlyRentalIncome, movingCostBuying,
    rentDeposit, PMIRate, annualMaintainanceRate, monthyQualityOfLife,
    mortgageYears, movingCostRenting
  ]);

  const isValidProjectionData = (data) => Array.isArray(data) && !data.error;

  const Input = ({ label, value, onChange, min, max, step, suffix = "" }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm text-gray-600">{label}</label>
        <span className="text-sm font-medium">
          {value.toLocaleString()}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-screen-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-gray-800 mb-4">
            Net Worth Calculator: Buy vs. Rent
          </h1>
          <p className="text-sm text-gray-600 mb-2">
            The graph shows total net worth over time:
          </p>
          <ul className="text-sm text-gray-600 list-disc pl-5">
            <li className="mb-1">
              <span className="text-blue-500 font-medium">
                Buy Property & Invest
              </span>
              : Home equity + Investment portfolio ({investmentRate}% of salary
              invested) - Mortgage & costs + Rental income
            </li>
            <li className="mb-1">
              <span className="text-green-500 font-medium">Rent & Invest</span>:
              Investment portfolio ({investmentRate}% of salary invested) -
              Rental costs
            </li>
          </ul>
        </div>

        <AffordabilityCheck projectionData={projectionData} />

        {/* Input Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Financial Parameters Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Financial Parameters</h2>
            <Input
              label="Initial Investment Portfolio"
              value={initialInvestment}
              onChange={setInitialInvestment}
              min={0}
              max={5000000}
              step={10000}
              suffix="$"
            />
            <Input
              label="Annual Salary (before tax)"
              value={annualSalaryBeforeTax}
              onChange={setAnnualSalaryBeforeTax}
              min={50000}
              max={2000000}
              step={10000}
              suffix="$"
            />
            <Input
              label="Effective tax rate (percentage)"
              value={effectiveTaxRate}
              onChange={setEffectiveTaxRate}
              min={1}
              max={100}
              step={1}
              suffix="%"
            />
            <Input
              label="Standard Deduction"
              value={standardDeduction}
              onChange={setStandardDeduction}
              min={10000}
              max={40000}
              step={100}
              suffix="$"
            />
            <Input
              label="Percentage of Salary Invested"
              value={investmentRate}
              onChange={setInvestmentRate}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />
          </div>

          {/* Property Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Property Details</h2>

            {/* Purchase Related */}
            <Input
              label="Home Price"
              value={homePrice}
              onChange={setHomePrice}
              min={100000}
              max={2000000}
              step={10000}
              suffix="$"
            />
            <Input
              label="Down Payment"
              value={downPaymentPercent}
              onChange={setDownPaymentPercent}
              min={5}
              max={50}
              step={1}
              suffix="%"
            />
            <Input
              label="Closing Cost"
              value={closingCostPercent}
              onChange={setClosingCostPercent}
              min={0}
              max={6}
              step={0.1}
              suffix="%"
            />

            {/* Monthly Costs */}
            <Input
              label="Mortgage Rate"
              value={mortgageRate}
              onChange={setMortgageRate}
              min={0}
              max={10}
              step={0.1}
              suffix="%"
            />
            <Input
              label="PMI Rate"
              value={PMIRate}
              onChange={setPMIRate}
              min={0}
              max={30}
              step={.5}
              suffix="%"
            />
            <Input
              label="Annual Maintenance Rate"
              value={annualMaintainanceRate}
              onChange={setAnnualMaintainanceRate}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />
            <Input
              label="Property Tax Rate"
              value={propertyTaxRate}
              onChange={setPropertyTaxRate}
              min={0.5}
              max={3}
              step={0.1}
              suffix="%"
            />
            <Input
              label="Monthly Property Utilities"
              value={monthlyPropertyUtilities}
              onChange={setMonthlyPropertyUtilities}
              min={0}
              max={500}
              step={10}
              suffix="$"
            />
            {/* New Rental Income Input */}
            <Input
              label="Monthly Rental Income (after tax)"
              value={monthlyRentalIncome}
              onChange={setMonthlyRentalIncome}
              min={0}
              max={10000}
              step={100}
              suffix="$"
            />
            {/* Moving cost */}
            <Input
              label="Moving cost (one time)"
              value={movingCostBuying}
              onChange={setMovingCostBuying}
              min={0}
              max={10000}
              step={100}
              suffix="$"
            />
            <Input
              label="Mortgage Years"
              value={mortgageYears}
              onChange={setMortgageYears}
              min={5}
              max={30}
              step={1}
              suffix=""
            />
            <Input
              label={
                <div className="flex items-center gap-1">
                  Monthly Quality of Life Benefit
                  <div
                    className="text-gray-400 hover:text-gray-600 cursor-help"
                    title="How much you'd be willing to pay monthly for homeownership benefits like: control over space, freedom to renovate, sense of permanence, no landlord, community belonging"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </div>
                </div>
              }
              value={monthyQualityOfLife}
              onChange={setMonthyQualityOfLife}
              min={0}
              max={10000}
              step={100}
              suffix="$"
            />
          </div>

          {/* Renting Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Renting Details</h2>
            <Input
              label="Monthly Rent"
              value={monthlyRent}
              onChange={setMonthlyRent}
              min={1000}
              max={10000}
              step={100}
              suffix="$"
            />
            <Input
              label="Security Deposit (one time)"
              value={rentDeposit}
              onChange={setRentDeposit}
              min={0}
              max={5000}
              step={100}
              suffix="$"
            />
            <Input
              label="Monthly Rent Utilities"
              value={monthlyRentUtilities}
              onChange={setMonthlyRentUtilities}
              min={0}
              max={500}
              step={10}
              suffix="$"
            />
            <Input
              label="Monthly Renter's Insurance"
              value={monthlyRenterInsurance}
              onChange={setMonthlyRenterInsurance}
              min={5}
              max={50}
              step={1}
              suffix="$"
            />
            <Input
              label="Moving cost (one time)"
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

            {/* Timeline */}
            <Input
              label="Graph Timeline"
              value={xAxisYears}
              onChange={setXAxisYears}
              min={5}
              max={30}
              step={1}
              suffix=" years"
            />

            {/* Asset Growth */}
            <Input
              label="Home Appreciation"
              value={homeAppreciation}
              onChange={setHomeAppreciation}
              min={0}
              max={20}
              step={0.1}
              suffix="%"
            />
            <Input
              label="Investment Return"
              value={investmentReturn}
              onChange={setInvestmentReturn}
              min={2}
              max={12}
              step={0.5}
              suffix="%"
            />

            {/* Cost Increases */}
            <Input
              label="Rent Increase"
              value={rentIncrease}
              onChange={setRentIncrease}
              min={0}
              max={10}
              step={0.5}
              suffix="%"
            />
            <Input
              label="Salary Growth Rate"
              value={salaryGrowthRate}
              onChange={setSalaryGrowthRate}
              min={0}
              max={10}
              step={0.5}
              suffix="%"
            />
          </div>
        </div>

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

              <div className="text-center text-gray-600 mt-4">
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
                  const finalDifference =
                    projectionData[xAxisYears].buying -
                    projectionData[xAxisYears].renting;

                  return breakEvenYear !== null
                    ? `In year ${breakEvenYear}, buying becomes better than renting. By year ${xAxisYears}, you'll have $${Math.abs(
                      finalDifference
                    ).toLocaleString()} more by buying.`
                    : `Renting stays better for all ${xAxisYears} years. By the end, you'll have $${Math.abs(
                      finalDifference
                    ).toLocaleString()} more by renting.`;
                })()}
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
