import React from 'react';
import type { TableRow } from '@/utils/tableDataTransform';

interface RawDataTableProps {
  /** Pre-computed table rows */
  tableData: TableRow[];
  /** Maximum height for scrollable area */
  maxHeight: number;
}

const RawDataTable: React.FC<RawDataTableProps> = ({
  tableData,
  maxHeight,
}) => {
  return (
    <div style={{ flex: 1, maxHeight, overflowY: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '12px',
        }}
      >
        <thead>
          <tr
            style={{
              backgroundColor: '#f0f0f0',
              position: 'sticky',
              top: 0,
            }}
          >
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RawDataTable;
