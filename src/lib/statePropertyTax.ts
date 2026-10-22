import type { StateCode } from './stateLaw';

// Property tax rules by state, for an owner-occupied home.
//
// typicalRate is a starting point for a home bought today, as a share of its
// market value; it fills in the property tax rate when you pick the state.
// Rates vary a lot within a state, so the help text tells people to use their
// county's. assessmentLimit is the statutory cap on how fast a homestead's
// assessed value may grow (California's Prop 13 and the like); without one,
// the assessed value follows the home's market value.

export interface AssessmentLimit {
  rate: number; // most the assessed value may grow in a year, in percent
  // true: the lesser of inflation and `rate` (California, Florida, Michigan)
  inflationLinked: boolean;
  name: string; // "Proposition 13"
  // One sentence for the help text: what the limit is and when it resets
  description: string;
}

export interface StatePropertyTax {
  typicalRate: number;
  rateNote: string; // what typicalRate is and where it comes from
  assessmentLimit: AssessmentLimit | null;
  // Without a statewide limit: local caps and levy limits worth knowing
  limitNote?: string;
  // What the state calls the non-ad-valorem charges billed with the property
  // tax (California's Mello-Roos). They're a separate input because they
  // aren't SALT-deductible.
  specialAssessment?: SpecialAssessmentWords;
}

export interface SpecialAssessmentWords {
  name: string; // "Mello-Roos"
  label: string; // the rate field: "Mello-Roos rate"
  growsLabel: string; // its toggle: "Mello-Roos grows with assessed value"
  help: string; // what it is, in a sentence
}

