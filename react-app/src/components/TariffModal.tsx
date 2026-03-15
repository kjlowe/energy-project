import React, { useState, useMemo } from 'react';
import type { TariffSchedule, TariffPeriod } from '@/types/generated/tariff';

interface TariffModalProps {
  tariffSchedule: TariffSchedule | null;
  onClose: () => void;
}

type SortColumn = 'period' | 'delivery' | 'meter' | 'baseline' | 'climate' | 'summerPeak' | 'summerOffPeak' | 'winterPeak' | 'winterOffPeak' | 'winterBaseline' | 'summerBaseline';
type SortDirection = 'asc' | 'desc';

interface TableRow {
  period: string;
  effectiveStart: string;
  effectiveEnd: string;
  delivery: string;
  meter: string;
  baseline: string;
  climate: string;
  summerPeak: string;
  summerOffPeak: string;
  winterPeak: string;
  winterOffPeak: string;
  winterBaseline: string;
  summerBaseline: string;
  sourceFile: string;
  note: string;
  touPeakHours: string;
  touPeakDays: string;
  touOffPeakHours: string;
  touSummerSeason: string;
  touWinterSeason: string;
  baselineNote: string;
}

/**
 * Modal component for displaying PG&E E-TOU-C tariff information.
 * Shows rates, baseline quantities, and TOU period definitions.
 */
