import React, { useState, useMemo } from 'react';
import type {
  BillingStructureMetadata,
  FieldMetadata,
  FieldSource,
} from '@/types/generated/metadata';

interface MetadataModalProps {
  metadata: BillingStructureMetadata | null;
  onClose: () => void;
}

type SortColumn = 'fieldName' | 'type' | 'tou' | 'unit' | 'whereFrom' | 'page' | 'numberCode';
type SortDirection = 'asc' | 'desc';

interface TableRow {
  fieldName: string;
  type: 'Date Field' | 'Simple Field' | 'TOU Field';
  tou: string; // 'Peak', 'Off-Peak', 'Total', or '—'
  unit: string;
  whereFrom: string;
  page: string;
  numberCode: string;
}

/**
 * Modal component for displaying billing metadata.
 * Shows units, data sources, and field origins for all billing fields.
 */
export const MetadataModal: React.FC<MetadataModalProps> = ({ metadata, onClose }) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('fieldName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  if (!metadata) return null;

  // Overlay backdrop style
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  // Modal content style
  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '95%',
    width: '1200px',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  };

  // Table styles
  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '12px',
    fontSize: '14px',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: '#2c3e50',
    padding: '14px 12px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #34495e',
    color: '#ecf0f1',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.2s',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px',
    borderBottom: '1px solid #e9ecef',
    verticalAlign: 'middle',
  };

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '5px 10px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: color,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  });

  const unitStyle: React.CSSProperties = {
    fontFamily: 'monospace',
    backgroundColor: '#e3f2fd',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    color: '#1565c0',
    fontWeight: 500,
  };

  const touBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '3px 8px',
    borderRadius: '3px',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#fff3cd',
    color: '#856404',
    border: '1px solid #ffeaa7',
  };

  // Helper to extract first source or return empty values
  const getFirstSource = (sources?: FieldSource[]): FieldSource | null => {
    return (sources && sources.length > 0 ? sources[0] : null) ?? null;
  };

  // Helper to convert fields to flat table rows
  const fieldsToRows = (fields: { [key: string]: FieldMetadata }): TableRow[] => {
    const rows: TableRow[] = [];

    Object.entries(fields).forEach(([fieldName, fieldMeta]) => {
      const fieldType = fieldMeta.metadata?.$case;

      if (fieldType === 'date_field' && fieldMeta.metadata) {
        const dateField = fieldMeta.metadata.date_field;
        const source = getFirstSource(dateField.where_found);
        // API returns kevins_number_code as plain number, not wrapped in OptionalInt32
        const numberCode = source?.kevins_number_code as unknown as number | null;
        rows.push({
          fieldName,
          type: 'Date Field',
          tou: '—',
          unit: '—',
          whereFrom: (source?.where_from as unknown as string) || '—',
          page: source?.where_on_pdf || '—',
          numberCode: numberCode != null ? numberCode.toString() : '—',
        });
      }

      if (fieldType === 'simple_field' && fieldMeta.metadata) {
        const simpleField = fieldMeta.metadata.simple_field;
        const source = getFirstSource(simpleField.where_found);
        // API returns kevins_number_code as plain number, not wrapped in OptionalInt32
        const numberCode = source?.kevins_number_code as unknown as number | null;
        rows.push({
          fieldName,
          type: 'Simple Field',
          tou: '—',
          unit: (simpleField.unit as unknown as string) || 'UNSPECIFIED',
          whereFrom: (source?.where_from as unknown as string) || '—',
          page: source?.where_on_pdf || '—',
          numberCode: numberCode != null ? numberCode.toString() : '—',
        });
      }

      if (fieldType === 'tou_field' && fieldMeta.metadata) {
        const touField = fieldMeta.metadata.tou_field;

        // Peak row
        const peakSource = getFirstSource(touField.peak?.where_found);
        const peakNumberCode = peakSource?.kevins_number_code as unknown as number | null;
        rows.push({
          fieldName,
          type: 'TOU Field',
          tou: 'Peak',
          unit: (touField.peak?.unit as unknown as string) || 'UNSPECIFIED',
          whereFrom: (peakSource?.where_from as unknown as string) || '—',
          page: peakSource?.where_on_pdf || '—',
          numberCode: peakNumberCode != null ? peakNumberCode.toString() : '—',
        });

        // Off-Peak row
        const offPeakSource = getFirstSource(touField.off_peak?.where_found);
        const offPeakNumberCode = offPeakSource?.kevins_number_code as unknown as number | null;
        rows.push({
          fieldName,
          type: 'TOU Field',
          tou: 'Off-Peak',
          unit: (touField.off_peak?.unit as unknown as string) || 'UNSPECIFIED',
          whereFrom: (offPeakSource?.where_from as unknown as string) || '—',
          page: offPeakSource?.where_on_pdf || '—',
          numberCode: offPeakNumberCode != null ? offPeakNumberCode.toString() : '—',
        });

        // Total row
        const totalSource = getFirstSource(touField.total?.where_found);
        const totalNumberCode = totalSource?.kevins_number_code as unknown as number | null;
        rows.push({
          fieldName,
          type: 'TOU Field',
          tou: 'Total',
          unit: (touField.total?.unit as unknown as string) || 'UNSPECIFIED',
          whereFrom: (totalSource?.where_from as unknown as string) || '—',
          page: totalSource?.where_on_pdf || '—',
          numberCode: totalNumberCode != null ? totalNumberCode.toString() : '—',
        });
      }
    });

    return rows;
  };

  // Sorting function
  const sortRows = (rows: TableRow[], column: SortColumn, direction: SortDirection): TableRow[] => {
    return [...rows].sort((a, b) => {
      let aVal: string | number = a[column];
      let bVal: string | number = b[column];

      // Special handling for numeric sorting of numberCode
      if (column === 'numberCode') {
        // Always put empty values ('—') last, regardless of sort direction
        const aIsEmpty = aVal === '—';
        const bIsEmpty = bVal === '—';

        if (aIsEmpty && bIsEmpty) return 0;
        if (aIsEmpty) return 1; // a is empty, put it after b
        if (bIsEmpty) return -1; // b is empty, put it after a

        // Both have values, do numeric comparison
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);

        if (aNum < bNum) return direction === 'asc' ? -1 : 1;
        if (aNum > bNum) return direction === 'asc' ? 1 : -1;
        return 0;
      }

      // Convert to lowercase for case-insensitive sorting
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  // Handle column header click
  const handleHeaderClick = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Memoized sorted rows for generation meter
  const generationRows = useMemo(() => {
    if (!metadata.generation_meter?.fields) return [];
    const rows = fieldsToRows(metadata.generation_meter.fields);
    return sortRows(rows, sortColumn, sortDirection);
  }, [metadata.generation_meter?.fields, sortColumn, sortDirection]);

  // Memoized sorted rows for benefit meter
  const benefitRows = useMemo(() => {
    if (!metadata.benefit_meter?.fields) return [];
    const rows = fieldsToRows(metadata.benefit_meter.fields);
    return sortRows(rows, sortColumn, sortDirection);
  }, [metadata.benefit_meter?.fields, sortColumn, sortDirection]);

  return (
    <div style={overlayStyle} onClick={onClose} data-testid="metadata-modal-overlay">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} data-testid="metadata-modal-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#212529' }}>Billing Metadata</h2>
          <button
            onClick={onClose}
            data-testid="metadata-modal-close-button"
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#c82333')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#dc3545')}
          >
            Close
          </button>
        </div>

        {/* Generation Meter */}
        {generationRows.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              borderBottom: '3px solid #3498db',
              paddingBottom: '10px',
              marginBottom: '0',
              color: '#2c3e50',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}>
              Generation Meter
            </h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th
                    style={{ ...thStyle, width: '20%' }}
                    onClick={() => handleHeaderClick('fieldName')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Field Name {sortColumn === 'fieldName' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '12%' }}
                    onClick={() => handleHeaderClick('type')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Type {sortColumn === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '10%' }}
                    onClick={() => handleHeaderClick('tou')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    TOU {sortColumn === 'tou' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '14%' }}
                    onClick={() => handleHeaderClick('unit')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Unit {sortColumn === 'unit' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '16%' }}
                    onClick={() => handleHeaderClick('whereFrom')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Where From {sortColumn === 'whereFrom' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '14%' }}
                    onClick={() => handleHeaderClick('page')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Page {sortColumn === 'page' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '14%' }}
                    onClick={() => handleHeaderClick('numberCode')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Number Code {sortColumn === 'numberCode' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {generationRows.map((row, idx) => {
                  // Check if we should merge field names (only when sorting by fieldName)
                  const shouldMergeFieldNames = sortColumn === 'fieldName';
                  const isFirstInGroup = idx === 0 || generationRows[idx - 1]?.fieldName !== row.fieldName;

                  // Count how many consecutive rows have the same field name
                  let rowSpan = 1;
                  if (shouldMergeFieldNames && isFirstInGroup) {
                    for (let i = idx + 1; i < generationRows.length; i++) {
                      if (generationRows[i]?.fieldName === row.fieldName) {
                        rowSpan++;
                      } else {
                        break;
                      }
                    }
                  }

                  return (
                    <tr key={`${row.fieldName}-${row.tou}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                      {/* Only render field name cell for first row in group when merging */}
                      {(!shouldMergeFieldNames || isFirstInGroup) && (
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 600,
                            color: '#2c3e50',
                            verticalAlign: shouldMergeFieldNames && rowSpan > 1 ? 'top' : 'middle'
                          }}
                          rowSpan={shouldMergeFieldNames ? rowSpan : 1}
                        >
                          {row.fieldName}
                        </td>
                      )}
                      <td style={tdStyle}>
                        <span style={badgeStyle(
                          row.type === 'Date Field' ? '#95a5a6' :
                          row.type === 'Simple Field' ? '#3498db' :
                          '#27ae60'
                        )}>
                          {row.type}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {row.tou !== '—' ? (
                          <span style={touBadgeStyle}>{row.tou}</span>
                        ) : (
                          <span style={{ color: '#95a5a6', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {row.unit !== '—' ? (
                          <code style={unitStyle}>{row.unit}</code>
                        ) : (
                          <span style={{ color: '#95a5a6', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '13px', color: '#34495e' }}>{row.whereFrom}</td>
                      <td style={{ ...tdStyle, fontSize: '13px', color: '#34495e' }}>{row.page}</td>
                      <td style={{ ...tdStyle, fontSize: '13px', fontFamily: 'monospace', color: '#7f8c8d' }}>{row.numberCode}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Benefit Meter */}
        {benefitRows.length > 0 && (
          <div>
            <h3 style={{
              borderBottom: '3px solid #27ae60',
              paddingBottom: '10px',
              marginBottom: '0',
              color: '#2c3e50',
              fontSize: '20px',
              fontWeight: 700,
              letterSpacing: '0.5px'
            }}>
              Benefit Meter
            </h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th
                    style={{ ...thStyle, width: '20%' }}
                    onClick={() => handleHeaderClick('fieldName')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Field Name {sortColumn === 'fieldName' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '12%' }}
                    onClick={() => handleHeaderClick('type')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Type {sortColumn === 'type' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '10%' }}
                    onClick={() => handleHeaderClick('tou')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    TOU {sortColumn === 'tou' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '14%' }}
                    onClick={() => handleHeaderClick('unit')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Unit {sortColumn === 'unit' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '16%' }}
                    onClick={() => handleHeaderClick('whereFrom')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Where From {sortColumn === 'whereFrom' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '14%' }}
                    onClick={() => handleHeaderClick('page')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Page {sortColumn === 'page' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                  <th
                    style={{ ...thStyle, width: '14%' }}
                    onClick={() => handleHeaderClick('numberCode')}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#34495e')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#2c3e50')}
                  >
                    Number Code {sortColumn === 'numberCode' && (sortDirection === 'asc' ? '▲' : '▼')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {benefitRows.map((row, idx) => {
                  // Check if we should merge field names (only when sorting by fieldName)
                  const shouldMergeFieldNames = sortColumn === 'fieldName';
                  const isFirstInGroup = idx === 0 || benefitRows[idx - 1]?.fieldName !== row.fieldName;

                  // Count how many consecutive rows have the same field name
                  let rowSpan = 1;
                  if (shouldMergeFieldNames && isFirstInGroup) {
                    for (let i = idx + 1; i < benefitRows.length; i++) {
                      if (benefitRows[i]?.fieldName === row.fieldName) {
                        rowSpan++;
                      } else {
                        break;
                      }
                    }
                  }

                  return (
                    <tr key={`${row.fieldName}-${row.tou}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                      {/* Only render field name cell for first row in group when merging */}
                      {(!shouldMergeFieldNames || isFirstInGroup) && (
                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 600,
                            color: '#2c3e50',
                            verticalAlign: shouldMergeFieldNames && rowSpan > 1 ? 'top' : 'middle'
                          }}
                          rowSpan={shouldMergeFieldNames ? rowSpan : 1}
                        >
                          {row.fieldName}
                        </td>
                      )}
                      <td style={tdStyle}>
                        <span style={badgeStyle(
                          row.type === 'Date Field' ? '#95a5a6' :
                          row.type === 'Simple Field' ? '#3498db' :
                          '#27ae60'
                        )}>
                          {row.type}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {row.tou !== '—' ? (
                          <span style={touBadgeStyle}>{row.tou}</span>
                        ) : (
                          <span style={{ color: '#95a5a6', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        {row.unit !== '—' ? (
                          <code style={unitStyle}>{row.unit}</code>
                      ) : (
                          <span style={{ color: '#95a5a6', fontSize: '13px' }}>—</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '13px', color: '#34495e' }}>{row.whereFrom}</td>
                      <td style={{ ...tdStyle, fontSize: '13px', color: '#34495e' }}>{row.page}</td>
                      <td style={{ ...tdStyle, fontSize: '13px', fontFamily: 'monospace', color: '#7f8c8d' }}>{row.numberCode}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
