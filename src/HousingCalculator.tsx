import React, { useState } from "react";
import { AffordabilityCheck } from './components/AffordabilityCheck';
import { DetailedMathCard } from './components/DetailedMathCard';
import SankeyWealthFlow from './components/SankeyWealthFlow';
import MortgageAmortizationChart from './components/MortgageAmortizationChart';
import InputCards from './components/InputCards';
import { WealthSummary } from './components/WealthSummary';
import { ActionButtons } from './components/ActionButtons';
import { ScenarioTabs } from './components/ScenarioTabs';
import { NetWorthChart } from './components/NetWorthChart';
import { TaxSavingsSummary } from './components/TaxSavingsSummary';
import { MortgagePayoffOptimizer } from './components/MortgagePayoffOptimizer';
import { useCalculatorInputs } from './hooks/useCalculatorInputs';

const isValidProjectionData = (data: any) => Array.isArray(data) && !data.error;

const HousingCalculator = () => {
  const [activeScenario, setActiveScenario] = useState('buying');
  const [currentPage, setCurrentPage] = useState('calculator');
  const [activePoint, setActivePoint] = useState(null);

  const { inputs, projectionData, resetToDefaults, handleShare, inputCardProps } = useCalculatorInputs();

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="mx-auto" style={{ maxWidth: '1843px' }}>
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-light text-gray-800">
                Build Wealth: Buy vs. Rent Calculator
              </h1>
              <div className="mt-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-sm text-gray-700">
                <p className="font-medium mb-1">Key Settings:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Selling costs ({inputs.includeSellingCosts ? `${inputs.sellingCostPercent}% included` : 'excluded'}) — configurable in Property Details</li>
                  <li>• Tax deduction savings use {inputs.useMarginalTaxRate ? `marginal rate (${inputs.marginalFederalTaxRate}%)` : `effective rate (${inputs.effectiveFederalTaxRate}%)`} — configurable in Financial Parameters</li>
                  <li>• Investment tax drag: {inputs.annualInvestmentTaxDrag}% (net return: {(inputs.investmentReturn - inputs.annualInvestmentTaxDrag).toFixed(1)}%) — configurable in Growth Assumptions</li>
                  <li>• Mello-Roos is not SALT-deductible per IRS rules (IRC 164)</li>
                </ul>
              </div>
            </div>

            <nav className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setCurrentPage('calculator')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'calculator'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Buy vs Rent
              </button>
              <button
                onClick={() => setCurrentPage('payoff')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  currentPage === 'payoff'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Payoff Strategy
              </button>
            </nav>
          </div>

          {currentPage === 'calculator' && (
            <>
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
            </>
          )}

          {currentPage === 'payoff' && (
            <p className="text-sm text-gray-600">
              Optimize your mortgage payoff strategy to maximize net worth by analyzing the trade-off between paying down debt versus investing extra cash.
            </p>
          )}
        </div>

        {currentPage === 'payoff' ? (
          <MortgagePayoffOptimizer inputs={inputs} />
        ) : (
          <>
            <AffordabilityCheck projectionData={projectionData} />

            <div className="mb-6 flex justify-between items-center">
              <div className="flex gap-6">
                {isValidProjectionData(projectionData) && (
                  <WealthSummary
                    xAxisYears={inputs.xAxisYears}
                    projectionData={projectionData}
                  />
                )}
                {isValidProjectionData(projectionData) && projectionData[0] && (
                  <TaxSavingsSummary
                    projectionData={projectionData}
                    effectiveFederalTaxRate={inputs.effectiveFederalTaxRate}
                  />
                )}
              </div>
              <ActionButtons
                resetToDefaults={resetToDefaults}
                handleShare={handleShare}
              />
            </div>

            <InputCards {...inputCardProps} />

            {isValidProjectionData(projectionData) ? (
              <div className="grid grid-cols-4 gap-6 mb-8">
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
                <NetWorthChart
                  projectionData={projectionData}
                  xAxisYears={inputs.xAxisYears}
                  setActivePoint={setActivePoint}
                />
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

            {isValidProjectionData(projectionData) ? (
              <div className="mt-8 mb-8">
                <ScenarioTabs
                  activeScenario={activeScenario}
                  setActiveScenario={setActiveScenario}
                />
                <SankeyWealthFlow
                  projectionData={projectionData}
                  scenario={activeScenario}
                  xAxisYears={inputs.xAxisYears}
                />
              </div>
            ) : null}

            {isValidProjectionData(projectionData) && (
              <div className="mb-8">
                <MortgageAmortizationChart
                  projectionData={projectionData}
                  mortgageYears={inputs.mortgageYears}
                  homePrice={inputs.homePrice}
                  downPaymentPercent={inputs.downPaymentPercent}
                  effectiveMortgageRate={inputs.effectiveMortgageRate}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default HousingCalculator;
