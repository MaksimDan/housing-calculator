import type { FilingStatus } from './taxLaw';
import type { StateCode } from './stateLaw';
import { STATE_INCOME_TAX } from './stateIncomeTaxTable';

export { STATE_INCOME_TAX };

// State income tax on wages, by state and tax year. The rules for each state
// are in the table in stateIncomeTaxTable.ts; this file defines what an entry
// can say and computes the tax from it.
//
// The calculator takes state income tax as an effective rate (tax / salary),
// like the federal rate. Picking a state fills that rate in from the state's
// law for the salary, filing status and number of earners in the first tax
// year: the salary taxed as wages (no other income, no dependents, no pre-tax
// deductions), the state's standard deduction, personal exemptions and
// credits, plus any local income tax every resident pays (Maryland's and
// Indiana's county taxes, Pennsylvania's earned income tax). Local taxes only
// some places levy are named in `localNote` for people to add themselves.

type ByStatus<T> = Record<FilingStatus, T>;

// A rate-schedule row: [lowest taxable income in the row, marginal rate in
// percent, tax at that income]. The tax is usually left out: it is then the
// sum of the rows below. A few states print a different one (Ohio taxes
// nothing up to $26,050 and $332 at it).
export type Bracket = readonly [number, number] | readonly [number, number, number];

// How an amount (a deduction, exemption or credit) shrinks as income rises:
//  - from/to: in full up to `from`, down to `floor` (0 when absent) at `to`,
//    in a straight line, or with `step` in whole steps of that many dollars
//    of income ("for each $2,500 or fraction thereof")
//  - bands: a step function, rows of [highest income in the row, amount]
//  - points: a piecewise straight line through [income, amount] points, flat
//    before the first and after the last
export type PhaseDown =
  | { from: ByStatus<number>; to: ByStatus<number>; floor?: ByStatus<number>; step?: number | ByStatus<number> }
  | { bands: ByStatus<readonly (readonly [number, number])[]> }
  | { points: ByStatus<readonly (readonly [number, number])[]> };

// Rules beyond brackets, deductions, exemptions, credits and a surtax, each
// computed in stateIncomeTaxOnWages below
export type SpecialRule =
  // A deduction for federal income tax paid: `share` of it (a percent, or
  // percent bands by income), at most `cap`, or the cap from `capBands` by
  // income: Alabama's (all of it), Missouri's (by income band, none above
  // $125,000) and Oregon's (capped, the cap stepping down with income)
  | { kind: 'federalTaxDeduction'; share: number | ByStatus<readonly (readonly [number, number])[]>;
      cap?: ByStatus<number>; capBands?: ByStatus<readonly (readonly [number, number])[]> }
  // A deduction each earner takes from their own wages: `rate` of them, at
  // most `max` (Massachusetts' Social Security and Medicare deduction)
  | { kind: 'earnerDeduction'; rate: number; max: number }
  // For two earners, the lower earner's wages up to `max` (Maryland's
  // two-income subtraction)
  | { kind: 'twoEarnerDeduction'; max: number }
  // Two earners on a joint return each put their share of taxable income
  // through the brackets: Missouri's rule, and the "combined separate" return
  // Delaware, DC, Arkansas, Mississippi and Kentucky let couples file on one
  // form. `standardDeductionEach`: each spouse takes this deduction, where a
  // joint return gets only one (Kentucky)
  | { kind: 'bracketsPerEarner'; standardDeductionEach?: number }
  // Below `upTo` of taxable income the tax comes from `brackets`; just above
  // it, `adjustment` smooths the step between the two tables: `first` off at
  // `from`, $`perRow` less for each `rowWidth` above, none past `to` (Arkansas)
  | { kind: 'lowerIncomeTable'; upTo: number; brackets: readonly Bracket[];
      adjustment?: { from: number; to: number; first: number; perRow: number; rowWidth: number } }
  // New York's supplemental tax, which takes back the lower brackets' benefit
  // above $107,650 of income: see newYorkSupplementalTax
  | { kind: 'newYorkSupplementalTax'; tiers: ByStatus<NewYorkTiers> }
  // Amounts added to the tax by income, each "for each `step` dollars of
  // income over `over`, or fraction thereof, `perStep`, at most `max`"
  // (Connecticut's 2% rate phase-out and benefit recapture)
  | { kind: 'addBack'; tiers: ByStatus<readonly AddBackTier[]> }
  // A credit worth a percent of the tax so far, by income band: rows of
  // [highest income in the row, percent]; `basis` 'taxable' bands by income
  // less exemptions. Optionally at most `cap`, only up to `maxIncome`, only
  // for two earners (Connecticut's personal credit, Ohio's joint filing credit)
  | { kind: 'percentCredit'; bands: ByStatus<readonly (readonly [number, number])[]>; basis?: 'agi' | 'agiLessExemptions';
      cap?: number; maxIncome?: number; twoEarners?: boolean }
  // `rate` of the lower earner's wages up to `maxWages` (Wisconsin's married couple credit)
  | { kind: 'twoEarnerCredit'; rate: number; maxWages: number }
  // `amount` for two earners once joint taxable income passes `minTaxable` and
  // the lower earner's wages `minLesserWages` (North Dakota's marriage penalty
  // credit at its maximum; the smaller amounts below the thresholds are left out)
  | { kind: 'twoEarnerFlatCredit'; amount: number; minTaxable: number; minLesserWages: number }
  // Minnesota's marriage credit: see minnesotaMarriageCredit
  | { kind: 'minnesotaMarriageCredit'; adjustment: number; minLesserWages: number; minTaxable: number; cap: number }
  // Virginia's spouse tax adjustment: see virginiaSpouseTaxAdjustment
  | { kind: 'virginiaSpouseTaxAdjustment'; max: number }
  // No tax at all at or below this income (New Jersey)
  | { kind: 'noTaxAtOrBelow'; income: ByStatus<number> };

