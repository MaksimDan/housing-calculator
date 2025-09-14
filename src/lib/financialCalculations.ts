// File: src/lib/financialCalculations.ts
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
}

const calculateMonthlyTakeHome = (annualSalary: number, effectiveFederalTaxRate: number, effectiveStateIncomeTaxRate: number) => {
    // Calculate federal and state taxes separately
    // State taxes are not deductible from federal income in this simplified calculation
    const federalTaxAmount = annualSalary * (effectiveFederalTaxRate / 100);
    const stateTaxAmount = annualSalary * (effectiveStateIncomeTaxRate / 100);
    const totalTaxAmount = federalTaxAmount + stateTaxAmount;
    const afterTaxAnnual = annualSalary - totalTaxAmount;
    return afterTaxAnnual / 12;
};

const calculateYearlyMortgageBreakdown = (loanBalance: number, monthlyPayment: number, monthlyRate: number) => {
    let yearlyInterestPaid = 0;
    let yearlyPrincipalPaid = 0;
    let currentBalance = loanBalance;

    for (let month = 0; month < 12; month++) {
        const monthlyInterestPaid = currentBalance * monthlyRate;
        const monthlyPrincipalPaid = monthlyPayment - monthlyInterestPaid;

        yearlyInterestPaid += monthlyInterestPaid;
        yearlyPrincipalPaid += monthlyPrincipalPaid;
        currentBalance -= monthlyPrincipalPaid;
    }

    return {
        yearlyInterestPaid,
        yearlyPrincipalPaid,
        endingBalance: currentBalance,
    };
};

const calculateTaxSavings = (
    mortgageInterest: number,
    propertyTaxes: number,
    melloRoosTaxes: number,
    currentStandardDeduction: number,
    mortgageInterestDeductionCap: number,
    mortgageBalance: number,
    effectiveFederalTaxRate: number,
    saltCap: number,
    annualSalary: number,
    effectiveStateIncomeTaxRate: number
) => {
    const stateIncomeTax = annualSalary * (effectiveStateIncomeTaxRate / 100);
    // The mortgage interest deduction is capped based on the loan amount, not proportional to home price
    // If the mortgage balance exceeds the cap, only interest on the capped amount is deductible
    const effectiveDeductibleBalance = Math.min(mortgageBalance, mortgageInterestDeductionCap);
    const cappedMortgageInterest = mortgageBalance > 0 
        ? mortgageInterest * (effectiveDeductibleBalance / mortgageBalance)
        : 0;
    const totalSaltTaxes = propertyTaxes + melloRoosTaxes + stateIncomeTax;
    const cappedSaltDeduction = Math.min(totalSaltTaxes, saltCap);
    const totalItemizedDeductions = cappedMortgageInterest + cappedSaltDeduction;
    const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
    const yearlyTaxSavings = extraDeductionBenefit * (effectiveFederalTaxRate / 100);
    return { yearlyTaxSavings, totalItemizedDeductions };
};