export const STATE_PROPERTY_TAX: Record<StateCode, StatePropertyTax> = {
  AK: {
    typicalRate: 0.94,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  AL: {
    typicalRate: 0.37,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: { rate: 7, inflationLinked: false, name: '7% assessment cap',
      description: 'Alabama caps the yearly increase in a home\'s taxable assessed value at 7%, and lifts the cap when it sells (enacted in 2025; sources differ on whether it ends after 2027 or in 2029).' },
  },
  AR: {
    typicalRate: 1.12,
    rateNote: 'on a home bought today in Little Rock, from the Lincoln Institute\'s study of taxes paid in 2025, since assessments reset at sale; owners statewide pay 0.56% on average',
    assessmentLimit: { rate: 5, inflationLinked: false, name: 'Amendment 79',
      description: 'Arkansas\' Amendment 79 limits the yearly increase in a homestead\'s assessed value to 5%, and resets it when the home sells.' },
  },
  AZ: {
    typicalRate: 0.48,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: { rate: 5, inflationLinked: false, name: 'Proposition 117',
      description: 'Arizona\'s Proposition 117 lets a home\'s limited (taxable) value grow by at most 5% a year, and the limit carries over to a buyer.' },
    specialAssessment: { name: 'CFD assessments', label: 'CFD assessment rate', growsLabel: 'CFD assessments grow with assessed value',
      help: 'Community Facilities District (CFD) taxes and assessments, billed in some Arizona communities.' },
  },
  CA: {
    typicalRate: 1.15,
    rateNote: 'on a home bought today: the 1% Proposition 13 rate plus voter-approved debt, the Board of Equalization\'s 2024-25 statewide average; counties range from 1.00% to 1.25%',
    assessmentLimit: { rate: 2, inflationLinked: true, name: 'Proposition 13',
      description: 'California\'s Proposition 13 lets a home\'s assessed value grow by the lesser of inflation and 2% a year, and resets it to the price when the home sells.' },
    specialAssessment: {
      name: 'Mello-Roos', label: 'Mello-Roos rate', growsLabel: 'Mello-Roos grows with assessed value',
      help: 'Mello-Roos (Community Facilities District) special tax, levied in some California communities.',
    },
  },
  CO: {
    typicalRate: 0.5,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
    limitNote: 'Local governments other than school districts may raise property tax revenue by at most 5.25% a year.',
  },
  CT: {
    typicalRate: 1.54,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  DC: {
    typicalRate: 0.6,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: { rate: 10, inflationLinked: false, name: 'assessment cap credit',
      description: 'The District of Columbia caps the yearly increase in a homestead\'s taxable assessment at 10%, and resets it when the home sells.' },
  },
  DE: {
    typicalRate: 0.54,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  FL: {
    typicalRate: 1.47,
    rateNote: 'on a $400,000 home bought today with the homestead exemption, at the Department of Revenue\'s 2025 statewide average millage',
    assessmentLimit: { rate: 3, inflationLinked: true, name: 'Save Our Homes',
      description: 'Florida\'s Save Our Homes amendment lets a homestead\'s assessed value grow by the lesser of inflation and 3% a year, and resets it to market value the year after the home sells.' },
    specialAssessment: { name: 'CDD assessments', label: 'CDD assessment rate', growsLabel: 'CDD assessments grow with assessed value',
      help: 'Community Development District (CDD) assessments and other non-ad valorem charges billed with the Florida property tax.' },
  },
  GA: {
    typicalRate: 0.79,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
    limitNote: 'Georgia\'s floating homestead exemption (2024) holds a homestead\'s assessed value to inflation where the county, city or school district didn\'t opt out (most school districts did for 2025), and a 2026 law (SB 33) is reported to make it apply everywhere from 2027.',
  },
  HI: {
    typicalRate: 0.29,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  IA: {
    typicalRate: 1.33,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  ID: {
    typicalRate: 0.5,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  IL: {
    typicalRate: 1.88,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
    limitNote: 'In Cook, the collar counties and some others, levies of districts without home rule may grow by at most the lesser of 5% and inflation.',
  },
  IN: {
    typicalRate: 0.76,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
    limitNote: 'Indiana caps a homestead\'s tax bill at 1% of its assessed value.',
  },
  KS: {
    typicalRate: 1.21,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  KY: {
    typicalRate: 0.74,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  LA: {
    typicalRate: 0.55,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  MA: {
    typicalRate: 1,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
    limitNote: 'Proposition 2 1/2 limits each town\'s levy to 2.5% a year plus new growth, so tax rates fall when values rise faster.',
  },
  MD: {
    typicalRate: 0.92,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: { rate: 4, inflationLinked: false, name: 'homestead credit',
      description: 'Maryland\'s homestead credit holds the yearly increase in a home\'s taxable assessment to a cap each county sets, at most 10% (Montgomery 10%, Howard 5%, Baltimore City and County 4%, Prince George\'s 3%, Anne Arundel 2%; 4% is typical), and resets it when the home sells.' },
  },
  ME: {
    typicalRate: 0.98,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  MI: {
    typicalRate: 1.76,
    rateNote: 'on a home bought today: half the Treasury\'s 2025 statewide average homestead millage, since taxable value resets to half of market value the year after a sale',
    assessmentLimit: { rate: 5, inflationLinked: true, name: 'Proposal A',
      description: 'Michigan\'s Proposal A lets a home\'s taxable value grow by the lesser of inflation and 5% a year, and resets it to half of market value the year after the home sells.' },
  },
  MN: {
    typicalRate: 1,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  MO: {
    typicalRate: 0.89,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  MS: {
    typicalRate: 0.58,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  MT: {
    typicalRate: 0.61,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  NC: {
    typicalRate: 0.66,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  ND: {
    typicalRate: 0.92,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  NE: {
    typicalRate: 1.44,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  NH: {
    typicalRate: 1.5,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  NJ: {
    typicalRate: 1.88,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
    limitNote: 'Each county, town and school district may raise its levy by at most 2% a year, with exceptions.',
  },
  NM: {
    typicalRate: 1.43,
    rateNote: 'on a home bought today in Albuquerque, from the Lincoln Institute\'s study of taxes paid in 2025, since assessments reset at sale; owners statewide pay 0.63% on average',
    assessmentLimit: { rate: 3, inflationLinked: false, name: 'valuation limit',
      description: 'New Mexico limits the yearly increase in a home\'s taxable value to 3%, and resets it when the home sells.' },
  },
  NV: {
    typicalRate: 0.5,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: { rate: 3, inflationLinked: false, name: 'partial abatement',
      description: 'Nevada caps the yearly increase in an owner-occupied home\'s tax bill at 3%, a cap on the bill that a buyer appears to inherit.' },
  },
  NY: {
    typicalRate: 1.3,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
    limitNote: 'New York City and Nassau County cap a home\'s yearly assessment increase at 6% (20% over five years), a cap that carries over to a buyer; elsewhere levies may grow by at most 2% a year or inflation.',
  },
  OH: {
    typicalRate: 1.36,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  OK: {
    typicalRate: 1.31,
    rateNote: 'on a home bought today in Oklahoma City, from the Lincoln Institute\'s study of taxes paid in 2025, since assessments reset at sale; owners statewide pay 0.79% on average',
    assessmentLimit: { rate: 3, inflationLinked: false, name: 'State Question 676',
      description: 'Oklahoma caps the yearly increase in a homestead\'s taxable value at 3%, and resets it when the home sells.' },
  },
  OR: {
    typicalRate: 0.81,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: { rate: 3, inflationLinked: false, name: 'Measure 50',
      description: 'Oregon\'s Measure 50 lets a home\'s maximum assessed value grow by 3% a year, and the limit carries over to a buyer.' },
  },
  PA: {
    typicalRate: 1.26,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  RI: {
    typicalRate: 1.12,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  SC: {
    typicalRate: 0.54,
    rateNote: 'on a home bought today in Charleston, from the Lincoln Institute\'s study of taxes paid in 2025, since a sale triggers reassessment; owners statewide pay 0.49% on average',
    assessmentLimit: { rate: 2.83, inflationLinked: false, name: '15% reassessment cap',
      description: 'South Carolina limits the increase from each five-yearly reassessment to 15% (about 2.83% a year), and reassesses a home at market value when it sells.' },
  },
  SD: {
    typicalRate: 1,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  TN: {
    typicalRate: 0.52,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  TX: {
    typicalRate: 1.4,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: { rate: 10, inflationLinked: false, name: 'homestead appraisal cap',
      description: 'Texas caps the yearly increase in a homestead\'s appraised value at 10%, starting the year after the owner qualifies, so a buyer starts at market value.' },
    specialAssessment: { name: 'PID assessments', label: 'PID assessment rate', growsLabel: 'PID assessments grow with assessed value',
      help: 'Public Improvement District (PID) assessments, billed in some Texas subdivisions. Municipal utility district (MUD) taxes are ordinary property taxes: include them in the property tax rate.' },
  },
  UT: {
    typicalRate: 0.48,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  VA: {
    typicalRate: 0.78,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  VT: {
    typicalRate: 1.51,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  WA: {
    typicalRate: 0.75,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
    limitNote: 'Each district\'s regular levy may grow by at most 1% a year plus new construction, so tax rates fall when values rise faster.',
  },
  WI: {
    typicalRate: 1.32,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  WV: {
    typicalRate: 0.51,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: null,
  },
  WY: {
    typicalRate: 0.53,
    rateNote: 'the tax owner-occupied homes pay as a share of their value, from the Tax Foundation\'s 2026 figures for Census ACS 2020-2024',
    assessmentLimit: { rate: 4, inflationLinked: false, name: '4% assessment exemption',
      description: 'Wyoming exempts the part of a home\'s assessed value above 4% yearly growth (enacted in 2024 and questioned by the state equalization board in 2026), and resets it when the home sells.' },
  },
};

const GENERIC_SPECIAL_ASSESSMENT: SpecialAssessmentWords = {
  name: 'Special assessments', label: 'Special assessments', growsLabel: 'Special assessments grow with assessed value',
  help: 'Special assessments billed with the property tax by a local improvement district.',
};

// ---------------------------------------------------------------------------
// Lookups (no constants below this line)
// ---------------------------------------------------------------------------

export const statePropertyTax = (state: StateCode): StatePropertyTax => STATE_PROPERTY_TAX[state];

export const assessmentLimit = (state: StateCode) => statePropertyTax(state)?.assessmentLimit ?? null;

// Whether the state's cap is the lesser of inflation and the cap rate
export const assessmentCapFollowsInflation = (state: StateCode) => assessmentLimit(state)?.inflationLinked ?? false;

export const specialAssessmentWords = (state: StateCode) => statePropertyTax(state)?.specialAssessment ?? GENERIC_SPECIAL_ASSESSMENT;
