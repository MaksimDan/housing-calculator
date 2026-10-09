import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { WealthSummary } from './WealthSummary';
import { NetWorthChart } from './NetWorthChart';
import { MortgageAmortizationChart } from './MortgageAmortizationChart';
import { ErrorBoundary } from './ErrorBoundary';
import { calculateProjectionData } from '../lib/financialCalculations';
import { DEFAULTS } from '../hooks/useCalculatorInputs';

const data = calculateProjectionData(DEFAULTS) as any[];

describe('year lookups never crash on a fractional timeline', () => {
  it.each([10.1, 29.9, 12.5])('WealthSummary at xAxisYears %s', (years) => {
    const html = renderToStaticMarkup(<WealthSummary xAxisYears={years} projectionData={data} />);
    expect(html).toContain(`Net Worth at Year ${Math.floor(years)}`);
    expect(html).not.toContain('NaN');
  });

  it.each([10.1, 29.9])('NetWorthChart at xAxisYears %s', (years) => {
    const html = renderToStaticMarkup(<NetWorthChart xAxisYears={years} projectionData={data} setActivePoint={() => {}} />);
    expect(html).toContain(` ${Math.floor(years)} years`);
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('undefined');
  });
});

describe('MortgageAmortizationChart', () => {
  it.each([5, 40, 99.9, 100])('shows no NaN at %s%% down', (downPaymentPercent) => {
    const inputs = { ...DEFAULTS, downPaymentPercent, initialInvestment: 2000000 };
    const rows = calculateProjectionData(inputs) as any[];
    const html = renderToStaticMarkup(
      <MortgageAmortizationChart projectionData={rows} mortgageYears={30} homePrice={750000}
        downPaymentPercent={downPaymentPercent} effectiveMortgageRate={5.24} />
    );
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
  });
});

describe('ErrorBoundary', () => {
  it('renders a recovery screen instead of a blank page', () => {
    const Boom = () => { throw new Error('boom'); };
    const originalError = console.error;
    console.error = () => {};
    try {
      // Server rendering doesn't run error boundaries, so check the fallback
      // state directly
      const boundary = new ErrorBoundary({ children: <Boom /> });
      boundary.state = ErrorBoundary.getDerivedStateFromError(new Error('boom'));
      const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
      expect(html).toContain('Reset saved settings');
    } finally {
      console.error = originalError;
    }
  });
});
