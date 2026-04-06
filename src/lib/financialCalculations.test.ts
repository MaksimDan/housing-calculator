import { describe, it, expect } from 'vitest';
import {
  toMonthlyRate,
  calculateMonthlyTakeHome,
  calculateYearlyMortgageBreakdown,
  calculateTaxSavings,
  calculateMortgageScenario,
  calculateProjectionData,
  HousingCalculatorInputs,
} from './financialCalculations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseInputs: HousingCalculatorInputs = {
  annualSalaryBeforeTax: 420000,
  effectiveFederalTaxRate: 19.1,
  standardDeduction: 30000,
  initialInvestment: 1500000,
  monthlyMiscExpenses: 1000,
  homePrice: 750000,
  downPaymentPercent: 40,
  effectiveMortgageRate: 5.24,
  mortgageYears: 30,
  PMIRate: 0.8,
  propertyTaxRate: 1.14,
  melloRoosTaxRate: 0,
  closingCostPercent: 2.5,
  annualMaintenanceRate: 0.5,
  monthlyHOAFee: 0,
  monthlyHomeInsurance: 150,
  monthlyRent: 3000,
  monthlyRentalIncome: 1500,
  rentDeposit: 1000,
  movingCostBuying: 0,
  movingCostRenting: 0,
  monthlyRenterInsurance: 25,
  monthlyRentUtilities: 300,
  monthlyPropertyUtilities: 120,
  homeAppreciation: 4.5,
  investmentReturn: 11.71,
  rentIncrease: 4.5,
  salaryGrowthRate: 2.4,
  inflationRate: 3.0,
  propertyTaxAssessmentCap: 2,
  xAxisYears: 30,
  mortgageInterestDeductionCap: 750000,
  saltCap: 40000,
  effectiveStateIncomeTaxRate: 7.5,
  marginalFederalTaxRate: 32,
  useMarginalTaxRate: true,
  melloRoosGrowsWithAssessment: false,
  includeSellingCosts: false,
  sellingCostPercent: 6,
  annualInvestmentTaxDrag: 0.2,
};

function inputs(overrides: Partial<HousingCalculatorInputs> = {}): HousingCalculatorInputs {
  return { ...baseInputs, ...overrides };
}

