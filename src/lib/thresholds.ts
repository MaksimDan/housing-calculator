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

// The nearest value of `key` at which the buy-minus-rent gap changes sign,
// using the engine as a black box: from the current value it steps toward
// each end of `range` until the sign changes, then bisects that step. An
// input's effect needn't be monotone (where property tax follows the home's
// value, faster appreciation also means higher taxes), so the steps rather
// than the ends decide whether there is a flip; a flip and flip-back within
// one step can be missed. Stops where the inputs become unaffordable.
// Returns null when the verdict doesn't flip anywhere in the range.
export const findFlipThreshold = (
  inputs: HousingCalculatorInputs,
  key: InputKey,
  horizon: number,
  range: { min: number; max: number },
  iterations = 50,
  steps = 32
): FlipThreshold | null => {
  const current = inputs[key] as number;
  const at = (v: number) => gapAt({ ...inputs, [key]: v }, horizon);
  const g0 = at(current);
  if (g0 === null || g0 === 0) return null;
  let nearest: FlipThreshold | null = null;
  for (const [end, direction] of [[range.min, 'below'], [range.max, 'above']] as const) {
    if (direction === 'below' && end >= current) continue;
    if (direction === 'above' && end <= current) continue;
    let same = current;
    for (let k = 1; k <= steps; k++) {
      const v = current + (end - current) * k / steps;
      const g = at(v);
      if (g === null) break;
      if (Math.sign(g) === Math.sign(g0)) { same = v; continue; }
      let other = v;
      for (let i = 0; i < iterations; i++) {
        const mid = (same + other) / 2;
        const gm = at(mid);
        if (gm === null) { other = mid; continue; }
        if (Math.sign(gm) === Math.sign(g0)) same = mid; else other = mid;
      }
      const found = { key, value: (same + other) / 2, direction };
      if (!nearest || Math.abs(found.value - current) < Math.abs(nearest.value - current)) nearest = found;
      break;
    }
  }
  return nearest;
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
