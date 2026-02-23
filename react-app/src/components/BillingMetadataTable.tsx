import React, { useState, useMemo } from 'react';
import type {
  MeterBillingMonth,
  EnergyDate,
  EnergyMetric,
  EnergyMetricTOU,
} from '@/types/generated/billing';
import type {
  MeterMetadata,
  FieldMetadata,
  FieldSource,
} from '@/types/generated/metadata';
import { getMetricValue, formatEnergyValue } from '@/types/utils';

interface BillingMetadataTableProps {
  /** Billing data for a single meter (main or adu) */
  meterData: MeterBillingMonth | undefined | null;

  /** Metadata for the same meter type */
  meterMetadata: MeterMetadata | undefined | null;

  /** Maximum height for scrollable area */
  maxHeight: number;
}

type SortColumn = 'fieldName' | 'type' | 'tou' | 'unit' | 'value' | 'whereFrom' | 'page' | 'numberCode';
type SortDirection = 'asc' | 'desc';

interface BillingMetadataTableRow {
  fieldName: string;
  type: 'Date Field' | 'Simple Field' | 'TOU Field';
  tou: string;
  unit: string;
  value: string;
  whereFrom: string;
  page: string;
  numberCode: string;
}

/**
 * Helper to extract first source from metadata or return null
 */
function getFirstSource(fieldMeta: FieldMetadata | undefined | null): FieldSource | null {
  if (!fieldMeta) return null;

  const fieldType = fieldMeta.metadata?.$case;

  if (fieldType === 'date_field') {
    const sources = fieldMeta.metadata.date_field.where_found;
    return (sources && sources.length > 0 ? sources[0] : null) ?? null;
  }

  if (fieldType === 'simple_field') {
    const sources = fieldMeta.metadata.simple_field.where_found;
    return (sources && sources.length > 0 ? sources[0] : null) ?? null;
  }

  return null;
}

/**
 * Helper to get source from TOU component metadata
 */
function getTOUComponentSource(
  touMeta: any,
  component: 'peak' | 'off_peak' | 'total'
): FieldSource | null {
  if (!touMeta) return null;

  const componentMeta = touMeta[component];
  if (!componentMeta?.where_found) return null;

  const sources = componentMeta.where_found;
  return (sources && sources.length > 0 ? sources[0] : null) ?? null;
}

/**
 * Infer field type from billing data structure
 * Falls back to metadata if available
 */
function inferFieldType(
  fieldValue: any,
  metadataType?: string
): 'date_field' | 'simple_field' | 'tou_field' {
  // Use metadata type if available
  if (metadataType === 'date_field' || metadataType === 'simple_field' || metadataType === 'tou_field') {
    return metadataType;
  }

  // Infer from data structure
  if (fieldValue?.value && typeof fieldValue.value === 'string' && fieldValue.value.match(/^\d{4}-\d{2}-\d{2}/)) {
    return 'date_field'; // EnergyDate has ISO 8601 string
  }

  if (fieldValue?.peak || fieldValue?.off_peak || fieldValue?.total) {
    return 'tou_field'; // EnergyMetricTOU has these properties
  }

  return 'simple_field'; // Default to simple field (EnergyMetric)
}

/**
 * Transform billing data into table rows (data-driven approach)
 * Iterates over billing data fields and looks up metadata for each
 */
