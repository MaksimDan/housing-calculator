export interface HousingCalculatorInputs {
    annualSalaryBeforeTax: number;
    effectiveFederalTaxRate: number;
    standardDeduction: number;
    initialInvestment: number;
    monthlyMiscExpenses: number;
    homePrice: number;
    downPaymentPercent: number;
    effectiveMortgageRate: number;
    mortgageYears: number;
    PMIRate: number;
    propertyTaxRate: number;
    melloRoosTaxRate: number;
    closingCostPercent: number;
    annualMaintenanceRate: number;
    monthlyHOAFee: number;
    monthlyHomeInsurance: number;
    monthlyRent: number;
    monthlyRentalIncome: number;
    rentDeposit: number;
    movingCostBuying: number;
    movingCostRenting: number;
    monthlyRenterInsurance: number;
    monthlyRentUtilities: number;
    monthlyPropertyUtilities: number;
    homeAppreciation: number;
    investmentReturn: number;
    rentIncrease: number;
    salaryGrowthRate: number;
    inflationRate: number;
    propertyTaxAssessmentCap: number;
    xAxisYears: number;
    mortgageInterestDeductionCap: number;
    saltCap: number;
    effectiveStateIncomeTaxRate: number;
    marginalFederalTaxRate: number;
    useMarginalTaxRate: boolean;
    melloRoosGrowsWithAssessment: boolean;
    includeSellingCosts: boolean;
    sellingCostPercent: number;
    annualInvestmentTaxDrag: number;
    assumeSaltCapExtension: boolean;
    // Employee payroll taxes (Social Security + Medicare) are computed separately
    // from the effective federal income-tax rate. Off = the user's rates already
    // include them.
    includePayrollTax: boolean;
    // Salary is split evenly across earners; each earner has their own Social
    // Security wage base.
    payrollEarners: number;
    // Calendar tax year that projection year 1 falls in. Statutory amounts
    // (SALT schedule, standard deduction, wage base) are anchored to TAX_BASE_YEAR
    // and follow the calendar from here.
    firstTaxYear: number;
    filingStatus: FilingStatus;
}

export type FilingStatus = 'mfj' | 'single' | 'hoh' | 'mfs';

// Timing convention used by BOTH engines: each simulated year charges that year's
// cash flows at start-of-year levels (year 1 uses the user's entered values), and
// growth/inflation applies at each year boundary. Stocks (home value, balances)
// are reported at end of year.

// Statutory inputs (standard deduction, SALT cap) are entered as tax-year-2026
// amounts. Projection year N is tax year firstTaxYear + N - 1.
export const TAX_BASE_YEAR = 2026;
export const SALT_CAP_BASE_TAX_YEAR = TAX_BASE_YEAR;

export const taxYearForProjectionYear = (inputs: HousingCalculatorInputs, projectionYear: number) =>
    inputs.firstTaxYear + projectionYear - 1;

// Years of inflation indexing from TAX_BASE_YEAR to the tax year of a
// projection year (0-based index: 0 = projection year 1)
export const yearsSinceTaxBase = (inputs: HousingCalculatorInputs, yearIndex: number) =>
    inputs.firstTaxYear - TAX_BASE_YEAR + yearIndex;

// Standard deduction for a 0-based projection year index. The input is the
// TY2026 amount, indexed with the inflation rate.
export const standardDeductionForYear = (inputs: HousingCalculatorInputs, yearIndex: number) =>
    inputs.standardDeduction * Math.pow(1 + inputs.inflationRate / 100, yearsSinceTaxBase(inputs, yearIndex));

export const calculateMonthlyTakeHome = (
    annualSalary: number,
    effectiveFederalTaxRate: number,
    effectiveStateIncomeTaxRate: number,
    annualPayrollTax: number = 0
) => {
    const federalTaxAmount = annualSalary * (effectiveFederalTaxRate / 100);
    const stateTaxAmount = annualSalary * (effectiveStateIncomeTaxRate / 100);
    const totalTaxAmount = federalTaxAmount + stateTaxAmount + annualPayrollTax;
    const afterTaxAnnual = annualSalary - totalTaxAmount;
    return afterTaxAnnual / 12;
};

// Employee payroll taxes, tax year 2026.
export const SOCIAL_SECURITY_RATE = 6.2;
export const SOCIAL_SECURITY_WAGE_BASE_2026 = 184500; // SSA, indexed annually
export const MEDICARE_RATE = 1.45;
export const ADDITIONAL_MEDICARE_RATE = 0.9;
// Statutory and NOT indexed for inflation (IRC 3101(b)(2))
export const ADDITIONAL_MEDICARE_THRESHOLDS: Record<FilingStatus, number> = {
    mfj: 250000, single: 200000, hoh: 200000, mfs: 125000,
};
export const ADDITIONAL_MEDICARE_THRESHOLD = ADDITIONAL_MEDICARE_THRESHOLDS.mfj;