export const TariffModal: React.FC<TariffModalProps> = ({ tariffSchedule, onClose }) => {
  const [sortColumn, setSortColumn] = useState<SortColumn>('period');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showRawData, setShowRawData] = useState(false);

  if (!tariffSchedule) return null;

  // Format currency value
  const formatCurrency = (value: number | null | undefined): string => {
    if (value == null) return '—';
    const formatted = Math.abs(value).toFixed(5);
    return value < 0 ? `-$${formatted}` : `$${formatted}`;
  };

  // Format kWh/day value
  const formatKwhPerDay = (value: number | null | undefined): string => {
    if (value == null) return '—';
    return `${value.toFixed(1)} kWh/day`;
  };

  // Transform tariff periods into table rows
  const periodsToRows = (periods: TariffPeriod[]): TableRow[] => {
    return periods.map((period) => ({
      period: `${period.effective_start} to ${period.effective_end}`,
      effectiveStart: period.effective_start,
      effectiveEnd: period.effective_end,
      delivery: formatCurrency(period.delivery_minimum?.value),
      meter: formatCurrency(period.total_meter_charge?.value),
      baseline: formatCurrency(period.baseline_credit?.value),
      climate: formatCurrency(period.ca_climate_credit?.value),
      summerPeak: formatCurrency(period.tou_rates?.summer?.peak?.value),
      summerOffPeak: formatCurrency(period.tou_rates?.summer?.off_peak?.value),
      winterPeak: formatCurrency(period.tou_rates?.winter?.peak?.value),
      winterOffPeak: formatCurrency(period.tou_rates?.winter?.off_peak?.value),
      winterBaseline: formatKwhPerDay(period.baseline_quantities?.winter?.territory_t_individually_metered),
      summerBaseline: formatKwhPerDay(period.baseline_quantities?.summer?.territory_t_individually_metered),
      sourceFile: period.source_file,
      note: period.note,
      touPeakHours: period.tou_periods?.peak_hours || '',
      touPeakDays: period.tou_periods?.peak_days || '',
      touOffPeakHours: period.tou_periods?.off_peak_hours || '',
      touSummerSeason: period.tou_periods?.summer_season || '',
      touWinterSeason: period.tou_periods?.winter_season || '',
      baselineNote: period.baseline_quantities?.note || '',
    }));
  };

  // Sorting function
  const sortRows = (rows: TableRow[], column: SortColumn, direction: SortDirection): TableRow[] => {
    return [...rows].sort((a, b) => {
      let aVal: string = '';
      let bVal: string = '';

      switch (column) {
        case 'period':
          aVal = a.effectiveStart;
          bVal = b.effectiveStart;
          break;
        case 'delivery':
          aVal = a.delivery;
          bVal = b.delivery;
          break;
        case 'meter':
          aVal = a.meter;
          bVal = b.meter;
          break;
        case 'baseline':
          aVal = a.baseline;
          bVal = b.baseline;
          break;
        case 'climate':
          aVal = a.climate;
          bVal = b.climate;
          break;
        case 'summerPeak':
          aVal = a.summerPeak;
          bVal = b.summerPeak;
          break;
        case 'summerOffPeak':
          aVal = a.summerOffPeak;
          bVal = b.summerOffPeak;
          break;
        case 'winterPeak':
          aVal = a.winterPeak;
          bVal = b.winterPeak;
          break;
        case 'winterOffPeak':
          aVal = a.winterOffPeak;
          bVal = b.winterOffPeak;
          break;
        case 'winterBaseline':
          aVal = a.winterBaseline;
          bVal = b.winterBaseline;
          break;
        case 'summerBaseline':
          aVal = a.summerBaseline;
          bVal = b.summerBaseline;
          break;
      }

      // Handle "—" values (empty/null) - always put them last
      const aIsEmpty = aVal === '—';
      const bIsEmpty = bVal === '—';

      if (aIsEmpty && bIsEmpty) return 0;
      if (aIsEmpty) return 1;
      if (bIsEmpty) return -1;

      // Handle "current" values - always put them last (after all dates)
      const aIsCurrent = aVal === 'current';
      const bIsCurrent = bVal === 'current';

      if (aIsCurrent && bIsCurrent) return 0;
      if (aIsCurrent) return 1;
      if (bIsCurrent) return -1;

      // String comparison (works for dates and numeric strings)
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

  // Memoized sorted rows
  const sortedRows = useMemo(() => {
    if (!tariffSchedule.periods) return [];
    const rows = periodsToRows(tariffSchedule.periods);
    return sortRows(rows, sortColumn, sortDirection);
  }, [tariffSchedule.periods, sortColumn, sortDirection]);

  // Styles
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

  const modalStyle: React.CSSProperties = {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '24px',
    maxWidth: '95%',
    width: '1400px',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.15)',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '8px',
    fontSize: '11px',
  };

  const thStyle: React.CSSProperties = {
    backgroundColor: '#f0f0f0',
    padding: '8px 6px',
    textAlign: 'left',
    fontWeight: 600,
    border: '1px solid #ccc',
    color: '#333',
    cursor: 'pointer',
    userSelect: 'none',
    position: 'sticky',
    top: 0,
    fontSize: '11px',
  };

  const tdStyle: React.CSSProperties = {
    padding: '6px',
    border: '1px solid #ccc',
    verticalAlign: 'middle',
    fontSize: '10px',
  };

  const buttonStyle: React.CSSProperties = {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginLeft: '8px',
  };

  return (
    <div style={overlayStyle} onClick={onClose} data-testid="tariff-modal-overlay">
      <div style={modalStyle} onClick={(e) => e.stopPropagation()} data-testid="tariff-modal-content">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', color: '#212529' }}>
              {tariffSchedule.tariff_name} Tariff Schedule
            </h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
              {tariffSchedule.description} - Territory T, Individually Metered
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setShowRawData(!showRawData)}
              style={buttonStyle}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#5a6268')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#6c757d')}
            >
              {showRawData ? 'Show Table View' : 'View Raw Data'}
            </button>
            <button
              onClick={onClose}
              data-testid="tariff-modal-close-button"
              style={{
                ...buttonStyle,
                backgroundColor: '#666',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#555')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#666')}
            >
              Close
            </button>
          </div>
        </div>

        {/* Content: Table View or Raw JSON */}
        {showRawData ? (
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '4px',
            maxHeight: '70vh',
            overflow: 'auto',
          }}>
            <pre style={{
              margin: 0,
              fontSize: '11px',
              fontFamily: 'Monaco, Consolas, "Courier New", monospace',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
            }}>
              {JSON.stringify(tariffSchedule, null, 2)}
            </pre>
          </div>
        ) : (
          <>
            {/* TOU Period Definitions (Common across all periods) */}
            {sortedRows.length > 0 && (
              <div style={{ marginBottom: '24px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#333' }}>Time-of-Use (TOU) Period Definitions</h3>
                <div style={{ fontSize: '12px', color: '#555' }}>
                  <p style={{ margin: '4px 0' }}><strong>Peak Hours:</strong> {sortedRows[0].touPeakHours}</p>
                  <p style={{ margin: '4px 0' }}><strong>Peak Days:</strong> {sortedRows[0].touPeakDays}</p>
                  <p style={{ margin: '4px 0' }}><strong>Off-Peak Hours:</strong> {sortedRows[0].touOffPeakHours}</p>
                  <p style={{ margin: '4px 0' }}><strong>Summer Season:</strong> {sortedRows[0].touSummerSeason}</p>
                  <p style={{ margin: '4px 0' }}><strong>Winter Season:</strong> {sortedRows[0].touWinterSeason}</p>
                </div>
              </div>
            )}

            {/* Tariff Periods Table */}
            <div>
              <h3 style={{
                borderBottom: '2px solid #ccc',
                paddingBottom: '8px',
                marginBottom: '0',
                color: '#333',
                fontSize: '16px',
                fontWeight: 600,
              }}>
                Rate Periods ({sortedRows.length} periods)
              </h3>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th
                      style={{ ...thStyle, minWidth: '140px' }}
                      onClick={() => handleHeaderClick('period')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Effective Period {sortColumn === 'period' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '70px' }}
                      onClick={() => handleHeaderClick('delivery')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Delivery Min ($/day) {sortColumn === 'delivery' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '70px' }}
                      onClick={() => handleHeaderClick('meter')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Meter Charge ($/day) {sortColumn === 'meter' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '70px' }}
                      onClick={() => handleHeaderClick('baseline')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Baseline Credit ($/kWh) {sortColumn === 'baseline' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '70px' }}
                      onClick={() => handleHeaderClick('climate')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      CA Climate Credit ($) {sortColumn === 'climate' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '70px' }}
                      onClick={() => handleHeaderClick('summerPeak')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Summer Peak ($/kWh) {sortColumn === 'summerPeak' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '70px' }}
                      onClick={() => handleHeaderClick('summerOffPeak')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Summer Off-Peak ($/kWh) {sortColumn === 'summerOffPeak' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '70px' }}
                      onClick={() => handleHeaderClick('winterPeak')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Winter Peak ($/kWh) {sortColumn === 'winterPeak' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '70px' }}
                      onClick={() => handleHeaderClick('winterOffPeak')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Winter Off-Peak ($/kWh) {sortColumn === 'winterOffPeak' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '80px' }}
                      onClick={() => handleHeaderClick('winterBaseline')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Winter Baseline {sortColumn === 'winterBaseline' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                    <th
                      style={{ ...thStyle, minWidth: '80px' }}
                      onClick={() => handleHeaderClick('summerBaseline')}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8e8e8')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    >
                      Summer Baseline {sortColumn === 'summerBaseline' && (sortDirection === 'asc' ? '▲' : '▼')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row, idx) => (
                    <tr key={`${row.effectiveStart}-${idx}`} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8f9fa' }}>
                      <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '10px' }}>{row.period}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.delivery}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.meter}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.baseline}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.climate}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.summerPeak}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.summerOffPeak}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.winterPeak}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.winterOffPeak}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.winterBaseline}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontFamily: 'monospace' }}>{row.summerBaseline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
