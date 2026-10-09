import React from 'react';
import { HelpCircle } from 'lucide-react';
import { AnimatedInput } from './AnimatedInput';
import { Toggle } from './Toggle';
import { CollapsibleCard } from './CollapsibleCard';

interface InputCardsProps {
    // Financial Parameters
    initialInvestment: number;
    setInitialInvestment: (value: number) => void;
    annualSalaryBeforeTax: number;
    setAnnualSalaryBeforeTax: (value: number) => void;
    effectiveFederalTaxRate: number;
    setEffectiveFederalTaxRate: (value: number) => void;
    standardDeduction: number;
    setStandardDeduction: (value: number) => void;
    monthlyMiscExpenses: number;
    setMonthlyMiscExpenses: (value: number) => void;
    mortgageInterestDeductionCap: number;
    setMortgageInterestDeductionCap: (value: number) => void;
    saltCap: number;
    setSaltCap: (value: number) => void;
    effectiveStateIncomeTaxRate: number;
    setEffectiveStateIncomeTaxRate: (value: number) => void;

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
    setAnnualMaintenanceRate: (value: number) => void;
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

    // Model Settings
    marginalFederalTaxRate: number;
    setMarginalFederalTaxRate: (value: number) => void;
    filingStatus: 'mfj' | 'single' | 'hoh' | 'mfs';
    setFilingStatus: (value: 'mfj' | 'single' | 'hoh' | 'mfs') => void;
    firstTaxYear: number;
    setFirstTaxYear: (value: number) => void;
    includePayrollTax: boolean;
    setIncludePayrollTax: (value: boolean) => void;
    payrollEarners: number;
    setPayrollEarners: (value: number) => void;
    useMarginalTaxRate: boolean;
    setUseMarginalTaxRate: (value: boolean) => void;
    assumeSaltCapExtension: boolean;
    setAssumeSaltCapExtension: (value: boolean) => void;
    melloRoosGrowsWithAssessment: boolean;
    setMelloRoosGrowsWithAssessment: (value: boolean) => void;
    includeSellingCosts: boolean;
    setIncludeSellingCosts: (value: boolean) => void;
    sellingCostPercent: number;
    setSellingCostPercent: (value: number) => void;
    annualInvestmentTaxDrag: number;
    setAnnualInvestmentTaxDrag: (value: number) => void;
}

