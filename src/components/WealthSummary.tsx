// File: src/components/WealthSummary.tsx
import React from 'react';

interface WealthSummaryProps {
    xAxisYears: number;
    projectionData: any[];
}

export const WealthSummary: React.FC<WealthSummaryProps> = ({ xAxisYears, projectionData }) => {
    // Rows are whole years; never index with a fractional or out-of-range year
    const row = projectionData[Math.min(Math.floor(xAxisYears), projectionData.length - 1)];
    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="text-sm text-gray-600 mb-2">Net Worth at Year {row.year}</div>
            <div className="flex gap-6">
                <div className="text-center">
                    <div className="text-xs text-blue-600 mb-1">Buying</div>
                    <div className="text-lg font-semibold text-blue-600">
                        ${row.buying.toLocaleString()}
                    </div>
                </div>
                <div className="text-center">
                    <div className="text-xs text-green-600 mb-1">Renting</div>
                    <div className="text-lg font-semibold text-green-600">
                        ${row.renting.toLocaleString()}
                    </div>
                </div>
            </div>
        </div>
    );
};