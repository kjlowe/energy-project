import React, { useState, CSSProperties } from 'react';
import type { BillingYearWithId } from '@/types/api';
import { tableConfig, type ColumnConfig, type EnergyMetricWithValue } from '@/utils/yearlyBillingTableConfig';
import { formatValue } from '@/utils/formatters';
import { generateYearLabel } from '@/utils/yearLabel';

interface YearlyBillingViewProps {
  /** Full billing year data */
  data: BillingYearWithId;
}

/**
 * Renders multi-level headers for units (main, adu)
 */
function renderUnitHeaders(columns: ColumnConfig[]): JSX.Element[] {
  const groups: { unit: string; colspan: number }[] = [];

  let currentUnit = '';
  let colspan = 0;

  columns.forEach((col) => {
    const unit = col.headers.unit || '';
    if (unit !== currentUnit) {
      if (colspan > 0) {
        groups.push({ unit: currentUnit, colspan });
      }
      currentUnit = unit;
      colspan = 1;
    } else {
      colspan++;
    }
  });

  if (colspan > 0) {
    groups.push({ unit: currentUnit, colspan });
  }

  return groups.map((group, idx) => (
    <th
      key={idx}
      colSpan={group.colspan}
      style={{
        border: '1px solid #dee2e6',
        borderRight: idx < groups.length - 1 ? '3px solid #000' : '1px solid #dee2e6',
        padding: '8px',
        backgroundColor: '#f8f9fa',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: '13px',
      }}
    >
      {group.unit}
    </th>
  ));
}

/**
 * Renders multi-level headers for categories
 */
function renderCategoryHeaders(columns: ColumnConfig[]): JSX.Element[] {
  const groups: { category: string; colspan: number; isUnitBoundary: boolean }[] = [];

  let currentCategory = '';
  let currentUnit = '';
  let colspan = 0;

  columns.forEach((col) => {
    const category = col.headers.category || '';
    const unit = col.headers.unit || '';
    const isUnitChange = unit !== currentUnit;

    if (category !== currentCategory || isUnitChange) {
      if (colspan > 0) {
        groups.push({ category: currentCategory, colspan, isUnitBoundary: false });
      }
      currentCategory = category;
      currentUnit = unit;
      colspan = 1;
    } else {
      colspan++;
    }
  });

  if (colspan > 0) {
    groups.push({ category: currentCategory, colspan, isUnitBoundary: false });
  }

  // Mark unit boundaries
  let lastUnit = columns[0]?.headers.unit || '';
  groups.forEach((group, idx) => {
    const firstColInGroup = columns.slice(0, idx + 1).reduce((sum, _, i) => {
      return i < idx ? sum + groups[i]!.colspan : sum;
    }, 0);
    const col = columns[firstColInGroup];
    if (col && col.headers.unit !== lastUnit) {
      group.isUnitBoundary = true;
      lastUnit = col.headers.unit || '';
    }
  });

  return groups.map((group, idx) => (
    <th
      key={idx}
      colSpan={group.colspan}
      style={{
        border: '1px solid #dee2e6',
        borderLeft: group.isUnitBoundary ? '3px solid #000' : '1px solid #dee2e6',
        padding: '8px',
        backgroundColor: '#e9ecef',
        fontWeight: 'bold',
        textAlign: 'center',
        fontSize: '11px',
        whiteSpace: 'pre-wrap',
      }}
    >
      {group.category}
    </th>
  ));
}

/**
 * Get column background color based on group
 */
function getColumnStyle(group: string, isUnitBoundary: boolean): CSSProperties {
  const groupColors: Record<string, string> = {
    dates: '#f8f9fa',
    energy_export: '#fff9c4',      // Yellowy color
    energy_import: '#e3f2fd',       // Light blue
    allocated_credits: '#bbdefb',   // Medium blue
    net_energy: '#90caf9',          // Darker blue
    pce: '#f3e5f5',
    pge: '#c8e6c9',                 // Greeny color
    totals: '#bdbdbd',              // Dark grey
  };

  return {
    border: '1px solid #dee2e6',
    borderLeft: isUnitBoundary ? '3px solid #000' : '1px solid #dee2e6',
    padding: '6px',
    backgroundColor: groupColors[group] || '#fff',
    textAlign: 'right',
    fontSize: '11px',
    fontFamily: 'monospace',
    whiteSpace: 'nowrap',
  };
}

