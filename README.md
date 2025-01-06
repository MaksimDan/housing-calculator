# Housing Investment Calculator

An interactive tool to compare the financial implications of buying vs. renting a home. This calculator helps users make informed decisions by visualizing long-term financial outcomes based on various parameters.

## Features

- Real-time calculation of buying vs. renting scenarios
- Interactive sliders for adjusting key financial parameters:
  - Home price
  - Down payment percentage
  - Mortgage rate
  - Property tax rate
  - Home appreciation rate
  - Investment return rate
  - Monthly rent
  - Rent increase rate
- Dynamic visualization using Recharts
- Break-even point calculation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/housing-calculator.git
cd housing-calculator
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:5173](http://localhost:5173) to view it in your browser.

## Usage

1. Adjust the sliders to input your specific financial parameters
2. The graph will update in real-time to show:
   - The buying scenario equity (blue line)
   - The renting scenario equity (green line)
3. The break-even point shows when buying becomes more financially advantageous than renting

## Key Assumptions

The calculator makes the following assumptions:
- Home insurance is calculated at 0.5% of home value annually
- Home maintenance costs are estimated at 1% of home value annually
- Mortgage calculations include principal and interest (P&I)
- The renting scenario assumes the down payment amount is invested
- All rates are assumed to remain constant over the analysis period

## Technical Details

Built with:
- React
- Recharts for data visualization
- Tailwind CSS for styling

## License

This project is licensed under the MIT License - see the LICENSE file for details

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request