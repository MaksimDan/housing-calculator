// File: src/components/NetWorthTable.tsx
import React from 'react';

interface NetWorthTableProps {
    projectionData: any[];
    xAxisYears: number;
}

export const NetWorthTable: React.FC<NetWorthTableProps> = ({ projectionData, xAxisYears }) => {
    return (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium mb-4">
                Net Worth Comparison Table
            </h3>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200">
                            <th className="px-4 py-2 text-left font-medium text-gray-600">
                                Year
                            </th>
                            <th className="px-4 py-2 text-right font-medium text-blue-600">
                                Buying
                            </th>
                            <th className="px-4 py-2 text-right font-medium text-green-600">
                                Renting
                            </th>
                            <th className="px-4 py-2 text-right font-medium text-gray-600">
                                Difference
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {projectionData.slice(0, xAxisYears + 1).map((row) => {
                            const difference = row.buying - row.renting;
                            return (
                                <tr
                                    key={row.year}
                                    className="border-b border-gray-100 hover:bg-gray-50"
                                >
                                    <td className="px-4 py-2 text-left text-gray-600">
                                        {row.year}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-blue-600">
                                        ${Math.abs(row.buying).toLocaleString()}
                                    </td>
                                    <td className="px-4 py-2 text-right font-medium text-green-600">
                                        ${Math.abs(row.renting).toLocaleString()}
                                    </td>
                                    <td
                                        className={`px-4 py-2 text-right font-medium ${difference >= 0 ? "text-blue-600" : "text-green-600"
                                            }`}
                                    >
                                        {difference >= 0 ? "+" : "-"}$
                                        {Math.abs(difference).toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};