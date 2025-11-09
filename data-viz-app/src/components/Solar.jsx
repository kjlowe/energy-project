/* filepath: /workspace/data-viz-app/src/components/Solar.jsx */
import React, { useState } from 'react';
import { Group } from '@visx/group';
import { Circle, Line } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';

const Solar = ({ data, width = 100, height = 100 }) => {

  // Make a variable for the % of solar
  
  // Reserve space at bottom for peak/off-peak labels
  const labelHeight = 20;
  const chartHeight = height - labelHeight;
  
  // Calculate positions for time markers (24 hours)
  const hourWidth = width / 24; // Each hour takes 1/24 of the width
  const hour4pm = 16 * hourWidth; // 4pm is hour 16 (0-based: 0=midnight, 16=4pm)

  const sinePoints = [];
  const numPoints = 100;
  const amplitude = chartHeight / 2;
  const frequency = 1;
  
  for (let i = 0; i <= numPoints; i++) {
    const x = (width * i) / numPoints;
    const y = chartHeight / 2 + amplitude * Math.cos((2 * Math.PI * frequency * i) / numPoints);

    sinePoints.push(`${x},${y}`);
  }

  return (
    <div>
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

      </svg>
    </div>
  );
};

export default Solar;