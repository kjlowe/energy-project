import React from 'react';

interface MonthSelectorProps {
  /** Current month index (0-based) */
  monthIdx: number;
  /** Total number of months available */
  totalMonths: number;
  /** Month name to display (e.g., "May") */
  monthName: string;
  /** Callback when previous button clicked */
  onPrevMonth: () => void;
  /** Callback when next button clicked */
  onNextMonth: () => void;
  /** Callback when slider value changes */
  onMonthChange: (newIndex: number) => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({
  monthIdx,
  totalMonths,
  monthName,
  onPrevMonth,
  onNextMonth,
  onMonthChange,
}) => {
  const maxMonth = totalMonths - 1;

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
          onClick={onPrevMonth}
          disabled={monthIdx === 0}
          style={{
            padding: '5px 10px',
            fontSize: '18px',
            cursor: monthIdx === 0 ? 'not-allowed' : 'pointer',
            opacity: monthIdx === 0 ? 0.5 : 1,
          }}
        >
          ←
        </button>
        <label htmlFor="month-slider" style={{ fontWeight: 'bold' }}>
          Month: {monthIdx + 1}
        </label>
        <input
          id="month-slider"
          type="range"
          min="0"
          max={maxMonth}
          step="1"
          value={monthIdx}
          onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
          style={{ width: '200px' }}
        />
        <button
          onClick={onNextMonth}
          disabled={monthIdx === maxMonth}
          style={{
            padding: '5px 10px',
            fontSize: '18px',
            cursor: monthIdx === maxMonth ? 'not-allowed' : 'pointer',
            opacity: monthIdx === maxMonth ? 0.5 : 1,
          }}
        >
          →
        </button>
      </div>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        Month: {monthName}
      </div>
    </div>
  );
};

export default MonthSelector;
