// File: src/components/ScenarioTabs.tsx
import React from 'react';

interface ScenarioTabsProps {
    activeScenario: string;
    setActiveScenario: (scenario: string) => void;
}

export const ScenarioTabs: React.FC<ScenarioTabsProps> = ({ activeScenario, setActiveScenario }) => {
    return (
        <div className="mb-6">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveScenario('buying')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeScenario === 'buying'
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            Property Owner Cash Flow
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveScenario('renting')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${activeScenario === 'renting'
                            ? 'border-green-500 text-green-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            Renter Cash Flow
                        </div>
                    </button>
                </nav>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                {activeScenario === 'buying' ? (
                    <div>
                        <h3 className="font-medium text-blue-700 mb-2">Property Owner Strategy</h3>
                        <p className="text-sm text-gray-600">
                            Visualizes how your income flows to mortgage payments, property taxes, maintenance,
                            and other homeownership costs. Shows equity building through principal payments and
                            home appreciation, plus investment growth from remaining income. Does not assume home is sold.
                        </p>
                    </div>
                ) : (
                    <div>
                        <h3 className="font-medium text-green-700 mb-2">Renter Strategy</h3>
                        <p className="text-sm text-gray-600">
                            Visualizes how your income flows to rent, utilities, and living expenses.
                            Shows wealth building entirely through investment growth from the larger
                            amount of remaining income after housing costs. Does not assume that stocks are sold.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};