const YearlyBillingView: React.FC<YearlyBillingViewProps> = ({ data }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  if (!data || !data.billing_months || data.billing_months.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
        No billing data available for this year
      </div>
    );
  }

  // Combine columns from both units
  const allColumns = [...tableConfig.main, ...tableConfig.adu];

  // Get subheaders
  const subheaders = allColumns.map((col) => col.headers.subheader);

  // Determine unit boundaries for styling
  const unitBoundaries = allColumns.map((col, idx) => {
    if (idx === 0) return false;
    return col.headers.unit !== allColumns[idx - 1]?.headers.unit;
  });

  // Toggle row expansion
  const toggleRow = (rowIdx: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(rowIdx)) {
      newExpanded.delete(rowIdx);
    } else {
      newExpanded.add(rowIdx);
    }
    setExpandedRows(newExpanded);
  };

  // Check if a month has any metric with 2+ subcomponents
  const hasMultipleSubcomponents = (
    month: BillingYearWithId['billing_months'][number]
  ): boolean => {
    return allColumns.some((col) => {
      const cellData = col.accessor(month);
      const subValues = (cellData as EnergyMetricWithValue)?.subcomponent_values;
      return subValues && subValues.length > 1;
    });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
        {generateYearLabel(data)}
      </h2>

      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <table
          style={{
            width: 'max-content',
            borderCollapse: 'collapse',
            fontSize: '11px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          <thead>
            {/* Row 1: Unit Headers (main, adu) */}
            <tr>
              <th
                rowSpan={3}
                style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRight: '2px solid #000',
                  fontWeight: 'bold',
                  padding: '8px',
                  zIndex: 3,
                  minWidth: '120px',
                  textAlign: 'left',
                }}
              >
                month_label
              </th>
              {renderUnitHeaders(allColumns)}
            </tr>

            {/* Row 2: Category Headers (API field names) */}
            <tr>{renderCategoryHeaders(allColumns)}</tr>

            {/* Row 3: Metric names (off_peak, peak, total, etc.) */}
            <tr>
              {subheaders.map((header, idx) => (
                <th
                  key={idx}
                  style={{
                    border: '1px solid #dee2e6',
                    borderLeft: unitBoundaries[idx] ? '3px solid #000' : '1px solid #dee2e6',
                    padding: '6px',
                    backgroundColor: '#f8f9fa',
                    fontWeight: 'bold',
                    textAlign: 'center',
                    fontSize: '10px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {data.billing_months.map((month, rowIdx) => (
              <React.Fragment key={rowIdx}>
                {/* Main total row */}
                <tr style={{ backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                  {/* Period column */}
                  <td
                    style={{
                      position: 'sticky',
                      left: 0,
                      backgroundColor: rowIdx % 2 === 0 ? '#fff' : '#f9f9f9',
                      border: '1px solid #dee2e6',
                      borderRight: '2px solid #000',
                      padding: '8px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      zIndex: 1,
                    }}
                  >
                    {hasMultipleSubcomponents(month) && (
                      <button
                        onClick={() => toggleRow(rowIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          marginRight: '8px',
                          fontSize: '12px',
                          padding: 0,
                        }}
                        aria-label={expandedRows.has(rowIdx) ? 'Collapse' : 'Expand'}
                      >
                        {expandedRows.has(rowIdx) ? '▼' : '▶'}
                      </button>
                    )}
                    {month.month_label?.month_name} {month.month_label?.year}
                  </td>

                  {/* Data columns showing totals */}
                  {allColumns.map((col, colIdx) => {
                    const cellData = col.accessor(month);
                    const value = (cellData as EnergyMetricWithValue)?.value ?? (cellData as { value: string })?.value ?? null;
                    const formatted = formatValue(value, col.format, col.decimals);

                    return (
                      <td key={colIdx} style={getColumnStyle(col.group, unitBoundaries[colIdx] ?? false)}>
                        {formatted}
                      </td>
                    );
                  })}
                </tr>

                {/* Subcomponent rows (if expanded and has multiple subcomponents) */}
                {expandedRows.has(rowIdx) && hasMultipleSubcomponents(month) && renderSubcomponentRows(month, rowIdx, allColumns, unitBoundaries)}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Renders subcomponent breakdown rows for a given month
 */
function renderSubcomponentRows(
  month: BillingYearWithId['billing_months'][number],
  rowIdx: number,
  allColumns: ColumnConfig[],
  unitBoundaries: boolean[]
): JSX.Element[] {
  // Get max length of any subcomponent_values array
  const maxSubcomponents = Math.max(
    ...allColumns.map((col) => {
      const cellData = col.accessor(month);
      const subValues = (cellData as EnergyMetricWithValue)?.subcomponent_values;
      return subValues?.length ?? 1;
    }),
    1
  );

  // Create rows for each subcomponent index
  return Array.from({ length: maxSubcomponents }).map((_, subIdx) => (
    <tr
      key={`${rowIdx}-sub-${subIdx}`}
      style={{
        backgroundColor: rowIdx % 2 === 0 ? '#f5f5f5' : '#eeeeee',
      }}
    >
      <td
        style={{
          position: 'sticky',
          left: 0,
          backgroundColor: rowIdx % 2 === 0 ? '#f5f5f5' : '#eeeeee',
          border: '1px solid #dee2e6',
          borderRight: '2px solid #000',
          padding: '8px',
          paddingLeft: '30px',
          fontSize: '10px',
          fontStyle: 'italic',
          color: '#666',
          whiteSpace: 'nowrap',
          zIndex: 1,
        }}
      >
        └─ subcomponent {subIdx + 1}
      </td>

      {allColumns.map((col, colIdx) => {
        const cellData = col.accessor(month);
        const subValues = (cellData as EnergyMetricWithValue)?.subcomponent_values;
        const subValue = subValues?.[subIdx] ?? null;
        const formatted = formatValue(subValue, col.format, col.decimals);

        return (
          <td
            key={colIdx}
            style={{
              ...getColumnStyle(col.group, unitBoundaries[colIdx] ?? false),
              backgroundColor: rowIdx % 2 === 0 ? '#f5f5f5' : '#eeeeee',
              fontSize: '10px',
            }}
          >
            {formatted}
          </td>
        );
      })}
    </tr>
  ));
}

export default YearlyBillingView;
