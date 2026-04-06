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
}

export const calculateMonthlyTakeHome = (annualSalary: number, effectiveFederalTaxRate: number, effectiveStateIncomeTaxRate: number) => {
    const federalTaxAmount = annualSalary * (effectiveFederalTaxRate / 100);
    const stateTaxAmount = annualSalary * (effectiveStateIncomeTaxRate / 100);
    const totalTaxAmount = federalTaxAmount + stateTaxAmount;
    const afterTaxAnnual = annualSalary - totalTaxAmount;
    return afterTaxAnnual / 12;
};

export const calculateYearlyMortgageBreakdown = (loanBalance: number, monthlyPayment: number, monthlyRate: number, extraPrincipalPayment: number = 0) => {
    let yearlyInterestPaid = 0;
    let yearlyPrincipalPaid = 0;
    let currentBalance = loanBalance;

    for (let month = 0; month < 12; month++) {
        if (currentBalance <= 0) break;

        const monthlyInterestPaid = currentBalance * monthlyRate;
        const regularPrincipalPayment = monthlyPayment - monthlyInterestPaid;
        const totalPrincipalPayment = Math.min(regularPrincipalPayment + extraPrincipalPayment, currentBalance);

        yearlyInterestPaid += monthlyInterestPaid;
        yearlyPrincipalPaid += totalPrincipalPayment;
        currentBalance -= totalPrincipalPayment;
    }

    return {
        yearlyInterestPaid,
        yearlyPrincipalPaid,
        endingBalance: Math.max(0, currentBalance),
    };
};