export interface NewYorkTiers {
  // Taxable income at or below `upTo` is taxed at a flat `rate` once income
  // is $50,000 past `phaseStart`, phased in before that
  first: { upTo: number; rate: number };
  // Above: the bracket containing taxable income adds `base` plus `benefit`
  // phased in over the $50,000 of income past `incomeBase`
  tiers: readonly { over: number; incomeBase: number; base: number; benefit: number }[];
}

export interface AddBackTier { over: number; step: number; perStep: number; max: number }

export interface StateIncomeTaxYear {
  source: string;
  // Some of the year's amounts are estimates (not yet published by the state)
  estimated?: string;
  brackets: ByStatus<readonly Bracket[]>;
  standardDeduction?: ByStatus<number>;
  standardDeductionPhaseDown?: PhaseDown;
  // Personal exemptions for the filer(s): one, or two on a joint return
  exemption?: ByStatus<number>;
  exemptionPhaseDown?: PhaseDown;
  credit?: ByStatus<number>; // personal credits for the filer(s), off the tax
  creditPhaseDown?: PhaseDown;
  surtax?: { rate: number; over: ByStatus<number> }; // on taxable income over `over`
  rules?: readonly SpecialRule[];
}

// Which dollar amounts the state adjusts for inflation each year, so that
// projected years grow them too: bracket thresholds, deduction / exemption /
// credit amounts, and the income thresholds of phase-downs and surtaxes
export interface Indexing { brackets: boolean; amounts: boolean; thresholds: boolean }

export interface StateIncomeTax {
  years: Record<number, StateIncomeTaxYear>;
  indexed: boolean | Indexing;
  // Enacted rates for years after the newest entry, one per bracket
  scheduledRates?: Record<number, ByStatus<readonly number[]>>;
  // Enacted brackets for years after the newest entry, used as they are
  // (Montana's 2027 brackets, set in statute before indexing resumes)
  scheduledBrackets?: Record<number, ByStatus<readonly Bracket[]>>;
  // Enacted surtaxes for years after the newest entry (Rhode Island's)
  scheduledSurtax?: Record<number, { rate: number; over: ByStatus<number> }>;
  // Income tax every resident pays to a county or town, on the state's
  // taxable income, included in the estimate
  local?: { rate: number; note: string };
  // Local income taxes only some places levy (not in the estimate)
  localNote?: string;
}

