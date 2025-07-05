// File: src/lib/financialCalculations.ts
export interface HousingCalculatorInputs {
    annualSalaryBeforeTax: number;
    effectiveTaxRate: number;
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
    monthlyQualityOfLife: number;
    homeAppreciation: number;
    investmentReturn: number;
    rentIncrease: number;
    salaryGrowthRate: number;
    inflationRate: number;
    propertyTaxAssessmentCap: number;
    xAxisYears: number;
    mortgageInterestDeductionCap: number;
}

const calculateMonthlyTakeHome = (annualSalary: number, effectiveTaxRate: number) => {
    const afterTaxAnnual = annualSalary * (1 - effectiveTaxRate / 100);
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
    homePrice: number,
    effectiveTaxRate: number
) => {
    const cappedMortgageInterest = Math.min(mortgageInterest, (mortgageInterestDeductionCap / homePrice) * mortgageInterest);
    const totalItemizedDeductions = cappedMortgageInterest + propertyTaxes + melloRoosTaxes;
    const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
    return extraDeductionBenefit * (effectiveTaxRate / 100);
};

export const calculateProjectionData = (inputs: HousingCalculatorInputs) => {
    const {
        annualSalaryBeforeTax,
        effectiveTaxRate,
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
        monthlyQualityOfLife,
        homeAppreciation,
        investmentReturn,
        rentIncrease,
        salaryGrowthRate,
        inflationRate,
        propertyTaxAssessmentCap,
        xAxisYears,
        mortgageInterestDeductionCap,
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
    let previousBuyingInvestments = buyingNetWorth - (currentHomeValue - mortgageBalance);

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

    const initialMonthlyTakeHome = calculateMonthlyTakeHome(annualSalaryBeforeTax, effectiveTaxRate);
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
        const yearlyTaxSavings = calculateTaxSavings(
            mortgageBreakdown.yearlyInterestPaid,
            yearlyPropertyTaxes,
            yearlyMelloRoosTaxes,
            currentStandardDeduction,
            mortgageInterestDeductionCap,
            homePrice,
            effectiveTaxRate
        );

        const monthlyPropertyTax = yearlyPropertyTaxes / 12;
        const monthlyMelloRoosTax = yearlyMelloRoosTaxes / 12;
        const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate) / 100 / 12;

        const equityPercentOriginal = ((homePrice - mortgageBalance) / homePrice) * 100;
        const monthlyPMI = equityPercentOriginal < 20
            ? (mortgageBalance * PMIRate) / 100 / 12
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

        const monthlyTaxBenefit = yearlyTaxSavings / 12;
        const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts -
            currentMonthlyRentalIncome - monthlyTaxBenefit;

        const totalMonthlyRenterCosts =
            currentMonthlyRent + monthlyRenterInsurance + currentMonthlyRentUtilities;

        const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary, effectiveTaxRate);

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

            const yearlyQualityOfLifeBenefit = monthlyQualityOfLife * 12;
            const monthlyReturn = investmentReturn / 100 / 12;
            const monthlyHomeownerInvestment = yearlyHomeownerInvestment / 12;
            const monthlyRenterInvestment = yearlyRenterInvestment / 12;

            let buyingInvestmentBalance = previousBuyingInvestments;
            let rentingInvestmentBalance = rentingNetWorth;

            for (let month = 0; month < 12; month++) {
                buyingInvestmentBalance += monthlyHomeownerInvestment;
                buyingInvestmentBalance *= (1 + monthlyReturn);
                rentingInvestmentBalance += monthlyRenterInvestment;
                rentingInvestmentBalance *= (1 + monthlyReturn);
            }

            buyingInvestmentBalance += yearlyQualityOfLifeBenefit;
            buyingNetWorth = buyingInvestmentBalance + (currentHomeValue - mortgageBalance);
            previousBuyingInvestments = buyingInvestmentBalance;

            rentingNetWorth = rentingInvestmentBalance;
        }
    }
    return data;
};
