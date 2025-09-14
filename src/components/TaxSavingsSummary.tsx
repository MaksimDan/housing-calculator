import React from 'react';

interface TaxSavingsSummaryProps {
  yearlyTaxSavings: number;
  totalItemizedDeductions: number;
  effectiveFederalTaxRate: number;
}

export const TaxSavingsSummary: React.FC<TaxSavingsSummaryProps> = ({
  yearlyTaxSavings,
  totalItemizedDeductions,
  effectiveFederalTaxRate,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-sm text-gray-600 mb-2">Tax Savings (Year 1)</div>
      <div className="flex gap-6">
        <div className="text-center">
          <div className="text-xs text-gray-600 mb-1">Itemized Deductions</div>
          <div className="text-lg font-semibold text-gray-800">
            ${totalItemizedDeductions.toLocaleString()}
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-green-600 mb-1">Savings</div>
          <div className="text-lg font-semibold text-green-600">
            ${yearlyTaxSavings.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};
