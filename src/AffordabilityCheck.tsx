import React from "react";

export const AffordabilityCheck = ({ projectionData }) => {
    if (!projectionData) return null;
  
    if (projectionData.error) {
      // Format currency values
      const formatCurrency = (value) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          maximumFractionDigits: 0
        }).format(value);
      };
  
      // Extract numerical details from error message
      let details = null;
  
      if (projectionData.error.includes("Monthly housing costs exceed")) {
        details = {
          title: "Monthly Costs Exceed Income",
          items: [
            {
              label: "Monthly Take-Home Pay",
              value: formatCurrency(projectionData.monthlyTakeHome || 0)
            },
            {
              label: "Monthly Housing Costs",
              value: formatCurrency(projectionData.monthlyHousingCosts || 0)
            },
            {
              label: "Monthly Shortfall",
              value: formatCurrency((projectionData.monthlyHousingCosts || 0) - (projectionData.monthlyTakeHome || 0))
            }
          ]
        };
      } else if (projectionData.error.includes("Insufficient initial investment")) {
        details = {
          title: "Insufficient Down Payment",
          items: [
            {
              label: "Required Upfront Costs",
              value: formatCurrency(projectionData.requiredUpfront || 0)
            },
            {
              label: "Available Investment",
              value: formatCurrency(projectionData.availableInvestment || 0)
            },
            {
              label: "Shortfall",
              value: formatCurrency((projectionData.requiredUpfront || 0) - (projectionData.availableInvestment || 0))
            }
          ]
        };
      }
  
      return (
        <div className="w-full mb-4">
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded">
            <div className="flex flex-col">
              <div className="ml-3">
                <h3 className="text-red-800 font-medium">Cannot Afford Property</h3>
                <div className="text-red-700 text-sm mb-2">
                  {projectionData.error}
                </div>
                {details && (
                  <div className="mt-2 bg-white bg-opacity-50 rounded p-3">
                    <h4 className="text-red-800 font-medium text-sm mb-2">{details.title}</h4>
                    <div className="space-y-2 max-w-lg">
                      {details.items.map((item, index) => (
                        <div key={index} className="grid" style={{ gridTemplateColumns: 'auto 120px' }}>
                          <span className="text-red-700 text-sm">{item.label}</span>
                          <span className="text-red-800 font-medium text-sm text-right">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
  
    return (
      <div className="w-full mb-4">
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-green-800 font-medium">Property is Affordable</h3>
              <div className="text-green-700 text-sm">
                Your income and savings are sufficient for this property based on the current settings.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
};

export default AffordabilityCheck;