function billingDataToRows(
  billingData: MeterBillingMonth,
  metadata: MeterMetadata | undefined | null
): BillingMetadataTableRow[] {
  const rows: BillingMetadataTableRow[] = [];

  // Iterate over all fields in billing data
  Object.keys(billingData).forEach((fieldName) => {
    // Skip nem2a_meter_type field - it's metadata, not actual data
    if (fieldName === 'nem2a_meter_type') return;

    const fieldValue = billingData[fieldName as keyof MeterBillingMonth];
    if (!fieldValue) return; // Skip null/undefined fields

    // Look up metadata for this field (may not exist)
    const fieldMeta = metadata?.fields?.[fieldName];
    const fieldType = fieldMeta?.metadata?.$case;

    // Determine field type from metadata or infer from data
    const inferredType = inferFieldType(fieldValue, fieldType);

    // Date Field: Single row
    if (inferredType === 'date_field') {
      const dateField = fieldValue as EnergyDate;
      const firstSource = getFirstSource(fieldMeta);

      rows.push({
        fieldName,
        type: 'Date Field',
        tou: '—',
        unit: '—',
        value: dateField.value || 'N/A',
        whereFrom: firstSource?.where_from || '—',
        page: firstSource?.where_on_pdf || '—',
        numberCode: (firstSource?.kevins_number_code as unknown as number)?.toString() || '—',
      });
    }

    // Simple Field: Single row
    else if (inferredType === 'simple_field') {
      const metric = fieldValue as EnergyMetric;
      const simpleField = fieldMeta?.metadata?.simple_field;
      const firstSource = getFirstSource(fieldMeta);

      rows.push({
        fieldName,
        type: 'Simple Field',
        tou: '—',
        unit: simpleField?.unit || '—',
        value: formatEnergyValue(getMetricValue(metric)),
        whereFrom: firstSource?.where_from || '—',
        page: firstSource?.where_on_pdf || '—',
        numberCode: (firstSource?.kevins_number_code as unknown as number)?.toString() || '—',
      });
    }

    // TOU Field: Three rows (Peak, Off-Peak, Total)
    else if (inferredType === 'tou_field') {
      const touField = fieldValue as EnergyMetricTOU;
      const touMeta = fieldMeta?.metadata?.tou_field;

      // Peak row
      if (touField.peak) {
        const peakSource = getTOUComponentSource(touMeta, 'peak');
        rows.push({
          fieldName,
          type: 'TOU Field',
          tou: 'Peak',
          unit: touMeta?.peak?.unit || '—',
          value: formatEnergyValue(getMetricValue(touField.peak)),
          whereFrom: peakSource?.where_from || '—',
          page: peakSource?.where_on_pdf || '—',
          numberCode: (peakSource?.kevins_number_code as unknown as number)?.toString() || '—',
        });
      }

      // Off-Peak row
      if (touField.off_peak) {
        const offPeakSource = getTOUComponentSource(touMeta, 'off_peak');
        rows.push({
          fieldName,
          type: 'TOU Field',
          tou: 'Off-Peak',
          unit: touMeta?.off_peak?.unit || '—',
          value: formatEnergyValue(getMetricValue(touField.off_peak)),
          whereFrom: offPeakSource?.where_from || '—',
          page: offPeakSource?.where_on_pdf || '—',
          numberCode: (offPeakSource?.kevins_number_code as unknown as number)?.toString() || '—',
        });
      }

      // Total row
      if (touField.total) {
        const totalSource = getTOUComponentSource(touMeta, 'total');
        rows.push({
          fieldName,
          type: 'TOU Field',
          tou: 'Total',
          unit: touMeta?.total?.unit || '—',
          value: formatEnergyValue(getMetricValue(touField.total)),
          whereFrom: totalSource?.where_from || '—',
          page: totalSource?.where_on_pdf || '—',
          numberCode: (totalSource?.kevins_number_code as unknown as number)?.toString() || '—',
        });
      }
    }
  });

  return rows;
}

/**
 * Sort rows by column with numeric-aware sorting
 */
