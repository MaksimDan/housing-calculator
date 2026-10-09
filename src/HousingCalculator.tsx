import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useCalculatorInputs, TaxOverridePrompt } from './hooks/useCalculatorInputs';
import type { HousingCalculatorInputs } from './lib/financialCalculations';
import { computeVerdict } from './lib/verdict';
import { findFlipThresholds, gapAt } from './lib/thresholds';
import { checkCash } from './lib/cashCheck';
import { FIELD_BY_KEY, FIELDS, InputKey, fieldId } from './lib/fields';
import { formatCompactUSD, formatUSD } from './lib/format';
import { BUY_TEXT, RENT_TEXT } from './lib/colors';
import { Header } from './components/Header';
import { VerdictHero } from './components/VerdictHero';
import { DriversPanel } from './components/DriversPanel';
import { GapChart } from './components/GapChart';
import { YearComparison } from './components/YearComparison';
import { AssumptionsDrawer } from './components/AssumptionsDrawer';
import { DeepDives } from './components/DeepDives';
import { PrepaySection } from './components/PrepaySection';
import { HowCalculated } from './components/HowCalculated';
import { BlockingState } from './components/BlockingState';

const FINANCE_KEYS: InputKey[] = ['initialInvestment', 'annualSalaryBeforeTax', 'monthlyMiscExpenses'];
const DRAWER_KEYS = new Set(FIELDS.filter(f => !f.driver && f.group !== 'view').map(f => f.key));

