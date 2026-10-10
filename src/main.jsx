import React from 'react'
import ReactDOM from 'react-dom/client'
import HousingCalculator from './HousingCalculator'
import { ErrorBoundary } from './components/ErrorBoundary'
import { migrateSavedSettings, getBrowserStorage } from './lib/inputValidation'
import { syncSavedSettings } from './lib/personalConfig'
import { PERSONAL_CONFIG } from './hooks/useCalculatorInputs'
import './index.css'

// Must run before any component reads saved settings
const storage = getBrowserStorage()
migrateSavedSettings(storage)
syncSavedSettings(storage, PERSONAL_CONFIG)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HousingCalculator />
    </ErrorBoundary>
  </React.StrictMode>
)