// Mello-Roos is NOT included in SALT per IRS rules (IRC 164) — it is a special
// assessment, not an ad valorem property tax.
export const calculateTaxSavings = (
    mortgageInterest: number,
    propertyTaxes: number,
    currentStandardDeduction: number,
    mortgageInterestDeductionCap: number,
    mortgageBalance: number,
    taxRateForDeductions: number,
    saltCap: number,
    annualSalary: number,
    effectiveStateIncomeTaxRate: number
) => {
    const stateIncomeTax = annualSalary * (effectiveStateIncomeTaxRate / 100);
    const effectiveDeductibleBalance = Math.min(mortgageBalance, mortgageInterestDeductionCap);
    const cappedMortgageInterest = mortgageBalance > 0
        ? mortgageInterest * (effectiveDeductibleBalance / mortgageBalance)
        : 0;
    // SALT = property taxes + state income tax (no Mello-Roos)
    const totalSaltTaxes = propertyTaxes + stateIncomeTax;
    const cappedSaltDeduction = Math.min(totalSaltTaxes, saltCap);
    const totalItemizedDeductions = cappedMortgageInterest + cappedSaltDeduction;
    const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
    const yearlyTaxSavings = extraDeductionBenefit * (taxRateForDeductions / 100);
    return { yearlyTaxSavings, totalItemizedDeductions };
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
            includeSellingCosts, sellingCostPercent, annualInvestmentTaxDrag } = inputs;

    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);
    const loanAmount = homePrice - downPaymentAmount;
    const monthlyRate = effectiveMortgageRate / 100 / 12;
    const totalPayments = mortgageYears * 12;
    const monthlyInvestmentReturn = toMonthlyRate(investmentReturn - annualInvestmentTaxDrag);
    const horizonMonths = horizonYears * 12;
    const taxRateForDeductions = useMarginalTaxRate ? marginalFederalTaxRate : effectiveFederalTaxRate;

    const regularPayment = (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
                          (Math.pow(1 + monthlyRate, totalPayments) - 1);

    let balance = loanAmount;
    let investmentBalance = initialInvestment - downPaymentAmount - closingCostsAmount - movingCostBuying;
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let payoffMonth = -1;

    let annualInterestForTax = 0;
    let totalTaxSavings = 0;
    const itemizedDeductionsByYear: number[] = [];

    let currentAssessedValue = homePrice;
    let currentStandardDeduction = standardDeduction;
    let currentAnnualSalary = annualSalaryBeforeTax;
    let currentMonthlyMiscExpenses = monthlyMiscExpenses;
    let currentMonthlyHOAFee = monthlyHOAFee;
    let currentMonthlyHomeInsurance = monthlyHomeInsurance;
    let currentMonthlyPropertyUtilities = monthlyPropertyUtilities;
    let currentMonthlyRentalIncome = monthlyRentalIncome;

    let beginningYearBalance = loanAmount;
    // Tax savings from previous year, distributed monthly (more realistic timing)
    let monthlyTaxSavingsDistribution = 0;

    for (let month = 1; month <= horizonMonths; month++) {
        if ((month - 1) % 12 === 0 && month > 1) {
            const yearsPassed = Math.floor((month - 1) / 12);
            currentAnnualSalary = annualSalaryBeforeTax * Math.pow(1 + salaryGrowthRate / 100, yearsPassed);
            currentStandardDeduction = standardDeduction * Math.pow(1 + inflationRate / 100, yearsPassed);
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
        // Distribute previous year's tax savings monthly
        investmentBalance += monthlyTaxSavingsDistribution;

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

            if (balance <= 0 && payoffMonth === -1) {
                payoffMonth = month;
            }
        }

        const currentHomeValue = homePrice * Math.pow(1 + homeAppreciation / 100, Math.floor((month - 1) / 12));
        const monthlyPropertyTax = (currentAssessedValue * (propertyTaxRate / 100)) / 12;
        const melloRoosBase = melloRoosGrowsWithAssessment ? currentAssessedValue : homePrice;
        const monthlyMelloRoosTax = (melloRoosBase * (melloRoosTaxRate / 100)) / 12;
        const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate / 100) / 12;

        const currentLTV = (balance / homePrice) * 100;
        const originalLoanAmount = homePrice * (1 - downPaymentPercent / 100);
        const monthlyPMI = currentLTV > 80 ? (originalLoanAmount * PMIRate) / 100 / 12 : 0;

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
        const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary, effectiveFederalTaxRate, effectiveStateIncomeTaxRate);
        const monthlyInvestment = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;

        investmentBalance += monthlyInvestment;

        if (month % 12 === 0) {
            const annualPropertyTax = currentAssessedValue * (propertyTaxRate / 100);
            const stateIncomeTax = currentAnnualSalary * (effectiveStateIncomeTaxRate / 100);

            const effectiveDeductibleBalance = Math.min(beginningYearBalance, mortgageInterestDeductionCap);
            const cappedMortgageInterest = beginningYearBalance > 0
                ? annualInterestForTax * (effectiveDeductibleBalance / beginningYearBalance)
                : 0;

            // SALT = property taxes + state income tax (Mello-Roos excluded per IRC 164)
            const totalSaltTaxes = annualPropertyTax + stateIncomeTax;
            const cappedSaltDeduction = Math.min(totalSaltTaxes, saltCap);
            const totalItemizedDeductions = cappedMortgageInterest + cappedSaltDeduction;
            itemizedDeductionsByYear.push(totalItemizedDeductions);

            const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
            const yearlyTaxSavings = extraDeductionBenefit * (taxRateForDeductions / 100);

            // Distribute this year's savings monthly over the next year
            monthlyTaxSavingsDistribution = yearlyTaxSavings / 12;
            totalTaxSavings += yearlyTaxSavings;

            annualInterestForTax = 0;
        }
    }

    const homeValueAtHorizon = homePrice * Math.pow(1 + homeAppreciation / 100, horizonYears);
    const sellingCosts = includeSellingCosts ? homeValueAtHorizon * (sellingCostPercent / 100) : 0;
    const finalNetWorth = homeValueAtHorizon + investmentBalance - balance - sellingCosts;

    const payoffYears = payoffMonth !== -1 ? payoffMonth / 12 : mortgageYears;

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
    } = inputs;

    const data = [];
    const taxRateForDeductions = useMarginalTaxRate ? marginalFederalTaxRate : effectiveFederalTaxRate;

    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);

    const initialSellingCosts = includeSellingCosts ? homePrice * (sellingCostPercent / 100) : 0;
    let buyingNetWorth = initialInvestment - closingCostsAmount - movingCostBuying - initialSellingCosts;
    let rentingNetWorth = initialInvestment - rentDeposit - movingCostRenting;

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
    let previousBuyingInvestments = buyingNetWorth - (currentHomeValue - mortgageBalance - initialSellingCosts);

    let currentMonthlyMiscExpenses = monthlyMiscExpenses;
    let currentMonthlyHOAFee = monthlyHOAFee;
    let currentMonthlyHomeInsurance = monthlyHomeInsurance;
    let currentMonthlyPropertyUtilities = monthlyPropertyUtilities;
    let currentMonthlyRentUtilities = monthlyRentUtilities;
    let currentMonthlyRenterInsurance = monthlyRenterInsurance;
    let currentStandardDeduction = standardDeduction;

    const monthlyInterestRate = effectiveMortgageRate / 100 / 12;
    const totalMonthlyPayments = mortgageYears * 12;
    const monthlyMortgagePayment = (mortgageBalance *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonthlyPayments))) /
        (Math.pow(1 + monthlyInterestRate, totalMonthlyPayments) - 1);

    const initialMonthlyTakeHome = calculateMonthlyTakeHome(annualSalaryBeforeTax, effectiveFederalTaxRate, effectiveStateIncomeTaxRate);
    const initialMonthlyPropertyTax = (currentAssessedValue * (propertyTaxRate / 100)) / 12;
    const initialMelloRoosBase = homePrice; // Always use original price for initial calculation
    const initialMonthlyMelloRoosTax = (initialMelloRoosBase * (melloRoosTaxRate / 100)) / 12;
    const initialMonthlyMaintenance = (currentHomeValue * annualMaintenanceRate / 100) / 12;
    const initialMonthlyPMI = downPaymentPercent < 20 ? (mortgageBalance * PMIRate) / 100 / 12 : 0;

    const initialTotalMonthlyHousingCosts =
        monthlyMortgagePayment +
        initialMonthlyPropertyTax +
        initialMonthlyMelloRoosTax +
        currentMonthlyHomeInsurance +
        initialMonthlyMaintenance +
        initialMonthlyPMI +
        currentMonthlyPropertyUtilities +
        currentMonthlyHOAFee;

    const initialTotalMonthlyExpenses = initialTotalMonthlyHousingCosts + currentMonthlyMiscExpenses;

    if (initialTotalMonthlyExpenses > initialMonthlyTakeHome) {
        return {
            error: "Monthly housing costs and living expenses exceed monthly take-home pay",
            monthlyHousingCosts: initialTotalMonthlyHousingCosts,
            monthlyMiscExpenses: currentMonthlyMiscExpenses,
            monthlyTakeHome: initialMonthlyTakeHome
        };
    }

    // Year 0 calculations
    const yearlyPropertyTaxes = currentAssessedValue * (propertyTaxRate / 100);
    const { yearlyTaxSavings, totalItemizedDeductions } = calculateTaxSavings(
        0,
        yearlyPropertyTaxes,
        currentStandardDeduction,
        mortgageInterestDeductionCap,
        mortgageBalance,
        taxRateForDeductions,
        saltCap,
        currentAnnualSalary,
        effectiveStateIncomeTaxRate
    );

    const monthlyPropertyTax = yearlyPropertyTaxes / 12;
    const melloRoosBase = homePrice; // Year 0: always original price
    const monthlyMelloRoosTax = (melloRoosBase * (melloRoosTaxRate / 100)) / 12;
    const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate) / 100 / 12;

    const currentLTV = (mortgageBalance / homePrice) * 100;
    const originalLoanAmount = homePrice * (1 - downPaymentPercent / 100);
    const monthlyPMI = currentLTV > 80
        ? (originalLoanAmount * PMIRate) / 100 / 12
        : 0;

    const totalMonthlyHomeownerCosts =
        (mortgageBalance > 0 ? monthlyMortgagePayment : 0) +
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

    const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary, effectiveFederalTaxRate, effectiveStateIncomeTaxRate);

    data.push({
        year: 0,
        buying: Math.round(buyingNetWorth),
        renting: Math.round(rentingNetWorth),
        salary: Math.round(currentAnnualSalary),
        homeEquity: Math.round(currentHomeValue - mortgageBalance),
        investmentsBuying: Math.round(previousBuyingInvestments),
        investmentsRenting: Math.round(rentingNetWorth),
        homeValue: Math.round(currentHomeValue),
        remainingLoan: Math.round(mortgageBalance),
        sellingCosts: Math.round(initialSellingCosts),
        yearlyPrincipalPaid: 0,
        yearlyInterestPaid: 0,
        monthlyPayment: Math.round(netMonthlyHomeownerCosts),
        availableMonthlyInvestment: Math.round(monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses),
        monthlyRent: Math.round(currentMonthlyRent),
        annualRentCosts: Math.round(totalMonthlyRenterCosts * 12),
        monthlyRentalIncome: Math.round(currentMonthlyRentalIncome),
        yearlyTaxSavings: Math.round(yearlyTaxSavings),
        monthlyMiscExpenses: Math.round(currentMonthlyMiscExpenses),
        totalItemizedDeductions: Math.round(totalItemizedDeductions),
    });

    for (let year = 1; year <= Math.max(mortgageYears, xAxisYears); year++) {
        currentAnnualSalary *= 1 + salaryGrowthRate / 100;
        currentMonthlyRent *= 1 + rentIncrease / 100;
        currentMonthlyRentalIncome *= 1 + rentIncrease / 100;
        currentHomeValue *= 1 + homeAppreciation / 100;
        const assessmentIncrease = Math.min(inflationRate, propertyTaxAssessmentCap);
        currentAssessedValue *= 1 + assessmentIncrease / 100;

        const inflationMultiplier = 1 + inflationRate / 100;
        currentMonthlyMiscExpenses *= inflationMultiplier;
        currentMonthlyHOAFee *= inflationMultiplier;
        currentMonthlyHomeInsurance *= inflationMultiplier;
        currentMonthlyPropertyUtilities *= inflationMultiplier;
        currentMonthlyRentUtilities *= inflationMultiplier;
        currentMonthlyRenterInsurance *= inflationMultiplier;
        currentStandardDeduction *= inflationMultiplier;

        const mortgageBreakdown = mortgageBalance > 0 ? calculateYearlyMortgageBreakdown(
            mortgageBalance,
            monthlyMortgagePayment,
            monthlyInterestRate
        ) : {
            yearlyInterestPaid: 0,
            yearlyPrincipalPaid: 0,
            endingBalance: 0
        };

        const yearlyPropertyTaxes = currentAssessedValue * (propertyTaxRate / 100);
        const { yearlyTaxSavings, totalItemizedDeductions } = calculateTaxSavings(
            mortgageBreakdown.yearlyInterestPaid,
            yearlyPropertyTaxes,
            currentStandardDeduction,
            mortgageInterestDeductionCap,
            mortgageBalance,
            taxRateForDeductions,
            saltCap,
            currentAnnualSalary,
            effectiveStateIncomeTaxRate
        );

        const monthlyPropertyTax = yearlyPropertyTaxes / 12;
        const melloRoosBase = melloRoosGrowsWithAssessment ? currentAssessedValue : homePrice;
        const monthlyMelloRoosTax = (melloRoosBase * (melloRoosTaxRate / 100)) / 12;
        const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate) / 100 / 12;

        const currentLTV = (mortgageBalance / homePrice) * 100;
        const originalLoanAmount = homePrice * (1 - downPaymentPercent / 100);
        const monthlyPMI = currentLTV > 80
            ? (originalLoanAmount * PMIRate) / 100 / 12
            : 0;

        const totalMonthlyHomeownerCosts =
            (mortgageBalance > 0 ? monthlyMortgagePayment : 0) +
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

        const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary, effectiveFederalTaxRate, effectiveStateIncomeTaxRate);

        // Allow negative surplus — draws from investments when costs exceed income
        const monthlyAvailableForBuyerInvestment = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;
        const monthlyAvailableForRenterInvestment = monthlyTakeHome - totalMonthlyRenterCosts - currentMonthlyMiscExpenses;

        const yearlyHomeownerInvestment = monthlyAvailableForBuyerInvestment * 12;
        const yearlyRenterInvestment = monthlyAvailableForRenterInvestment * 12;

        mortgageBalance = mortgageBreakdown.endingBalance;

        const monthlyReturn = toMonthlyRate(investmentReturn - annualInvestmentTaxDrag);
        const monthlyHomeownerInvestment = yearlyHomeownerInvestment / 12;
        const monthlyRenterInvestment = yearlyRenterInvestment / 12;
        const monthlyTaxSavings = yearlyTaxSavings / 12;

        let buyingInvestmentBalance = previousBuyingInvestments;
        let rentingInvestmentBalance = rentingNetWorth;

        for (let month = 0; month < 12; month++) {
            buyingInvestmentBalance *= (1 + monthlyReturn);
            buyingInvestmentBalance += monthlyHomeownerInvestment + monthlyTaxSavings;
            rentingInvestmentBalance *= (1 + monthlyReturn);
            rentingInvestmentBalance += monthlyRenterInvestment;
        }

        const sellingCosts = includeSellingCosts ? currentHomeValue * (sellingCostPercent / 100) : 0;
        buyingNetWorth = buyingInvestmentBalance + (currentHomeValue - mortgageBalance) - sellingCosts;
        previousBuyingInvestments = buyingInvestmentBalance;
        rentingNetWorth = rentingInvestmentBalance;

        data.push({
            year,
            buying: Math.round(buyingNetWorth),
            renting: Math.round(rentingNetWorth),
            salary: Math.round(currentAnnualSalary),
            homeEquity: Math.round(currentHomeValue - mortgageBalance),
            investmentsBuying: Math.round(buyingInvestmentBalance),
            investmentsRenting: Math.round(rentingNetWorth),
            homeValue: Math.round(currentHomeValue),
            remainingLoan: Math.round(mortgageBalance),
            sellingCosts: Math.round(sellingCosts),
            yearlyPrincipalPaid: Math.round(mortgageBreakdown.yearlyPrincipalPaid),
            yearlyInterestPaid: Math.round(mortgageBreakdown.yearlyInterestPaid),
            monthlyPayment: Math.round(netMonthlyHomeownerCosts),
            availableMonthlyInvestment: Math.round(monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses),
            monthlyRent: Math.round(currentMonthlyRent),
            annualRentCosts: Math.round(totalMonthlyRenterCosts * 12),
            monthlyRentalIncome: Math.round(currentMonthlyRentalIncome),
            yearlyTaxSavings: Math.round(yearlyTaxSavings),
            monthlyMiscExpenses: Math.round(currentMonthlyMiscExpenses),
            totalItemizedDeductions: Math.round(totalItemizedDeductions),
        });
    }
    return data;
};
