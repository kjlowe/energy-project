/* filepath: /workspace/data-viz-app/src/App.jsx */
import { useDataFetch } from './hooks/useDataFetch';
import FlowChart from './components/FlowChart';

function App() {
  const { data, filters, loading, error } = useDataFetch();

  if (loading) return <div className="loading">🔄 Loading data visualization...</div>;
  if (error) return <div className="error">❌ Error loading data: {error}</div>;

  return (
    <div className="App">     
      <div className="filters">
        <select>
          <option value="">Select Category</option>
          {filters.categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>s
      </div>

      <div className="chart-container">
        <FlowChart data={data} width={800} height={500} />
      </div>
    </div>
  );
}

export default App;