import React, { useState, useMemo } from "react";
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
  // Core Financial Inputs
  const [annualSalaryBeforeTax, setAnnualSalaryBeforeTax] = useState(350000);
  const [effectiveTaxRate, setEffectiveTaxRate] = useState(40);
  const [standardDeduction, setStandardDeduction] = useState(21900);
  const [initialInvestment, setInitialInvestment] = useState(1000000);  // Starting cash available

  // Property Details - Inputs that affect purchase costs and ongoing expenses
  const [homePrice, setHomePrice] = useState(700000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [effectoveMortgageRate, setEffectiveMortgageRate] = useState(6.5);
  const [mortgageYears, setMortgageYears] = useState(30);
  const [PMIRate, setPMIRate] = useState(1);  // Private Mortgage Insurance rate if down payment < 20%
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [closingCostPercent, setClosingCostPercent] = useState(3);
  const [annualMaintainanceRate, setAnnualMaintainanceRate] = useState(2);

  // Rental Related - Inputs for rental scenario and potential rental income
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [monthlyRentalIncome, setMonthlyRentalIncome] = useState(0);  // If planning to rent out part of owned property
  const [rentDeposit, setRentDeposit] = useState(500);

  // One-time Moving Costs
  const [movingCostBuying, setMovingCostBuying] = useState(2000);
  const [movingCostRenting, setMovingCostRenting] = useState(1000);

  // Monthly Recurring Expenses
  const [monthlyRenterInsurance, setMonthlyRenterInsurance] = useState(10);
  const [monthlyRentUtilities, setMonthlyRentUtilities] = useState(150);
  const [monthlyPropertyUtilities, setMonthlyPropertyUtilities] = useState(200);
  // This is a subjective metric that artificially inflates net worth for the buying scenario. It is up the user to induce it.
  const [monthyQualityOfLife, setMonthyQualityOfLife] = useState(500);

  // Annual Growth/Return Rates
  const [homeAppreciation, setHomeAppreciation] = useState(4.5);
  const [investmentReturn, setInvestmentReturn] = useState(8);
  const [rentIncrease, setRentIncrease] = useState(3);
  const [salaryGrowthRate, setSalaryGrowthRate] = useState(3);

  // UI State for visualization
  const [xAxisYears, setXAxisYears] = useState(30);
  const [activePoint, setActivePoint] = useState(null);

  // Helper Functions

  // Calculate monthly take-home pay after taxes
  const calculateMonthlyTakeHome = (annualSalary) => {
    const afterTaxAnnual = annualSalary * (1 - effectiveTaxRate / 100);
    return afterTaxAnnual / 12;
  };

  // Calculate yearly mortgage amortization details
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

  // Calculate tax savings from mortgage interest and property tax deductions
  const calculateTaxSavings = (mortgageInterest, propertyTaxes) => {
    // Only benefit from itemizing if deductions exceed standard deduction
    const totalItemizedDeductions = mortgageInterest + propertyTaxes;
    const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - standardDeduction);
    return extraDeductionBenefit * (effectiveTaxRate / 100);
  };

  // Main projection calculation
  const projectionData = useMemo(() => {
    const data = [];

    // --- Initial Setup ---

    // Calculate upfront costs
    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);

    // Calculate initial net worth for both scenarios
    // For buying: We subtract closing costs and moving costs, but NOT down payment
    // Down payment converts from cash to home equity, so it doesn't affect net worth
    let buyingNetWorth = initialInvestment - closingCostsAmount - movingCostBuying;

    // For renting: We subtract security deposit and moving costs
    let rentingNetWorth = initialInvestment - rentDeposit - movingCostRenting;

    // Validate if we have enough initial investment to cover all upfront cash needs
    const totalCashNeeded = downPaymentAmount + closingCostsAmount + movingCostBuying;
    if (totalCashNeeded > initialInvestment) {
      return {
        error: "Insufficient initial investment for down payment and closing costs",
        requiredUpfront: totalCashNeeded,
        availableInvestment: initialInvestment
      };
    }

    // Initialize tracking variables for year-over-year calculations
    let currentHomeValue = homePrice;  // Tracks home value with appreciation
    let currentMonthlyRent = monthlyRent;  // Tracks rent with annual increases
    let currentAnnualSalary = annualSalaryBeforeTax;  // Tracks salary growth
    let mortgageBalance = homePrice - downPaymentAmount;  // Tracks remaining mortgage
    let currentMonthlyRentalIncome = monthlyRentalIncome;  // Tracks rental income if any

    // Calculate how much of buying net worth is in non-home investments
    // This is important because investment returns only apply to this portion
    let previousBuyingInvestments = buyingNetWorth - (currentHomeValue - mortgageBalance);

    // Calculate monthly mortgage payment (stays constant through loan term)
    const monthlyInterestRate = effectoveMortgageRate / 100 / 12;
    const totalMonthlyPayments = mortgageYears * 12;
    const monthlyMortgagePayment = (mortgageBalance *
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonthlyPayments))) /
      (Math.pow(1 + monthlyInterestRate, totalMonthlyPayments) - 1);

    // --- Validate Monthly Affordability ---
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

    // --- Year-by-Year Calculations ---
    for (let year = 0; year <= mortgageYears; year++) {
      // Calculate this year's mortgage payments breakdown
      const mortgageBreakdown = calculateYearlyMortgageBreakdown(
        mortgageBalance,
        monthlyMortgagePayment,
        monthlyInterestRate
      );

      // Calculate annual property tax and potential tax savings
      const yearlyPropertyTaxes = currentHomeValue * (propertyTaxRate / 100);
      const yearlyTaxSavings = calculateTaxSavings(
        mortgageBreakdown.yearlyInterestPaid,
        yearlyPropertyTaxes
      );

      // Calculate monthly housing costs for homeowner
      const monthlyPropertyTax = yearlyPropertyTaxes / 12;
      const monthlyHomeInsurance = (currentHomeValue * ANNUAL_HOMEOWNERS_INSURANCE_RATE) / 12;
      const monthlyMaintenance = (currentHomeValue * annualMaintainanceRate) / 100 / 12;

      // Check if PMI is still needed (required when equity < 20%)
      // Calculate equity percentage based on original purchase price
      const equityPercentOriginal = ((homePrice - mortgageBalance) / homePrice) * 100;
      const monthlyPMI = equityPercentOriginal < 20
        ? (mortgageBalance * PMIRate) / 100 / 12
        : 0;

      // Sum up all monthly costs for homeowner
      const totalMonthlyHomeownerCosts =
        monthlyMortgagePayment +
        monthlyPropertyTax +
        monthlyHomeInsurance +
        monthlyMaintenance +
        monthlyPMI +
        monthlyPropertyUtilities;

      // Calculate net monthly cost after rental income and tax benefits
      const monthlyTaxBenefit = yearlyTaxSavings / 12;
      const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts -
        currentMonthlyRentalIncome - monthlyTaxBenefit;

      // Calculate total monthly costs for renter
      const totalMonthlyRenterCosts =
        currentMonthlyRent + monthlyRenterInsurance + monthlyRentUtilities;

      const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary);

      // Update values for next year (if not the initial year)
      if (year > 0) {
        // Increase salary by growth rate
        currentAnnualSalary *= 1 + salaryGrowthRate / 100;

        // Calculate how much each scenario can invest monthly
        const monthlyAvailableForBuyerInvestment = monthlyTakeHome - netMonthlyHomeownerCosts;
        const monthlyAvailableForRenterInvestment = monthlyTakeHome - totalMonthlyRenterCosts;

        // Convert to yearly investment amounts
        const yearlyHomeownerInvestment = Math.max(0, monthlyAvailableForBuyerInvestment) * 12;
        const yearlyRenterInvestment = Math.max(0, monthlyAvailableForRenterInvestment) * 12;

        // Update home value with appreciation
        const previousHomeValue = currentHomeValue;
        currentHomeValue *= 1 + homeAppreciation / 100;

        // Update mortgage balance based on this year's payments
        mortgageBalance = mortgageBreakdown.endingBalance;

        // Quality of life benefit (if any) added to buying scenario
        const yearlyQualityOfLifeBenefit = monthyQualityOfLife * 12;

        // Calculate new buying net worth:
        // 1. Previous investments grow at investment return rate
        // 2. Add new investments from savings
        // 3. Add quality of life benefit
        // 4. Add current home equity (home value minus mortgage)
        buyingNetWorth =
          previousBuyingInvestments * (1 + investmentReturn / 100) +
          yearlyHomeownerInvestment +
          yearlyQualityOfLifeBenefit +
          (currentHomeValue - mortgageBalance);

        // Track how much of buying net worth is in investments vs home equity
        previousBuyingInvestments = buyingNetWorth - (currentHomeValue - mortgageBalance);

        // Update rental income and rent with their respective growth rates
        currentMonthlyRentalIncome *= 1 + rentIncrease / 100;
        currentMonthlyRent *= 1 + rentIncrease / 100;

        // Calculate new renting net worth:
        // 1. Previous investments grow at investment return rate
        // 2. Add new investments from savings
        rentingNetWorth =
          rentingNetWorth * (1 + investmentReturn / 100) +
          yearlyRenterInvestment;
      }

      // Store this year's data for visualization and analysis
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
    homePrice, downPaymentPercent, effectoveMortgageRate, propertyTaxRate,
    monthlyRent, homeAppreciation, investmentReturn, rentIncrease,
    closingCostPercent, monthlyRenterInsurance, monthlyRentUtilities,
    monthlyPropertyUtilities, salaryGrowthRate, initialInvestment,
    annualSalaryBeforeTax, effectiveTaxRate,
    standardDeduction, monthlyRentalIncome, movingCostBuying,
    rentDeposit, PMIRate, annualMaintainanceRate, monthyQualityOfLife,
    mortgageYears, movingCostRenting
  ]);

  const isValidProjectionData = (data) => Array.isArray(data) && !data.error;

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
              max={100}
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
              label="Effective Mortgage Rate"
              value={effectoveMortgageRate}
              onChange={setEffectiveMortgageRate}
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
                  Monthly Quality of Life Benefit (Subjective Inflator)
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
              min={1}
              max={50}
              step={0.5}
              suffix="%"
            />

            {/* Cost Increases */}
            <AnimatedInput
              label="Rent Increase"
              value={rentIncrease}
              onChange={setRentIncrease}
              min={0}
              max={15}
              step={0.1}
              suffix="%"
            />
            <AnimatedInput
              label="Salary Growth Rate"
              value={salaryGrowthRate}
              onChange={setSalaryGrowthRate}
              min={0}
              max={20}
              step={0.1}
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
                const finalDifference = projectionData[xAxisYears].buying - projectionData[xAxisYears].renting;
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
