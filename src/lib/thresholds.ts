import { calculateProjectionData, HousingCalculatorInputs } from './financialCalculations';
import { FIELDS, InputKey, appliesTo } from './fields';

// Buy-minus-rent gap at the horizon, or null when the inputs are unaffordable.
export const gapAt = (inputs: HousingCalculatorInputs, horizon: number): number | null => {
  const rows = calculateProjectionData(inputs) as any;
  if (!Array.isArray(rows)) return null;
  const row = rows[Math.min(Math.floor(horizon), rows.length - 1)];
  return row.buying - row.renting;
};

export interface FlipThreshold {
  key: InputKey;
  value: number; // the input value at which the verdict changes sides
  direction: 'below' | 'above'; // the verdict flips when the input goes below/above `value`
}

// Bisects the engine (as a black box) for the value of `key` at which the
// buy-minus-rent gap changes sign, searching from the current value toward
// whichever end of `range` has the opposite sign. Returns null when the
// verdict doesn't flip anywhere in the range.
export const findFlipThreshold = (
  inputs: HousingCalculatorInputs,
  key: InputKey,
  horizon: number,
  range: { min: number; max: number },
  iterations = 50
): FlipThreshold | null => {
  const current = inputs[key] as number;
  const at = (v: number) => gapAt({ ...inputs, [key]: v }, horizon);
  const g0 = at(current);
  if (g0 === null || g0 === 0) return null;
  for (const [end, direction] of [[range.min, 'below'], [range.max, 'above']] as const) {
    if (direction === 'below' && end >= current) continue;
    if (direction === 'above' && end <= current) continue;
    const gEnd = at(end);
    if (gEnd === null || Math.sign(gEnd) === Math.sign(g0)) continue;
    let same = current, other = end;
    for (let i = 0; i < iterations; i++) {
      const mid = (same + other) / 2;
      const g = at(mid);
      if (g === null) { other = mid; continue; }
      if (Math.sign(g) === Math.sign(g0)) same = mid; else other = mid;
    }
    return { key, value: (same + other) / 2, direction };
  }
  return null;
};

// Flip thresholds for every field that declares a flip range, nearest first
// (by relative distance from the current value).
export const findFlipThresholds = (inputs: HousingCalculatorInputs, horizon: number): FlipThreshold[] => {
  const results: FlipThreshold[] = [];
  for (const f of FIELDS) {
    if (!f.flip || !appliesTo(f, inputs.situation)) continue;
    const t = findFlipThreshold(inputs, f.key, horizon, f.flip);
    if (t) results.push(t);
  }
  const distance = (t: FlipThreshold) => {
    const cur = inputs[t.key] as number;
    return Math.abs(t.value - cur) / Math.max(Math.abs(cur), 1);
  };
  return results.sort((a, b) => distance(a) - distance(b));
};