const HousingCalculator = () => {
  const { inputs, projectionData, changedKeys, setInput, setMany, resetField, resetAll, share, changeTaxYear, changeFilingStatus } = useCalculatorInputs();
  const rows = Array.isArray(projectionData) ? (projectionData as any[]) : null;
  const horizon = rows ? Math.min(inputs.xAxisYears, rows.length - 1) : inputs.xAxisYears;

  // One selected year drives the chart marker, the table and the deep dives
  const [selectedYear, setSelectedYear] = useState(horizon);
  useEffect(() => setSelectedYear(horizon), [horizon]);
  const year = Math.min(selectedYear, horizon);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [undo, setUndo] = useState<HousingCalculatorInputs | null>(null);
  const [taxPrompts, setTaxPrompts] = useState<TaxOverridePrompt[] | null>(null);
  const [rateNotice, setRateNotice] = useState(false);

  const verdict = useMemo(
    () => (rows ? computeVerdict(rows, horizon, inputs.inflationRate, inputs.firstTaxYear) : null),
    [rows, horizon, inputs.inflationRate, inputs.firstTaxYear]
  );
  // Bisection runs a few hundred engine calls; defer so typing stays responsive
  const deferredInputs = useDeferredValue(inputs);
  const thresholds = useMemo(
    () => (Array.isArray(projectionData) ? findFlipThresholds(deferredInputs, Math.min(deferredInputs.xAxisYears, (projectionData as any[]).length - 1)) : []),
    [deferredInputs, projectionData]
  );
  const sellingCostFlip = useMemo(() => {
    if (!verdict || inputs.includeSellingCosts || horizon > 10) return null;
    const gap = gapAt({ ...inputs, includeSellingCosts: true }, horizon);
    return gap !== null && gap !== 0 && Math.sign(gap) !== Math.sign(verdict.gap) ? { gap } : null;
  }, [inputs, horizon, verdict]);
  const cashCheck = useMemo(() => (rows ? checkCash(inputs, rows, horizon) : null), [inputs, rows, horizon]);

  const focusField = (key: InputKey) => {
    if (DRAWER_KEYS.has(key)) setDrawerOpen(true);
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const el = document.getElementById(fieldId(key));
      if (el) {
        el.scrollIntoView({ block: 'center' });
        el.focus();
      }
    }));
  };

  const onReset = () => {
    setUndo(resetAll());
    setTaxPrompts(null);
    setRateNotice(false);
  };
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 10000);
    return () => clearTimeout(t);
  }, [undo]);

  const onTaxChange = (prompts: TaxOverridePrompt[]) => {
    setTaxPrompts(prompts.length ? prompts : null);
    setRateNotice(true);
  };

  // Sticky answer on phones once the hero scrolls away
  const heroRef = useRef<HTMLElement>(null);
  const [heroVisible, setHeroVisible] = useState(true);
  const hasResults = rows !== null;
  useEffect(() => {
    const el = heroRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const obs = new IntersectionObserver(([entry]) => setHeroVisible(entry.isIntersecting));
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasResults]);

  const showExampleNotice = !FINANCE_KEYS.some(k => changedKeys.includes(k));
  const openAssumptions = () => {
    setDrawerOpen(true);
    requestAnimationFrame(() => document.getElementById('assumptions')?.scrollIntoView());
  };
  const drivers = (
    <DriversPanel inputs={inputs} thresholds={thresholds} setInput={setInput} changedKeys={changedKeys} resetField={resetField}
      otherCount={DRAWER_KEYS.size} openAssumptions={openAssumptions} />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        Skip to results
      </a>
      <Header
        firstTaxYear={inputs.firstTaxYear}
        filingStatus={inputs.filingStatus}
        onTaxYear={(y) => onTaxChange(changeTaxYear(y))}
        onFilingStatus={(s) => onTaxChange(changeFilingStatus(s))}
        share={share}
        onReset={onReset}
      />
      <main id="main" className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 pb-24 sm:px-6">
        <span id="top" />
        {(taxPrompts || rateNotice) && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">
            {taxPrompts && (
              <div>
                <p>You had customized {taxPrompts.length === 1 ? 'this amount' : 'these amounts'}. Update to the {inputs.firstTaxYear} amounts for this filing status?</p>
                <ul className="mt-1 list-disc pl-5">
                  {taxPrompts.map(p => <li key={p.key}>{FIELD_BY_KEY[p.key].label}: yours {formatUSD(p.current)} → {formatUSD(p.next)}</li>)}
                </ul>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { setMany(Object.fromEntries(taxPrompts.map(p => [p.key, p.next]))); setTaxPrompts(null); }}
                    className="rounded-md bg-amber-700 px-3 py-1 text-white hover:bg-amber-800">Update</button>
                  <button type="button" onClick={() => setTaxPrompts(null)} className="rounded-md border border-amber-400 px-3 py-1 hover:bg-amber-100">Keep mine</button>
                </div>
              </div>
            )}
            {rateNotice && (
              <p className={taxPrompts ? 'mt-2' : ''}>
                Your federal income tax rates weren't recalculated for this change.{' '}
                <button type="button" className="underline" onClick={() => { setRateNotice(false); focusField('effectiveFederalTaxRate'); }}>Review them</button>
                {' · '}
                <button type="button" className="underline" onClick={() => setRateNotice(false)}>Dismiss</button>
              </p>
            )}
          </div>
        )}

        {rows && verdict && cashCheck ? (
          <>
            <VerdictHero ref={heroRef} verdict={verdict} inputs={inputs} thresholds={thresholds} sellingCostFlip={sellingCostFlip}
              cashCheck={cashCheck} showExampleNotice={showExampleNotice} setInput={setInput} focusField={focusField}
              changedKeys={changedKeys} resetField={resetField} />
            {/* Phones: the chart comes right after the answer, then the drivers */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
              <div className="min-w-0 lg:col-start-2 lg:row-start-1">
                <GapChart rows={rows} horizon={horizon} selectedYear={year} onSelectYear={setSelectedYear} />
              </div>
              <div className="lg:col-start-1 lg:row-start-1">{drivers}</div>
            </div>
            <YearComparison rows={rows} horizon={horizon} selectedYear={year} onSelectYear={setSelectedYear}
              calendarYear={(y) => inputs.firstTaxYear + y - 1} inflationRate={inputs.inflationRate}
              includeSellingCosts={inputs.includeSellingCosts} />
          </>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
            {drivers}
            <BlockingState error={projectionData} focusField={focusField} />
          </div>
        )}

        <AssumptionsDrawer inputs={inputs} open={drawerOpen} setOpen={setDrawerOpen} setInput={setInput} setMany={setMany}
          changedKeys={changedKeys} resetField={resetField} />
        {rows && <DeepDives rows={rows} inputs={inputs} horizon={horizon} selectedYear={year} />}
        <PrepaySection inputs={inputs} rows={rows} horizon={horizon} focusField={focusField} />
        <HowCalculated />
      </main>

      {rows && verdict && !heroVisible && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur lg:hidden">
          <a href="#top" className="flex items-center justify-between text-sm font-semibold">
            <span className={verdict.winner === 'buy' ? BUY_TEXT : verdict.winner === 'rent' ? RENT_TEXT : 'text-gray-900'}>
              {verdict.winner === 'tie' ? 'Even' : `${verdict.winner === 'buy' ? 'Buy' : 'Rent'} +${formatCompactUSD(verdict.gapAbs)}`} · yr {verdict.horizon}
            </span>
            <span className="text-gray-600" aria-hidden="true">▲</span>
          </a>
        </div>
      )}
      {undo && (
        <div role="status" className="fixed bottom-16 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg lg:bottom-6">
          Inputs reset to defaults.
          <button type="button" className="font-semibold underline" onClick={() => { setMany(undo); setUndo(null); }}>Undo</button>
        </div>
      )}
    </div>
  );
};

export default HousingCalculator;
