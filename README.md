# Housing Investment Calculator

https://housing-calculator-livid.vercel.app/

An interactive web tool to compare owning a home with renting one over time, from either side: you rent today and are deciding whether to buy, or you own today and are deciding whether to keep your home or sell it and rent. It shows the long-term net worth of each path based on your financial inputs.

## Features

- **Your situation first:** "I rent" compares buying (down payment, closing costs, a new mortgage) with renting on; "I own my home" compares keeping it (your loan as it stands, no purchase costs) with selling it now (selling costs and the payoff come out of the sale, the rest is invested) and renting. Labels, inputs, the verdict and every table follow the choice, the page spells out what each path pays, and each situation keeps its own home and rent inputs while income, savings, taxes and market assumptions are shared
- **Answer first:** who comes out ahead, by how much (in future and today's dollars), how the lead evolves, and what would flip it (e.g. "buying wins if rent > $3,941/mo")
- **What drives this:** the seven inputs that move the result most, as typed fields, with every other assumption in a grouped drawer
- **Own-minus-rent chart** with one shared year selector, a side-by-side Buy | Rent (Keep | Sell & rent for an owner) | Difference table, and an all-years table
- **Dig deeper:** monthly cash flow, tax savings by year, and the mortgage amortization
- **If you buy (or keep): prepay or invest?** using the same inputs, limited to what you can afford, with the break-even return
- **Tax law by year:** tax year and filing status fill in the statutory amounts from `src/lib/taxLaw.ts` (add a year there when the IRS publishes it)
- **Your state:** the state picker fills in that state's income tax rate (from its brackets, deductions and credits for your salary and filing status, plus the county income tax every Maryland and Indiana resident pays), its typical property tax rate, and its cap on how fast an assessment can grow (California's Prop 13, Florida's Save Our Homes, Texas' 10% homestead cap; none in states without one). Each rule lives in one table keyed by state: `src/lib/stateIncomeTax.ts` and `src/lib/statePropertyTax.ts`, behind `src/lib/stateLaw.ts`. Fields you've typed your own value into are kept, with the state's value offered beside them
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

## Your own numbers

To start from your own situation instead of the example household, copy `personal.config.example.ts` to `personal.config.ts` and set the inputs you know (including `situation: 'owner'` if you own); anything you leave out keeps its default. Each situation keeps its own home and rent inputs, so an owner's numbers never leak into a purchase: the ones at the top level belong to the situation the page opens in, and the other situation's go in a `renter: {...}` or `owner: {...}` block. `npm run dev` then opens on your numbers (the header shows a `personal.config.ts` badge), Reset returns to them, and saving the file reloads the page with it.

`personal.config.ts` is git-ignored, and only the dev server reads it: `npm run build`, the tests and the deployed site always use the defaults, even on a machine that has the file.

## Built With

- React
- Recharts
- Tailwind CSS