import React from "react";
import { TrendingUp, TrendingDown, Home, DollarSign } from 'lucide-react';

export const DetailedMathCard = ({ data, showBuying, previousYearData }) => {
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
    </div>
  );
};

export default DetailedMathCard;