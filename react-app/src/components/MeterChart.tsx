import React from 'react';
import { Line } from '@visx/shape';
import { calculateSineWavePaths } from '@/utils/chartCalculations';

interface MeterChartProps {
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
  /** Meter type: 'generation' shows solar curve and export areas, 'benefit' shows simplified consumption-only view */
  meterType: 'generation' | 'benefit';
}

export const MeterChart: React.FC<MeterChartProps> = ({
  width,
  height,
  offPeakExport,
  peakExport,
  offPeakImport,
  peakImport,
  meterType,
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
    <svg width={width} height={height} role="img">
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

      {/* Filled area above midline - Off-peak (left of 4pm) - Generation mode only */}
      {meterType === 'generation' && fillPathAboveLeft && (
        <path d={fillPathAboveLeft} fill="#4CAF50" fillOpacity={0.4} />
      )}

      {/* Filled area above midline - Peak (right of 4pm) - Generation mode only */}
      {meterType === 'generation' && fillPathAboveRight && (
        <path d={fillPathAboveRight} fill="#FF9800" fillOpacity={0.4} />
      )}

      {/* Filled area below midline - Off-peak (left of 4pm) */}
      {meterType === 'generation' ? (
        // Generation mode: Use sine wave fill path
        fillPathBelowLeft && (
          <path d={fillPathBelowLeft} fill="#2196F3" fillOpacity={0.4} />
        )
      ) : (
        // Benefit mode: Simple rectangle
        <rect
          x={0}
          y={midLine}
          width={hour4pm}
          height={chartHeight - midLine}
          fill="#2196F3"
          fillOpacity={0.4}
        />
      )}

      {/* Filled area below midline - Peak (right of 4pm) */}
      {meterType === 'generation' ? (
        // Generation mode: Use sine wave fill path
        fillPathBelowRight && (
          <path d={fillPathBelowRight} fill="#E91E63" fillOpacity={0.4} />
        )
      ) : (
        // Benefit mode: Simple rectangle
        <rect
          x={hour4pm}
          y={midLine}
          width={width - hour4pm}
          height={chartHeight - midLine}
          fill="#E91E63"
          fillOpacity={0.4}
        />
      )}

      {/* Solar Curve - Generation mode only */}
      {meterType === 'generation' && (
        <polyline
          points={sinePoints.join(' ')}
          fill="none"
          stroke="#0066cc"
          strokeWidth={2}
        />
      )}

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

      {/* Off-peak Export (top left quadrant) - Only show in generation mode */}
      {meterType === 'generation' && (
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
      )}

      {/* Peak Export (top right quadrant) - Only show in generation mode */}
      {meterType === 'generation' && (
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
      )}

      {/* Off-peak Import (bottom left quadrant) - Centered in benefit mode */}
      <text
        x={meterType === 'benefit' ? hour4pm / 2 : hour4pm / 6}
        y={meterType === 'benefit' ? (chartHeight * 3) / 4 : (chartHeight * 6) / 10}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="24"
        fontWeight="bold"
        fill="#0000ffff"
      >
        {offPeakImport !== 0 ? offPeakImport.toFixed(0) : 'N/A'}
      </text>

      {/* Peak Import (bottom right quadrant) - Centered in benefit mode */}
      <text
        x={meterType === 'benefit' ? hour4pm + (width - hour4pm) / 2 : hour4pm + ((width - hour4pm) * 2) / 3}
        y={meterType === 'benefit' ? (chartHeight * 3) / 4 : (chartHeight * 6) / 10}
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

export default MeterChart;
