import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { calculateMortgageScenario, HousingCalculatorInputs } from '../lib/financialCalculations';
import { formatAxisUSD, formatUSD, formatPercent } from '../lib/format';

interface MortgageAmortizationChartProps {
  projectionData: any[];
  inputs: HousingCalculatorInputs;
}

export const MortgageAmortizationChart: React.FC<MortgageAmortizationChartProps> = ({ projectionData, inputs }) => {
  const loanAmount = inputs.homePrice * (1 - inputs.downPaymentPercent / 100);
  const termYears = Math.ceil(inputs.mortgageYears);
  const data = useMemo(() => projectionData
    .filter((r: any) => r.year > 0 && r.year <= termYears)
    .map((r: any) => ({ year: r.year, principal: r.yearlyPrincipalPaid, interest: r.yearlyInterestPaid })), [projectionData, termYears]);
  // Exact lifetime totals from the engine (the yearly rows are rounded)
  const totalInterest = useMemo(
    () => (loanAmount > 0 ? calculateMortgageScenario(inputs, 0, termYears).totalInterestPaid : 0),
    [inputs, loanAmount, termYears]
  );

  if (loanAmount <= 0) {
    return <p className="text-sm text-gray-700">No mortgage: with a 100% down payment this is a cash purchase.</p>;
  }

  return (
    <div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded bg-gray-50 p-3"><dt className="text-xs text-gray-600">Loan</dt><dd className="text-sm font-semibold tabular-nums">{formatUSD(loanAmount)}</dd></div>
        <div className="rounded bg-orange-50 p-3"><dt className="text-xs text-gray-600">Total interest</dt><dd className="text-sm font-semibold tabular-nums text-orange-800">{formatUSD(totalInterest)}</dd></div>
        <div className="rounded bg-gray-50 p-3"><dt className="text-xs text-gray-600">Total paid</dt><dd className="text-sm font-semibold tabular-nums">{formatUSD(loanAmount + totalInterest)}</dd></div>
      </dl>
      <p className="mt-3 text-sm text-gray-700">
        At {inputs.effectiveMortgageRate}% over {inputs.mortgageYears} years you pay {formatUSD(totalInterest)} in interest,{' '}
        {formatPercent((totalInterest / loanAmount) * 100)} of the amount borrowed.{' '}
        <a href="#prepay" className="font-medium text-blue-700 hover:underline">Pay it off faster instead? ↓</a>
      </p>
      <div className="mt-3 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }} accessibilityLayer>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#4b5563' }} />
            <YAxis tickFormatter={formatAxisUSD} width={56} tick={{ fontSize: 12, fill: '#4b5563' }} />
            <Tooltip formatter={(v: number, name: string) => [formatUSD(v), name]} labelFormatter={(l) => `Year ${l}`} />
            <Legend />
            <Bar dataKey="principal" name="Principal" stackId="a" fill="#2563eb" isAnimationActive={false} />
            <Bar dataKey="interest" name="Interest" stackId="a" fill="#f97316" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MortgageAmortizationChart;
