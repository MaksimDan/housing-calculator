import { formatCompactUSD } from './format';

export type Side = 'buy' | 'rent' | 'tie';

export interface ProjectionRow {
  year: number;
  buying: number;
  renting: number;
  [key: string]: number;
}

export interface Verdict {
  horizon: number;
  calendarYear: number; // dollars are nominal dollars of this year
  buying: number;
  renting: number;
  gap: number; // buying - renting (nominal)
  winner: Side;
  loser: Side;
  gapAbs: number;
  gapPctOfLoser: number; // how much more net worth the winner has, in %
  todayGap: number; // gapAbs deflated to today's dollars
  crossovers: number[]; // years in which the lead changed hands
  leadSince: number; // first year of the winner's final, unbroken lead
  story: string; // how the lead evolved
  headline: string;
}

const sideName = (s: Side) => (s === 'buy' ? 'Buying' : s === 'rent' ? 'Renting' : 'Neither');
const sideOf = (gap: number): Side => (gap > 0 ? 'buy' : gap < 0 ? 'rent' : 'tie');

// The leader in each year 0..horizon, and the years the lead changed hands.
export const leadHistory = (rows: ProjectionRow[], horizon: number) => {
  const leaders: Side[] = [];
  for (let y = 0; y <= horizon; y++) leaders.push(sideOf(rows[y].buying - rows[y].renting));
  const crossovers: number[] = [];
  let last: Side | null = null;
  leaders.forEach((s, y) => {
    if (s === 'tie') return;
    if (last !== null && s !== last) crossovers.push(y);
    last = s;
  });
  return { leaders, crossovers };
};

export const computeVerdict = (
  rows: ProjectionRow[],
  requestedHorizon: number,
  inflationRate: number,
  firstTaxYear: number
): Verdict => {
  const horizon = Math.min(Math.floor(requestedHorizon), rows.length - 1);
  const end = rows[horizon];
  const gap = end.buying - end.renting;
  const winner = Math.abs(gap) < 1 ? 'tie' : sideOf(gap);
  const loser: Side = winner === 'buy' ? 'rent' : winner === 'rent' ? 'buy' : 'tie';
  const gapAbs = Math.abs(gap);
  const loserNetWorth = winner === 'buy' ? end.renting : end.buying;
  const gapPctOfLoser = loserNetWorth > 0 ? (gapAbs / loserNetWorth) * 100 : NaN;
  const todayGap = gapAbs / Math.pow(1 + inflationRate / 100, horizon);
  const { crossovers } = leadHistory(rows, horizon);
  const leadSince = crossovers.length ? crossovers[crossovers.length - 1] : 0;

  let story: string;
  if (winner === 'tie') {
    story = `The two paths end up even after ${horizon} years.`;
  } else if (crossovers.length === 0) {
    story = `${sideName(winner)} is ahead from the start and stays ahead for all ${horizon} years.`;
  } else if (crossovers.length === 1) {
    story = `${sideName(loser)} leads at first; ${sideName(winner).toLowerCase()} pulls ahead in year ${leadSince} and stays ahead.`;
  } else {
    story = `The lead changes hands ${crossovers.length} times (years ${crossovers.join(', ')}); ${sideName(winner).toLowerCase()} has led since year ${leadSince}.`;
  }

  const headline = winner === 'tie'
    ? `Buying and renting come out even after ${horizon} years`
    : `${sideName(winner)} comes out ahead by ${formatCompactUSD(gapAbs)} after ${horizon} years`;

  return {
    horizon,
    calendarYear: firstTaxYear + horizon - 1,
    buying: end.buying,
    renting: end.renting,
    gap,
    winner,
    loser,
    gapAbs,
    gapPctOfLoser,
    todayGap,
    crossovers,
    leadSince,
    story,
    headline,
  };
};
