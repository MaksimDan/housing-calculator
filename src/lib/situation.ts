import type { HousingCalculatorInputs, Situation } from './financialCalculations';

export const SITUATIONS: Situation[] = ['renter', 'owner'];

// Inputs about one particular home (the one you'd buy, or the one you own)
// and the rent you'd pay. Each situation keeps its own, so switching never
// carries your home's numbers into a purchase or the other way round.
// Everything else (income, savings, taxes, market assumptions) is shared.
export const SITUATION_KEYS: readonly (keyof HousingCalculatorInputs)[] = [
  'homePrice', 'effectiveMortgageRate', 'mortgageYears', 'PMIRate',
  'propertyTaxRate', 'melloRoosTaxRate', 'melloRoosGrowsWithAssessment', 'annualMaintenanceRate',
  'monthlyHOAFee', 'monthlyHomeInsurance', 'monthlyPropertyUtilities', 'monthlyRentalIncome',
  'monthlyRent', 'monthlyRentUtilities', 'monthlyRenterInsurance', 'rentDeposit', 'movingCostRenting',
];

export const isSituationKey = (key: string) => (SITUATION_KEYS as readonly string[]).includes(key);

// What the two paths are called in each situation. The engines' "buying" side
// is whichever path owns the home and "renting" whichever rents: someone who
// rents today compares buying with renting on, and someone who owns compares
// keeping the home with selling it and renting.

export interface PathWords {
  short: string; // table columns and chart labels: "Buy", "Keep"
  name: string; // starting a sentence: "Buying", "Keeping your home"
  lower: string; // mid-sentence: "buying", "keeping your home"
  who: string; // after an amount: "$1,200 for the buyer", "$1,200 if you keep it"
}

export interface SituationWords {
  own: PathWords;
  rent: PathWords;
  even: string; // "Buying and renting come out even"
  question: string; // what the verdict answers (the nav link to it)
  ifOwning: string; // heading prefix for the prepay section
}

export const SITUATION_WORDS: Record<Situation, SituationWords> = {
  renter: {
    own: { short: 'Buy', name: 'Buying', lower: 'buying', who: 'for the buyer' },
    rent: { short: 'Rent', name: 'Renting', lower: 'renting', who: 'for the renter' },
    even: 'Buying and renting',
    question: 'Buy or rent?',
    ifOwning: 'If you buy',
  },
  owner: {
    own: { short: 'Keep', name: 'Keeping your home', lower: 'keeping your home', who: 'if you keep it' },
    rent: { short: 'Sell & rent', name: 'Selling and renting', lower: 'selling and renting', who: 'if you sell' },
    even: 'Keeping and selling',
    question: 'Keep or sell?',
    ifOwning: 'If you keep it',
  },
};

export const wordsFor = (situation: Situation): SituationWords => SITUATION_WORDS[situation] ?? SITUATION_WORDS.renter;

// The words for one side of the comparison ('buy' is the path that owns)
export const pathWords = (situation: Situation, side: 'buy' | 'rent'): PathWords =>
  side === 'buy' ? wordsFor(situation).own : wordsFor(situation).rent;
