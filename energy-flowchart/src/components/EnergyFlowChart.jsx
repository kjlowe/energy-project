import React, { useState, useEffect } from 'react';
import { Group } from '@visx/group';
import { LinePath } from '@visx/shape';
import { curveBundle } from '@visx/curve';
import { localPoint } from '@visx/event';
import { useTooltip, Tooltip, defaultStyles } from '@visx/tooltip';

const EnergyFlowChart = ({ width = 800, height = 600 }) => {
  const [data, setData] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('2024-05');
  const [months, setMonths] = useState([]);
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const {
    tooltipData,
    tooltipLeft,
    tooltipTop,
    tooltipOpen,
    showTooltip,
    hideTooltip,
  } = useTooltip();

  // API base URL - will use Flask backend
  const API_BASE = 'http://localhost:5000';

  useEffect(() => {
    // Load available months
    fetch(`${API_BASE}/api/months`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch months');
        return res.json();
      })
      .then(setMonths)
      .catch(err => {
        console.error('Error loading months:', err);
        setError('Failed to load available months');
      });
  }, []);

  useEffect(() => {
    // Load data for selected month
    if (selectedMonth) {
      setLoading(true);
      setError(null);
      
      fetch(`${API_BASE}/api/energy-flow/${selectedMonth}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch energy data');
          return res.json();
        })
        .then(data => {
          setData(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error loading energy data:', err);
          setError('Failed to load energy data');
          setLoading(false);
        });
    }
  }, [selectedMonth]);

  const getNodeColor = (type) => {
    const colors = {
      utility: '#3b82f6',    // Blue for grid
      meter: '#10b981',      // Green for meters
      generation: '#f59e0b', // Yellow for solar
      load: '#ef4444'        // Red for loads
    };
    return colors[type] || '#6b7280';
  };

  const getNodeStroke = (type) => {
    const strokes = {
      utility: '#1e40af',
      meter: '#047857',
      generation: '#d97706',
      load: '#dc2626'
    };
    return strokes[type] || '#374151';
  };

  const getEdgeColor = (type) => {
    const colors = {
      import: '#ef4444',     // Red for grid import
      export: '#10b981',     // Green for grid export
      generation: '#f59e0b', // Yellow for solar generation
      consumption: '#6b7280', // Gray for consumption
      internal: '#8b5cf6'    // Purple for internal transfers
    };
    return colors[type] || '#6b7280';
  };

  const getEdgeWidth = (value) => {
    // Scale line width based on energy value
    const maxWidth = 8;
    const minWidth = 2;
    const maxValue = data ? Math.max(...data.edges.map(e => e.value)) : 1000;
    return minWidth + ((value / maxValue) * (maxWidth - minWidth));
  };

  const handleEdgeHover = (edge, event) => {
    const point = localPoint(event.target.ownerSVGElement, event);
    setHoveredEdge(edge);
    showTooltip({
      tooltipData: edge,
      tooltipLeft: point.x,
      tooltipTop: point.y,
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) return <div className="p-8 text-center">Loading energy data...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center">No data available</div>;

  return (
    <div className="w-full p-6 bg-white">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Energy Flow Visualization</h1>
      
      {/* Month Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2 text-gray-700">
          Select Month:
          <select 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="ml-2 border border-gray-300 rounded-md px-3 py-2 bg-white shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Billing Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="font-semibold mb-3 text-lg text-gray-800">Billing Summary - {data.month}</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-gray-600">Solar Generated</div>
            <div className="font-bold text-yellow-600">{data.billing_summary.solar_generation.toLocaleString()} kWh</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-gray-600">Grid Export</div>
            <div className="font-bold text-green-600">{data.billing_summary.total_export.toLocaleString()} kWh</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-gray-600">Grid Import</div>
            <div className="font-bold text-red-600">{data.billing_summary.total_import.toLocaleString()} kWh</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-gray-600">Net Usage</div>
            <div className="font-bold text-blue-600">{data.billing_summary.net_usage.toLocaleString()} kWh</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-gray-600">Total Consumption</div>
            <div className="font-bold text-gray-600">{data.billing_summary.total_consumption.toLocaleString()} kWh</div>
          </div>
          <div className="bg-white p-3 rounded shadow-sm">
            <div className="text-gray-600">Est. Bill</div>
            <div className="font-bold text-purple-600">{formatCurrency(data.billing_summary.estimated_bill)}</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-4 p-3 bg-gray-50 rounded border">
        <h4 className="font-medium mb-2 text-gray-800">Legend:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>Utility Grid</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>Meters</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span>Solar Generation</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span>Loads</span>
          </div>
        </div>
      </div>

      {/* SVG Flowchart */}
      <div className="border border-gray-300 rounded-lg overflow-hidden shadow-lg">
        <svg width={width} height={height} className="bg-gray-50">
          <Group>
            {/* Grid pattern background */}
            <defs>
              <pattern
                id="grid"
                width="20"
                height="20"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 20 0 L 0 0 0 20"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="1"
                />
              </pattern>
              
              {/* Arrow marker for directed edges */}
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="9"
                refY="3"
                markerWidth="6"
                markerHeight="6"
                orient="auto"
                markerUnits="strokeWidth"
              >
                <path d="M0,0 L0,6 L9,3 z" fill="#374151" />
              </marker>
            </defs>

            {/* Grid background */}
            <rect width={width} height={height} fill="url(#grid)" />

            {/* Render Edges */}
            {data.edges.map((edge, i) => {
              const sourceNode = data.nodes.find(n => n.id === edge.source);
              const targetNode = data.nodes.find(n => n.id === edge.target);
              
              if (!sourceNode || !targetNode) return null;
              
              const isHovered = hoveredEdge?.source === edge.source && 
                              hoveredEdge?.target === edge.target;
              
              const strokeWidth = getEdgeWidth(edge.value);
              
              return (
                <g key={i}>
                  <LinePath
                    data={[
                      { x: sourceNode.x + 60, y: sourceNode.y + 30 },
                      { x: targetNode.x - 10, y: targetNode.y + 30 }
                    ]}
                    x={d => d.x}
                    y={d => d.y}
                    stroke={getEdgeColor(edge.type)}
                    strokeWidth={isHovered ? strokeWidth + 2 : strokeWidth}
                    opacity={isHovered ? 1 : 0.8}
                    markerEnd="url(#arrow)"
                    onMouseMove={(e) => handleEdgeHover(edge, e)}
                    onMouseLeave={hideTooltip}
                    style={{ cursor: 'pointer' }}
                    curve={curveBundle.beta(0.8)}
                  />
                  
                  {/* Edge labels */}
                  <text
                    x={(sourceNode.x + 60 + targetNode.x - 10) / 2}
                    y={(sourceNode.y + 30 + targetNode.y + 30) / 2 - 10}
                    fontSize={11}
                    fontWeight="medium"
                    textAnchor="middle"
                    fill="#374151"
                    className="pointer-events-none"
                  >
                    {edge.label}
                  </text>
                </g>
              );
            })}

            {/* Render Nodes */}
            {data.nodes.map(node => (
              <Group key={node.id} left={node.x} top={node.y}>
                <rect
                  width={120}
                  height={60}
                  rx={12}
                  fill={getNodeColor(node.type)}
                  stroke={getNodeStroke(node.type)}
                  strokeWidth={3}
                  style={{
                    filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.2))'
                  }}
                />
                <text
                  x={60}
                  y={35}
                  fontSize={14}
                  fontWeight="bold"
                  textAnchor="middle"
                  fill="white"
                  className="pointer-events-none"
                >
                  {node.label}
                </text>
                <text
                  x={60}
                  y={50}
                  fontSize={10}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.8)"
                  className="pointer-events-none"
                >
                  {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                </text>
              </Group>
            ))}
          </Group>
        </svg>
      </div>

      {/* Tooltip */}
      {tooltipOpen && tooltipData && (
        <Tooltip
          top={tooltipTop}
          left={tooltipLeft}
          style={{
            ...defaultStyles,
            backgroundColor: 'white',
            border: '1px solid #d1d5db',
            borderRadius: '8px',
            padding: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div>
            <div className="font-semibold text-gray-800">{tooltipData.label}</div>
            <div className="text-sm text-gray-600 mt-1">
              Type: {tooltipData.type.charAt(0).toUpperCase() + tooltipData.type.slice(1)}
            </div>
            <div className="text-sm text-gray-600">
              Value: {tooltipData.value.toLocaleString()} kWh
            </div>
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default EnergyFlowChart;