function sortRows(
  rows: BillingMetadataTableRow[],
  column: SortColumn,
  direction: SortDirection
): BillingMetadataTableRow[] {
  return [...rows].sort((a, b) => {
    let aVal: string | number = a[column];
    let bVal: string | number = b[column];

    // Numeric sorting for numberCode and value columns
    if (column === 'numberCode' || column === 'value') {
      // Empty values always last
      const aIsEmpty = aVal === '—' || aVal === 'N/A';
      const bIsEmpty = bVal === '—' || bVal === 'N/A';

      if (aIsEmpty && bIsEmpty) return 0;
      if (aIsEmpty) return 1;  // a goes after b
      if (bIsEmpty) return -1; // b goes after a

      // Numeric comparison for non-empty values
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);

      if (aNum < bNum) return direction === 'asc' ? -1 : 1;
      if (aNum > bNum) return direction === 'asc' ? 1 : -1;
      return 0;
    }

    // Case-insensitive string sorting for other columns
    if (typeof aVal === 'string') aVal = aVal.toLowerCase();
    if (typeof bVal === 'string') bVal = bVal.toLowerCase();

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Table component for displaying billing data with metadata enrichment.
 * Shows field names, types, TOU components, units, values, and source information.
 * Data-driven approach: iterates over billing data fields and looks up metadata.
 */
export const BillingMetadataTable: React.FC<BillingMetadataTableProps> = ({
  meterData,
  meterMetadata,
  maxHeight,
}) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('fieldName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Transform billing data into table rows (data-driven!)
  const rows = useMemo(() => {
    if (!meterData) return [];
    const transformedRows = billingDataToRows(meterData, meterMetadata);
    return sortRows(transformedRows, sortColumn, sortDirection);
  }, [meterData, meterMetadata, sortColumn, sortDirection]);

  // Handle column header click
  const handleHeaderClick = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column: default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Empty state
  if (!meterData || rows.length === 0) {
    return <div>No billing data available</div>;
  }

  // Table styles (exact match to MetadataModal)
  const containerStyle: React.CSSProperties = {
    maxHeight: `${maxHeight}px`,
    overflow: 'auto',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
    fontSize: '12px',
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: '#f0f0f0',
    padding: '8px',
    textAlign: 'left',
    fontWeight: 600,
    border: '1px solid #ccc',
    color: '#333',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'sticky',
    top: 0,
  };

  const tdStyle: React.CSSProperties = {
    padding: '6px',
    border: '1px solid #ccc',
    verticalAlign: 'middle',
    fontSize: '11px',
  };

  return (
    <div style={containerStyle}>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th
              style={thStyle}
              onClick={() => handleHeaderClick('fieldName')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            >
              Field Name {sortColumn === 'fieldName' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th
              style={thStyle}
              onClick={() => handleHeaderClick('type')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            >
              Type {sortColumn === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th
              style={thStyle}
              onClick={() => handleHeaderClick('tou')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            >
              TOU {sortColumn === 'tou' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th
              style={thStyle}
              onClick={() => handleHeaderClick('unit')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            >
              Unit {sortColumn === 'unit' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th
              style={thStyle}
              onClick={() => handleHeaderClick('whereFrom')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            >
              Where From {sortColumn === 'whereFrom' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th
              style={thStyle}
              onClick={() => handleHeaderClick('page')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            >
              Page {sortColumn === 'page' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th
              style={thStyle}
              onClick={() => handleHeaderClick('numberCode')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            >
              Number Code {sortColumn === 'numberCode' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
            <th
              style={thStyle}
              onClick={() => handleHeaderClick('value')}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
            >
              Value {sortColumn === 'value' && (sortDirection === 'asc' ? '▲' : '▼')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            // Check if we should merge field names (only when sorting by fieldName)
            const shouldMergeFieldNames = sortColumn === 'fieldName';
            const isFirstInGroup = idx === 0 || rows[idx - 1]?.fieldName !== row.fieldName;

            // Count how many consecutive rows have the same field name
            let rowSpan = 1;
            if (shouldMergeFieldNames && isFirstInGroup) {
              for (let i = idx + 1; i < rows.length; i++) {
                if (rows[i]?.fieldName === row.fieldName) {
                  rowSpan++;
                } else {
                  break;
                }
              }
            }

            return (
              <tr
                key={`${row.fieldName}-${row.tou}-${idx}`}
                style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}
              >
                {/* Only render field name cell for first row in group when merging */}
                {(!shouldMergeFieldNames || isFirstInGroup) && (
                  <td
                    style={{
                      ...tdStyle,
                      verticalAlign: shouldMergeFieldNames && rowSpan > 1 ? 'top' : 'middle'
                    }}
                    rowSpan={shouldMergeFieldNames ? rowSpan : 1}
                  >
                    {row.fieldName}
                  </td>
                )}
                {/* Other cells render normally */}
                <td style={tdStyle}>{row.type}</td>
                <td style={tdStyle}>{row.tou}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{row.unit}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{row.whereFrom}</td>
                <td style={tdStyle}>{row.page}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace' }}>{row.numberCode}</td>
                <td style={{ ...tdStyle, fontFamily: 'monospace', textAlign: 'right', fontWeight: 'bold' }}>
                  {row.value}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
