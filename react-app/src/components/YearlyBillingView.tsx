import React from 'react';
import type { BillingYearWithId } from '@/types/api';
import { renderDataTable } from '@/utils/tableDataTransform';

interface YearlyBillingViewProps {
  /** Full billing year data */
  data: BillingYearWithId;
}

const YearlyBillingView: React.FC<YearlyBillingViewProps> = ({ data }) => {
  if (!data || !data.billing_months || data.billing_months.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No billing data available for this year
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>
        Full Year Data: {data.months?.[0]?.month_name} {data.months?.[0]?.year} -{' '}
        {data.months?.[data.months.length - 1]?.month_name}{' '}
        {data.months?.[data.months.length - 1]?.year}
      </h2>

      {data.billing_months.map((month, monthIdx) => {
        const monthLabel = month.month_label?.month_name || `Month ${monthIdx + 1}`;
        const year = month.month_label?.year || month.year;
        const tableData = renderDataTable(month as unknown as Record<string, unknown>);

        return (
          <div key={monthIdx} style={{ marginBottom: '40px' }}>
            <h3
              style={{
                marginBottom: '10px',
                padding: '10px',
                backgroundColor: '#f0f0f0',
                borderLeft: '4px solid #0066cc',
              }}
            >
              {monthLabel} {year}
            </h3>

            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '12px',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th
                      style={{
                        border: '1px solid #ccc',
                        padding: '8px',
                        textAlign: 'left',
                      }}
                    >
                      Property
                    </th>
                    <th
                      style={{
                        border: '1px solid #ccc',
                        padding: '8px',
                        textAlign: 'right',
                      }}
                    >
                      Value
                    </th>
                    <th
                      style={{
                        border: '1px solid #ccc',
                        padding: '8px',
                        textAlign: 'left',
                      }}
                    >
                      Unit
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableData.map((row, idx) => (
                    <tr
                      key={idx}
                      style={{
                        backgroundColor: idx % 2 === 0 ? '#fff' : '#f9f9f9',
                      }}
                    >
                      <td
                        style={{
                          border: '1px solid #ccc',
                          padding: '6px',
                          fontFamily: 'monospace',
                          fontSize: '11px',
                        }}
                      >
                        {row.key}
                      </td>
                      <td
                        style={{
                          border: '1px solid #ccc',
                          padding: '6px',
                          textAlign: 'right',
                          fontWeight: 'bold',
                        }}
                      >
                        {row.value}
                      </td>
                      <td style={{ border: '1px solid #ccc', padding: '6px' }}>
                        {row.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default YearlyBillingView;