// ---------------------------------------------------------------------------
// Lookups (no constants below this line)
// ---------------------------------------------------------------------------

export const hasWageIncomeTax = (state: StateCode) => STATE_INCOME_TAX[state] != null;

const STATUSES: FilingStatus[] = ['single', 'mfj', 'hoh', 'mfs'];
const byEachStatus = <T,>(f: (s: FilingStatus) => T) => Object.fromEntries(STATUSES.map(s => [s, f(s)])) as unknown as ByStatus<T>;
const mapStatus = <T, U>(v: ByStatus<T>, f: (x: T) => U) => byEachStatus(s => f(v[s]));
const scaleRows = (rows: ByStatus<readonly (readonly [number, number])[]>, x: number, y: number) =>
  mapStatus(rows, r => r.map(([a, b]) => [a * x, b * y] as const));

const indexing = (law: StateIncomeTax): Indexing =>
  (typeof law.indexed === 'boolean' ? { brackets: law.indexed, amounts: law.indexed, thresholds: law.indexed } : law.indexed);

const scalePhaseDown = (p: PhaseDown | undefined, threshold: number, amount: number): PhaseDown | undefined => {
  if (!p) return p;
  if ('bands' in p) return { bands: scaleRows(p.bands, threshold, amount) };
  if ('points' in p) return { points: scaleRows(p.points, threshold, amount) };
  return {
    from: mapStatus(p.from, v => v * threshold),
    to: mapStatus(p.to, v => v * threshold),
    floor: p.floor && mapStatus(p.floor, v => v * amount),
    step: typeof p.step === 'number' ? p.step * threshold : p.step && mapStatus(p.step, v => v * threshold),
  };
};

// The law for a tax year: its entry, or the newest earlier one (the earliest
// for a year before the table) projected: amounts the state indexes grow
// with the inflation rate, and enacted changes apply. `projected` says the
// year has no entry of its own; an entry's `estimated` names amounts the
// state hasn't published yet.
export const stateIncomeTaxYear = (state: StateCode, year: number, inflationRate: number) => {
  const law = STATE_INCOME_TAX[state];
  if (!law) return null;
  if (law.years[year]) return { ...law.years[year], projected: false, baseYear: year };
  const years = Object.keys(law.years).map(Number).sort((a, b) => a - b);
  const baseYear = [...years].reverse().find(y => y < year) ?? years[0];
  const base = law.years[baseYear];
  const growth = Math.pow(1 + inflationRate / 100, year - baseYear);
  const ix = indexing(law);
  const [b, a, t] = [ix.brackets, ix.amounts, ix.thresholds].map(on => (on ? growth : 1));
  // The latest enacted change in effect by `year`
  const latest = <T,>(changes: Record<number, T> | undefined) => {
    const ys = Object.keys(changes ?? {}).map(Number).filter(y => y > baseYear && y <= year);
    return ys.length ? changes![Math.max(...ys)] : null;
  };
  const rates = latest(law.scheduledRates);
  const enactedBrackets = latest(law.scheduledBrackets);
  const enactedSurtax = latest(law.scheduledSurtax);
  const scale = (v: ByStatus<number> | undefined, f: number) => v && mapStatus(v, x => x * f);
  return {
    ...base,
    source: `projected from ${baseYear}`,
    brackets: enactedBrackets ?? byEachStatus(s => base.brackets[s].map((row, i): Bracket => {
      const rate = rates ? rates[s][i] : row[1];
      return row.length === 3 && !rates ? [row[0] * b, rate, row[2] * b] : [row[0] * b, rate];
    })),
    standardDeduction: scale(base.standardDeduction, a),
    standardDeductionPhaseDown: scalePhaseDown(base.standardDeductionPhaseDown, t, a),
    exemption: scale(base.exemption, a),
    exemptionPhaseDown: scalePhaseDown(base.exemptionPhaseDown, t, a),
    credit: scale(base.credit, a),
    creditPhaseDown: scalePhaseDown(base.creditPhaseDown, t, a),
    surtax: enactedSurtax ?? (base.surtax && { rate: base.surtax.rate, over: mapStatus(base.surtax.over, v => v * t) }),
    projected: true,
    baseYear,
  };
};