const InputCards: React.FC<InputCardsProps> = ({
    initialInvestment, setInitialInvestment,
    annualSalaryBeforeTax, setAnnualSalaryBeforeTax,
    effectiveFederalTaxRate, setEffectiveFederalTaxRate,
    standardDeduction, setStandardDeduction,
    monthlyMiscExpenses, setMonthlyMiscExpenses,
    mortgageInterestDeductionCap, setMortgageInterestDeductionCap,
    saltCap, setSaltCap,
    effectiveStateIncomeTaxRate, setEffectiveStateIncomeTaxRate,
    homePrice, setHomePrice,
    downPaymentPercent, setDownPaymentPercent,
    closingCostPercent, setClosingCostPercent,
    effectiveMortgageRate, setEffectiveMortgageRate,
    PMIRate, setPMIRate,
    propertyTaxRate, setPropertyTaxRate,
    melloRoosTaxRate, setMelloRoosTaxRate,
    annualMaintenanceRate, setAnnualMaintenanceRate,
    monthlyHOAFee, setMonthlyHOAFee,
    monthlyHomeInsurance, setMonthlyHomeInsurance,
    monthlyPropertyUtilities, setMonthlyPropertyUtilities,
    monthlyRentalIncome, setMonthlyRentalIncome,
    movingCostBuying, setMovingCostBuying,
    mortgageYears, setMortgageYears,
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
    propertyTaxAssessmentCap, setPropertyTaxAssessmentCap,
    marginalFederalTaxRate, setMarginalFederalTaxRate,
    filingStatus, setFilingStatus,
    firstTaxYear, setFirstTaxYear,
    includePayrollTax, setIncludePayrollTax,
    payrollEarners, setPayrollEarners,
    useMarginalTaxRate, setUseMarginalTaxRate,
    assumeSaltCapExtension, setAssumeSaltCapExtension,
    melloRoosGrowsWithAssessment, setMelloRoosGrowsWithAssessment,
    includeSellingCosts, setIncludeSellingCosts,
    sellingCostPercent, setSellingCostPercent,
    annualInvestmentTaxDrag, setAnnualInvestmentTaxDrag,
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <CollapsibleCard title="Financial Parameters">
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Total cash available for down payment, closing costs, and initial investments")} /> Initial Investment Portfolio</>}
                    value={initialInvestment} onChange={setInitialInvestment}
                    min={0} max={5000000} step={10000} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Your gross annual salary before taxes and deductions")} /> Annual Salary (before tax)</>}
                    value={annualSalaryBeforeTax} onChange={setAnnualSalaryBeforeTax}
                    min={50000} max={2000000} step={10000} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Federal INCOME tax as a percentage of gross salary (your total federal income tax divided by salary). Do not include Social Security or Medicare: those are calculated separately below, unless you turn that off.")} /> Effective Federal Tax Rate (${(annualSalaryBeforeTax * (effectiveFederalTaxRate / 100)).toLocaleString()})</>}
                    value={effectiveFederalTaxRate} onChange={setEffectiveFederalTaxRate}
                    min={0} max={50} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Your effective state income tax rate as a percentage - the average percentage of income paid in state taxes")} /> Effective State Income Tax Rate (${(annualSalaryBeforeTax * (effectiveStateIncomeTaxRate / 100)).toLocaleString()})</>}
                    value={effectiveStateIncomeTaxRate} onChange={setEffectiveStateIncomeTaxRate}
                    min={0} max={15} step={0.1} suffix="%"
                />
                <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        <span><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Federal filing status. Changing it sets the 2026 standard deduction, SALT cap and mortgage-interest cap for that status (you can still edit them). It also sets the SALT phase-down threshold and floor (halved for married filing separately) and the Additional Medicare Tax threshold.")} />Filing Status</span>
                        <select
                            value={filingStatus}
                            onChange={(e) => setFilingStatus(e.target.value as 'mfj' | 'single' | 'hoh' | 'mfs')}
                            className="px-2 py-1 border border-gray-300 rounded text-sm font-normal"
                        >
                            <option value="mfj">Married filing jointly</option>
                            <option value="single">Single</option>
                            <option value="hoh">Head of household</option>
                            <option value="mfs">Married filing separately</option>
                        </select>
                    </label>
                    <label className="flex flex-col gap-1 text-sm font-medium text-gray-700">
                        <span><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("The tax year most of your first 12 months of ownership falls in (a purchase in the second half of a year is mostly next year). Tax rules follow the calendar from here: the SALT cap reverts to $10,000 in 2030, and the standard deduction and Social Security wage base are indexed from their 2026 amounts.")} />First Tax Year</span>
                        <select
                            value={firstTaxYear}
                            onChange={(e) => setFirstTaxYear(Number(e.target.value))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm font-normal"
                        >
                            {Array.from({ length: 10 }, (_, i) => 2026 + i).concat(
                                firstTaxYear >= 2026 && firstTaxYear < 2036 ? [] : [firstTaxYear]
                            ).sort((a, b) => a - b).map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </label>
                </div>
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Standard deduction for tax year 2026 ($32,200 married filing jointly; $16,100 single or married filing separately; $24,150 head of household). Later years are indexed with the inflation rate from 2026.")} /> Standard Deduction</>}
                    value={standardDeduction} onChange={setStandardDeduction}
                    min={10000} max={40000} step={100} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly spending on food, clothing, entertainment, dining out, and personal care (adjusted for inflation)")} /> Monthly Living Expenses</>}
                    value={monthlyMiscExpenses} onChange={setMonthlyMiscExpenses}
                    min={1000} max={10000} step={100} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Maximum mortgage debt eligible for interest deduction (federal limit is $750k for new loans)")} /> Mortgage Interest Deduction Cap</>}
                    value={mortgageInterestDeductionCap} onChange={setMortgageInterestDeductionCap}
                    min={0} max={1500000} step={25000} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("SALT deduction cap for tax year 2026 ($40,400; $20,200 married filing separately). Modeled automatically from it under current law: +1%/yr through 2029; reduced by 30% of income above $505,000 (2026, also +1%/yr; salary is used as income) but not below $10,000; and a flat $10,000 from 2030. Married filing separately halves the threshold and the $10,000.")} /> SALT Cap</>}
                    value={saltCap} onChange={setSaltCap}
                    min={0} max={50000} step={1000} suffix="$"
                />
                <div className="flex items-center gap-2">
                    <Toggle
                        checked={assumeSaltCapExtension}
                        onChange={setAssumeSaltCapExtension}
                        label="Assume SALT cap extended past 2029"
                    />
                    <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" onClick={() => alert("Off (current law): the elevated cap rises 1%/yr through 2029, then reverts to a flat $10,000 from 2030 on. On: the 2029 rules (cap, income phase-down) continue after 2029, as if Congress extends them. 2026-2029 are the same either way.")} />
                </div>

                <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <Toggle
                            checked={includePayrollTax}
                            onChange={setIncludePayrollTax}
                            label="Deduct Social Security & Medicare"
                        />
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" onClick={() => alert("Employee payroll taxes (2026): Social Security 6.2% of each earner's wages up to $184,500 (indexed with inflation in later years), Medicare 1.45%, plus 0.9% Additional Medicare Tax on household wages above $250,000. Turn off only if your federal tax rate above already includes them.")} />
                    </div>
                    {includePayrollTax && (
                        <div className="mt-3">
                            <AnimatedInput
                                label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Number of people earning the salary above (split evenly). Each earner pays Social Security up to their own wage cap, so two earners pay more in total.")} /> Wage Earners</>}
                                value={payrollEarners} onChange={setPayrollEarners}
                                min={1} max={2} step={1} animationStep={1}
                            />
                        </div>
                    )}
                </div>

                <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <Toggle
                            checked={useMarginalTaxRate}
                            onChange={setUseMarginalTaxRate}
                            label="Use marginal rate for deduction savings"
                        />
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" onClick={() => alert("Deductions reduce tax at your marginal (bracket) rate, not your average effective rate. Enable for more accurate tax savings calculation.")} />
                    </div>
                    {useMarginalTaxRate && (
                        <div className="mt-3">
                            <AnimatedInput
                                label="Marginal Federal Tax Rate"
                                value={marginalFederalTaxRate} onChange={setMarginalFederalTaxRate}
                                min={10} max={37} step={1} suffix="%"
                            />
                        </div>
                    )}
                </div>
            </CollapsibleCard>

            <CollapsibleCard title="Property Details">
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Total purchase price of the property")} /> Home Price</>}
                    value={homePrice} onChange={setHomePrice}
                    min={100000} max={2000000} step={10000} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Percentage of home price paid upfront (20%+ avoids PMI)")} /> Down Payment (${(homePrice * (downPaymentPercent / 100)).toLocaleString()})</>}
                    value={downPaymentPercent} onChange={setDownPaymentPercent}
                    min={5} max={100} step={.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time fees for loan processing, inspections, and legal costs (% of home price)")} /> Closing Costs (${(homePrice * (closingCostPercent / 100)).toLocaleString()})</>}
                    value={closingCostPercent} onChange={setClosingCostPercent}
                    min={0} max={6} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual interest rate on your mortgage loan")} /> Mortgage Rate (${(() => {
                        const loanAmount = homePrice - homePrice * downPaymentPercent / 100;
                        const monthlyRate = effectiveMortgageRate / 100 / 12;
                        const numPayments = mortgageYears * 12;
                        if (loanAmount <= 0 || monthlyRate <= 0) return "0";
                        const monthlyPayment = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
                        return Math.round(monthlyPayment * numPayments - loanAmount).toLocaleString();
                    })()} lifetime interest)</>}
                    value={effectiveMortgageRate} onChange={setEffectiveMortgageRate}
                    min={.1} max={15} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual private mortgage insurance rate (required if down payment < 20%)")} /> PMI Rate {downPaymentPercent < 20 ? `(${Math.round((homePrice - homePrice * downPaymentPercent / 100) * PMIRate / 100 / 12).toLocaleString()}/mo)` : '(not required)'}</>}
                    value={PMIRate} onChange={setPMIRate}
                    min={0} max={30} step={.5} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual property tax as percentage of home value (varies by location)")} /> Property Tax Rate (${(homePrice * (propertyTaxRate / 100)).toLocaleString()} year 1)</>}
                    value={propertyTaxRate} onChange={setPropertyTaxRate}
                    min={0.5} max={3} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual special assessment tax in some California communities (% of home value). Not SALT-deductible per IRS rules (IRC 164).")} /> Mello-Roos Tax Rate (${(homePrice * (melloRoosTaxRate / 100)).toLocaleString()} year 1)</>}
                    value={melloRoosTaxRate} onChange={setMelloRoosTaxRate}
                    min={0} max={2} step={0.01} suffix="%"
                />
                {melloRoosTaxRate > 0 && (
                    <Toggle
                        checked={melloRoosGrowsWithAssessment}
                        onChange={setMelloRoosGrowsWithAssessment}
                        label="Mello-Roos grows with assessed value"
                    />
                )}
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual maintenance and repairs as percentage of home value (typically 1-3%)")} /> Annual Maintenance Rate (${(homePrice * (annualMaintenanceRate / 100)).toLocaleString()} year 1)</>}
                    value={annualMaintenanceRate} onChange={setAnnualMaintenanceRate}
                    min={0} max={30} step={.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly homeowners association fees for shared amenities and maintenance (adjusted for inflation)")} /> Monthly HOA Fee</>}
                    value={monthlyHOAFee} onChange={setMonthlyHOAFee}
                    min={0} max={3000} step={1} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly homeowners insurance premium (adjusted for inflation)")} /> Monthly Home Insurance</>}
                    value={monthlyHomeInsurance} onChange={setMonthlyHomeInsurance}
                    min={50} max={1000} step={10} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly utilities for the home you buy: gas, electric, water/sewer, trash, internet. Use the same list as the rental's utilities so the two scenarios compare like for like; leave out anything your HOA covers (adjusted for inflation).")} /> Monthly Property Utilities</>}
                    value={monthlyPropertyUtilities} onChange={setMonthlyPropertyUtilities}
                    min={0} max={500} step={10} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly after-tax income from renting out part of your property (e.g., ADU, room). If you enter this, set Monthly Rent (Renting Details) to the rent for housing like the part you would live in, not the whole property.")} /> Monthly Rental Income</>}
                    value={monthlyRentalIncome} onChange={setMonthlyRentalIncome}
                    min={0} max={10000} step={100} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time cost for moving when buying (movers, truck rental, time off work)")} /> Moving Costs</>}
                    value={movingCostBuying} onChange={setMovingCostBuying}
                    min={0} max={10000} step={100} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Length of mortgage loan in years (15 or 30 years are most common)")} /> Mortgage Term</>}
                    value={mortgageYears} onChange={setMortgageYears}
                    min={5} max={30} step={1} animationStep={1} suffix=" years"
                />

                <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                        <Toggle
                            checked={includeSellingCosts}
                            onChange={setIncludeSellingCosts}
                            label="Include selling costs in net worth"
                        />
                        <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer flex-shrink-0" onClick={() => alert("Subtract estimated realtor fees and closing costs from home equity when calculating net worth. Typically 6-10% of home value.")} />
                    </div>
                    {includeSellingCosts && (
                        <div className="mt-3">
                            <AnimatedInput
                                label={`Selling Cost Rate (${(homePrice * (sellingCostPercent / 100)).toLocaleString()} at current price)`}
                                value={sellingCostPercent} onChange={setSellingCostPercent}
                                min={0} max={12} step={0.5} suffix="%"
                            />
                        </div>
                    )}
                </div>
            </CollapsibleCard>

            <CollapsibleCard title="Renting Details">
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly rent for a home comparable to the one you would buy. If you enter rental income for renting out part of the home (an ADU or a room), set this to the rent for housing like the part you would live in yourself; otherwise the comparison credits the buyer for space the renter is paying for.")} /> Monthly Rent</>}
                    value={monthlyRent} onChange={setMonthlyRent}
                    min={1000} max={10000} step={100} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time refundable deposit paid when starting rental lease")} /> Security Deposit</>}
                    value={rentDeposit} onChange={setRentDeposit}
                    min={0} max={5000} step={100} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly utilities for the rental: gas, electric, water/sewer, trash, internet. Use the same list as the owned home's utilities; leave out anything included in the rent (adjusted for inflation).")} /> Monthly Rent Utilities</>}
                    value={monthlyRentUtilities} onChange={setMonthlyRentUtilities}
                    min={0} max={500} step={10} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Monthly renters insurance premium for personal property coverage")} /> Monthly Renter's Insurance</>}
                    value={monthlyRenterInsurance} onChange={setMonthlyRenterInsurance}
                    min={5} max={50} step={1} suffix="$"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("One-time cost for moving when renting (movers, truck rental, time off work)")} /> Moving Costs</>}
                    value={movingCostRenting} onChange={setMovingCostRenting}
                    min={0} max={5000} step={100} suffix="$"
                />
            </CollapsibleCard>

            <CollapsibleCard title="Growth Assumptions">
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Number of years to display in the projection chart")} /> Graph Timeline</>}
                    value={xAxisYears} onChange={setXAxisYears}
                    min={5} max={30} step={1} animationStep={1} suffix=" years"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual rate of home value appreciation (historical average ~3-5%)")} /> Home Appreciation (${(homePrice * (homeAppreciation / 100)).toLocaleString()} year 1)</>}
                    value={homeAppreciation} onChange={setHomeAppreciation}
                    min={0} max={20} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual return on invested funds (stock market historical average ~7-10%)")} /> Investment Return</>}
                    value={investmentReturn} onChange={setInvestmentReturn}
                    min={1} max={50} step={0.5} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual reduction in returns due to taxes on dividends and capital gains in a taxable account. 0% for tax-advantaged accounts (401k/IRA). Typically 0.5-2% for taxable brokerage accounts.")} /> Investment Tax Drag (net: {(investmentReturn - annualInvestmentTaxDrag).toFixed(1)}%)</>}
                    value={annualInvestmentTaxDrag} onChange={setAnnualInvestmentTaxDrag}
                    min={0} max={5} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual percentage increase in rental costs (typically 2-5%)")} /> Annual Rent Increase (${Math.round(monthlyRent * (rentIncrease / 100)).toLocaleString()}/mo year 1)</>}
                    value={rentIncrease} onChange={setRentIncrease}
                    min={0} max={15} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual percentage increase in your salary (promotions, raises, inflation)")} /> Annual Salary Growth (${(annualSalaryBeforeTax * (salaryGrowthRate / 100)).toLocaleString()} year 1)</>}
                    value={salaryGrowthRate} onChange={setSalaryGrowthRate}
                    min={0} max={20} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual inflation rate affecting living expenses, utilities, insurance, HOA fees, and tax deductions (historical average ~2-3%)")} /> Annual Inflation Rate</>}
                    value={inflationRate} onChange={setInflationRate}
                    min={0} max={10} step={0.1} suffix="%"
                />
                <AnimatedInput
                    label={<><HelpCircle className="w-4 h-4 inline text-gray-400 hover:text-gray-600 cursor-pointer mr-2" onClick={() => alert("Annual cap on property tax assessment increases (California Prop 13 = 2%). Assessed value grows at the LESSER of inflation and this cap, so values above the inflation rate have no effect.")} /> Property Tax Assessment Cap</>}
                    value={propertyTaxAssessmentCap} onChange={setPropertyTaxAssessmentCap}
                    min={0} max={10} step={0.1} suffix="%"
                />
            </CollapsibleCard>
        </div>
    );
};

export default InputCards;