// yearsFromBase = years since tax year 2026. The Social Security wage base
// follows the national wage index; the model approximates it with the
// inflation rate.
export const calculateAnnualPayrollTax = (
    annualSalary: number,
    yearsFromBase: number,
    earners: number,
    inflationRate: number,
    filingStatus: FilingStatus = 'mfj'
) => {
    if (annualSalary <= 0) return 0;
    const earnerCount = Math.max(1, Math.round(earners));
    const wageBase = SOCIAL_SECURITY_WAGE_BASE_2026 * Math.pow(1 + inflationRate / 100, yearsFromBase);
    const wagesPerEarner = annualSalary / earnerCount;
    const socialSecurity = earnerCount * Math.min(wagesPerEarner, wageBase) * (SOCIAL_SECURITY_RATE / 100);
    const medicare = annualSalary * (MEDICARE_RATE / 100);
    const threshold = ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus] ?? ADDITIONAL_MEDICARE_THRESHOLD;
    const additionalMedicare = Math.max(0, annualSalary - threshold) * (ADDITIONAL_MEDICARE_RATE / 100);
    return socialSecurity + medicare + additionalMedicare;
};

// Single entry point both engines use, so payroll handling can't diverge.
// yearIndex is 0-based (0 = projection year 1).
export const takeHomeForYear = (inputs: HousingCalculatorInputs, annualSalary: number, yearIndex: number) => {
    const payrollTax = inputs.includePayrollTax
        ? calculateAnnualPayrollTax(annualSalary, yearsSinceTaxBase(inputs, yearIndex), inputs.payrollEarners,
            inputs.inflationRate, inputs.filingStatus)
        : 0;
    return calculateMonthlyTakeHome(annualSalary, inputs.effectiveFederalTaxRate, inputs.effectiveStateIncomeTaxRate, payrollTax);
};

// SALT cap under OBBBA (IRC 164(b)(7)), with baseCap = the TY2026 cap entered by
// the user ($40,400; $20,200 married filing separately):
// - 2025-2029: baseCap x 1.01^(year - 2026), reduced by 30% of MAGI above a
//   threshold ($505,000 in 2026, also +1%/yr; halved for MFS), but never below
//   $10,000 ($5,000 MFS) through the phase-down
// - 2030 on: flat, non-indexed $10,000 ($5,000 MFS)
// assumeExtension keeps the 2029 rules (cap, threshold, phase-down) in force
// after 2029 instead of reverting. Salary stands in for MAGI.
const SALT_CAP_LAST_ELEVATED_TAX_YEAR = 2029;
const SALT_PHASEDOWN_THRESHOLD_2026 = 505000;
const SALT_PHASEDOWN_RATE = 0.30;
const SALT_FLOOR = 10000;

export const saltCapForYear = (
    baseCap: number,
    taxYear: number,
    assumeExtension: boolean,
    magi: number = 0,
    filingStatus: FilingStatus = 'mfj'
) => {
    const statusFactor = filingStatus === 'mfs' ? 0.5 : 1;
    const floor = SALT_FLOOR * statusFactor;
    if (taxYear > SALT_CAP_LAST_ELEVATED_TAX_YEAR && !assumeExtension) {
        return Math.min(baseCap, floor);
    }
    const scheduleYear = Math.min(taxYear, SALT_CAP_LAST_ELEVATED_TAX_YEAR);
    const indexYears = scheduleYear - SALT_CAP_BASE_TAX_YEAR;
    const scheduledCap = baseCap * Math.pow(1.01, indexYears);
    const threshold = SALT_PHASEDOWN_THRESHOLD_2026 * statusFactor * Math.pow(1.01, indexYears);
    const reduction = SALT_PHASEDOWN_RATE * Math.max(0, magi - threshold);
    return Math.max(Math.min(scheduledCap, floor), scheduledCap - reduction);
};

// Standard fixed-payment annuity; falls back to straight-line for a 0% loan
// where the closed form is 0/0.
export const calculateMonthlyMortgagePayment = (loanAmount: number, monthlyRate: number, totalPayments: number) => {
    if (loanAmount <= 0) return 0;
    if (monthlyRate === 0) return loanAmount / totalPayments;
    return (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1);
};

