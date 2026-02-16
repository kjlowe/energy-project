import React from 'react';
import { Line } from '@visx/shape';
import { calculateSineWavePaths } from '@/utils/chartCalculations';

interface SolarChartProps {
  /** SVG width in pixels */
  width: number;
  /** SVG height in pixels */
  height: number;
  /** Off-peak export value (kWh) - displays in top-left quadrant */
  offPeakExport: number;
  /** Peak export value (kWh) - displays in top-right quadrant */
  peakExport: number;
  /** Off-peak import value (kWh) - displays in bottom-left quadrant */
  offPeakImport: number;
  /** Peak import value (kWh) - displays in bottom-right quadrant */
  peakImport: number;
}

const SolarChart: React.FC<SolarChartProps> = ({
  width,
  height,
  offPeakExport,
  peakExport,
  offPeakImport,
  peakImport,
}) => {
  const labelHeight = 20;
  const {
    sinePoints,
    fillPathAboveLeft,
    fillPathAboveRight,
    fillPathBelowLeft,
    fillPathBelowRight,
    hour4pm,
    midLine,
    chartHeight,
  } = calculateSineWavePaths(width, height, labelHeight);

  return (
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
  );
};

export default SolarChart;
