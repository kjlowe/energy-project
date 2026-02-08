import React, { useState } from 'react';
import { Line } from '@visx/shape';
import type { BillingYearWithId } from '@/types/api';
import { getOffPeakValue, getPeakValue } from '@/types/utils';

interface SolarProps {
  data: BillingYearWithId | null;
  width?: number;
  height?: number;
}

interface Point {
  x: number;
  y: number;
}

interface TableRow {
  key: string;
  value: string;
  unit: string;
}

const Solar: React.FC<SolarProps> = ({ data, width = 100, height = 100 }) => {
  const [monthIdx, setMonthIdx] = useState<number>(0);

  if (!data || !data.billing_months || data.billing_months.length === 0) {
    return <div>No billing data available</div>;
  }

  // Reserve space at bottom for peak/off-peak labels
  const labelHeight = 20;
  const chartHeight = height - labelHeight;

  // Calculate positions for time markers (24 hours)
  const hourWidth = width / 24; // Each hour takes 1/24 of the width
  const hour4pm = 16 * hourWidth; // 4pm is hour 16 (0-based: 0=midnight, 16=4pm)

  const currentMonth = data.billing_months[monthIdx];
  if (!currentMonth) {
    return <div>Invalid month index</div>;
  }

  // Extract energy values using type utilities
  const offPeakExport = getOffPeakValue(currentMonth.main?.energy_export_meter_channel_2);
  const peakExport = getPeakValue(currentMonth.main?.energy_export_meter_channel_2);
  const offPeakImport = getOffPeakValue(currentMonth.main?.energy_import_meter_channel_1);
  const peakImport = getPeakValue(currentMonth.main?.energy_import_meter_channel_1);
  const monthName = currentMonth.month_label ?? 'N/A';

  const renderDataValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const renderDataTable = (obj: Record<string, unknown>, prefix = ''): TableRow[] => {
    const rows: TableRow[] = [];

    const traverse = (dataObj: Record<string, unknown>, path: string) => {
      Object.keys(dataObj).forEach((key) => {
        const value = dataObj[key];
        const currentPath = path ? `${path}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          const objValue = value as Record<string, unknown>;
          if (objValue.value === undefined) {
            traverse(objValue, currentPath);
          } else {
            rows.push({
              key: currentPath,
              value: renderDataValue(objValue.value),
              unit: (objValue.unit as string) || '',
            });
          }
        } else if (typeof value !== 'object') {
          rows.push({
            key: currentPath,
            value: renderDataValue(value),
            unit: '',
          });
        }
      });
    };

    traverse(obj, prefix);
    return rows;
  };

  const tableData = renderDataTable(currentMonth as unknown as Record<string, unknown>);

  const handlePrevMonth = () => {
    if (monthIdx > 0) {
      setMonthIdx(monthIdx - 1);
    }
  };

  const handleNextMonth = () => {
    if (data.billing_months && monthIdx < data.billing_months.length - 1) {
      setMonthIdx(monthIdx + 1);
    }
  };

  const sinePoints: string[] = [];
  const abovePointsLeft: Point[] = [];
  const abovePointsRight: Point[] = [];
  const belowPointsLeft: Point[] = [];
  const belowPointsRight: Point[] = [];
  const numPoints = 100;
  const amplitude = chartHeight / 2;
  const frequency = 1;
  const midLine = chartHeight / 2;

  for (let i = 0; i <= numPoints; i++) {
    const x = (width * i) / numPoints;
    const y = chartHeight / 2 + amplitude * Math.cos((2 * Math.PI * frequency * i) / numPoints);

    sinePoints.push(`${x},${y}`);

    if (x <= hour4pm) {
      // Left side (off-peak)
      if (y < midLine) {
        abovePointsLeft.push({ x, y });
      } else {
        belowPointsLeft.push({ x, y });
      }
    } else {
      // Right side (peak)
      if (y < midLine) {
        abovePointsRight.push({ x, y });
      } else {
        belowPointsRight.push({ x, y });
      }
    }
  }

  // Build fill paths for above areas
  let fillPathAboveLeft = '';
  if (abovePointsLeft.length > 0) {
    const points = abovePointsLeft.map((p) => `${p.x},${p.y}`).join(' L ');
    fillPathAboveLeft = `M ${abovePointsLeft[0]?.x},${midLine} L ${points} L ${abovePointsLeft[abovePointsLeft.length - 1]?.x},${midLine} Z`;
  }

  let fillPathAboveRight = '';
  if (abovePointsRight.length > 0) {
    const points = abovePointsRight.map((p) => `${p.x},${p.y}`).join(' L ');
    fillPathAboveRight = `M ${abovePointsRight[0]?.x},${midLine} L ${points} L ${abovePointsRight[abovePointsRight.length - 1]?.x},${midLine} Z`;
  }

  // Build fill paths for below areas
  let fillPathBelowLeft = '';
  if (belowPointsLeft.length > 0) {
    const points = belowPointsLeft.map((p) => `${p.x},${p.y}`).join(' L ');
    fillPathBelowLeft = `M ${belowPointsLeft[0]?.x},${midLine} L ${points} L ${belowPointsLeft[belowPointsLeft.length - 1]?.x},${midLine} Z`;
  }

  let fillPathBelowRight = '';
  if (belowPointsRight.length > 0) {
    const points = belowPointsRight.map((p) => `${p.x},${p.y}`).join(' L ');
    fillPathBelowRight = `M ${belowPointsRight[0]?.x},${midLine} L ${points} L ${belowPointsRight[belowPointsRight.length - 1]?.x},${midLine} Z`;
  }

  const maxMonth = data.billing_months.length - 1;

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
          onClick={handlePrevMonth}
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
          onChange={(e) => setMonthIdx(parseInt(e.target.value, 10))}
          style={{ width: '200px' }}
        />
        <button
          onClick={handleNextMonth}
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
      <div style={{ display: 'flex', gap: '20px' }}>
        <svg width={width} height={height}>
          {/* Border */}
          <rect
            x={0}
            y={0}
            width={width}
            height={height}
            fill="none"
            stroke="#666"
            strokeWidth={1}
          />

          {/* Load Line */}
          <Line
            from={{ x: 0, y: chartHeight / 2 }}
            to={{ x: width, y: chartHeight / 2 }}
            stroke="#333"
            strokeWidth={2}
          />

          {/* Filled area above midline - Off-peak (left of 4pm) */}
          {fillPathAboveLeft && (
            <path d={fillPathAboveLeft} fill="#4CAF50" fillOpacity={0.4} />
          )}

          {/* Filled area above midline - Peak (right of 4pm) */}
          {fillPathAboveRight && (
            <path d={fillPathAboveRight} fill="#FF9800" fillOpacity={0.4} />
          )}

          {/* Filled area below midline - Off-peak (left of 4pm) */}
          {fillPathBelowLeft && (
            <path d={fillPathBelowLeft} fill="#2196F3" fillOpacity={0.4} />
          )}

          {/* Filled area below midline - Peak (right of 4pm) */}
          {fillPathBelowRight && (
            <path d={fillPathBelowRight} fill="#E91E63" fillOpacity={0.4} />
          )}

          {/* Solar Curve */}
          <polyline
            points={sinePoints.join(' ')}
            fill="none"
            stroke="#0066cc"
            strokeWidth={2}
          />

          {/* Vertical line at 4pm */}
          <Line
            from={{ x: hour4pm, y: 0 }}
            to={{ x: hour4pm, y: height }}
            stroke="#ff6b35"
            strokeWidth={2}
          />

          {/* Peak/Off-peak label area */}
          <rect
            x={0}
            y={chartHeight}
            width={width}
            height={labelHeight}
            fill="none"
            stroke="#ccc"
            strokeWidth={1}
          />

          {/* Off-peak label (before 4pm) */}
          <text
            x={hour4pm / 2}
            y={chartHeight + labelHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#666"
          >
            off-peak
          </text>

          {/* Peak label (after 4pm) */}
          <text
            x={hour4pm + (width - hour4pm) / 2}
            y={chartHeight + labelHeight / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fill="#666"
          >
            peak
          </text>

          {/* Off-peak Export (top left quadrant) */}
          <text
            x={(hour4pm * 6) / 8}
            y={chartHeight / 4}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fontWeight="bold"
            fill="#008700ff"
          >
            {offPeakExport !== 0 ? offPeakExport.toFixed(0) : 'N/A'}
          </text>

          {/* Peak Export (top right quadrant) */}
          <text
            x={hour4pm + ((width - hour4pm) * 1.3) / 3}
            y={(chartHeight * 4) / 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fontWeight="bold"
            fill="#ff9d00ff"
          >
            {peakExport !== 0 ? peakExport.toFixed(0) : 'N/A'}
          </text>

          {/* Off-peak Import (bottom left quadrant) */}
          <text
            x={hour4pm / 6}
            y={(chartHeight * 6) / 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fontWeight="bold"
            fill="#0000ffff"
          >
            {offPeakImport !== 0 ? offPeakImport.toFixed(0) : 'N/A'}
          </text>

          {/* Peak Import (bottom right quadrant) */}
          <text
            x={hour4pm + ((width - hour4pm) * 2) / 3}
            y={(chartHeight * 6) / 10}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="24"
            fontWeight="bold"
            fill="#ff0000ff"
          >
            {peakImport !== 0 ? peakImport.toFixed(0) : 'N/A'}
          </text>
        </svg>

        <div style={{ flex: 1, maxHeight: height, overflowY: 'auto' }}>
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
    </div>
  );
};

export default Solar;
