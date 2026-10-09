import type { HousingCalculatorInputs } from './financialCalculations';

// Parts of each side's net worth for a projection row; they sum to the
// engine's own totals (row fields are rounded, so within a couple of dollars).
export const netWorthParts = (row: any) => ({
  buy: [
    { label: 'Home value', value: row.homeValue },
    { label: 'Mortgage left', value: -row.remainingLoan },
    { label: 'Investments', value: row.investmentsBuying },
    { label: 'Selling costs', value: -row.sellingCosts },
  ],
  rent: [
    { label: 'Investments', value: row.investmentsRenting },
    { label: 'Security deposit', value: row.renting - row.investmentsRenting },
  ],
});

export interface Segment { label: string; value: number; kind: 'cost' | 'living' | 'invest' | 'drawdown' }

// Monthly cash flow of the year a row describes. Buyer segments sum to
// take-home + rental income, renter segments to take-home.
export const monthlyCashFlow = (row: any, _inputs?: HousingCalculatorInputs) => {
  const invest = (v: number): Segment[] => (v >= 0
    ? [{ label: 'Invested', value: v, kind: 'invest' }]
    : [{ label: 'Drawn from savings', value: v, kind: 'drawdown' }]);
  const buySegments: Segment[] = [
    { label: 'Mortgage interest', value: row.yearlyInterestPaid / 12, kind: 'cost' },
    { label: 'Mortgage principal', value: row.yearlyPrincipalPaid / 12, kind: 'cost' },
    { label: 'Property tax', value: row.monthlyPropertyTax, kind: 'cost' },
    { label: 'Mello-Roos', value: row.monthlyMelloRoosTax, kind: 'cost' },
    { label: 'PMI', value: row.monthlyPMI, kind: 'cost' },
    { label: 'Insurance', value: row.monthlyHomeInsurance, kind: 'cost' },
    { label: 'Maintenance', value: row.monthlyMaintenance, kind: 'cost' },
    { label: 'Utilities', value: row.monthlyPropertyUtilities, kind: 'cost' },
    { label: 'HOA', value: row.monthlyHOAFee, kind: 'cost' },
    { label: 'Living expenses', value: row.monthlyMiscExpenses, kind: 'living' },
    ...invest(row.availableMonthlyInvestment),
  ];
  const rentSegments: Segment[] = [
    { label: 'Rent', value: row.monthlyRent, kind: 'cost' },
    { label: 'Utilities', value: row.monthlyRentUtilities, kind: 'cost' },
    { label: 'Insurance', value: row.monthlyRenterInsurance, kind: 'cost' },
    { label: 'Living expenses', value: row.monthlyMiscExpenses, kind: 'living' },
    ...invest(row.availableMonthlyRenterInvestment),
  ];
  const visible = (segments: Segment[]) => segments.filter(s => Math.abs(s.value) >= 0.5);
  return {
    buy: visible(buySegments),
    rent: visible(rentSegments),
    buyIncome: row.monthlyTakeHome + row.monthlyRentalIncome,
    rentIncome: row.monthlyTakeHome,
    rentalIncome: row.monthlyRentalIncome,
  };
};
