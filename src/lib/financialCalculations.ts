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

const calculateYearlyMortgageBreakdown = (loanBalance: number, monthlyPayment: number, monthlyRate: number, extraPrincipalPayment: number = 0) => {
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
            monthlyPropertyUtilities, monthlyRentalIncome } = inputs;

    const downPaymentAmount = homePrice * (downPaymentPercent / 100);
    const closingCostsAmount = homePrice * (closingCostPercent / 100);
    const loanAmount = homePrice - downPaymentAmount;
    const monthlyRate = effectiveMortgageRate / 100 / 12;
    const totalPayments = mortgageYears * 12;
    const monthlyInvestmentReturn = investmentReturn / 100 / 12;
    const horizonMonths = horizonYears * 12;

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

        if (balance > 0) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = Math.min(regularPayment + extraMonthlyPayment - interestPayment, balance);
            
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
        const monthlyMelloRoosTax = (currentAssessedValue * (melloRoosTaxRate / 100)) / 12;
        const monthlyMaintenance = (currentHomeValue * annualMaintenanceRate / 100) / 12;
        
        const currentLTV = (balance / homePrice) * 100;
        const originalLoanAmount = homePrice * (1 - downPaymentPercent / 100);
        const monthlyPMI = currentLTV > 80 ? (originalLoanAmount * PMIRate) / 100 / 12 : 0;
        
        const totalMonthlyHomeownerCosts = 
            regularPayment +
            monthlyPropertyTax +
            monthlyMelloRoosTax +
            currentMonthlyHomeInsurance +
            monthlyMaintenance +
            monthlyPMI +
            currentMonthlyPropertyUtilities +
            currentMonthlyHOAFee;
            
        const netMonthlyHomeownerCosts = totalMonthlyHomeownerCosts - currentMonthlyRentalIncome;
        
        const monthlyTakeHome = calculateMonthlyTakeHome(currentAnnualSalary, effectiveFederalTaxRate, effectiveStateIncomeTaxRate);
        
        const monthlyAvailableBeforeExtra = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;
        
        let monthlyInvestment = Math.max(0, monthlyAvailableBeforeExtra - extraMonthlyPayment);
        
        if (payoffMonth !== -1 && month > payoffMonth) {
            const totalMonthlyHomeownerCostsNoPrincipal = 
                monthlyPropertyTax +
                monthlyMelloRoosTax +
                currentMonthlyHomeInsurance +
                monthlyMaintenance +
                currentMonthlyPropertyUtilities +
                currentMonthlyHOAFee;
            
            const netMonthlyHomeownerCostsNoPrincipal = totalMonthlyHomeownerCostsNoPrincipal - currentMonthlyRentalIncome;
            monthlyInvestment = monthlyTakeHome - netMonthlyHomeownerCostsNoPrincipal - currentMonthlyMiscExpenses;
        }
        
        investmentBalance += monthlyInvestment;

        if (month % 12 === 0) {
            const annualPropertyTax = currentAssessedValue * (propertyTaxRate / 100);
            const annualMelloRoosTax = currentAssessedValue * (melloRoosTaxRate / 100);
            const stateIncomeTax = currentAnnualSalary * (effectiveStateIncomeTaxRate / 100);

            const effectiveDeductibleBalance = Math.min(beginningYearBalance, mortgageInterestDeductionCap);
            const cappedMortgageInterest = beginningYearBalance > 0 
                ? annualInterestForTax * (effectiveDeductibleBalance / beginningYearBalance)
                : 0;

            const totalSaltTaxes = annualPropertyTax + annualMelloRoosTax + stateIncomeTax;
            const cappedSaltDeduction = Math.min(totalSaltTaxes, saltCap);
            const totalItemizedDeductions = cappedMortgageInterest + cappedSaltDeduction;
            itemizedDeductionsByYear.push(totalItemizedDeductions);
            
            const extraDeductionBenefit = Math.max(0, totalItemizedDeductions - currentStandardDeduction);
            const yearlyTaxSavings = extraDeductionBenefit * (effectiveFederalTaxRate / 100);
            
            investmentBalance += yearlyTaxSavings;
            totalTaxSavings += yearlyTaxSavings;
            
            annualInterestForTax = 0;
        }
    }

    const homeValueAtHorizon = homePrice * Math.pow(1 + homeAppreciation / 100, horizonYears);
    const finalNetWorth = homeValueAtHorizon + investmentBalance - balance;
    
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

    // Calculate initial state for year 0
    const yearlyPropertyTaxes = currentAssessedValue * (propertyTaxRate / 100);
    const yearlyMelloRoosTaxes = currentAssessedValue * (melloRoosTaxRate / 100);
    const { yearlyTaxSavings, totalItemizedDeductions } = calculateTaxSavings(
        0, // No interest paid at year 0
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

    // Push initial state (year 0)
    data.push({
        year: 0,
        buying: Math.round(buyingNetWorth),
        renting: Math.round(rentingNetWorth),
        salary: Math.round(currentAnnualSalary),
        homeEquity: Math.round(currentHomeValue - mortgageBalance),
        investmentsBuying: Math.round(buyingNetWorth - (currentHomeValue - mortgageBalance)),
        investmentsRenting: Math.round(rentingNetWorth),
        homeValue: Math.round(currentHomeValue),
        remainingLoan: Math.round(mortgageBalance),
        yearlyPrincipalPaid: 0, // No payments made at year 0
        yearlyInterestPaid: 0, // No payments made at year 0
        monthlyPayment: Math.round(netMonthlyHomeownerCosts),
        availableMonthlyInvestment: Math.round(monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses),
        monthlyRent: Math.round(currentMonthlyRent),
        annualRentCosts: Math.round(totalMonthlyRenterCosts * 12),
        monthlyRentalIncome: Math.round(currentMonthlyRentalIncome),
        yearlyTaxSavings: Math.round(yearlyTaxSavings),
        monthlyMiscExpenses: Math.round(currentMonthlyMiscExpenses),
        totalItemizedDeductions: Math.round(totalItemizedDeductions),
    });

    // Loop from year 1 onwards
    for (let year = 1; year <= Math.max(mortgageYears, xAxisYears); year++) {
        // Apply updates for the previous year first
        currentAnnualSalary *= 1 + salaryGrowthRate / 100;
        currentMonthlyRent *= 1 + rentIncrease / 100;
        currentMonthlyRentalIncome *= 1 + rentIncrease / 100;
        currentHomeValue *= 1 + homeAppreciation / 100;
        // Assessed value increases by lesser of inflation rate or assessment cap (e.g., Prop 13)
        const assessmentIncrease = Math.min(inflationRate, propertyTaxAssessmentCap);
        currentAssessedValue *= 1 + assessmentIncrease / 100;

        const inflationMultiplier = 1 + inflationRate / 100;
        currentMonthlyMiscExpenses *= inflationMultiplier;
        currentMonthlyHOAFee *= inflationMultiplier;
        currentMonthlyHomeInsurance *= inflationMultiplier;
        currentMonthlyPropertyUtilities *= inflationMultiplier;
        currentMonthlyRentUtilities *= inflationMultiplier;
        currentStandardDeduction *= inflationMultiplier;

        // Now calculate mortgage breakdown with updated values
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

        // Calculate investments/surplus
        const monthlyAvailableForBuyerInvestment = monthlyTakeHome - netMonthlyHomeownerCosts - currentMonthlyMiscExpenses;
        const monthlyAvailableForRenterInvestment = monthlyTakeHome - totalMonthlyRenterCosts - currentMonthlyMiscExpenses;

        const yearlyHomeownerInvestment = Math.max(0, monthlyAvailableForBuyerInvestment) * 12;
        const yearlyRenterInvestment = Math.max(0, monthlyAvailableForRenterInvestment) * 12;

        mortgageBalance = mortgageBreakdown.endingBalance;

        const monthlyReturn = investmentReturn / 100 / 12;
        const monthlyHomeownerInvestment = yearlyHomeownerInvestment / 12;
        const monthlyRenterInvestment = yearlyRenterInvestment / 12;
        const monthlyTaxSavings = yearlyTaxSavings / 12;

        let buyingInvestmentBalance = previousBuyingInvestments;
        let rentingInvestmentBalance = rentingNetWorth;

        for (let month = 0; month < 12; month++) {
            // Apply returns first, then add new contributions (correct order for compounding)
            buyingInvestmentBalance *= (1 + monthlyReturn);
            buyingInvestmentBalance += monthlyHomeownerInvestment + monthlyTaxSavings;
            rentingInvestmentBalance *= (1 + monthlyReturn);
            rentingInvestmentBalance += monthlyRenterInvestment;
        }
        
        buyingNetWorth = buyingInvestmentBalance + (currentHomeValue - mortgageBalance);
        previousBuyingInvestments = buyingInvestmentBalance;
        rentingNetWorth = rentingInvestmentBalance;

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
    }
    return data;
};
