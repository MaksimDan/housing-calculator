import { describe, it, expect } from 'vitest';
import {
  toMonthlyRate,
  calculateMonthlyTakeHome,
  calculateMonthlyMortgagePayment,
  calculateYearlyMortgageBreakdown,
  calculateTaxSavings,
  calculateRenterTaxSavings,
  calculateMortgageScenario,
  calculateProjectionData,
  saltCapForYear,
  HousingCalculatorInputs,
} from './financialCalculations';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const baseInputs: HousingCalculatorInputs = {
  annualSalaryBeforeTax: 420000,
  effectiveFederalTaxRate: 19.1,
  standardDeduction: 32200,
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
  saltCap: 40400,
  effectiveStateIncomeTaxRate: 7.5,
  marginalFederalTaxRate: 32,
  useMarginalTaxRate: true,
  melloRoosGrowsWithAssessment: false,
  includeSellingCosts: false,
  sellingCostPercent: 6,
  annualInvestmentTaxDrag: 0.2,
  assumeSaltCapExtension: false,
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
// calculateMonthlyMortgagePayment
// ---------------------------------------------------------------------------

describe('calculateMonthlyMortgagePayment', () => {
  it('matches the standard annuity formula', () => {
    const payment = calculateMonthlyMortgagePayment(400000, 6.5 / 100 / 12, 360);
    expect(payment).toBeCloseTo(2528.27, 1);
  });

  it('falls back to straight-line for a 0% loan instead of NaN', () => {
    const payment = calculateMonthlyMortgagePayment(360000, 0, 360);
    expect(payment).toBe(1000);
  });

  it('returns 0 for a zero loan (100% down payment)', () => {
    expect(calculateMonthlyMortgagePayment(0, 0.05 / 12, 360)).toBe(0);
    expect(calculateMonthlyMortgagePayment(0, 0, 360)).toBe(0);
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

  it('counts PMI months from the pre-payment balance against the threshold', () => {
    // Threshold just below the starting balance: only the months before the
    // balance amortizes past it should count
    const result = calculateYearlyMortgageBreakdown(loan, payment, rate, 0, loan - 2000);
    // Year-1 principal is ~6.2k, so the balance crosses (loan - 2000) during the year
    expect(result.pmiMonths).toBeGreaterThan(0);
    expect(result.pmiMonths).toBeLessThan(12);
  });

  it('counts 12 PMI months when the balance stays above the threshold', () => {
    const result = calculateYearlyMortgageBreakdown(loan, payment, rate, 0, 100000);
    expect(result.pmiMonths).toBe(12);
  });

  it('counts 0 PMI months when the balance starts below the threshold', () => {
    const result = calculateYearlyMortgageBreakdown(loan, payment, rate, 0, loan + 1);
    expect(result.pmiMonths).toBe(0);
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

  it('prorates mortgage interest when the average balance exceeds the cap', () => {
    // Average balance 1000000, cap 750000 → only 75% of interest deductible
    const fullInterest = 50000;
    const result = calculateTaxSavings(fullInterest, 0, 0, 750000, 1000000, 32, 100000, 420000, 7.5);
    // Capped interest = 50000 * (750000/1000000) = 37500
    // SALT = 0 + 31500 = 31500
    // Itemized = 37500 + 31500 = 69000
    expect(result.totalItemizedDeductions).toBeCloseTo(69000, 0);
  });

  it('does not prorate when the average balance is under the cap', () => {
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

  it('computes SALT-only savings when mortgage interest is zero', () => {
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
// calculateRenterTaxSavings
// ---------------------------------------------------------------------------

describe('calculateRenterTaxSavings', () => {
  it('credits the renter when state income tax exceeds the standard deduction', () => {
    // State tax = 420000 * 7.5% = 31500; itemized = min(31500, 40000) = 31500
    // Benefit = 31500 - 30000 = 1500 → savings = 1500 * 32% = 480
    expect(calculateRenterTaxSavings(420000, 7.5, 40000, 30000, 32)).toBeCloseTo(480, 5);
  });

  it('returns 0 when the standard deduction wins', () => {
    expect(calculateRenterTaxSavings(100000, 5, 40000, 30000, 32)).toBe(0);
  });

  it('caps the renter SALT deduction', () => {
    // State tax = 600000 * 9.3% = 55800 → capped at 10000 < 15000 standard → 0
    expect(calculateRenterTaxSavings(600000, 9.3, 10000, 15000, 35)).toBe(0);
    // With a 40k cap: min(55800, 40000) - 15000 = 25000 → * 35% = 8750
    expect(calculateRenterTaxSavings(600000, 9.3, 40000, 15000, 35)).toBeCloseTo(8750, 5);
  });
});

// ---------------------------------------------------------------------------
// saltCapForYear (OBBBA schedule)
// ---------------------------------------------------------------------------

describe('saltCapForYear', () => {
  it('uses the entered cap for the base tax year (2026)', () => {
    expect(saltCapForYear(40400, 0, false)).toBe(40400);
  });

  it('indexes the cap 1%/yr through 2029', () => {
    expect(saltCapForYear(40400, 1, false)).toBeCloseTo(40400 * 1.01, 5);
    expect(saltCapForYear(40400, 3, false)).toBeCloseTo(40400 * Math.pow(1.01, 3), 5);
  });

  it('reverts to $10,000 in 2030 and beyond under current law', () => {
    expect(saltCapForYear(40400, 4, false)).toBe(10000);
    expect(saltCapForYear(40400, 25, false)).toBe(10000);
  });

  it('never raises a user cap already below $10,000 after reversion', () => {
    expect(saltCapForYear(8000, 10, false)).toBe(8000);
  });

  it('holds the cap constant when extension is assumed', () => {
    expect(saltCapForYear(40400, 0, true)).toBe(40400);
    expect(saltCapForYear(40400, 10, true)).toBe(40400);
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

  it('year 0 renting net worth includes the refundable deposit', () => {
    const data = calculateProjectionData(inputs()) as any[];
    // renting NW = (investment - deposit - movingCostRent) + deposit = 1500000
    expect(data[0].renting).toBe(1500000);
    // The deposit itself is not investable
    expect(data[0].investmentsRenting).toBe(1499000);
  });

  it('renting net worth carries the deposit as a non-compounding asset every year', () => {
    const data = calculateProjectionData(inputs({ rentDeposit: 4000 })) as any[];
    for (const row of data) {
      expect(Math.abs(row.renting - row.investmentsRenting - 4000)).toBeLessThanOrEqual(2);
    }
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

  it('year 0 reports no tax savings (no time has elapsed)', () => {
    const data = calculateProjectionData(inputs()) as any[];
    expect(data[0].yearlyTaxSavings).toBe(0);
    expect(data[0].totalItemizedDeductions).toBe(0);
    expect(data[0].renterYearlyTaxSavings).toBe(0);
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

  it('does not error when rental income covers the cost gap (net-cost guard)', () => {
    // Take-home = 50000 * 0.85 / 12 ≈ 3542. Gross housing+misc ≈ 4779 would fail
    // a gross-cost guard, but net of $4,000/mo rental income it is ~779.
    const data = calculateProjectionData(inputs({
      annualSalaryBeforeTax: 50000,
      effectiveFederalTaxRate: 10,
      effectiveStateIncomeTaxRate: 5,
      monthlyRentalIncome: 4000,
    }));
    expect(Array.isArray(data)).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Growth and inflation: flows during year N use start-of-year levels
  // (year 1 uses the entered values), stocks are reported at end of year
  // ---------------------------------------------------------------------------

  it('home value appreciates correctly (end-of-year stock)', () => {
    const data = calculateProjectionData(inputs()) as any[];
    const year5 = data[5];
    const expected = Math.round(750000 * Math.pow(1.045, 5));
    expect(year5.homeValue).toBe(expected);
  });

  it('year 1 charges the entered rent and salary (no pre-applied growth)', () => {
    const data = calculateProjectionData(inputs()) as any[];
    expect(data[1].monthlyRent).toBe(3000);
    expect(data[1].salary).toBe(420000);
    expect(data[1].monthlyMiscExpenses).toBe(1000);
  });

  it('salary used during year N has N-1 years of growth', () => {
    const data = calculateProjectionData(inputs()) as any[];
    const year3 = data[3];
    const expected = Math.round(420000 * Math.pow(1.024, 2));
    expect(year3.salary).toBe(expected);
  });

  it('rent paid during year N has N-1 years of increases', () => {
    const data = calculateProjectionData(inputs()) as any[];
    const year2 = data[2];
    const expected = Math.round(3000 * 1.045);
    expect(year2.monthlyRent).toBe(expected);
  });

  it('renter insurance and utilities inflate from year 2 onward', () => {
    const inp = inputs({ monthlyRenterInsurance: 25, inflationRate: 3 });
    const data = calculateProjectionData(inp) as any[];
    // Year 1: entered values. Annual = (3000 + 300 + 25) * 12 = 39900
    expect(data[1].annualRentCosts).toBe((3000 + 300 + 25) * 12);
    // Year 2: rent +4.5%, insurance/utilities +3%
    expect(data[2].annualRentCosts).toBe(Math.round((3000 * 1.045 + 300 * 1.03 + 25 * 1.03) * 12));
  });

  it('misc expenses inflate from year 2 onward', () => {
    const data = calculateProjectionData(inputs()) as any[];
    expect(data[1].monthlyMiscExpenses).toBe(1000);
    expect(data[2].monthlyMiscExpenses).toBe(Math.round(1000 * 1.03));
  });

  it('year 1 property tax is levied on the purchase price (no pre-applied assessment growth)', () => {
    const data = calculateProjectionData(inputs()) as any[];
    expect(data[1].monthlyPropertyTax).toBeCloseTo(750000 * 0.0114 / 12, -1);
    // Year 2 assessed value grows by min(inflation, cap) = 2%
    expect(data[2].monthlyPropertyTax).toBeCloseTo(750000 * 1.02 * 0.0114 / 12, -1);
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
    expect(data[0].remainingLoan).toBe(600000);
    expect(data[0].monthlyPMI).toBe(0);
    expect(data[1].monthlyPMI).toBe(0);
  });

  it('PMI applies with less than 20% down and drops when LTV reaches 80%', () => {
    const data = calculateProjectionData(inputs({ downPaymentPercent: 10 })) as any[];
    expect(data[1].monthlyPMI).toBeGreaterThan(0);
    // 0.8% on a 675k loan = $450/mo while owed
    expect(data[1].monthlyPMI).toBe(450);
    // By year 30 the loan is long past 80% LTV
    expect(data[30].monthlyPMI).toBe(0);
    // The crossing year charges a partial-year average, not a binary 0/450
    const crossingYear = data.find(row => row.monthlyPMI > 0 && row.monthlyPMI < 450);
    expect(crossingYear).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Mello-Roos growth toggle
  // ---------------------------------------------------------------------------

  it('mello-roos stays fixed when growth toggle is off', () => {
    const inp = inputs({ melloRoosTaxRate: 0.5, melloRoosGrowsWithAssessment: false });
    const data = calculateProjectionData(inp) as any[];
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

  it('charges only the actual mortgage spend in a partial payoff year', () => {
    // 15.5-year term: the loan pays off halfway through year 16
    const inp = inputs({ mortgageYears: 15.5, xAxisYears: 20 });
    const data = calculateProjectionData(inp) as any[];
    const payment = mortgagePayment(450000, 5.24, 15.5);
    expect(data[16].remainingLoan).toBe(0);
    const actualSpend = data[16].yearlyPrincipalPaid + data[16].yearlyInterestPaid;
    // Roughly 6 payments, not 12
    expect(actualSpend).toBeLessThan(payment * 12 * 0.6);
    // The cost model (monthlyPayment is net homeowner cost) must reflect the
    // partial spend: it should be far below the prior (full-payment) year
    expect(data[16].monthlyPayment).toBeLessThan(data[15].monthlyPayment - payment * 0.3);
  });

  // ---------------------------------------------------------------------------
  // Tax savings
  // ---------------------------------------------------------------------------

  it('tax savings are higher with marginal rate than effective rate', () => {
    const marginal = calculateProjectionData(inputs({ useMarginalTaxRate: true, marginalFederalTaxRate: 32 })) as any[];
    const effective = calculateProjectionData(inputs({ useMarginalTaxRate: false })) as any[];
    // 32% > 19.1% → marginal gives higher savings
    expect(marginal[1].yearlyTaxSavings).toBeGreaterThan(effective[1].yearlyTaxSavings);
  });

  it('credits the renter with itemization savings when state tax exceeds the standard deduction', () => {
    // Force a clearly itemizing renter: high state tax, low standard deduction
    const inp = inputs({ effectiveStateIncomeTaxRate: 9.3, standardDeduction: 16100 });
    const data = calculateProjectionData(inp) as any[];
    // Renter itemized = min(420000 * 9.3% = 39060, 40400) = 39060
    // Benefit = 39060 - 16100 = 22960 → * 32% = 7347
    expect(data[1].renterYearlyTaxSavings).toBe(Math.round((39060 - 16100) * 0.32));
    // The renting BALANCE must actually receive the credit. Control: a standard
    // deduction high enough to zero the renter credit, with identical renter
    // cash flows (the standard deduction only enters via the tax credits).
    const control = calculateProjectionData(inputs({
      effectiveStateIncomeTaxRate: 9.3, standardDeduction: 45000,
    })) as any[];
    const delta = data[1].investmentsRenting - control[1].investmentsRenting;
    expect(delta).toBeGreaterThanOrEqual(7345);
    expect(delta).toBeLessThanOrEqual(7349);
  });

  it('prorates the interest deduction by average balance when the loan exceeds the cap', () => {
    // $1.5M home, 20% down → $1.2M loan, above the $750k cap
    const inp = inputs({ homePrice: 1500000, downPaymentPercent: 20, initialInvestment: 3000000 });
    const data = calculateProjectionData(inp) as any[];
    const payment = mortgagePayment(1200000, 5.24, 30);
    const breakdown = calculateYearlyMortgageBreakdown(1200000, payment, 5.24 / 100 / 12);
    const avgBalance = (1200000 + breakdown.endingBalance) / 2;
    const cappedInterest = breakdown.yearlyInterestPaid * (750000 / avgBalance);
    // SALT year 1: property tax 1.5M*1.14% = 17100 + state 31500 = 48600 → capped 40400
    const expectedItemized = cappedInterest + 40400;
    expect(data[1].totalItemizedDeductions).toBeCloseTo(expectedItemized, -1);
  });

  it('SALT cap reverts in 2030 under current law, reducing later-year savings', () => {
    const currentLaw = calculateProjectionData(inputs({ assumeSaltCapExtension: false })) as any[];
    const extended = calculateProjectionData(inputs({ assumeSaltCapExtension: true })) as any[];
    // Year 1 (base tax year 2026): identical cap
    expect(currentLaw[1].yearlyTaxSavings).toBe(extended[1].yearlyTaxSavings);
    // Years 2-4 (2027-2029): current law indexes the cap +1%/yr, so savings
    // are at least as large as under a constant cap
    for (let y = 2; y <= 4; y++) {
      expect(currentLaw[y].yearlyTaxSavings).toBeGreaterThanOrEqual(extended[y].yearlyTaxSavings);
    }
    // Year 5+ (2030+): the $10k cap must produce less savings
    expect(currentLaw[5].yearlyTaxSavings).toBeLessThan(extended[5].yearlyTaxSavings);
    expect(currentLaw[30].buying).toBeLessThan(extended[30].buying);
  });

  // ---------------------------------------------------------------------------
  // Investment compounding
  // ---------------------------------------------------------------------------

  it('investment return compounds correctly with tax drag (closed form)', () => {
    const inp = inputs({ investmentReturn: 10, annualInvestmentTaxDrag: 1 });
    const data = calculateProjectionData(inp) as any[];
    // Renter year 1: balance = P(1+m)^12 + c((1+m)^12 - 1)/m + renter tax credit,
    // with m the monthly equivalent of the net 9% annual return and c the
    // monthly contribution (end-of-month). Renter credit is 0 at these inputs.
    const m = toMonthlyRate(9);
    const P = 1499000; // 1500000 - 1000 deposit
    const takeHome = calculateMonthlyTakeHome(420000, 19.1, 7.5);
    const c = takeHome - (3000 + 25 + 300) - 1000;
    const expected = P * Math.pow(1 + m, 12) + c * (Math.pow(1 + m, 12) - 1) / m;
    expect(data[1].investmentsRenting).toBeCloseTo(expected, -1);
  });

  it('handles a 0% mortgage rate without NaN', () => {
    const data = calculateProjectionData(inputs({ effectiveMortgageRate: 0 })) as any[];
    expect(Array.isArray(data)).toBe(true);
    for (const row of data) {
      expect(Number.isFinite(row.buying)).toBe(true);
      expect(Number.isFinite(row.renting)).toBe(true);
    }
    // Straight-line: 450000 / 360 = 1250/mo principal
    expect(data[1].yearlyPrincipalPaid).toBe(15000);
    expect(data[1].yearlyInterestPaid).toBe(0);
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
  // Payoff month cash flow
  // ---------------------------------------------------------------------------

  it('payoff month correctly handles partial payment', () => {
    // With large extra payment, mortgage pays off quickly
    // The payoff month should invest the excess cash, not lose it
    const extra = 10000;
    const result = calculateMortgageScenario(inputs(), extra, 30);

    // Verify payoff happens well before 30 years
    expect(result.payoffYear).toBeLessThan(10);
    expect(result.remainingBalance).toBeCloseTo(0, 0);

    expect(result.investmentBalance).toBeGreaterThan(0);
    expect(result.finalNetWorth).toBeGreaterThan(result.homeValueAtHorizon);
  });

  it('post-payoff months invest full surplus (no mortgage deduction)', () => {
    const result = calculateMortgageScenario(inputs(), 10000, 30);
    expect(result.investmentBalance).toBeGreaterThan(10000000);
  });

  it('conserves cash at 0% return: balance gap equals interest saved net of tax-savings gap', () => {
    // With 0% investment return the balance is a pure sum of cash flows, so
    // (extra - standard) balance = interest saved - tax savings forgone.
    // This fails if post-payoff months stop investing the freed-up payment.
    const inp = inputs({ investmentReturn: 0, annualInvestmentTaxDrag: 0 });
    const standard = calculateMortgageScenario(inp, 0, 30);
    const extra = calculateMortgageScenario(inp, 2000, 30);
    const balanceGap = extra.investmentBalance - standard.investmentBalance;
    const interestSaved = standard.totalInterestPaid - extra.totalInterestPaid;
    const taxSavingsForgone = standard.taxSavings - extra.taxSavings;
    expect(balanceGap).toBeCloseTo(interestSaved - taxSavingsForgone, 4);
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

  it('reports the true payoff date even when it falls beyond the horizon', () => {
    // Standard payment with a 15-year horizon: payoff is still year 30
    const standard = calculateMortgageScenario(inputs(), 0, 15);
    expect(standard.payoffYear).toBe(30);
    // +$1,000/mo pays off in ~15.9 years — must NOT be reported as 30
    const extra1k = calculateMortgageScenario(inputs(), 1000, 15);
    expect(extra1k.payoffYear).toBeCloseTo(15.9, 1);
    // +$500/mo pays off well beyond the horizon (~20.6 years analytically)
    const extra500 = calculateMortgageScenario(inputs(), 500, 15);
    expect(extra500.payoffYear).toBeCloseTo(20.6, 1);
    // And must match what the same strategy reports with a long horizon
    const extra1kLong = calculateMortgageScenario(inputs(), 1000, 30);
    expect(extra1k.payoffYear).toBeCloseTo(extra1kLong.payoffYear, 1);
  });

  it('reports payoff year 0 for a cash purchase (100% down)', () => {
    const result = calculateMortgageScenario(inputs({ downPaymentPercent: 100 }), 0, 30);
    expect(result.payoffYear).toBe(0);
    expect(Number.isFinite(result.finalNetWorth)).toBe(true);
  });

  it('handles a 0% mortgage rate without NaN', () => {
    const result = calculateMortgageScenario(inputs({ effectiveMortgageRate: 0 }), 0, 30);
    expect(Number.isFinite(result.finalNetWorth)).toBe(true);
    expect(result.totalInterestPaid).toBe(0);
    expect(result.remainingBalance).toBeCloseTo(0, 0);
  });
});

// ---------------------------------------------------------------------------
// Cross-engine consistency: the main projection and the payoff optimizer must
// agree on identical inputs (no extra payments)
// ---------------------------------------------------------------------------

describe('engine consistency', () => {
  // Horizon 3 matters: tax savings are nonzero in the final simulated year
  // there, so a scenario engine that drops the last year's credit fails
  const horizons = [3, 10, 20, 30];

  it.each(horizons)('projection buying net worth matches scenario finalNetWorth at year %i (defaults)', (years) => {
    const inp = inputs();
    const data = calculateProjectionData(inp) as any[];
    const scenario = calculateMortgageScenario(inp, 0, years);
    // Projection rounds each field; allow a few dollars
    expect(Math.abs(data[years].buying - scenario.finalNetWorth)).toBeLessThanOrEqual(5);
  });

  it('engines agree with selling costs enabled', () => {
    const inp = inputs({ includeSellingCosts: true, sellingCostPercent: 6 });
    const data = calculateProjectionData(inp) as any[];
    const scenario = calculateMortgageScenario(inp, 0, 30);
    expect(Math.abs(data[30].buying - scenario.finalNetWorth)).toBeLessThanOrEqual(5);
  });

  it('engines agree under current-law SALT reversion and with extension assumed', () => {
    for (const assumeExt of [false, true]) {
      const inp = inputs({ assumeSaltCapExtension: assumeExt });
      const data = calculateProjectionData(inp) as any[];
      const scenario = calculateMortgageScenario(inp, 0, 30);
      expect(Math.abs(data[30].buying - scenario.finalNetWorth)).toBeLessThanOrEqual(5);
    }
  });

  it('engines agree exactly with PMI in play (10% down)', () => {
    const inp = inputs({ downPaymentPercent: 10 });
    const data = calculateProjectionData(inp) as any[];
    const scenario = calculateMortgageScenario(inp, 0, 30);
    // PMI is charged in its exact months in both engines — a single-month
    // PMI mismatch compounds to ~$5.5k by year 30 and must fail
    expect(Math.abs(data[30].buying - scenario.finalNetWorth)).toBeLessThanOrEqual(5);
  });

  it('engines agree exactly on a mid-year payoff (15.5-year term)', () => {
    const inp = inputs({ mortgageYears: 15.5, xAxisYears: 20 });
    const data = calculateProjectionData(inp) as any[];
    const scenario = calculateMortgageScenario(inp, 0, 20);
    // Payoff-year payments are charged in their exact months in both engines
    expect(Math.abs(data[20].buying - scenario.finalNetWorth)).toBeLessThanOrEqual(5);
  });

  it('engines agree when the mortgage-interest deduction cap binds ($1.2M loan)', () => {
    const inp = inputs({ homePrice: 1500000, downPaymentPercent: 20, initialInvestment: 3000000 });
    const data = calculateProjectionData(inp) as any[];
    const scenario = calculateMortgageScenario(inp, 0, 30);
    expect(Math.abs(data[30].buying - scenario.finalNetWorth)).toBeLessThanOrEqual(5);
  });

  it('engines agree with growth rates zeroed (timing isolation)', () => {
    const inp = inputs({
      salaryGrowthRate: 0, rentIncrease: 0, homeAppreciation: 0, inflationRate: 0,
    });
    const data = calculateProjectionData(inp) as any[];
    const scenario = calculateMortgageScenario(inp, 0, 30);
    expect(Math.abs(data[30].buying - scenario.finalNetWorth)).toBeLessThanOrEqual(5);
  });
});
