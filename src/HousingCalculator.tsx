import React, { useState, useMemo} from "react";
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

const ANNUAL_HOMEOWNERS_INSURANCE_RATE = 0.0065;

const HousingCalculator = () => {
  // Financial Inputs
  const [annualSalaryBeforeTax, setAnnualSalaryBeforeTax] = useState(350000);
  const [effectiveTaxRate, setEffectiveTaxRate] = useState(40);
  const [standardDeduction, setStandardDeduction] = useState(21900);
  const [initialInvestment, setInitialInvestment] = useState(1000000);

  // Property Details
  const [homePrice, setHomePrice] = useState(700000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [mortgageYears, setMortgageYears] = useState(30);
  const [PMIRate, setPMIRate] = useState(1);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [closingCostPercent, setClosingCostPercent] = useState(3);
  const [annualMaintainanceRate, setAnnualMaintainanceRate] = useState(2);

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
    let previousBuyingInvestments = buyingNetWorth;

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

        // Invest all available money in both scenarios at the end of each month
        const monthlyAvailableForBuyerInvestment = monthlyTakeHome - netMonthlyHomeownerCosts;
        const monthlyAvailableForRenterInvestment = monthlyTakeHome - totalMonthlyRenterCosts;

        // Calculate yearly investments using all available money
        const yearlyHomeownerInvestment = Math.max(0, monthlyAvailableForBuyerInvestment) * 12;
        const yearlyRenterInvestment = Math.max(0, monthlyAvailableForRenterInvestment) * 12;

        const previousHomeValue = currentHomeValue;
        currentHomeValue *= 1 + homeAppreciation / 100;
        mortgageBalance = mortgageBreakdown.endingBalance;
        const yearlyQualityOfLifeBenefit = monthyQualityOfLife * 12;

        // Updated buying net worth calculation
        buyingNetWorth =
          previousBuyingInvestments * (1 + investmentReturn / 100) +
          yearlyHomeownerInvestment +
          yearlyQualityOfLifeBenefit +
          (currentHomeValue - mortgageBalance);

        // Update values for next iteration
        previousBuyingInvestments = buyingNetWorth - (currentHomeValue - mortgageBalance);

        currentMonthlyRentalIncome *= 1 + rentIncrease / 100;
        currentMonthlyRent *= 1 + rentIncrease / 100;

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
        monthlyRent: Math.round(currentMonthlyRent),
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
    annualSalaryBeforeTax, effectiveTaxRate,
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

        {/* Input Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Financial Parameters Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Financial Parameters</h2>
            <AnimatedInput
              label="Initial Investment Portfolio"
              value={initialInvestment}
              onChange={setInitialInvestment}
              min={0}
              max={5000000}
              step={10000}
              suffix="$"
            />
            <AnimatedInput
              label="Annual Salary (before tax)"
              value={annualSalaryBeforeTax}
              onChange={setAnnualSalaryBeforeTax}
              min={50000}
              max={2000000}
              step={10000}
              suffix="$"
            />
            <AnimatedInput
              label="Effective tax rate (percentage)"
              value={effectiveTaxRate}
              onChange={setEffectiveTaxRate}
              min={1}
              max={100}
              step={1}
              suffix="%"
            />
            <AnimatedInput
              label="Standard Deduction"
              value={standardDeduction}
              onChange={setStandardDeduction}
              min={10000}
              max={40000}
              step={100}
              suffix="$"
            />
          </div>

          {/* Property Details Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Property Details</h2>

            {/* Purchase Related */}
            <AnimatedInput
              label="Home Price"
              value={homePrice}
              onChange={setHomePrice}
              min={100000}
              max={2000000}
              step={10000}
              suffix="$"
            />
            <AnimatedInput
              label="Down Payment"
              value={downPaymentPercent}
              onChange={setDownPaymentPercent}
              min={5}
              max={50}
              step={.1}
              suffix="%"
            />
            <AnimatedInput
              label="Closing Cost"
              value={closingCostPercent}
              onChange={setClosingCostPercent}
              min={0}
              max={6}
              step={0.1}
              suffix="%"
            />

            {/* Monthly Costs */}
            <AnimatedInput
              label="Mortgage Rate"
              value={mortgageRate}
              onChange={setMortgageRate}
              min={.1}
              max={15}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label="PMI Rate"
              value={PMIRate}
              onChange={setPMIRate}
              min={0}
              max={30}
              step={.5}
              suffix="%"
            />
            <AnimatedInput
              label="Annual Maintenance Rate"
              value={annualMaintainanceRate}
              onChange={setAnnualMaintainanceRate}
              min={0}
              max={100}
              step={1}
              suffix="%"
            />
            <AnimatedInput
              label="Property Tax Rate"
              value={propertyTaxRate}
              onChange={setPropertyTaxRate}
              min={0.5}
              max={3}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label="Monthly Property Utilities"
              value={monthlyPropertyUtilities}
              onChange={setMonthlyPropertyUtilities}
              min={0}
              max={500}
              step={10}
              suffix="$"
            />
            {/* New Rental Income Input */}
            <AnimatedInput
              label="Monthly Rental Income (after tax)"
              value={monthlyRentalIncome}
              onChange={setMonthlyRentalIncome}
              min={0}
              max={10000}
              step={100}
              suffix="$"
            />
            {/* Moving cost */}
            <AnimatedInput
              label="Moving cost (one time)"
              value={movingCostBuying}
              onChange={setMovingCostBuying}
              min={0}
              max={10000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label="Mortgage Years"
              value={mortgageYears}
              onChange={setMortgageYears}
              min={5}
              max={30}
              step={1}
              suffix=""
            />
            <AnimatedInput
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
            <AnimatedInput
              label="Monthly Rent"
              value={monthlyRent}
              onChange={setMonthlyRent}
              min={1000}
              max={10000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label="Security Deposit (one time)"
              value={rentDeposit}
              onChange={setRentDeposit}
              min={0}
              max={5000}
              step={100}
              suffix="$"
            />
            <AnimatedInput
              label="Monthly Rent Utilities"
              value={monthlyRentUtilities}
              onChange={setMonthlyRentUtilities}
              min={0}
              max={500}
              step={10}
              suffix="$"
            />
            <AnimatedInput
              label="Monthly Renter's Insurance"
              value={monthlyRenterInsurance}
              onChange={setMonthlyRenterInsurance}
              min={5}
              max={50}
              step={1}
              suffix="$"
            />
            <AnimatedInput
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
            <AnimatedInput
              label="Graph Timeline"
              value={xAxisYears}
              onChange={setXAxisYears}
              min={5}
              max={30}
              step={1}
              suffix=" years"
            />

            {/* Asset Growth */}
            <AnimatedInput
              label="Home Appreciation"
              value={homeAppreciation}
              onChange={setHomeAppreciation}
              min={0}
              max={20}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label="Investment Return"
              value={investmentReturn}
              onChange={setInvestmentReturn}
              min={2}
              max={12}
              step={0.5}
              suffix="%"
            />

            {/* Cost Increases */}
            <AnimatedInput
              label="Rent Increase"
              value={rentIncrease}
              onChange={setRentIncrease}
              min={0}
              max={10}
              step={0.5}
              suffix="%"
            />
            <AnimatedInput
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
