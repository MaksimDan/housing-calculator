import React from 'react'
import ReactDOM from 'react-dom/client'
import HousingCalculator from './HousingCalculator'
import { ErrorBoundary } from './components/ErrorBoundary'
import { migrateSavedSettings, getBrowserStorage } from './lib/inputValidation'
import './index.css'

// Must run before any component reads saved settings
migrateSavedSettings(getBrowserStorage())

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HousingCalculator />
    </ErrorBoundary>
  </React.StrictMode>
)
