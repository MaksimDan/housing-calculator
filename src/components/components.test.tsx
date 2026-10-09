// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import HousingCalculator from '../HousingCalculator';
import { ErrorBoundary } from './ErrorBoundary';
import { NumberField } from './NumberField';
import { calculateProjectionData } from '../lib/financialCalculations';
import { DEFAULTS } from '../hooks/useCalculatorInputs';
import { formatCompactUSD } from '../lib/format';

beforeAll(() => {
  // Node 25+ ships its own (here unconfigured) localStorage global, which
  // shadows jsdom's; use jsdom's so the app's persistence is exercised.
  const jsdomStorage = (globalThis as any).jsdom?.window?.localStorage;
  if (jsdomStorage) {
    Object.defineProperty(globalThis, 'localStorage', { value: jsdomStorage, configurable: true });
    Object.defineProperty(window, 'localStorage', { value: jsdomStorage, configurable: true });
  }
  // Recharts' ResponsiveContainer and the sticky answer bar use these
  (globalThis as any).ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  (globalThis as any).IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  Element.prototype.scrollIntoView = vi.fn();
});
beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
afterEach(cleanup);

const renderApp = () => render(<ErrorBoundary><HousingCalculator /></ErrorBoundary>);

describe('the page', () => {
  it('leads with the verdict, matching the engine', () => {
    renderApp();
    const rows = calculateProjectionData(DEFAULTS) as any[];
    const gap = rows[30].buying - rows[30].renting;
    const headline = screen.getByRole('heading', { level: 2, name: /comes out ahead by/ });
    expect(headline.textContent).toBe(`${gap > 0 ? 'Buying' : 'Renting'} comes out ahead by ${formatCompactUSD(Math.abs(gap))} after 30 years`);
    expect(document.body.textContent).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('changing how long you stay updates the verdict and the table', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: '10' }));
    expect(screen.getByRole('heading', { level: 2, name: /after 10 years/ })).toBeTruthy();
    expect(screen.getByRole('heading', { name: /Year 10, side by side/ })).toBeTruthy();
  });

  it('every input is labelled', () => {
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: /All assumptions/ }));
    for (const input of Array.from(document.querySelectorAll('input:not([type=range]):not([type=hidden]), select'))) {
      const el = input as HTMLInputElement;
      const labelled = el.labels?.length || el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.closest('label');
      expect(labelled, el.outerHTML.slice(0, 120)).toBeTruthy();
    }
    for (const button of Array.from(document.querySelectorAll('button'))) {
      const name = button.getAttribute('aria-label') || button.textContent?.trim() || button.closest('label')?.textContent?.trim();
      expect(name, button.outerHTML.slice(0, 120)).toBeTruthy();
    }
  });

  it('help is inline, not an alert()', () => {
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    renderApp();
    const info = screen.getByRole('button', { name: 'About Home price' });
    fireEvent.click(info);
    expect(info.getAttribute('aria-expanded')).toBe('true');
    expect(document.getElementById(info.getAttribute('aria-controls')!)!.textContent).toContain('Purchase price');
    expect(alert).not.toHaveBeenCalled();
  });

  it('shows a blocking state instead of a verdict when the purchase is unaffordable', () => {
    localStorage.setItem('housing-initialInvestment', '100000');
    renderApp();
    expect(screen.getByRole('alert').textContent).toContain('not enough cash upfront');
    expect(screen.queryByRole('heading', { name: /comes out ahead/ })).toBeNull();
    expect(screen.getByText(/Resolve the cash check above first/)).toBeTruthy();
  });

  it('reset can be undone', () => {
    localStorage.setItem('housing-homePrice', '910000');
    renderApp();
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }));
    fireEvent.click(screen.getByRole('button', { name: /Reset all inputs/ }));
    expect((document.getElementById('field-homePrice') as HTMLInputElement).value).toBe('750,000');
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect((document.getElementById('field-homePrice') as HTMLInputElement).value).toBe('910,000');
  });

  it('asks before overwriting a customized tax amount when the tax year changes', () => {
    localStorage.setItem('housing-standardDeduction', '20000');
    renderApp();
    fireEvent.change(screen.getByLabelText('Tax year'), { target: { value: '2026' } });
    expect(screen.getByText(/You had customized this amount/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Keep mine' }));
    expect(localStorage.getItem('housing-standardDeduction')).toBe('20000');
  });

  it('the prepay section uses the same inputs and gives an answer', () => {
    renderApp();
    const section = document.getElementById('prepay')!;
    expect(within(section).getByText(/Investing the extra \$1,000\/mo instead of prepaying leaves you/)).toBeTruthy();
  });
});

describe('NumberField', () => {
  it('commits on blur or Enter, never on partial keystrokes', () => {
    const onCommit = vi.fn();
    render(<NumberField id="x" value={5.24} onCommit={onCommit} unit="percent" ariaLabel="Rate" />);
    const input = screen.getByLabelText('Rate') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.blur(input);
    expect(onCommit).not.toHaveBeenCalled(); // 5.24 survives focus + blur unchanged
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.change(input, { target: { value: '6.' } });
    expect(onCommit).not.toHaveBeenCalled();
    fireEvent.change(input, { target: { value: '6.5' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onCommit).toHaveBeenCalledWith(6.5);
  });

  it('accepts typed currency formatting and reverts garbage', () => {
    const onCommit = vi.fn();
    render(<NumberField id="y" value={750000} onCommit={onCommit} unit="usd" ariaLabel="Price" />);
    const input = screen.getByLabelText('Price') as HTMLInputElement;
    expect(input.value).toBe('750,000');
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '$820,000' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledWith(820000);
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    expect(onCommit).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('750,000');
  });
});

describe('ErrorBoundary', () => {
  it('renders a recovery screen instead of a blank page', () => {
    const Boom = () => { throw new Error('boom'); };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(<ErrorBoundary><Boom /></ErrorBoundary>);
    expect(screen.getByRole('button', { name: /Reset saved settings/ })).toBeTruthy();
    spy.mockRestore();
  });
});
