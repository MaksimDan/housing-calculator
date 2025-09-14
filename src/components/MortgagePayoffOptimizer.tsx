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
  itemizedDeductions: number;
}

interface MortgagePayoffOptimizerProps {
  inputs: HousingCalculatorInputs;
}

export const MortgagePayoffOptimizer: React.FC<MortgagePayoffOptimizerProps> = ({ inputs }) => {
  const [extraPaymentAmount, setExtraPaymentAmount] = usePersistedState('payoff-extraPayment', 500);
  const [optimizationHorizon, setOptimizationHorizon] = usePersistedState('payoff-horizon', 30);

  const calculatePayoffScenario = (monthlyExtraPayment: number): PayoffScenario => {
    const { homePrice, downPaymentPercent, effectiveMortgageRate, mortgageYears, investmentReturn,
            propertyTaxRate, melloRoosTaxRate, annualSalaryBeforeTax, effectiveStateIncomeTaxRate,
            mortgageInterestDeductionCap, saltCap, standardDeduction, effectiveFederalTaxRate } = inputs;
    
    const loanAmount = homePrice * (1 - downPaymentPercent / 100);
    const monthlyRate = effectiveMortgageRate / 100 / 12;
    const totalPayments = mortgageYears * 12;
    
    const regularPayment = (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);
    
    const totalMonthlyPayment = regularPayment + monthlyExtraPayment;
    
    let balance = loanAmount;
    let totalInterest = 0;
    let month = 0;
    
    while (balance > 0 && month < totalPayments) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = Math.min(totalMonthlyPayment - interestPayment, balance);
      
      totalInterest += interestPayment;
      balance -= principalPayment;
      month++;
    }
    
    const payoffYears = month / 12;
    
    // Calculate average annual itemized deductions over the life of the loan
    // This properly accounts for how extra payments reduce total interest
    const annualPropertyTax = homePrice * (propertyTaxRate / 100);
    const annualMelloRoosTax = homePrice * (melloRoosTaxRate / 100);
    const stateIncomeTax = annualSalaryBeforeTax * (effectiveStateIncomeTaxRate / 100);
    
    // Calculate average mortgage interest deduction over the loan life
    const averageAnnualMortgageInterest = totalInterest / payoffYears;
    
    // Apply mortgage interest deduction cap - use average loan balance
    const averageLoanBalance = loanAmount / 2; // Rough approximation for average balance
    const effectiveDeductibleBalance = Math.min(averageLoanBalance, mortgageInterestDeductionCap);
    const cappedMortgageInterest = averageLoanBalance > 0 
      ? averageAnnualMortgageInterest * (effectiveDeductibleBalance / averageLoanBalance)
      : 0;
    
    const totalSaltTaxes = annualPropertyTax + annualMelloRoosTax + stateIncomeTax;
    const cappedSaltDeduction = Math.min(totalSaltTaxes, saltCap);
    
    const totalItemizedDeductions = cappedMortgageInterest + cappedSaltDeduction;
    
    // Calculate tax savings (benefit over standard deduction) - same as main calculator
    const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - standardDeduction);
    const yearlyTaxSavings = extraDeductionBenefit * (effectiveFederalTaxRate / 100);
    
    // Calculate opportunity cost (what the extra payments could have earned if invested)
    const monthlyInvestmentReturn = investmentReturn / 100 / 12;
    let investmentValue = 0;
    
    for (let i = 0; i < month; i++) {
      investmentValue = investmentValue * (1 + monthlyInvestmentReturn) + monthlyExtraPayment;
    }
    
    // Continue growing the investment for remaining years up to horizon
    const remainingMonths = Math.max(0, optimizationHorizon * 12 - month);
    for (let i = 0; i < remainingMonths; i++) {
      investmentValue *= (1 + monthlyInvestmentReturn);
    }
    
    const opportunityCost = investmentValue - (monthlyExtraPayment * month);
    
    // Calculate final net worth at optimization horizon
    const yearsAfterPayoff = Math.max(0, optimizationHorizon - payoffYears);
    const homeValueAtHorizon = homePrice * Math.pow(1 + inputs.homeAppreciation / 100, optimizationHorizon);
    
    // Calculate remaining loan balance at optimization horizon
    let remainingBalance = balance; // This is 0 if paid off, or remaining balance if not
    if (optimizationHorizon < payoffYears) {
      // Loan not paid off by horizon - calculate remaining balance
      let tempBalance = loanAmount;
      const horizonMonths = optimizationHorizon * 12;
      for (let i = 0; i < horizonMonths; i++) {
        const interestPayment = tempBalance * monthlyRate;
        const principalPayment = Math.min(totalMonthlyPayment - interestPayment, tempBalance);
        tempBalance -= principalPayment;
        if (tempBalance <= 0) break;
      }
      remainingBalance = Math.max(0, tempBalance);
    }
    
    // Freed up mortgage payments can be invested after payoff
    let additionalInvestments = 0;
    if (yearsAfterPayoff > 0) {
      const monthsOfFreedPayments = yearsAfterPayoff * 12;
      // Total monthly payment that gets freed up (regular + extra)
      const totalFreedPayment = regularPayment + monthlyExtraPayment;
      for (let i = 0; i < monthsOfFreedPayments; i++) {
        additionalInvestments = additionalInvestments * (1 + monthlyInvestmentReturn) + totalFreedPayment;
      }
    }
    
    // Calculate value of tax savings invested over optimization horizon
    const taxSavingsInvested = yearlyTaxSavings * payoffYears * Math.pow(1 + investmentReturn / 100, optimizationHorizon - payoffYears / 2);
    
    // Correct net worth calculation: Assets - Liabilities (including tax savings)
    const finalNetWorth = homeValueAtHorizon + additionalInvestments + taxSavingsInvested - remainingBalance;
    
    return {
      name: monthlyExtraPayment === 0 ? 'Standard Payment' : `+$${monthlyExtraPayment}/month`,
      extraMonthlyPayment: monthlyExtraPayment,
      finalNetWorth,
      payoffYear: Math.round(payoffYears * 10) / 10,
      totalInterestPaid: totalInterest,
      opportunityCost,
      taxSavings: yearlyTaxSavings,
      itemizedDeductions: totalItemizedDeductions
    };
  };

  const scenarios = useMemo(() => {
    const extraPayments = [
      0, 100, 250, 500, 750, 1000, 1500, 2000,
      3000, 4000, 5000, 6000, 7000, 8000, 9000, 10000
    ];
    return extraPayments.map(calculatePayoffScenario).sort((a, b) => b.finalNetWorth - a.finalNetWorth);
  }, [inputs, optimizationHorizon]);

  const optimalScenario = scenarios[0];
  const standardScenario = scenarios.find(s => s.extraMonthlyPayment === 0) || scenarios[0];

  const getDecisionRecommendation = () => {
    const investmentVsMortgageSpread = inputs.investmentReturn - inputs.effectiveMortgageRate;
    const afterTaxMortgageRate = inputs.effectiveMortgageRate * (1 - (inputs.effectiveFederalTaxRate + inputs.effectiveStateIncomeTaxRate) / 100);
    const realSpread = inputs.investmentReturn - afterTaxMortgageRate;
    
    if (realSpread > 2) {
      return {
        recommendation: 'INVEST',
        reason: `Investment returns (${inputs.investmentReturn}%) significantly exceed after-tax mortgage cost (${afterTaxMortgageRate.toFixed(1)}%). Focus on minimum payments and invest extra cash.`
      };
    } else if (realSpread < -1) {
      return {
        recommendation: 'PAY_OFF',
        reason: `After-tax mortgage cost (${afterTaxMortgageRate.toFixed(1)}%) exceeds expected investment returns (${inputs.investmentReturn}%). Prioritize extra mortgage payments.`
      };
    } else {
      return {
        recommendation: 'BALANCED',
        reason: `Investment returns and after-tax mortgage costs are similar. Consider a balanced approach based on risk tolerance.`
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
            <div className="text-xs text-blue-800 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div><strong>Combined Tax Rate:</strong> {(inputs.effectiveFederalTaxRate + inputs.effectiveStateIncomeTaxRate).toFixed(1)}%</div>
              <div><strong>Loan Amount:</strong> ${(inputs.homePrice * (1 - inputs.downPaymentPercent / 100)).toLocaleString()}</div>
              <div><strong>Down Payment:</strong> ${(inputs.homePrice * inputs.downPaymentPercent / 100).toLocaleString()}</div>
              <div><strong>After-Tax Mortgage Rate:</strong> {(inputs.effectiveMortgageRate * (1 - (inputs.effectiveFederalTaxRate + inputs.effectiveStateIncomeTaxRate) / 100)).toFixed(2)}%</div>
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
                  <th className="text-right py-3 px-2">Itemized Deductions</th>
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
                      ${Math.round(scenario.itemizedDeductions).toLocaleString()}
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