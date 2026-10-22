import React, { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useCalculatorInputs, LawPrompt, PERSONAL_CONFIG, InputsSnapshot } from './hooks/useCalculatorInputs';
import { computeVerdict } from './lib/verdict';
import { findFlipThresholds, gapAt } from './lib/thresholds';
import { checkCash } from './lib/cashCheck';
import { FIELD_BY_KEY, InputKey, fieldFor, fieldId, fieldsFor } from './lib/fields';
import { FILING_STATUS_LABELS } from './lib/taxLaw';
import { stateName } from './lib/stateLaw';
import { formatCompactUSD, formatUSD } from './lib/format';
import { BUY_TEXT, RENT_TEXT } from './lib/colors';
import { wordsFor } from './lib/situation';
import { Header } from './components/Header';
import { SituationPicker } from './components/SituationPicker';
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

// A value in a "you had customized this" prompt, in its field's unit
const formatLawValue = (key: InputKey, value: number | boolean) => {
  if (typeof value === 'boolean') return value ? 'on' : 'off';
  const unit = FIELD_BY_KEY[key].unit;
  return unit === 'usd' ? formatUSD(value) : `${Number(value.toFixed(2))}%`;
};

const HousingCalculator = () => {
  const { inputs, projectionData, changedKeys, setInput, setMany, resetField, resetAll, restore, share, changeState, changeTaxYear, changeFilingStatus } = useCalculatorInputs();
  const rows = Array.isArray(projectionData) ? (projectionData as any[]) : null;
  const horizon = rows ? Math.min(inputs.xAxisYears, rows.length - 1) : inputs.xAxisYears;
  const words = wordsFor(inputs.situation);
  // The inputs in the assumptions drawer: every one that applies here except the drivers
  const drawerKeys = useMemo(
    () => new Set(fieldsFor(inputs.situation).filter(f => !f.driver && f.group !== 'view').map(f => f.key)),
    [inputs.situation]
  );

  // One selected year drives the chart marker, the table and the deep dives
  const [selectedYear, setSelectedYear] = useState(horizon);
  useEffect(() => setSelectedYear(horizon), [horizon]);
  const year = Math.min(selectedYear, horizon);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [undo, setUndo] = useState<InputsSnapshot | null>(null);
  // Customized fields a change of state, tax year or filing status would
  // replace, and what changed ("Texas", "tax year 2027")
  const [taxPrompts, setTaxPrompts] = useState<{ prompts: LawPrompt[]; change: string } | null>(null);
  const [rateNotice, setRateNotice] = useState(false);

  const verdict = useMemo(
    () => (rows ? computeVerdict(rows, horizon, inputs.inflationRate, inputs.firstTaxYear, inputs.situation) : null),
    [rows, horizon, inputs.inflationRate, inputs.firstTaxYear, inputs.situation]
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
    if (drawerKeys.has(key)) setDrawerOpen(true);
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

  // The federal rates are typed in, so a new tax year or filing status may
  // need them reviewed; a new state doesn't change them
  const onLawChange = (prompts: LawPrompt[], change: string, federalRatesStale: boolean) => {
    setTaxPrompts(prompts.length ? { prompts, change } : null);
    if (federalRatesStale) setRateNotice(true);
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

  // The defaults describe an example household; a personal config doesn't
  const showExampleNotice = PERSONAL_CONFIG === null && !FINANCE_KEYS.some(k => changedKeys.includes(k));
  const openAssumptions = () => {
    setDrawerOpen(true);
    requestAnimationFrame(() => document.getElementById('assumptions')?.scrollIntoView());
  };
  const drivers = (
    <DriversPanel inputs={inputs} thresholds={thresholds} setInput={setInput} changedKeys={changedKeys} resetField={resetField}
      otherCount={drawerKeys.size} openAssumptions={openAssumptions} />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:shadow">
        Skip to results
      </a>
      <Header
        situation={inputs.situation}
        state={inputs.state}
        firstTaxYear={inputs.firstTaxYear}
        filingStatus={inputs.filingStatus}
        onState={(s) => onLawChange(changeState(s), stateName(s), false)}
        onTaxYear={(y) => onLawChange(changeTaxYear(y), `tax year ${y}`, true)}
        onFilingStatus={(s) => onLawChange(changeFilingStatus(s), FILING_STATUS_LABELS[s].toLowerCase(), true)}
        share={share}
        onReset={onReset}
        personal={PERSONAL_CONFIG !== null}
      />
      <main id="main" className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 pb-24 sm:px-6">
        <span id="top" />
        <SituationPicker inputs={inputs} setSituation={(s) => setInput('situation', s)} />
        {(taxPrompts || rateNotice) && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950" role="status">
            {taxPrompts && (
              <div>
                <p>You had customized {taxPrompts.prompts.length === 1 ? 'this amount' : 'these amounts'}. Update {taxPrompts.prompts.length === 1 ? 'it' : 'them'} for {taxPrompts.change}?</p>
                <ul className="mt-1 list-disc pl-5">
                  {taxPrompts.prompts.map(p => (
                    <li key={p.key}>{fieldFor(p.key, inputs.situation, inputs.state).label}: yours {formatLawValue(p.key, p.current)} → {formatLawValue(p.key, p.next)}</li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => { setMany(Object.fromEntries(taxPrompts.prompts.map(p => [p.key, p.next]))); setTaxPrompts(null); }}
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
                <GapChart rows={rows} horizon={horizon} selectedYear={year} onSelectYear={setSelectedYear} situation={inputs.situation} />
              </div>
              <div className="lg:col-start-1 lg:row-start-1">{drivers}</div>
            </div>
            <YearComparison rows={rows} horizon={horizon} selectedYear={year} onSelectYear={setSelectedYear}
              calendarYear={(y) => inputs.firstTaxYear + y - 1} inflationRate={inputs.inflationRate}
              includeSellingCosts={inputs.includeSellingCosts} situation={inputs.situation} />
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
        <HowCalculated inputs={inputs} />
      </main>

      {rows && verdict && !heroVisible && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-2 shadow-lg backdrop-blur lg:hidden">
          <a href="#top" className="flex items-center justify-between text-sm font-semibold">
            <span className={verdict.winner === 'buy' ? BUY_TEXT : verdict.winner === 'rent' ? RENT_TEXT : 'text-gray-900'}>
              {verdict.winner === 'tie' ? 'Even' : `${verdict.winner === 'buy' ? words.own.short : words.rent.short} +${formatCompactUSD(verdict.gapAbs)}`} · yr {verdict.horizon}
            </span>
            <span className="text-gray-600" aria-hidden="true">▲</span>
          </a>
        </div>
      )}
      {undo && (
        <div role="status" className="fixed bottom-16 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg lg:bottom-6">
          Inputs reset to defaults.
          <button type="button" className="font-semibold underline" onClick={() => { restore(undo); setUndo(null); }}>Undo</button>
        </div>
      )}
    </div>
  );
};

export default HousingCalculator;