export const calculateYearlyMortgageBreakdown = (
    loanBalance: number,
    monthlyPayment: number,
    monthlyRate: number,
    extraPrincipalPayment: number = 0,
    // PMI is owed in any month whose pre-payment balance exceeds this (80% of
    // original home value). Infinity = caller doesn't need PMI tracking.
    pmiThresholdBalance: number = Infinity
) => {
    let yearlyInterestPaid = 0;
    let yearlyPrincipalPaid = 0;
    let pmiMonths = 0;
    let currentBalance = loanBalance;
    // Actual lender cash per month (partial in the payoff month, 0 after) so
    // callers can time cash flows exactly, not as a yearly average
    const monthlySpends: number[] = [];

    for (let month = 0; month < 12; month++) {
        if (currentBalance <= 0) {
            monthlySpends.push(0);
            continue;
        }

        if (currentBalance > pmiThresholdBalance) pmiMonths++;

        const monthlyInterestPaid = currentBalance * monthlyRate;
        const regularPrincipalPayment = monthlyPayment - monthlyInterestPaid;
        const totalPrincipalPayment = Math.min(regularPrincipalPayment + extraPrincipalPayment, currentBalance);

        yearlyInterestPaid += monthlyInterestPaid;
        yearlyPrincipalPaid += totalPrincipalPayment;
        monthlySpends.push(monthlyInterestPaid + totalPrincipalPayment);
        currentBalance -= totalPrincipalPayment;
        // Snap float residue so downstream LTV/deduction logic never sees a phantom balance
        if (currentBalance < 0.005) currentBalance = 0;
    }

    return {
        yearlyInterestPaid,
        yearlyPrincipalPaid,
        endingBalance: Math.max(0, currentBalance),
        pmiMonths,
        monthlySpends,
    };
};

// Mello-Roos is NOT included in SALT per IRS rules (IRC 164) — it is a special
// assessment, not an ad valorem property tax.
// The buyer's own benefit is itemized minus the standard deduction; the renter's
// parallel benefit (state income tax alone can exceed the standard deduction) is
// credited separately to the renting scenario in calculateProjectionData.
export const calculateTaxSavings = (
    mortgageInterest: number,
    propertyTaxes: number,
    currentStandardDeduction: number,
    mortgageInterestDeductionCap: number,
    // IRS Pub 936 prorates the interest deduction by average (not beginning)
    // mortgage balance; callers pass (beginning + ending) / 2.
    averageMortgageBalance: number,
    taxRateForDeductions: number,
    saltCap: number,
    annualSalary: number,
    effectiveStateIncomeTaxRate: number
) => {
    const stateIncomeTax = annualSalary * (effectiveStateIncomeTaxRate / 100);
    const effectiveDeductibleBalance = Math.min(averageMortgageBalance, mortgageInterestDeductionCap);
    const cappedMortgageInterest = averageMortgageBalance > 0
        ? mortgageInterest * (effectiveDeductibleBalance / averageMortgageBalance)
        : 0;
    // SALT = property taxes + state income tax (no Mello-Roos)
    const totalSaltTaxes = propertyTaxes + stateIncomeTax;
    const cappedSaltDeduction = Math.min(totalSaltTaxes, saltCap);
    const totalItemizedDeductions = cappedMortgageInterest + cappedSaltDeduction;
    const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
    const yearlyTaxSavings = extraDeductionBenefit * (taxRateForDeductions / 100);
    return { yearlyTaxSavings, totalItemizedDeductions };
};

// A renter in a high-tax state can itemize too (SALT from state income tax alone).
export const calculateRenterTaxSavings = (
    annualSalary: number,
    effectiveStateIncomeTaxRate: number,
    saltCap: number,
    currentStandardDeduction: number,
    taxRateForDeductions: number
) => {
    const stateIncomeTax = annualSalary * (effectiveStateIncomeTaxRate / 100);
    const renterItemized = Math.min(stateIncomeTax, saltCap);
    return Math.max(0, renterItemized - currentStandardDeduction) * (taxRateForDeductions / 100);
};

// Convert stated annual rate to monthly rate that compounds to the correct annual rate.
// This treats the user's input as an effective annual rate (e.g. 8.5% means the portfolio
// grows by exactly 8.5% over 12 months of compounding).
export const toMonthlyRate = (annualPercent: number) =>
    Math.pow(1 + annualPercent / 100, 1 / 12) - 1;

