/* filepath: /workspace/data-viz-app/src/App.jsx */
import React from 'react';
import { useDataFetch } from './hooks/useDataFetch';
import FlowChart from './components/FlowChart';
import './App.css';

function App() {
  const { data, filters, loading, error } = useDataFetch();

  if (loading) return <div className="loading">🔄 Loading data visualization...</div>;
  if (error) return <div className="error">❌ Error loading data: {error}</div>;

  return (
    <div className="App">
      <h1>🔋 Energy Project Data Visualization</h1>
      
      <div className="filters">
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>Filters:</label>
        <select>
          <option value="">📂 Select Category</option>
          {filters.categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        
        <select>
          <option value="">⏰ Select Timeframe</option>
          {filters.timeframes.map(time => (
            <option key={time} value={time}>{time}</option>
          ))}
        </select>
      </div>

      <div className="chart-container">
        <h2>Process Flow Diagram</h2>
        <FlowChart data={data} width={800} height={500} />
      </div>
    </div>
  );
}

export default App;