// File: src/components/NetWorthChart.tsx
import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';

interface NetWorthChartProps {
    projectionData: any[];
    xAxisYears: number;
    setActivePoint: (point: any) => void;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({ projectionData, xAxisYears, setActivePoint }) => {
    const findBreakEvenYear = () => {
        for (let i = 0; i < projectionData.length; i++) {
            if (projectionData[i].buying > projectionData[i].renting) {
                return i;
            }
        }
        return null;
    };

    const breakEvenYear = findBreakEvenYear();
    const finalDifference = projectionData[Math.min(xAxisYears, projectionData.length - 1)].buying - projectionData[Math.min(xAxisYears, projectionData.length - 1)].renting;
    const isBuyingBetterAtEnd = finalDifference > 0;

    return (
        <div className="col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className={`text-center p-4 rounded-lg ${isBuyingBetterAtEnd
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-green-50 text-green-700 border border-green-200'}`}>
                {breakEvenYear !== null
                    ? `In year ${breakEvenYear}, buying becomes better than renting${isBuyingBetterAtEnd
                        ? `. By year ${xAxisYears}, you'll have $${Math.abs(
                            finalDifference
                        ).toLocaleString()} more by buying.`
                        : `, but by year ${xAxisYears}, renting becomes better again. You'll have $${Math.abs(
                            finalDifference
                        ).toLocaleString()} more by renting.`
                    }`
                    : `Renting starts better${isBuyingBetterAtEnd
                        ? `, but by year ${xAxisYears}, buying becomes better. You'll have $${Math.abs(
                            finalDifference
                        ).toLocaleString()} more by buying.`
                        : ` and stays better for all ${xAxisYears} years. By the end, you'll have $${Math.abs(
                            finalDifference
                        ).toLocaleString()} more by renting.`
                    }`}
            </div>
            <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                        data={projectionData.slice(0, xAxisYears + 1)}
                        margin={{ top: 30, right: 30, left: 60, bottom: 5 }}
                        onMouseMove={(e) => {
                            if (e.activePayload) {
                                setActivePoint(e.activePayload[0].payload);
                            }
                        }}
                        onMouseLeave={() => setActivePoint(null)}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                            dataKey="year"
                            stroke="#666"
                            label={{
                                value: "Years",
                                position: "insideBottom",
                                offset: -5,
                            }}
                            domain={[0, xAxisYears]}
                        />
                        <YAxis
                            stroke="#666"
                            tickFormatter={(value) => `${Math.abs(value / 1000)}k`}
                            label={{
                                value: "Net Worth",
                                angle: -90,
                                position: "insideLeft",
                                offset: -45,
                            }}
                        />
                        <Tooltip
                            formatter={(value, name) => {
                                if (name === "difference") {
                                    return [`$${Math.abs(value).toLocaleString()}`, "Difference (Buy vs Rent)"];
                                }
                                return [
                                    `$${Math.abs(value).toLocaleString()}`,
                                    value < 0 ? "Initial Investment/Costs" : "Net Worth",
                                ];
                            }}
                            labelFormatter={(value) => `Year ${value}`}
                        />
                        <Legend
                            verticalAlign="top"
                            height={36}
                            formatter={(value) => {
                                const labels = {
                                    buying: "Buy Property & Invest",
                                    renting: "Rent & Invest",
                                    difference: "Net Worth Difference"
                                };
                                return labels[value] || value;
                            }}
                        />
                        <Line
                            type="monotone"
                            dataKey="buying"
                            name="buying"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="renting"
                            name="renting"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey={(dataPoint) => dataPoint.buying - dataPoint.renting}
                            name="difference"
                            stroke="#9333ea"
                            strokeWidth={2}
                            strokeDasharray="4 4"
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};