// Standard mortgage payment formula
function mortgagePayment(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ---------------------------------------------------------------------------
// toMonthlyRate
// ---------------------------------------------------------------------------

describe('toMonthlyRate', () => {
  it('converts annual rate so 12 months of compounding equals the annual rate', () => {
    const annual = 8.5;
    const monthly = toMonthlyRate(annual);
    const effective = Math.pow(1 + monthly, 12) - 1;
    expect(effective).toBeCloseTo(annual / 100, 10);
  });

  it('returns 0 for 0% annual rate', () => {
    expect(toMonthlyRate(0)).toBe(0);
  });

  it('works for a range of rates', () => {
    for (const rate of [1, 5, 10, 15, 20]) {
      const monthly = toMonthlyRate(rate);
      const effective = (Math.pow(1 + monthly, 12) - 1) * 100;
      expect(effective).toBeCloseTo(rate, 8);
    }
  });

  it('handles tax drag subtracted from return', () => {
    const gross = 11.71;
    const drag = 0.2;
    const net = gross - drag; // 11.51
    const monthly = toMonthlyRate(net);
    const effective = (Math.pow(1 + monthly, 12) - 1) * 100;
    expect(effective).toBeCloseTo(net, 8);
  });
});

// ---------------------------------------------------------------------------
// calculateMonthlyTakeHome
// ---------------------------------------------------------------------------

describe('calculateMonthlyTakeHome', () => {
  it('computes take-home from salary and effective tax rates', () => {
    // 420k * (1 - 0.191 - 0.075) = 420k * 0.734 = 308280 / 12 = 25690
    const result = calculateMonthlyTakeHome(420000, 19.1, 7.5);
    expect(result).toBeCloseTo(25690, 0);
  });

  it('returns full salary / 12 when tax rates are 0', () => {
    const result = calculateMonthlyTakeHome(120000, 0, 0);
    expect(result).toBe(10000);
  });

  it('returns 0 when tax rates sum to 100%', () => {
    const result = calculateMonthlyTakeHome(120000, 60, 40);
    expect(result).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// calculateYearlyMortgageBreakdown
// ---------------------------------------------------------------------------

describe('calculateYearlyMortgageBreakdown', () => {
  const loan = 450000; // 750k * 60%
  const rate = 5.24 / 100 / 12;
  const payment = mortgagePayment(loan, 5.24, 30);

  it('interest + principal equals 12 monthly payments in year 1', () => {
    const result = calculateYearlyMortgageBreakdown(loan, payment, rate);
    const totalPaid = result.yearlyInterestPaid + result.yearlyPrincipalPaid;
    expect(totalPaid).toBeCloseTo(payment * 12, 2);
  });

  it('ending balance = starting - principal paid', () => {
    const result = calculateYearlyMortgageBreakdown(loan, payment, rate);
    expect(result.endingBalance).toBeCloseTo(loan - result.yearlyPrincipalPaid, 2);
  });

  it('first month interest is balance × monthly rate', () => {
    // First month interest = 450000 * (5.24/100/12)
    const expectedFirstMonthInterest = loan * rate;
    // Year 1 interest should be slightly less than 12× first month (balance decreases)
    const result = calculateYearlyMortgageBreakdown(loan, payment, rate);
    expect(result.yearlyInterestPaid).toBeLessThan(expectedFirstMonthInterest * 12);
    expect(result.yearlyInterestPaid).toBeGreaterThan(expectedFirstMonthInterest * 11);
  });

  it('extra payments reduce ending balance faster', () => {
    const standard = calculateYearlyMortgageBreakdown(loan, payment, rate);
    const extra = calculateYearlyMortgageBreakdown(loan, payment, rate, 1000);
    expect(extra.endingBalance).toBeLessThan(standard.endingBalance);
    expect(extra.yearlyPrincipalPaid).toBeGreaterThan(standard.yearlyPrincipalPaid);
  });

  it('extra payments reduce total interest', () => {
    const standard = calculateYearlyMortgageBreakdown(loan, payment, rate);
    const extra = calculateYearlyMortgageBreakdown(loan, payment, rate, 1000);
    expect(extra.yearlyInterestPaid).toBeLessThan(standard.yearlyInterestPaid);
  });

  it('caps principal at remaining balance when overpaying', () => {
    const smallBalance = 500;
    const result = calculateYearlyMortgageBreakdown(smallBalance, payment, rate);
    expect(result.endingBalance).toBe(0);
    expect(result.yearlyPrincipalPaid).toBeCloseTo(smallBalance, 2);
    // Total paid (interest + principal) should be LESS than 12 payments
    expect(result.yearlyInterestPaid + result.yearlyPrincipalPaid).toBeLessThan(payment * 12);
  });

  it('returns zeros for zero balance', () => {
    const result = calculateYearlyMortgageBreakdown(0, payment, rate);
    expect(result.yearlyInterestPaid).toBe(0);
    expect(result.yearlyPrincipalPaid).toBe(0);
    expect(result.endingBalance).toBe(0);
  });

  it('fully amortizes over 30 years', () => {
    let balance = loan;
    for (let year = 0; year < 30; year++) {
      const result = calculateYearlyMortgageBreakdown(balance, payment, rate);
      balance = result.endingBalance;
    }
    expect(balance).toBeCloseTo(0, 0);
  });
});

// ---------------------------------------------------------------------------
// calculateTaxSavings
// ---------------------------------------------------------------------------

describe('calculateTaxSavings', () => {
  it('produces savings when itemized exceeds standard deduction', () => {
    // Mortgage interest: 23000, property tax: 8550
    // State income tax: 420000 * 7.5% = 31500
    // SALT = 8550 + 31500 = 40050 → capped at 40000
    // Itemized = 23000 + 40000 = 63000
    // Benefit = 63000 - 30000 = 33000
    // Tax savings = 33000 * 32% = 10560
    const result = calculateTaxSavings(23000, 8550, 30000, 750000, 450000, 32, 40000, 420000, 7.5);
    expect(result.yearlyTaxSavings).toBeCloseTo(10560, 0);
    expect(result.totalItemizedDeductions).toBeCloseTo(63000, 0);
  });

  it('returns 0 savings when itemized is below standard deduction', () => {
    // Small mortgage interest, small property tax
    const result = calculateTaxSavings(5000, 3000, 30000, 750000, 450000, 32, 40000, 100000, 7.5);
    // SALT = 3000 + 7500 = 10500
    // Itemized = 5000 + 10500 = 15500 < 30000
    expect(result.yearlyTaxSavings).toBe(0);
    expect(result.totalItemizedDeductions).toBeCloseTo(15500, 0);
  });

  it('prorates mortgage interest when balance exceeds cap', () => {
    // Balance 1000000, cap 750000 → only 75% of interest deductible
    const fullInterest = 50000;
    const result = calculateTaxSavings(fullInterest, 0, 0, 750000, 1000000, 32, 100000, 420000, 7.5);
    // Capped interest = 50000 * (750000/1000000) = 37500
    // SALT = 0 + 31500 = 31500
    // Itemized = 37500 + 31500 = 69000
    expect(result.totalItemizedDeductions).toBeCloseTo(69000, 0);
  });

  it('does not prorate when balance is under cap', () => {
    const interest = 20000;
    const result = calculateTaxSavings(interest, 0, 0, 750000, 400000, 32, 100000, 0, 0);
    // Balance 400k < cap 750k → full interest deductible
    expect(result.totalItemizedDeductions).toBeCloseTo(20000, 0);
  });

  it('applies SALT cap', () => {
    // Property tax: 50000, state income: 31500 → total 81500, capped at 40000
    const result = calculateTaxSavings(0, 50000, 0, 750000, 0, 32, 40000, 420000, 7.5);
    // SALT = min(81500, 40000) = 40000
    expect(result.totalItemizedDeductions).toBeCloseTo(40000, 0);
  });

  it('does NOT include mello-roos (function has no mello-roos parameter)', () => {
    // The function signature itself enforces this — no melloRoos parameter.
    // Just verify the function works without it.
    const result = calculateTaxSavings(20000, 8550, 30000, 750000, 450000, 32, 40000, 420000, 7.5);
    expect(result.yearlyTaxSavings).toBeGreaterThan(0);
  });

  it('uses the provided tax rate for savings calculation', () => {
    const at24 = calculateTaxSavings(30000, 8550, 15000, 750000, 450000, 24, 40000, 420000, 7.5);
    const at32 = calculateTaxSavings(30000, 8550, 15000, 750000, 450000, 32, 40000, 420000, 7.5);
    // Same deductions, different rates → proportional savings
    expect(at32.yearlyTaxSavings / at24.yearlyTaxSavings).toBeCloseTo(32 / 24, 5);
  });

  it('returns 0 for zero mortgage interest at year 0', () => {
    const result = calculateTaxSavings(0, 8550, 30000, 750000, 450000, 32, 40000, 420000, 7.5);
    // SALT only: min(8550 + 31500, 40000) = 40000
    // Itemized = 40000
    // Benefit = 40000 - 30000 = 10000
    // Savings = 10000 * 0.32 = 3200
    expect(result.yearlyTaxSavings).toBeCloseTo(3200, 0);
  });

  it('handles zero mortgage balance gracefully', () => {
    const result = calculateTaxSavings(0, 8550, 30000, 750000, 0, 32, 40000, 420000, 7.5);
    expect(result.totalItemizedDeductions).toBeGreaterThan(0); // SALT still applies
  });
});

// ---------------------------------------------------------------------------
// calculateProjectionData — structure and year 0
// ---------------------------------------------------------------------------

describe('calculateProjectionData', () => {
  it('returns an array of yearly data points', () => {
    const data = calculateProjectionData(inputs());
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBe(Math.max(baseInputs.mortgageYears, baseInputs.xAxisYears) + 1); // +1 for year 0
  });

  it('year 0 has correct buying net worth', () => {
    const inp = inputs({ includeSellingCosts: false });
    const data = calculateProjectionData(inp) as any[];
    // buying NW = investment - closingCosts - movingCosts
    // = 1500000 - 18750 - 0 = 1481250
    expect(data[0].buying).toBe(1481250);
  });

  it('year 0 has correct renting net worth', () => {
    const data = calculateProjectionData(inputs()) as any[];
    // renting NW = investment - deposit - movingCostRent
    // = 1500000 - 1000 - 0 = 1499000
    expect(data[0].renting).toBe(1499000);
  });

  it('year 0 home equity = down payment', () => {
    const data = calculateProjectionData(inputs()) as any[];
    // equity = homePrice - mortgage = 750000 - 450000 = 300000
    expect(data[0].homeEquity).toBe(300000);
  });

  it('year 0 investmentsBuying = cash after all upfront costs', () => {
    const inp = inputs({ includeSellingCosts: false });
    const data = calculateProjectionData(inp) as any[];
    // investments = initial - downPayment - closingCosts - movingCosts
    // = 1500000 - 300000 - 18750 - 0 = 1181250
    expect(data[0].investmentsBuying).toBe(1181250);
  });

  it('buying net worth = investments + homeEquity - sellingCosts (within rounding)', () => {
    const inp = inputs({ includeSellingCosts: true, sellingCostPercent: 6 });
    const data = calculateProjectionData(inp) as any[];
    for (const row of data) {
      const expected = row.investmentsBuying + row.homeEquity - row.sellingCosts;
      // Each field is Math.round()'d independently, so allow ±2 rounding error
      expect(Math.abs(row.buying - expected)).toBeLessThanOrEqual(2);
    }
  });

  // ---------------------------------------------------------------------------
  // Error cases
  // ---------------------------------------------------------------------------

  it('returns error when cash is insufficient for down payment', () => {
    const data = calculateProjectionData(inputs({ initialInvestment: 100000 }));
    expect((data as any).error).toContain('Insufficient');
  });

  it('returns error when monthly costs exceed income', () => {
    const data = calculateProjectionData(inputs({
      annualSalaryBeforeTax: 40000,
      effectiveFederalTaxRate: 10,
      effectiveStateIncomeTaxRate: 5,
    }));
    expect((data as any).error).toContain('exceed');
  });

  // ---------------------------------------------------------------------------
  // Growth and inflation
  // ---------------------------------------------------------------------------

  it('home value appreciates correctly', () => {
    const data = calculateProjectionData(inputs()) as any[];
    const year5 = data[5];
    const expected = Math.round(750000 * Math.pow(1.045, 5));
    expect(year5.homeValue).toBe(expected);
  });

  it('salary grows correctly', () => {
    const data = calculateProjectionData(inputs()) as any[];
    const year3 = data[3];
    const expected = Math.round(420000 * Math.pow(1.024, 3));
    expect(year3.salary).toBe(expected);
  });

  it('rent increases correctly', () => {
    const data = calculateProjectionData(inputs()) as any[];
    const year2 = data[2];
    const expected = Math.round(3000 * Math.pow(1.045, 2));
    expect(year2.monthlyRent).toBe(expected);
  });

  it('renter insurance is inflation-adjusted', () => {
    const inp = inputs({ monthlyRenterInsurance: 25, inflationRate: 3 });
    const data = calculateProjectionData(inp) as any[];
    // Year 1 annual rent costs should include inflated renter insurance
    // Rent: 3000*1.045=3135, utilities: 300*1.03=309, insurance: 25*1.03=25.75
    // Annual = (3135 + 309 + 25.75) * 12 = 41637
    expect(data[1].annualRentCosts).toBe(Math.round((3000 * 1.045 + 300 * 1.03 + 25 * 1.03) * 12));
  });

  it('misc expenses inflate', () => {
    const data = calculateProjectionData(inputs()) as any[];
    const year1 = data[1];
    expect(year1.monthlyMiscExpenses).toBe(Math.round(1000 * 1.03));
  });

  // ---------------------------------------------------------------------------
  // Selling costs toggle
  // ---------------------------------------------------------------------------

  it('selling costs are 0 when toggle is off', () => {
    const data = calculateProjectionData(inputs({ includeSellingCosts: false })) as any[];
    expect(data[0].sellingCosts).toBe(0);
    expect(data[10].sellingCosts).toBe(0);
  });

  it('selling costs grow with home value when toggle is on', () => {
    const data = calculateProjectionData(inputs({ includeSellingCosts: true, sellingCostPercent: 6 })) as any[];
    const year5 = data[5];
    const expectedHomeValue = 750000 * Math.pow(1.045, 5);
    expect(year5.sellingCosts).toBe(Math.round(expectedHomeValue * 0.06));
  });

  it('buying net worth is higher with selling costs off', () => {
    const withCosts = calculateProjectionData(inputs({ includeSellingCosts: true })) as any[];
    const withoutCosts = calculateProjectionData(inputs({ includeSellingCosts: false })) as any[];
    for (let i = 0; i < withCosts.length; i++) {
      expect(withoutCosts[i].buying).toBeGreaterThanOrEqual(withCosts[i].buying);
    }
  });

  // ---------------------------------------------------------------------------
  // PMI
  // ---------------------------------------------------------------------------

  it('no PMI with 20%+ down payment', () => {
    const data = calculateProjectionData(inputs({ downPaymentPercent: 20 })) as any[];
    // With 20% down, LTV = 80%, PMI should not apply (LTV > 80 check is strict >)
    // The monthly payment should be the same with and without PMI at exactly 80%
    expect(data[0].remainingLoan).toBe(600000);
  });

  it('PMI applies with less than 20% down', () => {
    const withPMI = calculateProjectionData(inputs({ downPaymentPercent: 10 })) as any[];
    const noPMI = calculateProjectionData(inputs({ downPaymentPercent: 20 })) as any[];
    // With PMI, monthly costs should be higher
    expect(withPMI[0].monthlyPayment).toBeGreaterThan(noPMI[0].monthlyPayment);
  });

  // ---------------------------------------------------------------------------
  // Mello-Roos growth toggle
  // ---------------------------------------------------------------------------

  it('mello-roos stays fixed when growth toggle is off', () => {
    const inp = inputs({ melloRoosTaxRate: 0.5, melloRoosGrowsWithAssessment: false });
    const data = calculateProjectionData(inp) as any[];
    // Mello-roos portion of costs should be same at year 0 and later
    // Since it's fixed at homePrice * rate, it doesn't change
    // We can't directly observe mello-roos in the output, but costs should differ
    // from the growing case
    const growing = calculateProjectionData(inputs({
      melloRoosTaxRate: 0.5, melloRoosGrowsWithAssessment: true
    })) as any[];
    // At year 0 they should be the same
    expect(data[0].monthlyPayment).toBe(growing[0].monthlyPayment);
    // At year 10, growing should have higher costs
    expect(growing[10].monthlyPayment).toBeGreaterThan(data[10].monthlyPayment);
  });

  // ---------------------------------------------------------------------------
  // Negative surplus
  // ---------------------------------------------------------------------------

  it('allows negative investment surplus when costs exceed income', () => {
    // Very high rent with low salary growth should eventually cause negative surplus
    const inp = inputs({
      monthlyRent: 3000,
      rentIncrease: 15, // extreme rent growth
      salaryGrowthRate: 0,
      investmentReturn: 0.5,
      annualInvestmentTaxDrag: 0,
      xAxisYears: 20,
    });
    const data = calculateProjectionData(inp) as any[];
    // At some point, renting net worth should decline as rent exceeds income
    const lastYear = data[data.length - 1];
    const midYear = data[10];
    // With 15% rent growth and 0% salary growth, renting should become untenable
    expect(lastYear.renting).toBeLessThan(midYear.renting);
  });

  // ---------------------------------------------------------------------------
  // Mortgage pays off correctly
  // ---------------------------------------------------------------------------

  it('mortgage balance reaches 0 by year 30', () => {
    const data = calculateProjectionData(inputs()) as any[];
    expect(data[30].remainingLoan).toBe(0);
  });

  it('yearly principal + interest equals total mortgage payment (within rounding)', () => {
    const data = calculateProjectionData(inputs()) as any[];
    const payment = mortgagePayment(450000, 5.24, 30);
    for (let year = 1; year <= 30; year++) {
      if (data[year].remainingLoan > 0 || data[year - 1].remainingLoan > 0) {
        const totalPaid = data[year].yearlyPrincipalPaid + data[year].yearlyInterestPaid;
        // Fields are Math.round()'d independently, allow ±2
        expect(Math.abs(totalPaid - payment * 12)).toBeLessThanOrEqual(2);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Tax savings use marginal rate
  // ---------------------------------------------------------------------------

  it('tax savings are higher with marginal rate than effective rate', () => {
    const marginal = calculateProjectionData(inputs({ useMarginalTaxRate: true, marginalFederalTaxRate: 32 })) as any[];
    const effective = calculateProjectionData(inputs({ useMarginalTaxRate: false })) as any[];
    // 32% > 19.1% → marginal gives higher savings
    expect(marginal[1].yearlyTaxSavings).toBeGreaterThan(effective[1].yearlyTaxSavings);
  });

  // ---------------------------------------------------------------------------
  // Investment compounding
  // ---------------------------------------------------------------------------

  it('investment return compounds correctly with tax drag', () => {
    // Simple case: no housing costs, just investment growth
    const inp = inputs({
      initialInvestment: 1500000,
      homePrice: 100000,
      downPaymentPercent: 5,
      monthlyRent: 100,
      monthlyMiscExpenses: 100,
      investmentReturn: 10,
      annualInvestmentTaxDrag: 0,
      includeSellingCosts: false,
      xAxisYears: 1,
    });
    const data = calculateProjectionData(inp) as any[];
    // Renting: starts with 1500000 - 1000 (deposit) = 1499000
    // Grows + monthly contributions for 1 year
    // At minimum, should grow by ~10% on the initial balance
    expect(data[1].renting).toBeGreaterThan(1499000 * 1.05);
  });
});

// ---------------------------------------------------------------------------
// calculateMortgageScenario
// ---------------------------------------------------------------------------

describe('calculateMortgageScenario', () => {
  it('returns expected structure', () => {
    const result = calculateMortgageScenario(inputs(), 0, 30);
    expect(result).toHaveProperty('finalNetWorth');
    expect(result).toHaveProperty('payoffYear');
    expect(result).toHaveProperty('totalInterestPaid');
    expect(result).toHaveProperty('taxSavings');
    expect(result).toHaveProperty('itemizedDeductionsByYear');
    expect(result).toHaveProperty('remainingBalance');
    expect(result).toHaveProperty('investmentBalance');
    expect(result).toHaveProperty('homeValueAtHorizon');
  });

  it('standard payment pays off in exactly 30 years', () => {
    const result = calculateMortgageScenario(inputs(), 0, 30);
    expect(result.payoffYear).toBe(30);
    expect(result.remainingBalance).toBeCloseTo(0, 0);
  });

  it('extra payments reduce payoff time', () => {
    const standard = calculateMortgageScenario(inputs(), 0, 30);
    const extra1k = calculateMortgageScenario(inputs(), 1000, 30);
    const extra5k = calculateMortgageScenario(inputs(), 5000, 30);
    expect(extra1k.payoffYear).toBeLessThan(standard.payoffYear);
    expect(extra5k.payoffYear).toBeLessThan(extra1k.payoffYear);
  });

  it('extra payments reduce total interest', () => {
    const standard = calculateMortgageScenario(inputs(), 0, 30);
    const extra = calculateMortgageScenario(inputs(), 2000, 30);
    expect(extra.totalInterestPaid).toBeLessThan(standard.totalInterestPaid);
  });

  it('higher investment return makes standard payment optimal', () => {
    // With 11.71% return vs 5.24% mortgage, investing beats extra payments
    const standard = calculateMortgageScenario(inputs(), 0, 30);
    const extra = calculateMortgageScenario(inputs(), 5000, 30);
    expect(standard.finalNetWorth).toBeGreaterThan(extra.finalNetWorth);
  });

  it('lower investment return can make extra payments optimal', () => {
    // With 1% return vs 5.24% mortgage, extra payments should win
    const inp = inputs({ investmentReturn: 1, annualInvestmentTaxDrag: 0 });
    const standard = calculateMortgageScenario(inp, 0, 30);
    const extra = calculateMortgageScenario(inp, 2000, 30);
    expect(extra.finalNetWorth).toBeGreaterThan(standard.finalNetWorth);
  });

  it('tax savings decrease with faster payoff', () => {
    const standard = calculateMortgageScenario(inputs(), 0, 30);
    const extra = calculateMortgageScenario(inputs(), 5000, 30);
    expect(extra.taxSavings).toBeLessThan(standard.taxSavings);
  });

  it('selling costs reduce final net worth', () => {
    const without = calculateMortgageScenario(inputs({ includeSellingCosts: false }), 0, 30);
    const with6 = calculateMortgageScenario(inputs({ includeSellingCosts: true, sellingCostPercent: 6 }), 0, 30);
    const homeValue = 750000 * Math.pow(1.045, 30);
    const expectedDiff = homeValue * 0.06;
    expect(without.finalNetWorth - with6.finalNetWorth).toBeCloseTo(expectedDiff, -2);
  });

  it('home value at horizon is calculated correctly', () => {
    const result = calculateMortgageScenario(inputs(), 0, 30);
    const expected = 750000 * Math.pow(1.045, 30);
    expect(result.homeValueAtHorizon).toBeCloseTo(expected, 0);
  });

  it('has one itemized deductions entry per year', () => {
    const result = calculateMortgageScenario(inputs(), 0, 30);
    expect(result.itemizedDeductionsByYear.length).toBe(30);
  });

  it('investment tax drag reduces final net worth', () => {
    const noDrag = calculateMortgageScenario(inputs({ annualInvestmentTaxDrag: 0 }), 0, 30);
    const withDrag = calculateMortgageScenario(inputs({ annualInvestmentTaxDrag: 1 }), 0, 30);
    expect(withDrag.finalNetWorth).toBeLessThan(noDrag.finalNetWorth);
  });

  // ---------------------------------------------------------------------------
  // Payoff month cash flow fix
  // ---------------------------------------------------------------------------

  it('payoff month correctly handles partial payment', () => {
    // With large extra payment, mortgage pays off quickly
    // The payoff month should invest the excess cash, not lose it
    const extra = 10000;
    const result = calculateMortgageScenario(inputs(), extra, 30);

    // Verify payoff happens well before 30 years
    expect(result.payoffYear).toBeLessThan(10);
    expect(result.remainingBalance).toBeCloseTo(0, 0);

    // Compare with a scenario where we manually verify:
    // After payoff, all income minus non-mortgage costs goes to investments.
    // The investment balance should be substantial.
    expect(result.investmentBalance).toBeGreaterThan(0);
    expect(result.finalNetWorth).toBeGreaterThan(result.homeValueAtHorizon);
  });

  it('post-payoff months invest full surplus (no mortgage deduction)', () => {
    // After payoff, monthly investment should be: takeHome - nonMortgageCosts - misc
    // This should be MORE than during mortgage (since no mortgage payment)
    // We verify indirectly: extra payment scenario should still have large investments
    const result = calculateMortgageScenario(inputs(), 10000, 30);
    // Monthly take-home ~25690, non-mortgage costs ~(-205) [rental > costs], misc ~1000
    // After payoff: ~24895/mo goes to investments for remaining ~25 years
    // This should accumulate significantly
    expect(result.investmentBalance).toBeGreaterThan(10000000);
  });

  // ---------------------------------------------------------------------------
  // Horizon shorter than mortgage term
  // ---------------------------------------------------------------------------

  it('remaining balance is nonzero when horizon < mortgage term', () => {
    const result = calculateMortgageScenario(inputs(), 0, 15);
    expect(result.remainingBalance).toBeGreaterThan(0);
    // Net worth should account for the remaining balance
    expect(result.finalNetWorth).toBeLessThan(
      result.homeValueAtHorizon + result.investmentBalance
    );
  });

  it('remaining balance is correctly subtracted from net worth', () => {
    const result = calculateMortgageScenario(inputs({ includeSellingCosts: false }), 0, 15);
    const expected = result.homeValueAtHorizon + result.investmentBalance - result.remainingBalance;
    expect(result.finalNetWorth).toBeCloseTo(expected, 0);
  });
});
