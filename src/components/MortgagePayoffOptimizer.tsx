import React, { useState, useMemo } from 'react';
import { HousingCalculatorInputs } from '../lib/financialCalculations';
import { usePersistedState } from '../hooks/usePersistedState';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

interface PayoffScenario {
  name: string;
  extraMonthlyPayment: number;
  finalNetWorth: number;
  payoffYear: number;
  totalInterestPaid: number;
  opportunityCost: number;
  taxSavings: number;
  itemizedDeductionsByYear: number[];
}

interface MortgagePayoffOptimizerProps {
  inputs: HousingCalculatorInputs;
}

export const MortgagePayoffOptimizer: React.FC<MortgagePayoffOptimizerProps> = ({ inputs }) => {
  const [optimizationHorizon, setOptimizationHorizon] = usePersistedState('payoff-horizon', 30);
  const [selectedYear, setSelectedYear] = useState(1);

  const calculatePayoffScenario = (monthlyExtraPayment: number): PayoffScenario => {
    const { homePrice, downPaymentPercent, effectiveMortgageRate, mortgageYears, investmentReturn,
            propertyTaxRate, melloRoosTaxRate, annualSalaryBeforeTax, effectiveStateIncomeTaxRate,
            mortgageInterestDeductionCap, saltCap, standardDeduction, effectiveFederalTaxRate, 
            homeAppreciation, inflationRate, propertyTaxAssessmentCap, salaryGrowthRate,
            initialInvestment, closingCostPercent, movingCostBuying, monthlyMiscExpenses,
            PMIRate, annualMaintenanceRate, monthlyHOAFee, monthlyHomeInsurance,
            monthlyPropertyUtilities, monthlyRentalIncome } = inputs;

    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);
    const loanAmount = homePrice - downPaymentAmount;
    const monthlyRate = effectiveMortgageRate / 100 / 12;
    const totalPayments = mortgageYears * 12;
    const monthlyInvestmentReturn = investmentReturn / 100 / 12;
    const horizonMonths = optimizationHorizon * 12;

    const regularPayment = (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);

    let balance = loanAmount;
    // Initialize with remaining investment after down payment, closing costs, and moving costs
    let investmentBalance = initialInvestment - downPaymentAmount - closingCostsAmount - movingCostBuying;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let payoffMonth = -1;

    let annualInterestForTax = 0;
    let totalTaxSavings = 0;
    const itemizedDeductionsByYear: number[] = [];
    
    // Initialize values that need to grow over time
    let currentAssessedValue = homePrice;
    let currentStandardDeduction = standardDeduction;
    let currentAnnualSalary = annualSalaryBeforeTax;
    let currentMonthlyMiscExpenses = monthlyMiscExpenses;
    let currentMonthlyHOAFee = monthlyHOAFee;
    let currentMonthlyHomeInsurance = monthlyHomeInsurance;
    let currentMonthlyPropertyUtilities = monthlyPropertyUtilities;
    let currentMonthlyRentalIncome = monthlyRentalIncome;
    
    // Track the beginning balance for each year for tax calculations
    let beginningYearBalance = loanAmount;
    
    // Helper function to calculate monthly take-home pay
    const calculateMonthlyTakeHome = (annualSalary: number) => {
        const federalTaxAmount = annualSalary * (effectiveFederalTaxRate / 100);
        const stateTaxAmount = annualSalary * (effectiveStateIncomeTaxRate / 100);
        const totalTaxAmount = federalTaxAmount + stateTaxAmount;
        const afterTaxAnnual = annualSalary - totalTaxAmount;
        return afterTaxAnnual / 12;
    };

    for (let month = 1; month <= horizonMonths; month++) {
        // Apply annual updates at the beginning of each year
        if ((month - 1) % 12 === 0 && month > 1) {
            const yearsPassed = Math.floor((month - 1) / 12);
            // Salary grows annually
            currentAnnualSalary = annualSalaryBeforeTax * Math.pow(1 + salaryGrowthRate / 100, yearsPassed);
            // Standard deduction adjusts for inflation
            currentStandardDeduction = standardDeduction * Math.pow(1 + inflationRate / 100, yearsPassed);
            // Assessed value increases by lesser of inflation or assessment cap
            const assessmentIncrease = Math.min(inflationRate, propertyTaxAssessmentCap) / 100;
            currentAssessedValue = homePrice * Math.pow(1 + assessmentIncrease, yearsPassed);
            
            // Apply inflation to expenses
            const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsPassed);
            currentMonthlyMiscExpenses = monthlyMiscExpenses * inflationMultiplier;
            currentMonthlyHOAFee = monthlyHOAFee * inflationMultiplier;
            currentMonthlyHomeInsurance = monthlyHomeInsurance * inflationMultiplier;
            currentMonthlyPropertyUtilities = monthlyPropertyUtilities * inflationMultiplier;
            
            // Rental income grows with rent increase rate
            currentMonthlyRentalIncome = monthlyRentalIncome * Math.pow(1 + inputs.rentIncrease / 100, yearsPassed);
            
            // Store beginning balance for the year
            beginningYearBalance = balance;
        }
        
        // Grow investments
        investmentBalance *= (1 + monthlyInvestmentReturn);

        if (balance > 0) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(regularPayment + monthlyExtraPayment - interestPayment, balance);
            
            totalInterestPaid += interestPayment;
            annualInterestForTax += interestPayment;
            totalPrincipalPaid += principalPayment;
            balance -= principalPayment;

            if (balance <= 0 && payoffMonth === -1) {
                payoffMonth = month;
            }
        }

        // Calculate all monthly housing costs
        const currentHomeValue = homePrice * Math.pow(1 + homeAppreciation / 100, Math.floor((month - 1) / 12));
        const monthlyPropertyTax = (currentAssessedValue * (propertyTaxRate / 100)) / 12;
        const monthlyMelloRoosTax = (currentAssessedValue * (melloRoosTaxRate / 100)) / 12;
        const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate / 100) / 12;
        
        // PMI calculation
        const currentLTV = (balance / homePrice) * 100;
        const originalLoanAmount = homePrice * (1 - downPaymentPercent / 100);
        const monthlyPMI = currentLTV > 80 ? (originalLoanAmount * PMIRate) / 100 / 12 : 0;
        
        // Total monthly homeowner costs (excluding extra payments)
        const totalMonthlyHomeownerCosts = 
            regularPayment +
            monthlyPropertyTax +
            monthlyMelloRoosTax +
            currentMonthlyHomeInsurance +
            monthlyMaintenance +
            monthlyPMI +
            currentMonthlyPropertyUtilities +
            currentMonthlyHOAFee;
            
        // Net monthly homeowner costs after rental income
        const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts - currentMonthlyRentalIncome;
        
        // Calculate monthly take-home pay
        const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary);
        
        // Calculate available for investment (before extra mortgage payment)
        const monthlyAvailableBeforeExtra = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;
        
        // The actual investment is what's left after the extra mortgage payment
        let monthlyInvestment = Math.max(0, monthlyAvailableBeforeExtra - monthlyExtraPayment);
        
        // If mortgage is paid off, recalculate available investment
        if (payoffMonth !== -1 && month > payoffMonth) {
            const totalMonthlyHomeownerCostsNoPrincipal = 
                monthlyPropertyTax +
                monthlyMelloRoosTax +
                currentMonthlyHomeInsurance +
                monthlyMaintenance +
                currentMonthlyPropertyUtilities +
                currentMonthlyHOAFee;
            
            const netMonthlyHomeownerCostsNoPrincipal = totalMonthlyHomeownerCostsNoPrincipal - currentMonthlyRentalIncome;
            monthlyInvestment = monthlyTakeHome - netMonthlyHomeownerCostsNoPrincipal - currentMonthlyMiscExpenses;
        }
        
        investmentBalance += monthlyInvestment;

        // Calculate annual tax savings at the end of each year
        if (month % 12 === 0) {
            // Use assessed value for property taxes (not appreciated home value)
            const annualPropertyTax = currentAssessedValue * (propertyTaxRate / 100);
            const annualMelloRoosTax = currentAssessedValue * (melloRoosTaxRate / 100);
            const stateIncomeTax = currentAnnualSalary * (effectiveStateIncomeTaxRate / 100);

            // Use beginning year balance for mortgage interest deduction cap calculation
            const effectiveDeductibleBalance = Math.min(beginningYearBalance, mortgageInterestDeductionCap);
            const cappedMortgageInterest = beginningYearBalance > 0 
                ? annualInterestForTax * (effectiveDeductibleBalance / beginningYearBalance)
                : 0;

            const totalSaltTaxes = annualPropertyTax + annualMelloRoosTax + stateIncomeTax;
            const cappedSaltDeduction = Math.min(totalSaltTaxes, saltCap);
            const totalItemizedDeductions = cappedMortgageInterest + cappedSaltDeduction;
            itemizedDeductionsByYear.push(totalItemizedDeductions);
            
            const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
            const yearlyTaxSavings = extraDeductionBenefit * (effectiveFederalTaxRate / 100);
            
            // Invest the tax savings at the end of the year
            investmentBalance += yearlyTaxSavings;
            totalTaxSavings += yearlyTaxSavings;
            
            // Reset annual interest counter
            annualInterestForTax = 0;
        }
    }

    const homeValueAtHorizon = homePrice * Math.pow(1 + homeAppreciation / 100, optimizationHorizon);
    const finalNetWorth = homeValueAtHorizon + investmentBalance - balance;
    
    const payoffYears = payoffMonth !== -1 ? payoffMonth / 12 : mortgageYears;

    return {
        name: monthlyExtraPayment === 0 ? 'Standard Payment' : `+${monthlyExtraPayment.toLocaleString()}/mo`,
        extraMonthlyPayment: monthlyExtraPayment,
        finalNetWorth,
        payoffYear: Math.round(payoffYears * 10) / 10,
        totalInterestPaid,
        opportunityCost: 0, // This will be calculated later
        taxSavings: totalTaxSavings,
        itemizedDeductionsByYear,
    };
  };

  const scenarios = useMemo(() => {
    const extraPayments = [
      0, 100, 250, 500, 750, 1000, 1500, 2000,
      3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000
    ];

    const results = extraPayments.map(payment => calculatePayoffScenario(payment));
    
    const optimal = results.reduce((prev, current) => (prev.finalNetWorth > current.finalNetWorth) ? prev : current);

    return results.map(scenario => ({
      ...scenario,
      opportunityCost: optimal.finalNetWorth - scenario.finalNetWorth
    })).sort((a, b) => b.finalNetWorth - a.finalNetWorth);

  }, [inputs, optimizationHorizon]);

  const optimalScenario = scenarios[0];
  const standardScenario = scenarios.find((s: PayoffScenario) => s.extraMonthlyPayment === 0) || scenarios[0];

  const getDecisionRecommendation = () => {
    // Compare optimal scenario vs standard payment scenario
    const netWorthDifference = optimalScenario.finalNetWorth - standardScenario.finalNetWorth;
    const percentageImprovement = (netWorthDifference / standardScenario.finalNetWorth) * 100;
    
    if (optimalScenario.extraMonthlyPayment === 0) {
      return {
        recommendation: 'INVEST',
        reason: `Standard mortgage payments appear optimal. Consider investing extra cash instead of making additional mortgage payments.`
      };
    } else if (percentageImprovement > 5) {
      return {
        recommendation: 'PAY_OFF',
        reason: `Extra payments of $${optimalScenario.extraMonthlyPayment}/month could improve net worth by ${percentageImprovement.toFixed(1)}% over ${optimizationHorizon} years.`
      };
    } else {
      return {
        recommendation: 'BALANCED',
        reason: `The financial difference between strategies is modest. Consider your risk tolerance and liquidity needs.`
      };
    }
  };

  const decision = getDecisionRecommendation();
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Mortgage Payoff vs Investment Strategy Optimizer
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Optimization Timeline (Years)
            </label>
            <input
              type="number"
              value={optimizationHorizon}
              onChange={(e) => setOptimizationHorizon(parseInt(e.target.value) || 30)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="5"
              max="50"
            />
          </div>
          
          <div className={`p-4 rounded-lg ${
            decision.recommendation === 'INVEST' ? 'bg-green-50 border-green-200' :
            decision.recommendation === 'PAY_OFF' ? 'bg-blue-50 border-blue-200' :
            'bg-yellow-50 border-yellow-200'
          } border`}>
            <h3 className="font-semibold text-sm mb-2">Strategy Recommendation</h3>
            <p className="text-sm text-gray-700">{decision.reason}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Key Parameters (All Editable)</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Investment Return (%)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.investmentReturn}
                onChange={(e) => {
                  const event = new CustomEvent('updateInvestmentReturn', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Mortgage Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.effectiveMortgageRate}
                onChange={(e) => {
                  const event = new CustomEvent('updateMortgageRate', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Federal Tax (%)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.effectiveFederalTaxRate}
                onChange={(e) => {
                  const event = new CustomEvent('updateFederalTaxRate', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">State Tax (%)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.effectiveStateIncomeTaxRate}
                onChange={(e) => {
                  const event = new CustomEvent('updateStateTaxRate', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Home Price ($)</label>
              <input
                type="number"
                step="1000"
                value={inputs.homePrice}
                onChange={(e) => {
                  const event = new CustomEvent('updateHomePrice', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Down Payment (%)</label>
              <input
                type="number"
                step="0.5"
                value={inputs.downPaymentPercent}
                onChange={(e) => {
                  const event = new CustomEvent('updateDownPayment', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Mortgage Years</label>
              <input
                type="number"
                step="1"
                value={inputs.mortgageYears}
                onChange={(e) => {
                  const event = new CustomEvent('updateMortgageYears', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Home Appreciation (%)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.homeAppreciation}
                onChange={(e) => {
                  const event = new CustomEvent('updateHomeAppreciation', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Property Tax (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.propertyTaxRate}
                onChange={(e) => {
                  const event = new CustomEvent('updatePropertyTaxRate', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Inflation Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.inflationRate}
                onChange={(e) => {
                  const event = new CustomEvent('updateInflationRate', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Salary Growth (%)</label>
              <input
                type="number"
                step="0.1"
                value={inputs.salaryGrowthRate}
                onChange={(e) => {
                  const event = new CustomEvent('updateSalaryGrowth', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">PMI Rate (%)</label>
              <input
                type="number"
                step="0.01"
                value={inputs.PMIRate}
                onChange={(e) => {
                  const event = new CustomEvent('updatePMIRate', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Annual Salary ($)</label>
              <input
                type="number"
                step="1000"
                value={inputs.annualSalaryBeforeTax}
                onChange={(e) => {
                  const event = new CustomEvent('updateAnnualSalary', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Standard Deduction ($)</label>
              <input
                type="number"
                step="100"
                value={inputs.standardDeduction}
                onChange={(e) => {
                  const event = new CustomEvent('updateStandardDeduction', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">SALT Cap ($)</label>
              <input
                type="number"
                step="1000"
                value={inputs.saltCap}
                onChange={(e) => {
                  const event = new CustomEvent('updateSaltCap', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-600 mb-1 font-medium">Mortgage Interest Cap ($)</label>
              <input
                type="number"
                step="10000"
                value={inputs.mortgageInterestDeductionCap}
                onChange={(e) => {
                  const event = new CustomEvent('updateMortgageInterestCap', { 
                    detail: { value: parseFloat(e.target.value) || 0 } 
                  });
                  window.dispatchEvent(event);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-xs text-blue-800 grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><strong>Mortgage Rate:</strong> {inputs.effectiveMortgageRate.toFixed(2)}%</div>
              <div><strong>Loan Amount:</strong> ${(inputs.homePrice * (1 - inputs.downPaymentPercent / 100)).toLocaleString()}</div>
              <div><strong>Down Payment:</strong> ${(inputs.homePrice * inputs.downPaymentPercent / 100).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Payoff Strategy Comparison (at {optimizationHorizon} years)
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-2">Strategy</th>
                  <th className="text-right py-3 px-2">Final Net Worth</th>
                  <th className="text-right py-3 px-2">Payoff Time</th>
                  <th className="text-right py-3 px-2">Total Interest</th>
                  <th className="text-right py-3 px-2">Tax Savings</th>
                  <th className="text-right py-3 px-2">
                    <div className="flex items-center justify-end">
                      <span>Itemized Deductions (Year {selectedYear})</span>
                      <div className="flex flex-col ml-1">
                        <button onClick={() => setSelectedYear(y => Math.min(y + 1, optimizationHorizon))} className="h-4 w-4 text-xs leading-none">▲</button>
                        <button onClick={() => setSelectedYear(y => Math.max(y - 1, 1))} className="h-4 w-4 text-xs leading-none">▼</button>
                      </div>
                    </div>
                  </th>
                  <th className="text-right py-3 px-2">Opportunity Cost</th>
                </tr>
              </thead>
              <tbody>
                {scenarios.map((scenario, index) => (
                  <tr 
                    key={scenario.extraMonthlyPayment}
                    className={`border-b border-gray-100 ${
                      index === 0 ? 'bg-green-50' : ''
                    }`}
                  >
                    <td className="py-3 px-2 font-medium">{scenario.name}</td>
                    <td className="py-3 px-2 text-right">
                      ${scenario.finalNetWorth.toLocaleString()}
                      {index === 0 && <span className="text-green-600 text-xs ml-1">OPTIMAL</span>}
                    </td>
                    <td className="py-3 px-2 text-right">{scenario.payoffYear} years</td>
                    <td className="py-3 px-2 text-right">${Math.round(scenario.totalInterestPaid).toLocaleString()}</td>
                    <td className="py-3 px-2 text-right text-green-600">
                      ${Math.round(scenario.taxSavings).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-blue-600">
                      ${Math.round(scenario.itemizedDeductionsByYear[selectedYear - 1] || 0).toLocaleString()}
                    </td>
                    <td className="py-3 px-2 text-right text-gray-600">
                      ${Math.round(scenario.opportunityCost).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Final Net Worth Comparison</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scenarios} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    fontSize={9}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                    fontSize={10}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Net Worth']}
                  />
                  <Bar 
                    dataKey="finalNetWorth" 
                    fill="#3B82F6"
                    stroke="#1E40AF"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Payoff Time vs Interest Paid</h4>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={scenarios} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    fontSize={9}
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => `${value}y`}
                    fontSize={10}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    fontSize={10}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'payoffYear') return [`${value} years`, 'Payoff Time'];
                      return [`$${value.toLocaleString()}`, 'Total Interest'];
                    }}
                  />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="payoffYear" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Payoff Time (years)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="totalInterestPaid" 
                    stroke="#F59E0B" 
                    strokeWidth={2}
                    name="Total Interest Paid"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-800 mb-3">Opportunity Cost Analysis</h4>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scenarios} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    fontSize={9}
                    interval={0}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
                    fontSize={10}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Opportunity Cost']}
                  />
                  <Bar 
                    dataKey="opportunityCost" 
                    fill="#DC2626"
                    stroke="#B91C1C"
                    strokeWidth={1}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {optimalScenario.extraMonthlyPayment !== 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Optimal Strategy Impact</h4>
            <p className="text-sm text-green-700">
              Paying an extra ${optimalScenario.extraMonthlyPayment}/month results in 
              ${(optimalScenario.finalNetWorth - standardScenario.finalNetWorth).toLocaleString()} 
              more net worth after {optimizationHorizon} years compared to standard payments.
            </p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Market Timing Considerations
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Favor Extra Payments When:</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Investment returns are volatile or below mortgage rate
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Approaching retirement and want guaranteed savings
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                High tax rates reduce mortgage interest deduction value
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Interest rates are rising (locks in current low rate)
              </li>
            </ul>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-800">Favor Investing When:</h4>
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Investment returns consistently exceed mortgage rate
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Long investment horizon (15+ years)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Taking advantage of tax-advantaged accounts
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                High inflation erodes fixed mortgage payments
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};