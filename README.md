# Housing Investment Calculator

https://housing-calculator-livid.vercel.app/

An interactive web tool to compare the financial outcomes of buying vs. renting a home over time. This calculator helps visualize long-term wealth building scenarios based on various financial inputs.

## Features

- **Answer first:** who comes out ahead, by how much (in future and today's dollars), how the lead evolves, and what would flip it (e.g. "buying wins if rent > $3,941/mo")
- **What drives this:** the seven inputs that move the result most, as typed fields, with every other assumption in a grouped drawer
- **Buy-minus-rent chart** with one shared year selector, a side-by-side Buy | Rent | Difference table, and an all-years table
- **Dig deeper:** monthly cash flow, tax savings by year, and the mortgage amortization
- **If you buy: prepay or invest?** using the same inputs, limited to what you can afford, with the break-even return
- **Tax law by year:** tax year and filing status fill in the statutory amounts from `src/lib/taxLaw.ts` (add a year there when the IRS publishes it)
- Shareable links, saved settings, and a "How this is calculated" section

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

4. Run the tests:
```bash
npm test
```

## Built With

- React
- Recharts
- Tailwind CSS