export const calculateMortgageScenario = (
    inputs: HousingCalculatorInputs,
    extraMonthlyPayment: number = 0,
    horizonYears: number = 30
) => {
    const { homePrice, downPaymentPercent, effectiveMortgageRate, mortgageYears, investmentReturn,
            propertyTaxRate, melloRoosTaxRate, annualSalaryBeforeTax, effectiveStateIncomeTaxRate,
            mortgageInterestDeductionCap, saltCap, standardDeduction, effectiveFederalTaxRate,
            homeAppreciation, inflationRate, propertyTaxAssessmentCap, salaryGrowthRate,
            initialInvestment, closingCostPercent, movingCostBuying, monthlyMiscExpenses,
            PMIRate, annualMaintenanceRate, monthlyHOAFee, monthlyHomeInsurance,
            monthlyPropertyUtilities, monthlyRentalIncome,
            marginalFederalTaxRate, useMarginalTaxRate, melloRoosGrowsWithAssessment,
            includeSellingCosts, sellingCostPercent, annualInvestmentTaxDrag,
            assumeSaltCapExtension } = inputs;

    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);
    const loanAmount = homePrice - downPaymentAmount;
    const monthlyRate = effectiveMortgageRate / 100 / 12;
    const totalPayments = mortgageYears * 12;
    const monthlyInvestmentReturn = toMonthlyRate(investmentReturn - annualInvestmentTaxDrag);
    const horizonMonths = horizonYears * 12;
    const taxRateForDeductions = useMarginalTaxRate ? marginalFederalTaxRate : effectiveFederalTaxRate;

    const regularPayment = calculateMonthlyMortgagePayment(loanAmount, monthlyRate, totalPayments);
    const originalLoanAmount = loanAmount;
    const pmiThresholdBalance = homePrice * 0.8;

    let balance = loanAmount;
    let investmentBalance = initialInvestment - downPaymentAmount - closingCostsAmount - movingCostBuying;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let payoffMonth = -1;

    let annualInterestForTax = 0;
    let totalTaxSavings = 0;
    const itemizedDeductionsByYear: number[] = [];

    let currentAssessedValue = homePrice;
    let currentStandardDeduction = standardDeductionForYear(inputs, 0);
    let currentAnnualSalary = annualSalaryBeforeTax;
    let currentMonthlyMiscExpenses = monthlyMiscExpenses;
    let currentMonthlyHOAFee = monthlyHOAFee;
    let currentMonthlyHomeInsurance = monthlyHomeInsurance;
    let currentMonthlyPropertyUtilities = monthlyPropertyUtilities;
    let currentMonthlyRentalIncome = monthlyRentalIncome;

    let beginningYearBalance = loanAmount;

    for (let month = 1; month <= horizonMonths; month++) {
        if ((month - 1) % 12 === 0 && month > 1) {
            const yearsPassed = Math.floor((month - 1) / 12);
            currentAnnualSalary = annualSalaryBeforeTax * Math.pow(1 + salaryGrowthRate / 100, yearsPassed);
            currentStandardDeduction = standardDeductionForYear(inputs, yearsPassed);
            const assessmentIncrease = Math.min(inflationRate, propertyTaxAssessmentCap) / 100;
            currentAssessedValue = homePrice * Math.pow(1 + assessmentIncrease, yearsPassed);

            const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsPassed);
            currentMonthlyMiscExpenses = monthlyMiscExpenses * inflationMultiplier;
            currentMonthlyHOAFee = monthlyHOAFee * inflationMultiplier;
            currentMonthlyHomeInsurance = monthlyHomeInsurance * inflationMultiplier;
            currentMonthlyPropertyUtilities = monthlyPropertyUtilities * inflationMultiplier;

            currentMonthlyRentalIncome = monthlyRentalIncome * Math.pow(1 + inputs.rentIncrease / 100, yearsPassed);

            beginningYearBalance = balance;
        }

        investmentBalance *= (1 + monthlyInvestmentReturn);

        // PMI is owed for any month entered with LTV above 80% of original value
        const balanceBeforePayment = balance;

        // Track actual cash spent on mortgage (0 after payoff, partial in payoff month)
        let monthlyMortgageSpend = 0;
        if (balance > 0) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(regularPayment + extraMonthlyPayment - interestPayment, balance);
            monthlyMortgageSpend = interestPayment + principalPayment;

            totalInterestPaid += interestPayment;
            annualInterestForTax += interestPayment;
            totalPrincipalPaid += principalPayment;
            balance -= principalPayment;
            if (balance < 0.005) balance = 0;

            if (balance <= 0 && payoffMonth === -1) {
                payoffMonth = month;
            }
        }

        const currentHomeValue = homePrice * Math.pow(1 + homeAppreciation / 100, Math.floor((month - 1) / 12));
        const monthlyPropertyTax = (currentAssessedValue * (propertyTaxRate / 100)) / 12;
        const melloRoosBase = melloRoosGrowsWithAssessment ? currentAssessedValue : homePrice;
        const monthlyMelloRoosTax = (melloRoosBase * (melloRoosTaxRate / 100)) / 12;
        const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate / 100) / 12;

        const monthlyPMI = balanceBeforePayment > pmiThresholdBalance
            ? (originalLoanAmount * PMIRate) / 100 / 12
            : 0;

        // Use actual mortgage spend — correctly handles payoff month and post-payoff
        const totalMonthlyHomeownerCosts =
            monthlyMortgageSpend +
            monthlyPropertyTax +
            monthlyMelloRoosTax +
            currentMonthlyHomeInsurance +
            monthlyMaintenance +
            monthlyPMI +
            currentMonthlyPropertyUtilities +
            currentMonthlyHOAFee;

        const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts - currentMonthlyRentalIncome;
        const monthlyTakeHome = takeHomeForYear(inputs, currentAnnualSalary, Math.floor((month - 1) / 12));
        const monthlyInvestment = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;

        investmentBalance += monthlyInvestment;

        if (month % 12 === 0) {
            const yearIndex = month / 12; // 1-based simulated year
            const annualPropertyTax = currentAssessedValue * (propertyTaxRate / 100);
            const stateIncomeTax = currentAnnualSalary * (effectiveStateIncomeTaxRate / 100);

            // Pub 936: prorate by average balance for the year
            const averageBalance = (beginningYearBalance + balance) / 2;
            const effectiveDeductibleBalance = Math.min(averageBalance, mortgageInterestDeductionCap);
            const cappedMortgageInterest = averageBalance > 0
                ? annualInterestForTax * (effectiveDeductibleBalance / averageBalance)
                : 0;

            // SALT = property taxes + state income tax (Mello-Roos excluded per IRC 164)
            const effectiveSaltCap = saltCapForYear(saltCap, taxYearForProjectionYear(inputs, yearIndex),
                assumeSaltCapExtension, currentAnnualSalary, inputs.filingStatus);
            const totalSaltTaxes = annualPropertyTax + stateIncomeTax;
            const cappedSaltDeduction = Math.min(totalSaltTaxes, effectiveSaltCap);
            const totalItemizedDeductions = cappedMortgageInterest + cappedSaltDeduction;
            itemizedDeductionsByYear.push(totalItemizedDeductions);

            const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
            const yearlyTaxSavings = extraDeductionBenefit * (taxRateForDeductions / 100);

            // Credit the year's savings at year end (same convention as
            // calculateProjectionData, so the two engines agree)
            investmentBalance += yearlyTaxSavings;
            totalTaxSavings += yearlyTaxSavings;

            annualInterestForTax = 0;
        }
    }

    const homeValueAtHorizon = homePrice * Math.pow(1 + homeAppreciation / 100, horizonYears);
    const sellingCosts = includeSellingCosts ? homeValueAtHorizon * (sellingCostPercent / 100) : 0;
    const finalNetWorth = homeValueAtHorizon + investmentBalance - balance - sellingCosts;

    // True payoff date, independent of the optimization horizon
    let payoffYears: number;
    if (loanAmount <= 0) {
        payoffYears = 0;
    } else if (payoffMonth !== -1) {
        payoffYears = payoffMonth / 12;
    } else {
        // Loan outlives the horizon — keep amortizing (with the same extra
        // payment) to find the real payoff date instead of reporting the term.
        let futureBalance = balance;
        let futureMonth = horizonMonths;
        while (futureBalance > 0.005 && futureMonth < totalPayments + 1) {
            futureMonth++;
            const interestPayment = futureBalance * monthlyRate;
            const principalPayment = Math.min(regularPayment + extraMonthlyPayment - interestPayment, futureBalance);
            futureBalance -= principalPayment;
        }
        payoffYears = futureBalance <= 0.005 ? futureMonth / 12 : mortgageYears;
    }

    return {
        finalNetWorth,
        payoffYear: Math.round(payoffYears * 10) / 10,
        totalInterestPaid,
        taxSavings: totalTaxSavings,
        itemizedDeductionsByYear,
        remainingBalance: balance,
        investmentBalance,
        homeValueAtHorizon
    };
};

