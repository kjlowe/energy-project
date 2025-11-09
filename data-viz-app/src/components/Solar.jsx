/* filepath: /workspace/data-viz-app/src/components/Solar.jsx */
import React, { useState } from 'react';
import { Group } from '@visx/group';
import { Circle, Line } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';

const Solar = ({ data, width = 800, height = 500 }) => {

  return (
    <div>
      <svg width={width} height={height}>
        <Line
          from={{ x: 50, y: 50 }}
          to={{ x: 150, y: 50 }}
          stroke="#333"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
};

export default Solar;