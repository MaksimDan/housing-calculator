import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const HousingCalculator = () => {
  const [annualSalary, setAnnualSalary] = useState(350000);
  const [investmentRate, setInvestmentRate] = useState(20);
  const [initialInvestment, setInitialInvestment] = useState(1000000);
  const [homePrice, setHomePrice] = useState(700000);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [mortgageRate, setMortgageRate] = useState(6.5);
  const [propertyTaxRate, setPropertyTaxRate] = useState(1.2);
  const [monthlyRent, setMonthlyRent] = useState(2000);
  const [closingCostPercent, setClosingCostPercent] = useState(3);
  const [movingCost] = useState(2000);
  const [monthlyRenterInsurance, setMonthlyRenterInsurance] = useState(10);
  const [monthlyRentUtilities, setMonthlyRentUtilities] = useState(150);
  const [monthlyPropertyUtilities, setMonthlyPropertyUtilities] = useState(200);
  const [homeAppreciation, setHomeAppreciation] = useState(3);
  const [investmentReturn, setInvestmentReturn] = useState(11);
  const [rentIncrease, setRentIncrease] = useState(3);
  const [salaryGrowthRate, setSalaryGrowthRate] = useState(3);
  const [xAxisYears, setXAxisYears] = useState(10);

  const INSURANCE_RATE = 0.005;
  const MAINTENANCE_RATE = 0.01;
  const PMI_RATE = 0.01;
  const YEARS = 30;

  // Monthly costs calculation remains the same as it was correct
const calculateMonthlyCosts = (price, downPercent, mortRate) => {
  const downPayment = price * (downPercent / 100);
  const loanAmount = price - downPayment;
  const monthlyRate = mortRate / 100 / 12;
  const numPayments = YEARS * 12;
  
  const monthlyMortgage = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  const monthlyPropertyTax = (price * (propertyTaxRate / 100)) / 12;
  const monthlyInsurance = (price * INSURANCE_RATE) / 12;
  const monthlyMaintenance = (price * MAINTENANCE_RATE) / 12;
  const monthlyPMI = downPercent < 20 ? (loanAmount * PMI_RATE) / 12 : 0;
  
  return {
    total: monthlyMortgage + monthlyPropertyTax + monthlyInsurance + 
           monthlyMaintenance + monthlyPMI + monthlyPropertyUtilities,
    breakdown: {
      mortgage: monthlyMortgage,
      tax: monthlyPropertyTax,
      insurance: monthlyInsurance,
      maintenance: monthlyMaintenance,
      pmi: monthlyPMI,
      utilities: monthlyPropertyUtilities
    }
  };
};

const projectionData = useMemo(() => {
  const data = [];
  
  // Calculate initial costs for buying
  const downPayment = homePrice * (downPaymentPercent / 100);
  const closingCosts = homePrice * (closingCostPercent / 100);
  const initialCostsBuying = downPayment + closingCosts + movingCost;
  
  // Initial positions - money available for investment
  let buyingNetWorth = initialInvestment - initialCostsBuying;
  let rentingNetWorth = initialInvestment - movingCost;
  
  // Track home-related values
  let currentHomeValue = homePrice;
  let currentRent = monthlyRent;
  let currentSalary = annualSalary;
  let loanAmount = homePrice - downPayment;
  
  // Calculate fixed monthly mortgage payment
  const monthlyRate = (mortgageRate / 100) / 12;
  const numPayments = YEARS * 12;
  const monthlyMortgagePayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / 
    (Math.pow(1 + monthlyRate, numPayments) - 1);
  
  for (let year = 0; year <= YEARS; year++) {
    // Calculate monthly costs for both scenarios
    const monthlyPropertyTax = (currentHomeValue * (propertyTaxRate / 100)) / 12;
    const monthlyInsurance = (currentHomeValue * INSURANCE_RATE) / 12;
    const monthlyMaintenance = (currentHomeValue * MAINTENANCE_RATE) / 12;
    const monthlyPMI = downPaymentPercent < 20 ? (loanAmount * PMI_RATE) / 12 : 0;
    
    const totalMonthlyHomeCosts = 
      monthlyMortgagePayment + 
      monthlyPropertyTax + 
      monthlyInsurance + 
      monthlyMaintenance + 
      monthlyPMI + 
      monthlyPropertyUtilities;

    const totalMonthlyRentCosts = 
      currentRent + 
      monthlyRenterInsurance + 
      monthlyRentUtilities;

    if (year > 0) {
      // Salary growth and new savings calculation
      currentSalary *= (1 + salaryGrowthRate / 100);
      const annualSavings = currentSalary * (investmentRate / 100);
      
      // Home value appreciation
      const previousHomeValue = currentHomeValue;
      currentHomeValue *= (1 + homeAppreciation / 100);
      const yearlyHomeAppreciation = currentHomeValue - previousHomeValue;
      
      // Calculate mortgage principal paydown
      const monthlyInterestRate = mortgageRate / 100 / 12;
      const remainingPayments = (YEARS - year) * 12;
      const previousLoanAmount = loanAmount;
      loanAmount = monthlyMortgagePayment * 
        ((1 - Math.pow(1 + monthlyInterestRate, -remainingPayments)) / monthlyInterestRate);
      loanAmount = Math.max(0, loanAmount);
      const principalPaydown = previousLoanAmount - loanAmount;
      
      // Investment returns and costs for buying scenario
      const previousBuyingInvestments = buyingNetWorth - (currentHomeValue - loanAmount);
      const buyingInvestmentReturns = previousBuyingInvestments * (investmentReturn / 100);
      
      // Update buying net worth:
      // 1. Previous investments grow at investment return rate
      // 2. Add new savings
      // 3. Subtract housing costs
      // 4. Add home appreciation
      // 5. Add principal paydown
      buyingNetWorth = 
        previousBuyingInvestments * (1 + investmentReturn / 100) + // Investment growth
        annualSavings - // New savings
        (totalMonthlyHomeCosts * 12) + // Annual housing costs
        yearlyHomeAppreciation + // Home appreciation
        principalPaydown; // Equity from mortgage paydown
      
      // Add current home equity
      buyingNetWorth += (currentHomeValue - loanAmount);
      
      // Renting scenario
      // 1. Previous investments grow at investment return rate
      // 2. Add new savings
      // 3. Subtract rental costs
      currentRent *= (1 + rentIncrease / 100);
      rentingNetWorth = 
        rentingNetWorth * (1 + investmentReturn / 100) + // Investment growth
        annualSavings - // New savings
        (totalMonthlyRentCosts * 12); // Annual rental costs
    }
    
    data.push({
      year,
      buying: Math.round(buyingNetWorth),
      renting: Math.round(rentingNetWorth),
      salary: Math.round(currentSalary)
    });
  }
  
  return data;
}, [homePrice, downPaymentPercent, mortgageRate, propertyTaxRate, monthlyRent,
    homeAppreciation, investmentReturn, rentIncrease, closingCostPercent,
    monthlyRenterInsurance, monthlyRentUtilities, monthlyPropertyUtilities,
    salaryGrowthRate, initialInvestment, annualSalary, investmentRate]);

  const Input = ({ label, value, onChange, min, max, step, suffix = "" }) => (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-1">
        <label className="text-sm text-gray-600">{label}</label>
        <span className="text-sm font-medium">{value.toLocaleString()}{suffix}</span>
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

  const monthlyCosts = calculateMonthlyCosts(homePrice, downPaymentPercent, mortgageRate);
  const breakEvenYear = projectionData.find(point => point.buying > point.renting)?.year;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-light text-gray-800 mb-4">Net Worth Calculator: Buy vs. Rent</h1>
          <p className="text-sm text-gray-600 mb-2">The graph shows total net worth over time:</p>
          <ul className="text-sm text-gray-600 list-disc pl-5">
            <li className="mb-1"><span className="text-blue-500 font-medium">Buy Property</span>: Home equity + Investment portfolio ({investmentRate}% of salary invested) - Mortgage & costs</li>
            <li className="mb-1"><span className="text-green-500 font-medium">Rent & Invest</span>: Investment portfolio ({investmentRate}% of salary invested) - Rental costs</li>
          </ul>
        </div>
        
        {/* Input Cards Grid - Now in a row at the top */}
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
              label="Annual Salary"
              value={annualSalary}
              onChange={setAnnualSalary}
              min={50000}
              max={2000000}
              step={10000}
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
              label="Mortgage Rate"
              value={mortgageRate}
              onChange={setMortgageRate}
              min={2}
              max={10}
              step={0.1}
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
          </div>

          {/* Growth Assumptions Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-medium mb-4">Growth Assumptions</h2>
            <Input
              label="Graph Timeline"
              value={xAxisYears}
              onChange={setXAxisYears}
              min={5}
              max={30}
              step={1}
              suffix=" years"
            />
            <Input
              label="Home Appreciation"
              value={homeAppreciation}
              onChange={setHomeAppreciation}
              min={0}
              max={10}
              step={0.5}
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
            <Input
              label="Rent Increase"
              value={rentIncrease}
              onChange={setRentIncrease}
              min={0}
              max={10}
              step={0.5}
              suffix="%"
            />
          </div>
        </div>

        {/* Graph Section - Now full width below the cards */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="h-96 mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={projectionData.slice(0, xAxisYears + 1)} 
                margin={{ top: 30, right: 30, left: 60, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="year" 
                  stroke="#666"
                  label={{ value: 'Years', position: 'insideBottom', offset: -5 }}
                  domain={[0, xAxisYears]}
                />
                <YAxis
                  stroke="#666"
                  tickFormatter={(value) => `$${Math.abs(value / 1000)}k`}
                  label={{ 
                    value: 'Net Worth', 
                    angle: -90,
                    position: 'insideLeft',
                    offset: -45
                  }}
                />
                <Tooltip
                  formatter={(value) => [`$${Math.abs(value).toLocaleString()}`, value < 0 ? 'Initial Investment/Costs' : 'Net Worth']}
                  labelFormatter={(value) => `Year ${value}`}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  formatter={(value) => {
                    return value === "buying" ? "Buy Property" : "Rent & Invest";
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
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-center text-gray-600 mb-6">
          {breakEvenYear ? 
              `Based on current assumptions, buying this property will become more financially advantageous than renting after ${breakEvenYear} years.` :
              `Based on current assumptions, ${projectionData[xAxisYears].renting < projectionData[xAxisYears].buying ? 'renting' : 'buying'} remains more financially advantageous throughout the ${xAxisYears}-year period.`}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-2">Monthly Costs (Buying)</h3>
              <div className="space-y-1 text-gray-600">
                <div>Mortgage: ${Math.round(monthlyCosts.breakdown.mortgage).toLocaleString()}</div>
                <div>Property Tax: ${Math.round(monthlyCosts.breakdown.tax).toLocaleString()}</div>
                <div>Insurance: ${Math.round(monthlyCosts.breakdown.insurance).toLocaleString()}</div>
                <div>Maintenance: ${Math.round(monthlyCosts.breakdown.maintenance).toLocaleString()}</div>
                <div>Utilities: ${Math.round(monthlyCosts.breakdown.utilities).toLocaleString()}</div>
                {monthlyCosts.breakdown.pmi > 0 && (
                  <div>PMI: ${Math.round(monthlyCosts.breakdown.pmi).toLocaleString()}</div>
                )}
                <div className="font-medium text-gray-900 pt-1">
                  Total: ${Math.round(monthlyCosts.total).toLocaleString()}
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-medium mb-2">Monthly Costs (Renting)</h3>
              <div className="space-y-1 text-gray-600">
                <div>Rent: ${monthlyRent.toLocaleString()}</div>
                <div>Utilities: ${monthlyRentUtilities.toLocaleString()}</div>
                <div>Renter's Insurance: ${monthlyRenterInsurance.toLocaleString()}</div>
                <div className="font-medium text-gray-900 pt-1">
                  Total: ${(monthlyRent + monthlyRentUtilities + monthlyRenterInsurance).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HousingCalculator;