const interpolate = (rows: readonly (readonly [number, number])[], x: number) => {
  if (x <= rows[0][0]) return rows[0][1];
  for (let i = 1; i < rows.length; i++) {
    const [x1, y1] = rows[i];
    if (x <= x1) {
      const [x0, y0] = rows[i - 1];
      return x1 === x0 ? y1 : y0 + (y1 - y0) * (x - x0) / (x1 - x0);
    }
  }
  return rows[rows.length - 1][1];
};

const band = (rows: readonly (readonly [number, number])[], x: number) => (rows.find(([upTo]) => x <= upTo) ?? rows[rows.length - 1])[1];

const phasedAmount = (amount: number, phase: PhaseDown | undefined, status: FilingStatus, income: number) => {
  if (!phase) return amount;
  if ('bands' in phase) return band(phase.bands[status], income);
  if ('points' in phase) return interpolate(phase.points[status], income);
  const from = phase.from[status], to = phase.to[status], floor = phase.floor?.[status] ?? 0;
  if (income <= from) return amount;
  const step = typeof phase.step === 'number' ? phase.step : phase.step?.[status];
  const over = step ? Math.ceil((income - from) / step) * step : income - from;
  return amount - (amount - floor) * Math.min(1, over / (to - from));
};

// Tax from a rate schedule, using printed row bases where the state has them
export const bracketTax = (brackets: readonly Bracket[], taxable: number) => {
  let tax = 0;
  for (let i = 0; i < brackets.length; i++) {
    const [floor, rate, base] = brackets[i];
    if (taxable <= floor && i > 0) break;
    const ceiling = i + 1 < brackets.length ? brackets[i + 1][0] : Infinity;
    if (base !== undefined) tax = base;
    if (taxable > floor) tax += (Math.min(taxable, ceiling) - floor) * rate / 100;
  }
  return tax;
};

// New York's supplemental tax (Tax Law 601(d-1); the tax computation
// worksheets in the IT-201 instructions). Above $107,650 of income the
// benefit of the lower brackets is taken back in steps: once income is
// $50,000 past the bottom of the bracket taxable income is in, all of it is
// taxed at that bracket's rate. Over $25 million it is the top rate flat.
const newYorkSupplementalTax = (t: NewYorkTiers, brackets: readonly Bracket[], taxable: number, income: number) => {
  const schedule = bracketTax(brackets, taxable);
  if (income <= 107650) return schedule;
  if (income > 25000000) return taxable * brackets[brackets.length - 1][1] / 100;
  const phase = (start: number) => Math.round(Math.min(1, Math.max(0, income - start) / 50000) * 10000) / 10000;
  if (taxable <= t.first.upTo) {
    const flat = taxable * t.first.rate / 100;
    return schedule + (flat - schedule) * phase(107650);
  }
  const tier = [...t.tiers].reverse().find(r => taxable > r.over);
  return tier ? schedule + tier.base + tier.benefit * phase(tier.incomeBase) : schedule;
};

// Minnesota's marriage credit (Minn. Stat. 290.0675): for two earners, the
// joint tax less what the two would owe as singles, the lower earner taking
// their wages less `adjustment`, up to `cap`
const minnesotaMarriageCredit = (
  r: Extract<SpecialRule, { kind: 'minnesotaMarriageCredit' }>, t: StateIncomeTaxYear, taxable: number, lesserWages: number
) => {
  if (lesserWages < r.minLesserWages || taxable < r.minTaxable) return 0;
  const lesser = Math.max(0, lesserWages - r.adjustment);
  const asSingles = bracketTax(t.brackets.single, lesser) + bracketTax(t.brackets.single, Math.max(0, taxable - lesser));
  return Math.max(0, Math.min(r.cap, bracketTax(t.brackets.mfj, taxable) - asSingles));
};

