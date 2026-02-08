import React, { useState } from 'react';
import { Group } from '@visx/group';
import { Circle, Line } from '@visx/shape';
import { scaleOrdinal } from '@visx/scale';
import type { FlowChartDataResponse } from '@/types/api';

interface FlowChartProps {
  data: FlowChartDataResponse | null;
  width?: number;
  height?: number;
}

type NodeType = FlowChartDataResponse['nodes'][number];
type EdgeType = FlowChartDataResponse['edges'][number];

const FlowChart: React.FC<FlowChartProps> = ({
  data,
  width = 800,
  height = 500,
}) => {
  const [hoveredNode, setHoveredNode] = useState<NodeType | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<EdgeType | null>(null);

  if (!data || !data.nodes || !data.edges) {
    return <div>No flow chart data available</div>;
  }

  const { nodes, edges } = data;

  // Color scale for different node types
  const colorScale = scaleOrdinal({
    domain: ['start', 'process', 'end'],
    range: ['#4CAF50', '#2196F3', '#FF5722'],
  });

  return (
    <div>
      {/* Data Info */}
      <div
        className="data-info"
        style={{ display: 'flex', alignItems: 'center', gap: '16px' }}
      >
        <div>
          <strong>Flow Data:</strong> {nodes.length} nodes, {edges.length}{' '}
          connections
        </div>
        {hoveredNode && (
          <div>
            <strong>Hovered:</strong> {hoveredNode.label} ({hoveredNode.type})
          </div>
        )}
        {hoveredEdge && (
          <div>
            <strong>Connection:</strong> Value {hoveredEdge.value}
          </div>
        )}
      </div>

      {/* SVG Chart */}
      <svg
        width={width}
        height={height}
        style={{ border: '1px solid #ddd', borderRadius: '4px' }}
      >
        {/* Background */}
        <rect width={width} height={height} fill="#fafafa" />

        {/* Grid lines for better readability */}
        <defs>
          <pattern
            id="grid"
            width="50"
            height="50"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 50 0 L 0 0 0 50"
              fill="none"
              stroke="#e0e0e0"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#grid)" />

        <Group>
          {/* Render edges first (so they appear behind nodes) */}
          {edges.map((edge, i) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const isHovered =
              hoveredEdge?.source === edge.source &&
              hoveredEdge?.target === edge.target;

            return (
              <g key={`edge-${i}`}>
                {/* Arrow line */}
                <Line
                  from={{ x: sourceNode.x, y: sourceNode.y }}
                  to={{ x: targetNode.x, y: targetNode.y }}
                  stroke={isHovered ? '#FF6B35' : '#666'}
                  strokeWidth={isHovered ? 4 : 3}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />

                {/* Edge label showing value */}
                <text
                  x={(sourceNode.x + targetNode.x) / 2}
                  y={(sourceNode.y + targetNode.y) / 2 - 10}
                  textAnchor="middle"
                  fontSize={14}
                  fill={isHovered ? '#FF6B35' : '#333'}
                  fontWeight="bold"
                  style={{
                    pointerEvents: 'none',
                    textShadow: '1px 1px 2px white',
                  }}
                >
                  {edge.value}
                </text>
              </g>
            );
          })}

          {/* Render nodes */}
          {nodes.map((node) => {
            const isHovered = hoveredNode?.id === node.id;
            const radius = isHovered ? 40 : 35;

            return (
              <Group
                key={node.id}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node shadow */}
                <Circle
                  cx={node.x + 3}
                  cy={node.y + 3}
                  r={radius}
                  fill="rgba(0,0,0,0.2)"
                />

                {/* Main node circle */}
                <Circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={colorScale(node.type)}
                  stroke={isHovered ? '#333' : '#555'}
                  strokeWidth={isHovered ? 4 : 2}
                  style={{ cursor: 'pointer' }}
                />

                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  fontSize={14}
                  fill="white"
                  fontWeight="bold"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.label}
                </text>

                {/* Node ID below */}
                <text
                  x={node.x}
                  y={node.y + radius + 20}
                  textAnchor="middle"
                  fontSize={12}
                  fill="#666"
                  style={{ pointerEvents: 'none' }}
                >
                  ID: {node.id}
                </text>
              </Group>
            );
          })}
        </Group>
      </svg>
    </div>
  );
};

export default FlowChart;
