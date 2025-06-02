import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, FastForward } from 'lucide-react';

// Declare global types for Google Charts
declare global {
  interface Window {
    google: any;
  }
}

interface SankeyWealthFlowProps {
  // Pass the already calculated projection data instead of recalculating
  projectionData: any[];

  // Still need these for scenario-specific logic
  scenario?: 'buying' | 'renting';

  // For quality of life and other display values
  monthlyQualityOfLife: number;
  xAxisYears: number;
}

const SankeyWealthFlow: React.FC<SankeyWealthFlowProps> = ({
  projectionData,
  scenario = 'buying',
  monthlyQualityOfLife,
  xAxisYears
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(100);
  const [selectedNode, setSelectedNode] = useState(null);
  const [googleChartsLoaded, setGoogleChartsLoaded] = useState(false);

  // Load Google Charts
  useEffect(() => {
    if (window.google && window.google.charts) {
      setGoogleChartsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/charts/loader.js';
    script.onload = () => {
      window.google.charts.load('current', { packages: ['sankey'] });
      window.google.charts.setOnLoadCallback(() => {
        setGoogleChartsLoaded(true);
      });
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Use the existing projection data and interpolate monthly values
  const monthlyData = useMemo(() => {
    if (!projectionData || projectionData.length === 0) return [];

    const data = [];
    const totalMonths = xAxisYears * 12;

    // For each month, interpolate values from the annual projection data
    for (let month = 0; month <= totalMonths; month++) {
      const year = Math.floor(month / 12);
      const monthInYear = month % 12;

      // Get data for current year and next year for interpolation
      const currentYearData = projectionData[year] || projectionData[projectionData.length - 1];
      const nextYearData = projectionData[year + 1] || currentYearData;

      // Interpolate values within the year (simple approach - use current year values)
      // The main calculations are done annually, so we'll use those exact values
      const monthlyFactor = 1 / 12;

      // Extract monthly values - these should match the main calculator exactly
      data.push({
        month,
        year,
        monthInYear,

        // Use the exact same calculated values from the main projection
        buying: currentYearData.buying,
        renting: currentYearData.renting,
        homeEquity: currentYearData.homeEquity,
        investmentsBuying: currentYearData.investmentsBuying,
        investmentsRenting: currentYearData.investmentsRenting,

        // Monthly breakdown estimates based on annual data
        monthlyTakeHome: (currentYearData.salary * (1 - 0.4)) / 12, // Using the same tax logic
        monthlyPayment: currentYearData.monthlyPayment,
        availableMonthlyInvestment: currentYearData.availableMonthlyInvestment,
        monthlyRent: currentYearData.monthlyRent,
        monthlyMiscExpenses: currentYearData.monthlyMiscExpenses,
        monthlyRentalIncome: currentYearData.monthlyRentalIncome,

        // For detailed monthly breakdown, we'll estimate based on the annual calculations
        yearlyPrincipalPaid: currentYearData.yearlyPrincipalPaid,
        yearlyInterestPaid: currentYearData.yearlyInterestPaid,
        yearlyTaxSavings: currentYearData.yearlyTaxSavings,

        // Calculate monthly equivalents
        monthlyPrincipalPaid: (currentYearData.yearlyPrincipalPaid || 0) / 12,
        monthlyInterestPaid: (currentYearData.yearlyInterestPaid || 0) / 12,
        monthlyTaxSavings: (currentYearData.yearlyTaxSavings || 0) / 12,

        // Net worth calculations - use exact values from main calculator
        netWorth: scenario === 'buying' ? currentYearData.buying : currentYearData.renting,
        investmentBalance: scenario === 'buying' ? currentYearData.investmentsBuying : currentYearData.investmentsRenting,
        homeValue: currentYearData.homeValue || 0,
        remainingLoan: currentYearData.remainingLoan || 0,
        homeEquityValue: currentYearData.homeEquity || 0
      });
    }

    return data;
  }, [projectionData, xAxisYears, scenario]);

  // Create Google Charts compatible data structure
  const sankeyData = useMemo(() => {
    if (!monthlyData[currentMonth]) return [];

    const data = monthlyData[currentMonth];
    const rows = [];

    // Create connections based on scenario using the exact calculator values
    if (scenario === 'buying') {
      // Income to expenses - use the monthly breakdown from projectionData
      rows.push(['Take-Home Salary', 'Living Expenses', Math.round(data.monthlyMiscExpenses)]);

      if (data.monthlyInterestPaid > 0) {
        rows.push(['Take-Home Salary', 'Mortgage Interest', Math.round(data.monthlyInterestPaid)]);
      }
      if (data.monthlyPrincipalPaid > 0) {
        rows.push(['Take-Home Salary', 'Mortgage Principal', Math.round(data.monthlyPrincipalPaid)]);
      }

      // Add other monthly expenses based on the calculator's logic
      const estimatedPropertyTax = data.monthlyPayment * 0.15; // Rough estimate
      const estimatedMaintenance = data.monthlyPayment * 0.1; // Rough estimate

      if (estimatedPropertyTax > 0) {
        rows.push(['Take-Home Salary', 'Property Tax', Math.round(estimatedPropertyTax)]);
      }
      if (estimatedMaintenance > 0) {
        rows.push(['Take-Home Salary', 'Maintenance', Math.round(estimatedMaintenance)]);
      }

      if (data.availableMonthlyInvestment > 0) {
        rows.push(['Take-Home Salary', 'Investment Contribution', Math.round(data.availableMonthlyInvestment)]);
      }

      // Principal to equity
      if (data.monthlyPrincipalPaid > 0) {
        rows.push(['Mortgage Principal', 'Home Equity', Math.round(data.monthlyPrincipalPaid)]);
      }

      // Investment to balance
      if (data.availableMonthlyInvestment > 0) {
        rows.push(['Investment Contribution', 'Investment Balance', Math.round(data.availableMonthlyInvestment)]);
      }

      // Additional income flows
      if (data.monthlyRentalIncome > 0) {
        rows.push(['Rental Income', 'Investment Contribution', Math.round(data.monthlyRentalIncome)]);
      }
      if (data.monthlyTaxSavings > 0) {
        rows.push(['Tax Savings', 'Investment Contribution', Math.round(data.monthlyTaxSavings)]);
      }

    } else { // Renting scenario
      rows.push(['Take-Home Salary', 'Living Expenses', Math.round(data.monthlyMiscExpenses)]);
      rows.push(['Take-Home Salary', 'Rent', Math.round(data.monthlyRent)]);

      // Estimate utilities and insurance for renting
      const estimatedRentUtilities = 150;
      const estimatedRenterInsurance = 10;

      if (estimatedRentUtilities > 0) {
        rows.push(['Take-Home Salary', 'Rent Utilities', estimatedRentUtilities]);
      }
      if (estimatedRenterInsurance > 0) {
        rows.push(['Take-Home Salary', 'Renter Insurance', estimatedRenterInsurance]);
      }

      if (data.availableMonthlyInvestment > 0) {
        rows.push(['Take-Home Salary', 'Investment Contribution', Math.round(data.availableMonthlyInvestment)]);
      }

      // Investment to balance
      if (data.availableMonthlyInvestment > 0) {
        rows.push(['Investment Contribution', 'Investment Balance', Math.round(data.availableMonthlyInvestment)]);
      }
    }

    // Quality of life value (monthly benefit, not accumulated)
    if (monthlyQualityOfLife > 0 && scenario === 'buying') {
      rows.push(['Quality of Life Value', 'Monthly Benefit', Math.round(monthlyQualityOfLife)]);
    }

    return rows;
  }, [monthlyData, currentMonth, scenario, monthlyQualityOfLife]);

  // Draw the chart
  useEffect(() => {
    if (!googleChartsLoaded || !chartRef.current || sankeyData.length === 0) return;

    const data = new window.google.visualization.DataTable();
    data.addColumn('string', 'From');
    data.addColumn('string', 'To');
    data.addColumn('number', 'Weight');
    data.addRows(sankeyData);

    const options = {
      width: 1000,
      height: 600,
      sankey: {
        node: {
          colors: scenario === 'buying'
            ? ['#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#06b6d4', '#059669']
            : ['#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#059669'],
          label: {
            fontName: 'Arial',
            fontSize: 12,
            color: '#333',
            bold: false
          },
          labelPadding: 6,
          nodePadding: 10,
          width: 20
        },
        link: {
          colorMode: 'gradient',
          color: { fillOpacity: 0.7 }
        }
      }
    };

    const chart = new window.google.visualization.Sankey(chartRef.current);

    // Add event listener to add custom labels after chart is drawn
    window.google.visualization.events.addListener(chart, 'ready', function () {
      addFlowLabels();
    });

    chart.draw(data, options);

    // Function to add custom labels on flows
    function addFlowLabels() {
      const svg = chartRef.current?.querySelector('svg');
      if (!svg) return;

      // Remove any existing custom labels
      const existingLabels = svg.querySelectorAll('.custom-flow-label');
      existingLabels.forEach(label => label.remove());

      // Get all path elements (the flows)
      const paths = svg.querySelectorAll('path[stroke-width]');

      paths.forEach((path, index) => {
        if (index >= sankeyData.length) return;

        const flowData = sankeyData[index];
        const value = flowData[2]; // The weight/value

        // Get path bounding box to position label
        const bbox = path.getBBox();
        const midX = bbox.x + bbox.width / 2;
        const midY = bbox.y + bbox.height / 2;

        // Create text element
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', midX.toString());
        text.setAttribute('y', midY.toString());
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dominant-baseline', 'middle');
        text.setAttribute('class', 'custom-flow-label');
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-size', '11px');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('font-family', 'Arial, sans-serif');
        text.setAttribute('stroke', '#000');
        text.setAttribute('stroke-width', '0.5px');
        text.setAttribute('paint-order', 'stroke fill');

        // Format the value
        const formattedValue = value >= 1000
          ? `${Math.round(value / 1000)}k`
          : `${Math.round(value)}`;

        text.textContent = formattedValue;

        // Only show label if the flow is wide enough
        if (bbox.height > 20) {
          svg.appendChild(text);
        }
      });
    }
  }, [googleChartsLoaded, sankeyData, scenario]);

  // Animation control
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentMonth(prev => {
          const maxMonth = (xAxisYears * 12);
          if (prev >= maxMonth) {
            setIsPlaying(false);
            return maxMonth;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, xAxisYears]);

  const currentData = monthlyData[currentMonth] || {};
  const currentYear = Math.floor(currentMonth / 12);
  const currentMonthInYear = (currentMonth % 12) + 1;

  if (!googleChartsLoaded) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Google Charts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Monthly Cash Flow - {scenario === 'buying' ? 'Property Owner' : 'Renter'} Strategy
          </h2>
          <p className="text-sm text-gray-600">
            Year {currentYear}, Month {currentMonthInYear} • Showing monthly flows (accumulated totals on right)
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Speed:</label>
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={50}>2x</option>
              <option value={100}>1x</option>
              <option value={200}>0.5x</option>
              <option value={500}>0.2x</option>
            </select>
          </div>

          <button
            onClick={() => setCurrentMonth(0)}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Reset to beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentMonth(prev => Math.min(prev + 12, xAxisYears * 12))}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            title="Skip forward 1 year"
          >
            <FastForward className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-2 rounded-lg transition-colors ${isPlaying
                ? 'bg-red-100 hover:bg-red-200 text-red-600'
                : 'bg-green-100 hover:bg-green-200 text-green-600'
              }`}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Year 0</span>
          <span>Year {xAxisYears}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-200"
            style={{ width: `${(currentMonth / (xAxisYears * 12)) * 100}%` }}
          />
        </div>
        <input
          type="range"
          min={0}
          max={xAxisYears * 12}
          value={currentMonth}
          onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      {/* Google Charts Sankey diagram */}
      <div className="flex">
        <div ref={chartRef} className="flex-1" />

        {/* Summary panel */}
        <div className="ml-6 w-80">
          <div className="space-y-4">
            <div className="border border-gray-200 rounded p-3 bg-blue-50">
              <h4 className="font-medium text-gray-800 mb-2">💰 Accumulated Wealth</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Net Worth:</span>
                  <span className="font-bold text-lg text-blue-600">
                    ${Math.round(currentData.netWorth || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Investment balance:</span>
                  <span className="font-medium">${Math.round(currentData.investmentBalance || 0).toLocaleString()}</span>
                </div>
                {scenario === 'buying' && (
                  <div className="flex justify-between">
                    <span>Home equity:</span>
                    <span className="font-medium">${Math.round(currentData.homeEquityValue || 0).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h4 className="font-medium text-gray-800 mb-2">📊 Monthly Flows</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Take-home pay:</span>
                  <span className="font-medium">${Math.round(currentData.monthlyTakeHome || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available for investing:</span>
                  <span className="font-medium text-green-600">
                    ${Math.round(currentData.availableMonthlyInvestment || 0).toLocaleString()}
                  </span>
                </div>
                {scenario === 'buying' && (
                  <div className="flex justify-between">
                    <span>Monthly equity build:</span>
                    <span className="font-medium text-blue-600">
                      ${Math.round(currentData.monthlyPrincipalPaid || 0).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="border border-gray-200 rounded p-3">
              <h4 className="font-medium text-gray-800 mb-2">Legend</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-green-500 rounded"></div>
                  <span>Income Sources</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-red-500 rounded"></div>
                  <span>Monthly Expenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-blue-500 rounded"></div>
                  <span>Equity Building</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-purple-500 rounded"></div>
                  <span>Investment Flows</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-3 bg-cyan-500 rounded"></div>
                  <span>Wealth Components</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Diagram shows monthly cash flows. Accumulated wealth totals are displayed above.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SankeyWealthFlow;