// Virginia's spouse tax adjustment (STA worksheet): for two earners, the
// joint tax less the tax on each spouse's share figured separately, up to
// `max`. `lesser` is the lower earner's income less their exemption.
const virginiaSpouseTaxAdjustment = (max: number, brackets: readonly Bracket[], taxable: number, lesser: number) => {
  if (lesser <= 0) return 0;
  if (lesser > 17000 && taxable > 34000) return max;
  const half = taxable / 2;
  const separately = bracketTax(brackets, Math.min(lesser, half)) + bracketTax(brackets, Math.max(taxable - lesser, half));
  return Math.max(0, Math.min(max, bracketTax(brackets, taxable) - separately));
};

export interface WageTaxCase {
  state: StateCode;
  year: number;
  status: FilingStatus;
  wages: number;
  inflationRate: number;
  // People earning the wages, split evenly (only a joint return has two)
  earners?: number;
  // Federal income tax for the year, for the states that deduct it
  federalIncomeTax?: number;
}

export interface StateIncomeTaxEstimate {
  stateTax: number; // after credits, before local tax
  localTax: number; // the local tax every resident pays, where there is one
  total: number;
  taxable: number;
  projected: boolean; // the year has no entry: projected from another
}

// State (and statewide local) income tax on a year's wages
export const stateIncomeTaxOnWages = (c: WageTaxCase): StateIncomeTaxEstimate => {
  const law = STATE_INCOME_TAX[c.state];
  const t = stateIncomeTaxYear(c.state, c.year, c.inflationRate);
  if (!law || !t || c.wages <= 0) return { stateTax: 0, localTax: 0, total: 0, taxable: 0, projected: t?.projected ?? false };
  const { status, wages } = c;
  const earners = status === 'mfj' ? Math.max(1, Math.min(2, Math.round(c.earners ?? 1))) : 1;
  const perEarner = wages / earners;
  const rules = t.rules ?? [];
  const rule = <K extends SpecialRule['kind']>(kind: K) => rules.find(r => r.kind === kind) as Extract<SpecialRule, { kind: K }> | undefined;
  const income = wages; // AGI: wages are the only income

  const perEarnerBrackets = rule('bracketsPerEarner');
  let deductions = perEarnerBrackets?.standardDeductionEach && earners > 1
    ? earners * perEarnerBrackets.standardDeductionEach
    : phasedAmount(t.standardDeduction?.[status] ?? 0, t.standardDeductionPhaseDown, status, income);
  const exemptions = phasedAmount(t.exemption?.[status] ?? 0, t.exemptionPhaseDown, status, income);
  deductions += exemptions;
  const federal = rule('federalTaxDeduction');
  if (federal) {
    const share = typeof federal.share === 'number' ? federal.share : band(federal.share[status], income);
    const limit = federal.capBands ? band(federal.capBands[status], income) : federal.cap?.[status] ?? Infinity;
    deductions += Math.min(limit, Math.max(0, c.federalIncomeTax ?? 0) * share / 100);
  }
  const earner = rule('earnerDeduction');
  if (earner) deductions += earners * Math.min(earner.max, perEarner * earner.rate / 100);
  const twoIncome = rule('twoEarnerDeduction');
  if (twoIncome && earners > 1) deductions += Math.min(twoIncome.max, perEarner);
  const taxable = Math.max(0, income - deductions);

  const ny = rule('newYorkSupplementalTax');
  const lower = rule('lowerIncomeTable');
  const scheduleTax = (amount: number) => {
    if (!lower || amount > lower.upTo) {
      const a = lower?.adjustment;
      const smoothing = a && amount >= a.from && amount <= a.to ? a.first - a.perRow * Math.floor((amount - a.from) / a.rowWidth) : 0;
      return bracketTax(t.brackets[status], amount) - smoothing;
    }
    return bracketTax(lower.brackets, amount);
  };
  let tax = ny ? newYorkSupplementalTax(ny.tiers[status], t.brackets[status], taxable, income)
    : perEarnerBrackets && earners > 1 ? earners * scheduleTax(taxable / earners)
      : scheduleTax(taxable);
  for (const tier of rule('addBack')?.tiers[status] ?? []) {
    if (income > tier.over) tax += Math.min(tier.max, tier.perStep * Math.ceil((income - tier.over) / tier.step));
  }

  tax = Math.max(0, tax - phasedAmount(t.credit?.[status] ?? 0, t.creditPhaseDown, status, income));
  for (const r of rules) {
    if (r.kind === 'percentCredit' && (!r.twoEarners || earners > 1) && income < (r.maxIncome ?? Infinity)) {
      const basis = r.basis === 'agiLessExemptions' ? income - exemptions : income;
      tax -= Math.min(r.cap ?? Infinity, tax * band(r.bands[status], basis) / 100);
    }
    if (r.kind === 'twoEarnerCredit' && earners > 1) tax -= r.rate / 100 * Math.min(r.maxWages, perEarner);
    if (r.kind === 'twoEarnerFlatCredit' && earners > 1 && taxable > r.minTaxable && perEarner > r.minLesserWages) tax -= r.amount;
    if (r.kind === 'minnesotaMarriageCredit' && earners > 1) tax -= minnesotaMarriageCredit(r, t, taxable, perEarner);
    if (r.kind === 'virginiaSpouseTaxAdjustment' && earners > 1) {
      tax -= virginiaSpouseTaxAdjustment(r.max, t.brackets[status], taxable, perEarner - exemptions / earners);
    }
  }
  // Credits don't offset a surtax (California's 1% over $1 million)
  tax = Math.max(0, tax);
  if (t.surtax) tax += Math.max(0, taxable - t.surtax.over[status]) * t.surtax.rate / 100;
  const none = rule('noTaxAtOrBelow');
  const stateTax = none && income <= none.income[status] ? 0 : tax;
  const localTax = law.local ? taxable * law.local.rate / 100 : 0;
  return { stateTax, localTax, total: stateTax + localTax, taxable, projected: t.projected };
};

