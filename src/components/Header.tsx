import React, { useState } from 'react';
import { Share2, Check, MoreHorizontal } from 'lucide-react';
import { FilingStatus, taxYearOptions } from '../lib/taxLaw';

interface HeaderProps {
  firstTaxYear: number;
  filingStatus: FilingStatus;
  onTaxYear: (year: number) => void;
  onFilingStatus: (status: FilingStatus) => void;
  share: () => Promise<{ ok: boolean; url: string }>;
  onReset: () => void;
  // Starting values come from personal.config.ts (dev server only)
  personal: boolean;
}

export const Header: React.FC<HeaderProps> = ({ firstTaxYear, filingStatus, onTaxYear, onFilingStatus, share, onReset, personal }) => {
  const [shareState, setShareState] = useState<{ ok: boolean; url: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const options = taxYearOptions();
  if (!options.some(o => o.year === firstTaxYear)) options.push({ year: firstTaxYear, projected: true });
  options.sort((a, b) => a.year - b.year);

  const onShare = async () => {
    const result = await share();
    setShareState(result);
    if (result.ok) setTimeout(() => setShareState(null), 2500);
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <h1 className="order-1 text-lg font-semibold text-gray-900">Buy vs. Rent Calculator</h1>
        {personal && (
          <span className="order-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-900"
            title="Starting values come from personal.config.ts, which only your local dev server reads">
            personal.config.ts
          </span>
        )}
        <nav aria-label="Sections" className="order-3 flex w-full gap-4 text-sm lg:order-2 lg:w-auto">
          <a href="#top" className="text-gray-700 hover:text-gray-900 hover:underline">Buy or rent?</a>
          <a href="#prepay" className="text-gray-700 hover:text-gray-900 hover:underline">If you buy: prepay?</a>
          <a href="#method" className="text-gray-700 hover:text-gray-900 hover:underline">Method</a>
        </nav>
        <div className="order-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm lg:order-3">
          <label className="flex items-center gap-1.5 text-gray-800">
            Tax year
            <select value={firstTaxYear} onChange={(e) => onTaxYear(Number(e.target.value))}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              {options.map(o => <option key={o.year} value={o.year}>{o.year}{o.projected ? ' (projected)' : ''}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-1.5 text-gray-800">
            Filing
            <select value={filingStatus} onChange={(e) => onFilingStatus(e.target.value as FilingStatus)}
              className="rounded-md border border-gray-300 bg-white px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="mfj">Married filing jointly</option>
              <option value="single">Single</option>
              <option value="hoh">Head of household</option>
              <option value="mfs">Married filing separately</option>
            </select>
          </label>
        </div>
        <div className="order-2 ml-auto flex items-center gap-2 lg:order-4">
          <button type="button" onClick={onShare}
            className="flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
            {shareState?.ok ? <Check className="h-4 w-4" aria-hidden="true" /> : <Share2 className="h-4 w-4" aria-hidden="true" />}
            {shareState?.ok ? 'Link copied' : 'Share'}
          </button>
          <div className="relative">
            <button type="button" aria-label="More actions" aria-expanded={menuOpen} aria-haspopup="true" onClick={() => setMenuOpen(o => !o)}
              className="rounded-md border border-gray-300 p-1.5 text-gray-700 hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-56 rounded-md border border-gray-200 bg-white py-1 shadow-lg">
                <button type="button" onClick={() => { setMenuOpen(false); onReset(); }}
                  className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50">
                  {personal ? 'Reset all inputs to personal.config.ts' : 'Reset all inputs to defaults'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      {shareState && !shareState.ok && (
        <div className="mx-auto max-w-[1440px] px-4 pb-3 sm:px-6">
          <label className="block text-sm text-gray-800">
            Couldn't copy automatically. Copy this link:
            <input readOnly value={shareState.url} onFocus={(e) => e.currentTarget.select()} className="mt-1 w-full rounded border border-gray-300 px-2 py-1 text-xs" />
          </label>
        </div>
      )}
    </header>
  );
};

export default Header;
