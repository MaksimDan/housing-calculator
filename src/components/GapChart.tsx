import React, { useState } from 'react';
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceDot, ResponsiveContainer,
} from 'recharts';
import { formatAxisUSD, formatUSD } from '../lib/format';
import { BUY_COLOR, RENT_COLOR } from '../lib/colors';
import { leadHistory } from '../lib/verdict';

interface GapChartProps {
  rows: any[];
  horizon: number;
  selectedYear: number;
  onSelectYear: (year: number) => void;
}

const GapTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const lead = p.gap > 0 ? 'Buying ahead by' : p.gap < 0 ? 'Renting ahead by' : 'Even';
  return (
    <div className="rounded border border-gray-200 bg-white p-2 text-xs shadow">
      <p className="font-medium text-gray-900">Year {label}</p>
      <p className="text-gray-800">{lead} {p.gap !== 0 ? formatUSD(Math.abs(p.gap)) : ''}</p>
      <p className="text-blue-700">Buy: {formatUSD(p.buying)}</p>
      <p className="text-emerald-700">Rent: {formatUSD(p.renting)}</p>
    </div>
  );
};

// The decision itself: buy minus rent over time around a heavy zero line
// (above = buying ahead, below = renting ahead). "Totals" shows both net worths.
export const GapChart: React.FC<GapChartProps> = ({ rows, horizon, selectedYear, onSelectYear }) => {
  const [mode, setMode] = useState<'gap' | 'totals'>('gap');
  const data = rows.slice(0, horizon + 1).map((r: any) => ({ year: r.year, gap: r.buying - r.renting, buying: r.buying, renting: r.renting }));
  const gaps = data.map(d => d.gap);
  const max = Math.max(...gaps, 0), min = Math.min(...gaps, 0);
  const offset = max <= 0 ? 0 : min >= 0 ? 1 : max / (max - min);
  const { crossovers } = leadHistory(rows, horizon);
  const end = data[data.length - 1];
  const step = horizon <= 10 ? 1 : horizon <= 20 ? 2 : 5;
  const ticks = Array.from({ length: Math.floor(horizon / step) + 1 }, (_, k) => k * step);
  if (ticks[ticks.length - 1] !== horizon) ticks.push(horizon);
  const handleClick = (e: any) => {
    if (e && e.activeLabel !== undefined && e.activeLabel !== null) onSelectYear(Number(e.activeLabel));
  };

  return (
    <section aria-labelledby="gap-chart-title" className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="gap-chart-title" className="text-xs font-semibold uppercase tracking-wide text-gray-600">
          {mode === 'gap' ? 'Buy minus rent' : 'Net worth'} <span className="normal-case font-normal">(before taxes on selling)</span>
        </h2>
        <div role="group" aria-label="Chart view" className="inline-flex rounded-md border border-gray-300 overflow-hidden text-sm">
          {(['gap', 'totals'] as const).map(m => (
            <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
              className={`px-3 py-1 ${mode === m ? 'bg-gray-800 text-white' : 'bg-white text-gray-800 hover:bg-gray-50'} focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}>
              {m === 'gap' ? 'Gap' : 'Totals'}
            </button>
          ))}
        </div>
      </div>
      {mode === 'gap' && (
        <p className="mt-1 text-xs text-gray-600">
          <span className="text-blue-700">Above zero: buying ahead</span> · <span className="text-emerald-700">below zero: renting ahead</span> · click the chart to pick a year
        </p>
      )}
      <div className="mt-2 h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 16, right: 16, left: 8, bottom: 8 }} onClick={handleClick} accessibilityLayer>
            <defs>
              <linearGradient id="gapFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset={offset} stopColor={BUY_COLOR} stopOpacity={0.3} />
                <stop offset={offset} stopColor={RENT_COLOR} stopOpacity={0.3} />
              </linearGradient>
              <linearGradient id="gapStroke" x1="0" y1="0" x2="0" y2="1">
                <stop offset={offset} stopColor={BUY_COLOR} />
                <stop offset={offset} stopColor={RENT_COLOR} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="year" type="number" domain={[0, horizon]} ticks={ticks} allowDecimals={false} tick={{ fontSize: 12, fill: '#4b5563' }}
              label={{ value: 'Years', position: 'insideBottomRight', offset: -4, fontSize: 12, fill: '#4b5563' }} />
            <YAxis tickFormatter={formatAxisUSD} width={64} tick={{ fontSize: 12, fill: '#4b5563' }} />
            <Tooltip content={<GapTooltip />} />
            {mode === 'gap' ? (
              <>
                <ReferenceLine y={0} stroke="#374151" strokeWidth={2} />
                <Area type="monotone" dataKey="gap" stroke="url(#gapStroke)" strokeWidth={2.5} fill="url(#gapFill)" isAnimationActive={false} name="Buy minus rent" />
                {crossovers.map(y => (
                  <ReferenceDot key={y} x={y} y={0} r={4} fill="#374151" stroke="white" />
                ))}
                {end && (
                  <ReferenceDot x={end.year} y={end.gap} r={4} fill={end.gap >= 0 ? BUY_COLOR : RENT_COLOR} stroke="white"
                    label={{ value: `${end.gap >= 0 ? 'Buy' : 'Rent'} +${formatAxisUSD(Math.abs(end.gap))}`, position: 'left', offset: 8, fontSize: 12, fontWeight: 600, fill: '#111827' }} />
                )}
              </>
            ) : (
              <>
                <Line type="monotone" dataKey="buying" stroke={BUY_COLOR} strokeWidth={2} dot={false} isAnimationActive={false} name="Buy" />
                <Line type="monotone" dataKey="renting" stroke={RENT_COLOR} strokeWidth={2} strokeDasharray="6 3" dot={false} isAnimationActive={false} name="Rent" />
              </>
            )}
            <ReferenceLine x={selectedYear} stroke="#6b7280" strokeDasharray="4 4" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span id="year-picker-label" className="text-sm text-gray-800">Year</span>
        <button type="button" aria-label="Previous year" onClick={() => onSelectYear(Math.max(0, selectedYear - 1))}
          className="rounded border border-gray-300 px-2 py-0.5 text-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">◀</button>
        <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">{selectedYear}</span>
        <button type="button" aria-label="Next year" onClick={() => onSelectYear(Math.min(horizon, selectedYear + 1))}
          className="rounded border border-gray-300 px-2 py-0.5 text-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">▶</button>
        <input type="range" min={0} max={horizon} step={1} value={selectedYear} aria-labelledby="year-picker-label"
          onChange={(e) => onSelectYear(Number(e.target.value))} className="flex-1 min-w-[8rem]" />
        <a href="#year-table" className="text-sm text-blue-700 hover:underline">View as table</a>
      </div>
    </section>
  );
};

export default GapChart;
