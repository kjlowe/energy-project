import React from 'react';

interface YearSelectorProps {
  /** Current year index (0-based) */
  yearIdx: number;
  /** Total number of billing years available */
  totalYears: number;
  /** Year label to display (e.g., "May 2024 - June 2024") */
  yearLabel: string;
  /** Callback when previous button clicked */
  onPrevYear: () => void;
  /** Callback when next button clicked */
  onNextYear: () => void;
  /** Callback when dropdown value changes */
  onYearChange: (newIndex: number) => void;
}

const YearSelector: React.FC<YearSelectorProps> = ({
  yearIdx,
  totalYears,
  yearLabel,
  onPrevYear,
  onNextYear,
  onYearChange,
}) => {
  const maxYear = totalYears - 1;

  return (
    <div>
      <div
        style={{
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <button
          onClick={onPrevYear}
          disabled={yearIdx === 0}
          style={{
            padding: '5px 10px',
            fontSize: '18px',
            cursor: yearIdx === 0 ? 'not-allowed' : 'pointer',
            opacity: yearIdx === 0 ? 0.5 : 1,
          }}
        >
          ←
        </button>
        <label htmlFor="year-selector" style={{ fontWeight: 'bold' }}>
          Year: {yearIdx + 1} of {totalYears}
        </label>
        <select
          id="year-selector"
          value={yearIdx}
          onChange={(e) => onYearChange(parseInt(e.target.value, 10))}
          style={{ padding: '5px', minWidth: '50px' }}
        >
          {Array.from({ length: totalYears }, (_, i) => i).map((idx) => (
            <option key={idx} value={idx}>
              Year {idx + 1}
            </option>
          ))}
        </select>
        <button
          onClick={onNextYear}
          disabled={yearIdx === maxYear}
          style={{
            padding: '5px 10px',
            fontSize: '18px',
            cursor: yearIdx === maxYear ? 'not-allowed' : 'pointer',
            opacity: yearIdx === maxYear ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        Billing Period: {yearLabel}
      </div>
    </div>
  );
};

export default YearSelector;
