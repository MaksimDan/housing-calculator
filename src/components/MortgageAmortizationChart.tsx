import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface MortgageAmortizationChartProps {
  projectionData: any[];
  mortgageYears: number;
  homePrice: number;
  downPaymentPercent: number;
  effectiveMortgageRate: number;
}

export const MortgageAmortizationChart: React.FC<MortgageAmortizationChartProps> = ({
  projectionData,
  mortgageYears,
  homePrice,
  downPaymentPercent,
  effectiveMortgageRate,
}) => {
  const amortizationData = useMemo(() => {
    // Filter data to only include years with mortgage payments
    const mortgageData = projectionData
      .filter(row => row.year > 0 && row.year <= mortgageYears)
      .map(row => ({
        year: row.year,
        principal: row.yearlyPrincipalPaid || 0,
        interest: row.yearlyInterestPaid || 0,
        total: (row.yearlyPrincipalPaid || 0) + (row.yearlyInterestPaid || 0),
      }));

    return mortgageData;
  }, [projectionData, mortgageYears]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalPrincipal = amortizationData.reduce((sum, row) => sum + row.principal, 0);
    const totalInterest = amortizationData.reduce((sum, row) => sum + row.interest, 0);
    const totalPaid = totalPrincipal + totalInterest;
    const loanAmount = homePrice * (1 - downPaymentPercent / 100);
    
    return {
      loanAmount,
      totalPrincipal,
      totalInterest,
      totalPaid,
      interestPercentage: totalPaid > 0 ? (totalInterest / totalPaid) * 100 : 0,
    };
  }, [amortizationData, homePrice, downPaymentPercent]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const principal = payload.find((p: any) => p.dataKey === 'principal')?.value || 0;
      const interest = payload.find((p: any) => p.dataKey === 'interest')?.value || 0;
      const total = principal + interest;
      
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="font-medium text-gray-800 mb-2">Year {label}</p>
          <p className="text-sm text-blue-600">Principal: ${principal.toLocaleString()}</p>
          <p className="text-sm text-orange-600">Interest: ${interest.toLocaleString()}</p>
          <p className="text-sm font-medium text-gray-800 border-t pt-1 mt-1">
            Total: ${total.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {total > 0 ? `${((interest / total) * 100).toFixed(1)}% interest` : '0% interest'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-800 mb-2">
          Mortgage Amortization Schedule
        </h3>
        <p className="text-sm text-gray-600">
          Annual breakdown of principal vs interest payments over {mortgageYears} years
        </p>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-3 rounded">
          <p className="text-xs text-gray-500">Loan Amount</p>
          <p className="text-sm font-medium text-gray-800">
            ${summaryStats.loanAmount.toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-500">Total Principal</p>
          <p className="text-sm font-medium text-blue-600">
            ${summaryStats.totalPrincipal.toLocaleString()}
          </p>
        </div>
        <div className="bg-orange-50 p-3 rounded">
          <p className="text-xs text-gray-500">Total Interest</p>
          <p className="text-sm font-medium text-orange-600">
            ${summaryStats.totalInterest.toLocaleString()}
          </p>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <p className="text-xs text-gray-500">Total Paid</p>
          <p className="text-sm font-medium text-purple-600">
            ${summaryStats.totalPaid.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">
            ({summaryStats.interestPercentage.toFixed(1)}% interest)
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={amortizationData}
            margin={{ top: 20, right: 30, left: 60, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="year"
              stroke="#666"
              label={{
                value: "Year",
                position: "insideBottom",
                offset: -5,
              }}
            />
            <YAxis
              stroke="#666"
              tickFormatter={(value) => `${value / 1000}k`}
              label={{
                value: "Annual Payment ($)",
                angle: -90,
                position: "insideLeft",
                offset: -45,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="top"
              height={36}
              iconType="rect"
              formatter={(value) => {
                const labels: Record<string, string> = {
                  principal: "Principal",
                  interest: "Interest",
                };
                return labels[value] || value;
              }}
            />
            <Bar
              dataKey="principal"
              stackId="a"
              fill="#3b82f6"
              name="principal"
            />
            <Bar
              dataKey="interest"
              stackId="a"
              fill="#fb923c"
              name="interest"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
        <p>
          At {effectiveMortgageRate}% interest rate, you'll pay{' '}
          <span className="font-medium text-orange-600">
            ${summaryStats.totalInterest.toLocaleString()}
          </span>{' '}
          in interest over the life of the loan, which is{' '}
          <span className="font-medium">
            {((summaryStats.totalInterest / summaryStats.loanAmount) * 100).toFixed(1)}%
          </span>{' '}
          of the original loan amount.
        </p>
      </div>
    </div>
  );
};

export default MortgageAmortizationChart;