// The effective rate the state picker fills in, in percent (2 decimals)
export const estimateStateIncomeTaxRate = (c: WageTaxCase) => {
  if (c.wages <= 0) return 0;
  return Math.round(stateIncomeTaxOnWages(c).total / c.wages * 10000) / 100;
};

// The state's income tax in a sentence for this filing status, for the
// method section
export const describeStateIncomeTax = (state: StateCode, year: number, status: FilingStatus, inflationRate: number) => {
  const law = STATE_INCOME_TAX[state];
  const t = stateIncomeTaxYear(state, year, inflationRate);
  if (!law || !t) return 'none on wages.';
  const usd = (n: number) => `$${Math.round(n).toLocaleString('en-US')}`;
  const brackets = t.brackets[status];
  const untaxed = brackets[0][1] === 0 && brackets.length > 1 ? brackets[1][0] : 0;
  const positive = brackets.map(row => row[1]).filter(r => r > 0);
  const top = Math.max(...positive);
  const shape = new Set(positive).size === 1 ? `a flat ${top}%` : `${positive[0]}% to ${top}%`;
  const surtax = t.surtax ? `, plus ${t.surtax.rate}% on taxable income over ${usd(t.surtax.over[status])}` : '';
  const local = law.local ? `, plus ${law.local.note}` : '';
  const basis = t.projected ? ` (projected from ${t.baseYear})` : t.estimated ? ' (some amounts estimated)' : '';
  return `${untaxed ? `nothing on the first ${usd(untaxed)} of taxable income, then ` : ''}${shape}${untaxed ? '' : ' of taxable income'}`
    + ` in ${year}${basis}${surtax}${local}.`;
};