export const calculateProjectionData = (inputs: HousingCalculatorInputs) => {
    const {
        annualSalaryBeforeTax,
        effectiveFederalTaxRate,
        standardDeduction,
        initialInvestment,
        monthlyMiscExpenses,
        homePrice,
        downPaymentPercent,
        effectiveMortgageRate,
        mortgageYears,
        PMIRate,
        propertyTaxRate,
        melloRoosTaxRate,
        closingCostPercent,
        annualMaintenanceRate,
        monthlyHOAFee,
        monthlyHomeInsurance,
        monthlyRent,
        monthlyRentalIncome,
        rentDeposit,
        movingCostBuying,
        movingCostRenting,
        monthlyRenterInsurance,
        monthlyRentUtilities,
        monthlyPropertyUtilities,
        homeAppreciation,
        investmentReturn,
        rentIncrease,
        salaryGrowthRate,
        inflationRate,
        propertyTaxAssessmentCap,
        xAxisYears,
        mortgageInterestDeductionCap,
        saltCap,
        effectiveStateIncomeTaxRate,
    } = inputs;

    const data = [];

    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);

    let buyingNetWorth = initialInvestment - closingCostsAmount - movingCostBuying;
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
    let previousBuyingInvestments = buyingNetWorth - downPaymentAmount;

    let currentMonthlyMiscExpenses = monthlyMiscExpenses;
    let currentMonthlyHOAFee = monthlyHOAFee;
    let currentMonthlyHomeInsurance = monthlyHomeInsurance;
    let currentMonthlyPropertyUtilities = monthlyPropertyUtilities;
    let currentMonthlyRentUtilities = monthlyRentUtilities;
    let currentStandardDeduction = standardDeduction;

    const monthlyInterestRate = effectiveMortgageRate / 100 / 12;
    const totalMonthlyPayments = mortgageYears * 12;
    const monthlyMortgagePayment = (mortgageBalance *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonthlyPayments))) /
        (Math.pow(1 + monthlyInterestRate, totalMonthlyPayments) - 1);

    const initialMonthlyTakeHome = calculateMonthlyTakeHome(annualSalaryBeforeTax, effectiveFederalTaxRate, effectiveStateIncomeTaxRate);
    const initialMonthlyPropertyTax = (currentAssessedValue * (propertyTaxRate / 100)) / 12;
    const initialMonthlyMelloRoosTax = (currentAssessedValue * (melloRoosTaxRate / 100)) / 12;
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

    for (let year = 0; year <= Math.max(mortgageYears, xAxisYears); year++) {
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
        const yearlyMelloRoosTaxes = currentAssessedValue * (melloRoosTaxRate / 100);
        const { yearlyTaxSavings, totalItemizedDeductions } = calculateTaxSavings(
            mortgageBreakdown.yearlyInterestPaid,
            yearlyPropertyTaxes,
            yearlyMelloRoosTaxes,
            currentStandardDeduction,
            mortgageInterestDeductionCap,
            mortgageBalance,
            effectiveFederalTaxRate,
            saltCap,
            currentAnnualSalary,
            effectiveStateIncomeTaxRate
        );

        const monthlyPropertyTax = yearlyPropertyTaxes / 12;
        const monthlyMelloRoosTax = yearlyMelloRoosTaxes / 12;
        const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate) / 100 / 12;

        // PMI is removed when loan-to-value ratio reaches 80% (20% equity) based on original home value
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

        // Tax savings are received annually as a refund, not monthly
        const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts - currentMonthlyRentalIncome;

        const totalMonthlyRenterCosts =
            currentMonthlyRent + monthlyRenterInsurance + currentMonthlyRentUtilities;

        const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary, effectiveFederalTaxRate, effectiveStateIncomeTaxRate);

        data.push({
            year,
            buying: Math.round(buyingNetWorth),
            renting: Math.round(rentingNetWorth),
            salary: Math.round(currentAnnualSalary),
            homeEquity: Math.round(currentHomeValue - mortgageBalance),
            investmentsBuying: Math.round(buyingNetWorth - (currentHomeValue - mortgageBalance)),
            investmentsRenting: Math.round(rentingNetWorth),
            homeValue: Math.round(currentHomeValue),
            remainingLoan: Math.round(mortgageBalance),
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

        if (year > 0) {
            currentAnnualSalary *= 1 + salaryGrowthRate / 100;
            currentMonthlyRent *= 1 + rentIncrease / 100;
            currentMonthlyRentalIncome *= 1 + rentIncrease / 100;
            currentHomeValue *= 1 + homeAppreciation / 100;
            currentAssessedValue *= 1 + propertyTaxAssessmentCap / 100;

            const inflationMultiplier = 1 + inflationRate / 100;
            currentMonthlyMiscExpenses *= inflationMultiplier;
            currentMonthlyHOAFee *= inflationMultiplier;
            currentMonthlyHomeInsurance *= inflationMultiplier;
            currentMonthlyPropertyUtilities *= inflationMultiplier;
            currentMonthlyRentUtilities *= inflationMultiplier;
            currentStandardDeduction *= inflationMultiplier;

            const monthlyAvailableForBuyerInvestment = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;
            const monthlyAvailableForRenterInvestment = monthlyTakeHome - totalMonthlyRenterCosts - currentMonthlyMiscExpenses;

            const yearlyHomeownerInvestment = Math.max(0, monthlyAvailableForBuyerInvestment) * 12;
            const yearlyRenterInvestment = Math.max(0, monthlyAvailableForRenterInvestment) * 12;

            mortgageBalance = mortgageBreakdown.endingBalance;

            const monthlyReturn = investmentReturn / 100 / 12;
            const monthlyHomeownerInvestment = yearlyHomeownerInvestment / 12;
            const monthlyRenterInvestment = yearlyRenterInvestment / 12;

            let buyingInvestmentBalance = previousBuyingInvestments;
            let rentingInvestmentBalance = rentingNetWorth;

            for (let month = 0; month < 12; month++) {
                // Apply returns first, then add new contributions (correct order for compounding)
                buyingInvestmentBalance *= (1 + monthlyReturn);
                buyingInvestmentBalance += monthlyHomeownerInvestment;
                rentingInvestmentBalance *= (1 + monthlyReturn);
                rentingInvestmentBalance += monthlyRenterInvestment;
            }

            // Add annual tax savings at year-end
            buyingInvestmentBalance += yearlyTaxSavings;
            buyingNetWorth = buyingInvestmentBalance + (currentHomeValue - mortgageBalance);
            previousBuyingInvestments = buyingInvestmentBalance;

            rentingNetWorth = rentingInvestmentBalance;
        }
    }
    return data;
};
