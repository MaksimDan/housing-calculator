import React from 'react';
import { clearSavedSettings, getBrowserStorage } from '../lib/inputValidation';

interface ErrorBoundaryState {
  error: Error | null;
}

// Last line of defence: a render error shows a recovery screen instead of a
// blank page. Saved settings are the most likely cause of a repeat crash, so
// the screen offers to clear them.
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Housing calculator crashed:', error, info.componentStack);
  }

  resetSavedSettings = () => {
    clearSavedSettings(getBrowserStorage());
    window.location.assign(window.location.pathname);
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-white p-6">
        <div className="max-w-xl mx-auto mt-16 p-6 bg-red-50 border-l-4 border-red-500 rounded">
          <h1 className="text-lg font-medium text-red-800 mb-2">Something went wrong</h1>
          <p className="text-sm text-red-700 mb-4">
            The calculator hit an error, possibly from a saved setting or a shared link.
            Resetting restores the default inputs.
          </p>
          <button
            onClick={this.resetSavedSettings}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700"
          >
            Reset saved settings and reload
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
