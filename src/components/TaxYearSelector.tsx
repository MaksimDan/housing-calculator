import React from 'react';
import { HelpCircle } from 'lucide-react';
import { FilingStatus, taxYearOptions } from '../lib/taxLaw';

interface TaxYearSelectorProps {
  filingStatus: FilingStatus;
  setFilingStatus: (value: FilingStatus) => void;
  firstTaxYear: number;
  setFirstTaxYear: (value: number) => void;
}

// Tax year and filing status pick the statutory amounts (standard deduction,
// SALT cap, interest cap) from the table in lib/taxLaw.ts.
export const TaxYearSelector: React.FC<TaxYearSelectorProps> = ({
  filingStatus, setFilingStatus, firstTaxYear, setFirstTaxYear,
}) => {
  const options = taxYearOptions();
  if (!options.some(o => o.year === firstTaxYear)) options.push({ year: firstTaxYear, projected: true });
  options.sort((a, b) => a.year - b.year);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-700">
      <label className="flex items-center gap-2 font-medium">
        <HelpCircle
          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          onClick={() => alert("The tax year most of your first 12 months of ownership falls in (a purchase in the second half of a year is mostly next year). Choosing a year fills in that year's standard deduction, SALT cap and Social Security wage base from the IRS tables; later years follow the law from there (the SALT cap reverts to $10,000 in 2030). 'Projected' years haven't been published yet and are estimated from the newest published year with your inflation rate.")}
        />
        Tax Year
        <select
          value={firstTaxYear}
          onChange={(e) => setFirstTaxYear(Number(e.target.value))}
          className="px-2 py-1 border border-gray-300 rounded font-normal bg-white"
        >
          {options.map(o => (
            <option key={o.year} value={o.year}>{o.year}{o.projected ? ' (projected)' : ''}</option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 font-medium">
        <HelpCircle
          className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer"
          onClick={() => alert("Federal filing status. Changing it fills in that status's standard deduction, SALT cap and mortgage-interest cap for the selected tax year (you can still edit them). It also sets the SALT phase-down threshold and floor (halved for married filing separately) and the Additional Medicare Tax threshold.")}
        />
        Filing Status
        <select
          value={filingStatus}
          onChange={(e) => setFilingStatus(e.target.value as FilingStatus)}
          className="px-2 py-1 border border-gray-300 rounded font-normal bg-white"
        >
          <option value="mfj">Married filing jointly</option>
          <option value="single">Single</option>
          <option value="hoh">Head of household</option>
          <option value="mfs">Married filing separately</option>
        </select>
      </label>
    </div>
  );
};

export default TaxYearSelector;