export const calculateProjectionData = (inputs: HousingCalculatorInputs) => {
    const {
        annualSalaryBeforeTax, effectiveFederalTaxRate, standardDeduction,
        initialInvestment, monthlyMiscExpenses, homePrice, downPaymentPercent,
        effectiveMortgageRate, mortgageYears, PMIRate, propertyTaxRate,
        melloRoosTaxRate, closingCostPercent, annualMaintenanceRate,
        monthlyHOAFee, monthlyHomeInsurance, monthlyRent, monthlyRentalIncome,
        rentDeposit, movingCostBuying, movingCostRenting, monthlyRenterInsurance,
        monthlyRentUtilities, monthlyPropertyUtilities, homeAppreciation,
        investmentReturn, rentIncrease, salaryGrowthRate, inflationRate,
        propertyTaxAssessmentCap, xAxisYears, mortgageInterestDeductionCap,
        saltCap, effectiveStateIncomeTaxRate,
        marginalFederalTaxRate, useMarginalTaxRate, melloRoosGrowsWithAssessment,
        includeSellingCosts, sellingCostPercent, annualInvestmentTaxDrag,
        assumeSaltCapExtension,
    } = inputs;

    const data = [];
    const taxRateForDeductions = useMarginalTaxRate ? marginalFederalTaxRate : effectiveFederalTaxRate;

    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);
    const originalLoanAmount = homePrice * (1 - downPaymentPercent / 100);
    const pmiThresholdBalance = homePrice * 0.8;
    const monthlyPMIWhenOwed = (originalLoanAmount * PMIRate) / 100 / 12;

    const initialSellingCosts = includeSellingCosts ? homePrice * (sellingCostPercent / 100) : 0;

    const totalCashNeeded = downPaymentAmount + closingCostsAmount + movingCostBuying;
    if (totalCashNeeded > initialInvestment) {
        return {
            error: "Insufficient initial investment for down payment and closing costs",
            requiredUpfront: totalCashNeeded,
            availableInvestment: initialInvestment
        };
    }

    let currentHomeValue = homePrice;
    let currentAssessedValue = homePrice;
    let currentMonthlyRent = monthlyRent;
    let currentAnnualSalary = annualSalaryBeforeTax;
    let mortgageBalance = homePrice - downPaymentAmount;
    let currentMonthlyRentalIncome = monthlyRentalIncome;

    // Liquid portfolios; the rent deposit is excluded from the renter's
    // investable funds but reported as a (non-compounding) asset in net worth.
    let buyingInvestmentBalance = initialInvestment - downPaymentAmount - closingCostsAmount - movingCostBuying;
    let rentingInvestmentBalance = initialInvestment - rentDeposit - movingCostRenting;

    let currentMonthlyMiscExpenses = monthlyMiscExpenses;
    let currentMonthlyHOAFee = monthlyHOAFee;
    let currentMonthlyHomeInsurance = monthlyHomeInsurance;
    let currentMonthlyPropertyUtilities = monthlyPropertyUtilities;
    let currentMonthlyRentUtilities = monthlyRentUtilities;
    let currentMonthlyRenterInsurance = monthlyRenterInsurance;
    let currentStandardDeduction = standardDeductionForYear(inputs, 0);

    const monthlyInterestRate = effectiveMortgageRate / 100 / 12;
    const totalMonthlyPayments = mortgageYears * 12;
    const monthlyMortgagePayment = calculateMonthlyMortgagePayment(mortgageBalance, monthlyInterestRate, totalMonthlyPayments);

    const initialMonthlyTakeHome = takeHomeForYear(inputs, annualSalaryBeforeTax, 0);
    const initialMonthlyPropertyTax = (currentAssessedValue * (propertyTaxRate / 100)) / 12;
    const initialMonthlyMelloRoosTax = (homePrice * (melloRoosTaxRate / 100)) / 12;
    const initialMonthlyMaintenance = (currentHomeValue * annualMaintenanceRate / 100) / 12;
    const initialMonthlyPMI = mortgageBalance > pmiThresholdBalance ? monthlyPMIWhenOwed : 0;

    const initialTotalMonthlyHousingCosts =
        monthlyMortgagePayment +
        initialMonthlyPropertyTax +
        initialMonthlyMelloRoosTax +
        currentMonthlyHomeInsurance +
        initialMonthlyMaintenance +
        initialMonthlyPMI +
        currentMonthlyPropertyUtilities +
        currentMonthlyHOAFee;

    // Net of rental income — the simulation itself runs on net costs
    const initialNetMonthlyExpenses = initialTotalMonthlyHousingCosts - monthlyRentalIncome + currentMonthlyMiscExpenses;

    if (initialNetMonthlyExpenses > initialMonthlyTakeHome) {
        return {
            error: "Monthly housing costs and living expenses exceed monthly take-home pay",
            monthlyHousingCosts: initialTotalMonthlyHousingCosts,
            monthlyMiscExpenses: currentMonthlyMiscExpenses,
            monthlyRentalIncome: monthlyRentalIncome,
            monthlyTakeHome: initialMonthlyTakeHome
        };
    }

    // Year 0 is the moment of purchase: a snapshot of starting balances plus the
    // upcoming first year's monthly costs. No time has elapsed, so no tax savings.
    const netMonthlyHomeownerCostsAtStart = initialTotalMonthlyHousingCosts - currentMonthlyRentalIncome;
    const totalMonthlyRenterCostsAtStart =
        currentMonthlyRent + currentMonthlyRenterInsurance + currentMonthlyRentUtilities;

    data.push({
        year: 0,
        buying: Math.round(buyingInvestmentBalance + (currentHomeValue - mortgageBalance) - initialSellingCosts),
        renting: Math.round(rentingInvestmentBalance + rentDeposit),
        salary: Math.round(currentAnnualSalary),
        homeEquity: Math.round(currentHomeValue - mortgageBalance),
        investmentsBuying: Math.round(buyingInvestmentBalance),
        investmentsRenting: Math.round(rentingInvestmentBalance),
        homeValue: Math.round(currentHomeValue),
        remainingLoan: Math.round(mortgageBalance),
        sellingCosts: Math.round(initialSellingCosts),
        yearlyPrincipalPaid: 0,
        yearlyInterestPaid: 0,
        monthlyPayment: Math.round(netMonthlyHomeownerCostsAtStart),
        availableMonthlyInvestment: Math.round(initialMonthlyTakeHome - netMonthlyHomeownerCostsAtStart - currentMonthlyMiscExpenses),
        availableMonthlyRenterInvestment: Math.round(initialMonthlyTakeHome - totalMonthlyRenterCostsAtStart - currentMonthlyMiscExpenses),
        monthlyRent: Math.round(currentMonthlyRent),
        annualRentCosts: Math.round(totalMonthlyRenterCostsAtStart * 12),
        monthlyRentalIncome: Math.round(currentMonthlyRentalIncome),
        yearlyTaxSavings: 0,
        renterYearlyTaxSavings: 0,
        monthlyMiscExpenses: Math.round(currentMonthlyMiscExpenses),
        totalItemizedDeductions: 0,
        monthlyTakeHome: Math.round(initialMonthlyTakeHome),
        monthlyPropertyTax: Math.round(initialMonthlyPropertyTax),
        monthlyMelloRoosTax: Math.round(initialMonthlyMelloRoosTax),
        monthlyHomeInsurance: Math.round(currentMonthlyHomeInsurance),
        monthlyMaintenance: Math.round(initialMonthlyMaintenance),
        monthlyPMI: Math.round(initialMonthlyPMI),
        monthlyPropertyUtilities: Math.round(currentMonthlyPropertyUtilities),
        monthlyHOAFee: Math.round(currentMonthlyHOAFee),
        monthlyRentUtilities: Math.round(currentMonthlyRentUtilities),
        monthlyRenterInsurance: Math.round(currentMonthlyRenterInsurance),
    });

    const monthlyReturn = toMonthlyRate(investmentReturn - annualInvestmentTaxDrag);

    for (let year = 1; year <= Math.max(mortgageYears, xAxisYears); year++) {
        // --- Cash flows during this year, at start-of-year levels ---
        const mortgageBreakdown = mortgageBalance > 0 ? calculateYearlyMortgageBreakdown(
            mortgageBalance,
            monthlyMortgagePayment,
            monthlyInterestRate,
            0,
            pmiThresholdBalance
        ) : {
            yearlyInterestPaid: 0,
            yearlyPrincipalPaid: 0,
            endingBalance: 0,
            pmiMonths: 0,
            monthlySpends: [] as number[],
        };

        const yearlyPropertyTaxes = currentAssessedValue * (propertyTaxRate / 100);
        const effectiveSaltCap = saltCapForYear(saltCap, taxYearForProjectionYear(inputs, year),
            assumeSaltCapExtension, currentAnnualSalary, inputs.filingStatus);
        // Pub 936: prorate the interest deduction by average balance
        const averageMortgageBalance = (mortgageBalance + mortgageBreakdown.endingBalance) / 2;
        const { yearlyTaxSavings, totalItemizedDeductions } = calculateTaxSavings(
            mortgageBreakdown.yearlyInterestPaid,
            yearlyPropertyTaxes,
            currentStandardDeduction,
            mortgageInterestDeductionCap,
            averageMortgageBalance,
            taxRateForDeductions,
            effectiveSaltCap,
            currentAnnualSalary,
            effectiveStateIncomeTaxRate
        );
        const renterYearlyTaxSavings = calculateRenterTaxSavings(
            currentAnnualSalary,
            effectiveStateIncomeTaxRate,
            effectiveSaltCap,
            currentStandardDeduction,
            taxRateForDeductions
        );

        const monthlyPropertyTax = yearlyPropertyTaxes / 12;
        const melloRoosBase = melloRoosGrowsWithAssessment ? currentAssessedValue : homePrice;
        const monthlyMelloRoosTax = (melloRoosBase * (melloRoosTaxRate / 100)) / 12;
        const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate) / 100 / 12;

        // Actual cash to the lender this year (partial in a payoff year, 0 after)
        const monthlyMortgageSpend = (mortgageBreakdown.yearlyInterestPaid + mortgageBreakdown.yearlyPrincipalPaid) / 12;
        // PMI only for the months it was actually owed
        const monthlyPMI = (monthlyPMIWhenOwed * mortgageBreakdown.pmiMonths) / 12;

        const totalMonthlyHomeownerCosts =
            monthlyMortgageSpend +
            monthlyPropertyTax +
            monthlyMelloRoosTax +
            currentMonthlyHomeInsurance +
            monthlyMaintenance +
            monthlyPMI +
            currentMonthlyPropertyUtilities +
            currentMonthlyHOAFee;

        const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts - currentMonthlyRentalIncome;

        const totalMonthlyRenterCosts =
            currentMonthlyRent + currentMonthlyRenterInsurance + currentMonthlyRentUtilities;

        const monthlyTakeHome = takeHomeForYear(inputs, currentAnnualSalary, year - 1);

        // Allow negative surplus — draws from investments when costs exceed income
        const monthlyAvailableForBuyerInvestment = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;
        const monthlyAvailableForRenterInvestment = monthlyTakeHome - totalMonthlyRenterCosts - currentMonthlyMiscExpenses;

        // Buyer costs excluding mortgage and PMI, which are timed to their actual
        // months below (matters in the payoff and PMI-dropout years)
        const monthlyBuyerSurplusBeforeMortgage =
            monthlyTakeHome - currentMonthlyMiscExpenses + currentMonthlyRentalIncome - (
                monthlyPropertyTax +
                monthlyMelloRoosTax +
                currentMonthlyHomeInsurance +
                monthlyMaintenance +
                currentMonthlyPropertyUtilities +
                currentMonthlyHOAFee
            );

        mortgageBalance = mortgageBreakdown.endingBalance;

        for (let month = 0; month < 12; month++) {
            // PMI months are always the leading months of the year (declining balance)
            const pmiChargeThisMonth = month < mortgageBreakdown.pmiMonths ? monthlyPMIWhenOwed : 0;
            const mortgageSpendThisMonth = mortgageBreakdown.monthlySpends[month] || 0;
            buyingInvestmentBalance *= (1 + monthlyReturn);
            buyingInvestmentBalance += monthlyBuyerSurplusBeforeMortgage - mortgageSpendThisMonth - pmiChargeThisMonth;
            rentingInvestmentBalance *= (1 + monthlyReturn);
            rentingInvestmentBalance += monthlyAvailableForRenterInvestment;
        }
        // Tax savings credited at year end (same convention as calculateMortgageScenario)
        buyingInvestmentBalance += yearlyTaxSavings;
        rentingInvestmentBalance += renterYearlyTaxSavings;

        // --- Advance stocks to end of year ---
        currentHomeValue *= 1 + homeAppreciation / 100;
        const assessmentIncrease = Math.min(inflationRate, propertyTaxAssessmentCap);
        currentAssessedValue *= 1 + assessmentIncrease / 100;

        const sellingCosts = includeSellingCosts ? currentHomeValue * (sellingCostPercent / 100) : 0;
        const buyingNetWorth = buyingInvestmentBalance + (currentHomeValue - mortgageBalance) - sellingCosts;

        data.push({
            year,
            buying: Math.round(buyingNetWorth),
            renting: Math.round(rentingInvestmentBalance + rentDeposit),
            salary: Math.round(currentAnnualSalary),
            homeEquity: Math.round(currentHomeValue - mortgageBalance),
            investmentsBuying: Math.round(buyingInvestmentBalance),
            investmentsRenting: Math.round(rentingInvestmentBalance),
            homeValue: Math.round(currentHomeValue),
            remainingLoan: Math.round(mortgageBalance),
            sellingCosts: Math.round(sellingCosts),
            yearlyPrincipalPaid: Math.round(mortgageBreakdown.yearlyPrincipalPaid),
            yearlyInterestPaid: Math.round(mortgageBreakdown.yearlyInterestPaid),
            monthlyPayment: Math.round(netMonthlyHomeownerCosts),
            availableMonthlyInvestment: Math.round(monthlyAvailableForBuyerInvestment),
            availableMonthlyRenterInvestment: Math.round(monthlyAvailableForRenterInvestment),
            monthlyRent: Math.round(currentMonthlyRent),
            annualRentCosts: Math.round(totalMonthlyRenterCosts * 12),
            monthlyRentalIncome: Math.round(currentMonthlyRentalIncome),
            yearlyTaxSavings: Math.round(yearlyTaxSavings),
            renterYearlyTaxSavings: Math.round(renterYearlyTaxSavings),
            monthlyMiscExpenses: Math.round(currentMonthlyMiscExpenses),
            totalItemizedDeductions: Math.round(totalItemizedDeductions),
            monthlyTakeHome: Math.round(monthlyTakeHome),
            monthlyPropertyTax: Math.round(monthlyPropertyTax),
            monthlyMelloRoosTax: Math.round(monthlyMelloRoosTax),
            monthlyHomeInsurance: Math.round(currentMonthlyHomeInsurance),
            monthlyMaintenance: Math.round(monthlyMaintenance),
            monthlyPMI: Math.round(monthlyPMI),
            monthlyPropertyUtilities: Math.round(currentMonthlyPropertyUtilities),
            monthlyHOAFee: Math.round(currentMonthlyHOAFee),
            monthlyRentUtilities: Math.round(currentMonthlyRentUtilities),
            monthlyRenterInsurance: Math.round(currentMonthlyRenterInsurance),
        });

        // --- Grow flow levels for next year ---
        currentAnnualSalary *= 1 + salaryGrowthRate / 100;
        currentMonthlyRent *= 1 + rentIncrease / 100;
        currentMonthlyRentalIncome *= 1 + rentIncrease / 100;

        const inflationMultiplier = 1 + inflationRate / 100;
        currentMonthlyMiscExpenses *= inflationMultiplier;
        currentMonthlyHOAFee *= inflationMultiplier;
        currentMonthlyHomeInsurance *= inflationMultiplier;
        currentMonthlyPropertyUtilities *= inflationMultiplier;
        currentMonthlyRentUtilities *= inflationMultiplier;
        currentMonthlyRenterInsurance *= inflationMultiplier;
        currentStandardDeduction *= inflationMultiplier;
    }
    return data;
};
