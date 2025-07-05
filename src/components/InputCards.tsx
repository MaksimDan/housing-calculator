// File: src/InputCards.tsx
import React from 'react';
import { HelpCircle } from 'lucide-react';
import { AnimatedInput } from './AnimatedInput';

interface InputCardsProps {
    // Financial Parameters
    initialInvestment: number;
    setInitialInvestment: (value: number) => void;
    annualSalaryBeforeTax: number;
    setAnnualSalaryBeforeTax: (value: number) => void;
    effectiveTaxRate: number;
    setEffectiveTaxRate: (value: number) => void;
    standardDeduction: number;
    setStandardDeduction: (value: number) => void;
    monthlyMiscExpenses: number;
    setMonthlyMiscExpenses: (value: number) => void;
    mortgageInterestDeductionCap: number;
    setMortgageInterestDeductionCap: (value: number) => void;

    // Property Details
    homePrice: number;
    setHomePrice: (value: number) => void;
    downPaymentPercent: number;
    setDownPaymentPercent: (value: number) => void;
    closingCostPercent: number;
    setClosingCostPercent: (value: number) => void;
    effectiveMortgageRate: number;
    setEffectiveMortgageRate: (value: number) => void;
    PMIRate: number;
    setPMIRate: (value: number) => void;
    propertyTaxRate: number;
    setPropertyTaxRate: (value: number) => void;
    melloRoosTaxRate: number;
    setMelloRoosTaxRate: (value: number) => void;
    annualMaintenanceRate: number;
    setannualMaintenanceRate: (value: number) => void;
    monthlyHOAFee: number;
    setMonthlyHOAFee: (value: number) => void;
    monthlyHomeInsurance: number;
    setMonthlyHomeInsurance: (value: number) => void;
    monthlyPropertyUtilities: number;
    setMonthlyPropertyUtilities: (value: number) => void;
    monthlyRentalIncome: number;
    setMonthlyRentalIncome: (value: number) => void;
    movingCostBuying: number;
    setMovingCostBuying: (value: number) => void;
    mortgageYears: number;
    setMortgageYears: (value: number) => void;
    monthlyQualityOfLife: number;
    setMonthlyQualityOfLife: (value: number) => void;

    // Renting Details
    monthlyRent: number;
    setMonthlyRent: (value: number) => void;
    rentDeposit: number;
    setRentDeposit: (value: number) => void;
    monthlyRentUtilities: number;
    setMonthlyRentUtilities: (value: number) => void;
    monthlyRenterInsurance: number;
    setMonthlyRenterInsurance: (value: number) => void;
    movingCostRenting: number;
    setMovingCostRenting: (value: number) => void;

    // Growth Assumptions
    xAxisYears: number;
    setXAxisYears: (value: number) => void;
    homeAppreciation: number;
    setHomeAppreciation: (value: number) => void;
    investmentReturn: number;
    setInvestmentReturn: (value: number) => void;
    rentIncrease: number;
    setRentIncrease: (value: number) => void;
    salaryGrowthRate: number;
    setSalaryGrowthRate: (value: number) => void;
    inflationRate: number;
    setInflationRate: (value: number) => void;
    propertyTaxAssessmentCap: number;
    setPropertyTaxAssessmentCap: (value: number) => void;
}

