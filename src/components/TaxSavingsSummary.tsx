import React, { useState } from 'react';

interface ProjectionDataPoint {
  year: number;
  yearlyTaxSavings: number;
  totalItemizedDeductions: number;
}

interface TaxSavingsSummaryProps {
  projectionData: ProjectionDataPoint[];
  effectiveFederalTaxRate: number;
}

export const TaxSavingsSummary: React.FC<TaxSavingsSummaryProps> = ({
  projectionData,
  effectiveFederalTaxRate,
}) => {
  const [selectedYear, setSelectedYear] = useState(1);
  const selectedData = projectionData.find(d => d.year === selectedYear) || projectionData[0];
  const maxYear = projectionData[projectionData.length - 1]?.year || 30;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600">Tax Savings</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setSelectedYear(Math.max(0, selectedYear - 1))}
            disabled={selectedYear <= 0}
            className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <span className="text-sm font-medium px-2">Year {selectedYear}</span>
          <button
            onClick={() => setSelectedYear(Math.min(maxYear, selectedYear + 1))}
            disabled={selectedYear >= maxYear}
            className="w-6 h-6 flex items-center justify-center border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Itemized Deductions</div>
          <div className="text-lg font-semibold text-gray-800">
            ${selectedData.totalItemizedDeductions.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-green-600 mb-1">Savings</div>
          <div className="text-lg font-semibold text-green-600">
            ${selectedData.yearlyTaxSavings.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
