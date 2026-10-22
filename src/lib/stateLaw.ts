// Everything that depends on the state lives behind this file, one table per
// kind of rule, each keyed by state:
//
//   stateIncomeTax.ts    income tax on wages: brackets, deductions, credits by
//                        tax year, and the local taxes every county levies
//   statePropertyTax.ts  typical property tax rate, the limit on how fast an
//                        assessment can grow, special assessments
//
// The state picker fills in the inputs those rules decide (see
// statutoryInputs.ts); the engines read only the inputs, plus the one rule an
// input can't carry (whether the state's assessment cap is tied to inflation).
//
// TO ADD A STATE RULE: add a field to the table for that kind of rule and fill
// it in for every state; the tests check that each state has an entry.

export const STATES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida',
  GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine',
  MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin',
  WY: 'Wyoming',
} as const;

export type StateCode = keyof typeof STATES;

export const STATE_CODES = Object.keys(STATES) as StateCode[];

export const stateName = (code: StateCode) => STATES[code] ?? code;

export * from './stateIncomeTax';
export * from './statePropertyTax';