const InputCards: React.FC<InputCardsProps> = ({
    initialInvestment, setInitialInvestment,
    annualSalaryBeforeTax, setAnnualSalaryBeforeTax,
    effectiveTaxRate, setEffectiveTaxRate,
    standardDeduction, setStandardDeduction,
    monthlyMiscExpenses, setMonthlyMiscExpenses,
    mortgageInterestDeductionCap, setMortgageInterestDeductionCap,
    homePrice, setHomePrice,
    downPaymentPercent, setDownPaymentPercent,
    closingCostPercent, setClosingCostPercent,
    effectiveMortgageRate, setEffectiveMortgageRate,
    PMIRate, setPMIRate,
    propertyTaxRate, setPropertyTaxRate,
    melloRoosTaxRate, setMelloRoosTaxRate,
    annualMaintenanceRate, setannualMaintenanceRate,
    monthlyHOAFee, setMonthlyHOAFee,
    monthlyHomeInsurance, setMonthlyHomeInsurance,
    monthlyPropertyUtilities, setMonthlyPropertyUtilities,
    monthlyRentalIncome, setMonthlyRentalIncome,
    movingCostBuying, setMovingCostBuying,
    mortgageYears, setMortgageYears,
    monthlyQualityOfLife, setMonthlyQualityOfLife,
    monthlyRent, setMonthlyRent,
    rentDeposit, setRentDeposit,
    monthlyRentUtilities, setMonthlyRentUtilities,
    monthlyRenterInsurance, setMonthlyRenterInsurance,
    movingCostRenting, setMovingCostRenting,
    xAxisYears, setXAxisYears,
    homeAppreciation, setHomeAppreciation,
    investmentReturn, setInvestmentReturn,
    rentIncrease, setRentIncrease,
    salaryGrowthRate, setSalaryGrowthRate,
    inflationRate, setInflationRate,
    propertyTaxAssessmentCap, setPropertyTaxAssessmentCap
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Financial Parameters Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4">Financial Parameters</h2>
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Total cash available for down payment, closing costs, and initial investments")} /> Initial Investment Portfolio
                        </>
                    }
                    value={initialInvestment}
                    onChange={setInitialInvestment}
                    min={0}
                    max={5000000}
                    step={10000}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Your gross annual salary before taxes and deductions")} /> Annual Salary (before tax)
                        </>
                    }
                    value={annualSalaryBeforeTax}
                    onChange={setAnnualSalaryBeforeTax}
                    min={50000}
                    max={2000000}
                    step={10000}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Your overall tax rate (federal + state + local) as a percentage")} /> Effective Tax Rate (${(annualSalaryBeforeTax * (effectiveTaxRate / 100)).toLocaleString()})
                        </>
                    }
                    value={effectiveTaxRate}
                    onChange={setEffectiveTaxRate}
                    min={1}
                    max={100}
                    step={1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual standard tax deduction amount for calculating mortgage interest tax savings (adjusted for inflation)")} /> Standard Deduction
                        </>
                    }
                    value={standardDeduction}
                    onChange={setStandardDeduction}
                    min={10000}
                    max={40000}
                    step={100}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly spending on food, clothing, entertainment, dining out, and personal care (adjusted for inflation)")} /> Monthly Living Expenses
                        </>
                    }
                    value={monthlyMiscExpenses}
                    onChange={setMonthlyMiscExpenses}
                    min={1000}
                    max={10000}
                    step={100}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Maximum mortgage debt eligible for interest deduction (federal limit is $750k for new loans)")} /> Mortgage Interest Deduction Cap
                        </>
                    }
                    value={mortgageInterestDeductionCap}
                    onChange={setMortgageInterestDeductionCap}
                    min={0}
                    max={1500000}
                    step={25000}
                    suffix="$"
                />
            </div>

            {/* Property Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4">Property Details</h2>

                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Total purchase price of the property")} /> Home Price
                        </>
                    }
                    value={homePrice}
                    onChange={setHomePrice}
                    min={100000}
                    max={2000000}
                    step={10000}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Percentage of home price paid upfront (20%+ avoids PMI)")} /> Down Payment (${(homePrice * (downPaymentPercent / 100)).toLocaleString()})
                        </>
                    }
                    value={downPaymentPercent}
                    onChange={setDownPaymentPercent}
                    min={5}
                    max={100}
                    step={.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time fees for loan processing, inspections, and legal costs (% of home price)")} /> Closing Costs (${(homePrice * (closingCostPercent / 100)).toLocaleString()})
                        </>
                    }
                    value={closingCostPercent}
                    onChange={setClosingCostPercent}
                    min={0}
                    max={6}
                    step={0.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual interest rate on your mortgage loan")} /> Mortgage Rate (${(() => {
                                const loanAmount = homePrice - homePrice * downPaymentPercent / 100;
                                const monthlyRate = effectiveMortgageRate / 100 / 12;
                                const numPayments = mortgageYears * 12;
                                if (loanAmount <= 0 || monthlyRate <= 0) return "0";
                                const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
                                const totalPayments = monthlyPayment * numPayments;
                                const totalInterest = totalPayments - loanAmount;
                                return Math.round(totalInterest).toLocaleString();
                            })()} lifetime interest)
                        </>
                    }
                    value={effectiveMortgageRate}
                    onChange={setEffectiveMortgageRate}
                    min={.1}
                    max={15}
                    step={0.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual private mortgage insurance rate (required if down payment < 20%)")} /> PMI Rate {downPaymentPercent < 20 ? `(${Math.round((homePrice - homePrice * downPaymentPercent / 100) * PMIRate / 100 / 12).toLocaleString()}/mo)` : '(not required)'}
                        </>
                    }
                    value={PMIRate}
                    onChange={setPMIRate}
                    min={0}
                    max={30}
                    step={.5}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual property tax as percentage of home value (varies by location)")} /> Property Tax Rate (${(homePrice * (propertyTaxRate / 100)).toLocaleString()} year 1)
                        </>
                    }
                    value={propertyTaxRate}
                    onChange={setPropertyTaxRate}
                    min={0.5}
                    max={3}
                    step={0.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual special assessment tax in some California communities (% of home value)")} /> Mello-Roos Tax Rate (${(homePrice * (melloRoosTaxRate / 100)).toLocaleString()} year 1)
                        </>
                    }
                    value={melloRoosTaxRate}
                    onChange={setMelloRoosTaxRate}
                    min={0}
                    max={2}
                    step={0.01}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual maintenance and repairs as percentage of home value (typically 1-3%)")} /> Annual Maintenance Rate (${(homePrice * (annualMaintenanceRate / 100)).toLocaleString()} year 1)
                        </>
                    }
                    value={annualMaintenanceRate}
                    onChange={setannualMaintenanceRate}
                    min={0}
                    max={30}
                    step={.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly homeowners association fees for shared amenities and maintenance (adjusted for inflation)")} /> Monthly HOA Fee
                        </>
                    }
                    value={monthlyHOAFee}
                    onChange={setMonthlyHOAFee}
                    min={0}
                    max={3000}
                    step={1}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly homeowners insurance premium (adjusted for inflation)")} /> Monthly Home Insurance
                        </>
                    }
                    value={monthlyHomeInsurance}
                    onChange={setMonthlyHomeInsurance}
                    min={50}
                    max={1000}
                    step={10}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly utilities cost for the owned property (gas, electric, water, trash) - adjusted for inflation")} /> Monthly Property Utilities
                        </>
                    }
                    value={monthlyPropertyUtilities}
                    onChange={setMonthlyPropertyUtilities}
                    min={0}
                    max={500}
                    step={10}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly after-tax income from renting out part of your property (e.g., ADU, room)")} /> Monthly Rental Income
                        </>
                    }
                    value={monthlyRentalIncome}
                    onChange={setMonthlyRentalIncome}
                    min={0}
                    max={10000}
                    step={100}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time cost for moving when buying (movers, truck rental, time off work)")} /> Moving Costs
                        </>
                    }
                    value={movingCostBuying}
                    onChange={setMovingCostBuying}
                    min={0}
                    max={10000}
                    step={100}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Length of mortgage loan in years (15 or 30 years are most common)")} /> Mortgage Term
                        </>
                    }
                    value={mortgageYears}
                    onChange={setMortgageYears}
                    min={5}
                    max={30}
                    step={1}
                    suffix=" years"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly value you place on homeownership benefits (control, permanence, no landlord)")} /> Monthly Quality of Life Benefit
                        </>
                    }
                    value={monthlyQualityOfLife}
                    onChange={setMonthlyQualityOfLife}
                    min={0}
                    max={10000}
                    step={100}
                    suffix="$"
                />
            </div>

            {/* Renting Details Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4">Renting Details</h2>
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly rental payment for comparable housing")} /> Monthly Rent
                        </>
                    }
                    value={monthlyRent}
                    onChange={setMonthlyRent}
                    min={1000}
                    max={10000}
                    step={100}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time refundable deposit paid when starting rental lease")} /> Security Deposit
                        </>
                    }
                    value={rentDeposit}
                    onChange={setRentDeposit}
                    min={0}
                    max={5000}
                    step={100}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly utilities cost for rental property (gas, electric, internet) - adjusted for inflation")} /> Monthly Rent Utilities
                        </>
                    }
                    value={monthlyRentUtilities}
                    onChange={setMonthlyRentUtilities}
                    min={0}
                    max={500}
                    step={10}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly renters insurance premium for personal property coverage")} /> Monthly Renter's Insurance
                        </>
                    }
                    value={monthlyRenterInsurance}
                    onChange={setMonthlyRenterInsurance}
                    min={5}
                    max={50}
                    step={1}
                    suffix="$"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time cost for moving when renting (movers, truck rental, time off work)")} /> Moving Costs
                        </>
                    }
                    value={movingCostRenting}
                    onChange={setMovingCostRenting}
                    min={0}
                    max={5000}
                    step={100}
                    suffix="$"
                />
            </div>

            {/* Growth Assumptions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-medium mb-4">Growth Assumptions</h2>

                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Number of years to display in the projection chart")} /> Graph Timeline
                        </>
                    }
                    value={xAxisYears}
                    onChange={setXAxisYears}
                    min={5}
                    max={30}
                    step={1}
                    suffix=" years"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual rate of home value appreciation (historical average ~3-5%)")} /> Home Appreciation (${(homePrice * (homeAppreciation / 100)).toLocaleString()} year 1)
                        </>
                    }
                    value={homeAppreciation}
                    onChange={setHomeAppreciation}
                    min={0}
                    max={20}
                    step={0.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual return on invested funds (stock market historical average ~7-10%)")} /> Investment Return
                        </>
                    }
                    value={investmentReturn}
                    onChange={setInvestmentReturn}
                    min={1}
                    max={50}
                    step={0.5}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual percentage increase in rental costs (typically 2-5%)")} /> Annual Rent Increase (${Math.round(monthlyRent * (rentIncrease / 100)).toLocaleString()}/mo year 1)
                        </>
                    }
                    value={rentIncrease}
                    onChange={setRentIncrease}
                    min={0}
                    max={15}
                    step={0.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual percentage increase in your salary (promotions, raises, inflation)")} /> Annual Salary Growth (${(annualSalaryBeforeTax * (salaryGrowthRate / 100)).toLocaleString()} year 1)
                        </>
                    }
                    value={salaryGrowthRate}
                    onChange={setSalaryGrowthRate}
                    min={0}
                    max={20}
                    step={0.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual inflation rate affecting living expenses, utilities, insurance, HOA fees, and tax deductions (historical average ~2-3%)")} /> Annual Inflation Rate
                        </>
                    }
                    value={inflationRate}
                    onChange={setInflationRate}
                    min={0}
                    max={10}
                    step={0.1}
                    suffix="%"
                />
                <AnimatedInput
                    label={
                        <>
                            <HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual cap on property tax assessment increases (e.g. California Prop 13 = ~2%). Property taxes grow by this rate.")} /> Property Tax Assessment Cap
                        </>
                    }
                    value={propertyTaxAssessmentCap}
                    onChange={setPropertyTaxAssessmentCap}
                    min={0}
                    max={10}
                    step={0.1}
                    suffix="%"
                />
            </div>
        </div>
    );
};

export default InputCards;