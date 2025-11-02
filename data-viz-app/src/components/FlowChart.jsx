import React from 'react';
import { Group } from '@visx/group';
import { Circle, Line } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';

const FlowChart = ({ data, width = 600, height = 400 }) => {
  const { nodes, edges } = data;

  // Color scale for different node types
  const colorScale = scaleOrdinal({
    domain: ['start', 'process', 'end'],
    range: ['#4CAF50', '#2196F3', '#FF5722']
  });

  return (
    <svg width={width} height={height}>
      <Group>
        {/* Render edges first (so they appear behind nodes) */}
        {edges.map((edge, i) => {
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          
          if (!sourceNode || !targetNode) return null;
          
          return (
            <Line
              key={`edge-${i}`}
              from={{ x: sourceNode.x, y: sourceNode.y }}
              to={{ x: targetNode.x, y: targetNode.y }}
              stroke="#666"
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
        
        {/* Render nodes */}
        {nodes.map((node) => (
          <Group key={node.id}>
            <Circle
              cx={node.x}
              cy={node.y}
              r={30}
              fill={colorScale(node.type)}
              stroke="#333"
              strokeWidth={2}
              style={{ cursor: 'pointer' }}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fontSize={12}
              fill="white"
              fontWeight="bold"
            >
              {node.label}
            </text>
          </Group>
        ))}
      </Group>
    </svg>
  );
};

export default FlowChart;