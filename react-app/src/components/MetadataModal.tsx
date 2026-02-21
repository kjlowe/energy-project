import React from 'react';
import type {
  BillingStructureMetadata,
  FieldMetadata,
  FieldSource,
} from '@/types/generated/metadata';

interface MetadataModalProps {
  metadata: BillingStructureMetadata | null;
  onClose: () => void;
}

/**
 * Modal component for displaying billing metadata.
 * Shows units, data sources, and field origins for all billing fields.
 */
export const MetadataModal: React.FC<MetadataModalProps> = ({ metadata, onClose }) => {
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
    backgroundColor: '#f8f9fa',
    padding: '12px 16px',
    textAlign: 'left',
    fontWeight: 600,
    borderBottom: '2px solid #dee2e6',
    color: '#495057',
  };

  const tdStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid #e9ecef',
    verticalAlign: 'top',
  };

  const touSubRowStyle: React.CSSProperties = {
    ...tdStyle,
    paddingLeft: '32px',
    backgroundColor: '#f8f9fa',
    fontSize: '13px',
  };

  const badgeStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 500,
    backgroundColor: color,
    color: '#fff',
  });

  // Helper to format source info
  const formatSource = (source: FieldSource): string => {
    // API returns enum names as strings, not numeric values
    const parts = [source.where_from as unknown as string || 'UNSPECIFIED'];
    if (source.where_on_pdf) parts.push(source.where_on_pdf);
    if (source.kevins_number_code?.value) parts.push(`Code: ${source.kevins_number_code.value}`);
    return parts.join(' • ');
  };

  // Helper to render table rows for a meter's fields
  const renderTableRows = (fields: { [key: string]: FieldMetadata }) => {
    const rows: JSX.Element[] = [];

    Object.entries(fields).forEach(([fieldName, fieldMeta], index) => {
      const fieldType = fieldMeta.metadata?.$case;

      if (fieldType === 'date_field' && fieldMeta.metadata) {
        const dateField = fieldMeta.metadata.date_field;
        rows.push(
          <tr key={fieldName}>
            <td style={tdStyle}><strong>{fieldName}</strong></td>
            <td style={tdStyle}>
              <span style={badgeStyle('#6c757d')}>Date Field</span>
            </td>
            <td style={tdStyle}>—</td>
            <td style={tdStyle}>
              {dateField.where_found?.map((source, idx) => (
                <div key={idx} style={{ marginBottom: idx < (dateField.where_found?.length || 0) - 1 ? '4px' : '0' }}>
                  {formatSource(source)}
                </div>
              ))}
            </td>
          </tr>
        );
      }

      if (fieldType === 'simple_field' && fieldMeta.metadata) {
        const simpleField = fieldMeta.metadata.simple_field;
        rows.push(
          <tr key={fieldName}>
            <td style={tdStyle}><strong>{fieldName}</strong></td>
            <td style={tdStyle}>
              <span style={badgeStyle('#17a2b8')}>Simple Field</span>
            </td>
            <td style={tdStyle}>
              <code style={{
                backgroundColor: '#e9ecef',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#495057'
              }}>
                {simpleField.unit as unknown as string || 'UNSPECIFIED'}
              </code>
            </td>
            <td style={tdStyle}>
              {simpleField.where_found?.map((source, idx) => (
                <div key={idx} style={{ marginBottom: idx < (simpleField.where_found?.length || 0) - 1 ? '4px' : '0' }}>
                  {formatSource(source)}
                </div>
              ))}
            </td>
          </tr>
        );
      }

      if (fieldType === 'tou_field' && fieldMeta.metadata) {
        const touField = fieldMeta.metadata.tou_field;

        // Main TOU row
        rows.push(
          <tr key={fieldName}>
            <td style={tdStyle} rowSpan={4}>
              <strong>{fieldName}</strong>
            </td>
            <td style={tdStyle} rowSpan={4}>
              <span style={badgeStyle('#28a745')}>TOU Field</span>
            </td>
            <td style={touSubRowStyle}>
              <strong>Peak:</strong>{' '}
              <code style={{
                backgroundColor: '#d4edda',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#155724'
              }}>
                {touField.peak?.unit as unknown as string || 'UNSPECIFIED'}
              </code>
            </td>
            <td style={touSubRowStyle}>
              {touField.peak?.where_found?.map((source, idx) => (
                <div key={idx} style={{ marginBottom: idx < (touField.peak?.where_found?.length || 0) - 1 ? '4px' : '0' }}>
                  {formatSource(source)}
                </div>
              ))}
            </td>
          </tr>
        );

        // Off-Peak sub-row
        rows.push(
          <tr key={`${fieldName}-offpeak`}>
            <td style={touSubRowStyle}>
              <strong>Off-Peak:</strong>{' '}
              <code style={{
                backgroundColor: '#d4edda',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#155724'
              }}>
                {touField.off_peak?.unit as unknown as string || 'UNSPECIFIED'}
              </code>
            </td>
            <td style={touSubRowStyle}>
              {touField.off_peak?.where_found?.map((source, idx) => (
                <div key={idx} style={{ marginBottom: idx < (touField.off_peak?.where_found?.length || 0) - 1 ? '4px' : '0' }}>
                  {formatSource(source)}
                </div>
              ))}
            </td>
          </tr>
        );

        // Total sub-row
        rows.push(
          <tr key={`${fieldName}-total`}>
            <td style={touSubRowStyle}>
              <strong>Total:</strong>{' '}
              <code style={{
                backgroundColor: '#d4edda',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '12px',
                color: '#155724'
              }}>
                {touField.total?.unit as unknown as string || 'UNSPECIFIED'}
              </code>
            </td>
            <td style={touSubRowStyle}>
              {touField.total?.where_found?.map((source, idx) => (
                <div key={idx} style={{ marginBottom: idx < (touField.total?.where_found?.length || 0) - 1 ? '4px' : '0' }}>
                  {formatSource(source)}
                </div>
              ))}
            </td>
          </tr>
        );

        // Spacer row for visual separation
        rows.push(
          <tr key={`${fieldName}-spacer`}>
            <td colSpan={2} style={{ height: '4px', padding: 0, borderBottom: 'none' }}></td>
          </tr>
        );
      }
    });

    return rows;
  };

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
        {metadata.generation_meter?.fields && Object.keys(metadata.generation_meter.fields).length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              borderBottom: '3px solid #007bff',
              paddingBottom: '8px',
              marginBottom: '0',
              color: '#007bff',
              fontSize: '18px',
              fontWeight: 600
            }}>
              Generation Meter
            </h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '25%' }}>Field Name</th>
                  <th style={{ ...thStyle, width: '15%' }}>Type</th>
                  <th style={{ ...thStyle, width: '15%' }}>Unit</th>
                  <th style={{ ...thStyle, width: '45%' }}>Data Sources</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRows(metadata.generation_meter.fields)}
              </tbody>
            </table>
          </div>
        )}

        {/* Benefit Meter */}
        {metadata.benefit_meter?.fields && Object.keys(metadata.benefit_meter.fields).length > 0 && (
          <div>
            <h3 style={{
              borderBottom: '3px solid #28a745',
              paddingBottom: '8px',
              marginBottom: '0',
              color: '#28a745',
              fontSize: '18px',
              fontWeight: 600
            }}>
              Benefit Meter
            </h3>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={{ ...thStyle, width: '25%' }}>Field Name</th>
                  <th style={{ ...thStyle, width: '15%' }}>Type</th>
                  <th style={{ ...thStyle, width: '15%' }}>Unit</th>
                  <th style={{ ...thStyle, width: '45%' }}>Data Sources</th>
                </tr>
              </thead>
              <tbody>
                {renderTableRows(metadata.benefit_meter.fields)}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
