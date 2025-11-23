/* filepath: /workspace/data-viz-app/src/App.jsx */
import { useDataFetch } from './hooks/useDataFetch';
//import FlowChart from './components/FlowChart';
import Solar from './components/Solar';

function App() {
  const { data, filters, billingData, loading, error } = useDataFetch();

  if (loading) return <div className="loading">🔄 Loading data visualization...</div>;
  if (error) return <div className="error">❌ Error loading data: {error}</div>;

  return (
    <div className="App">     

      <div>
        <Solar data={billingData} width={400} height={400} />
      </div>

    </div>
  );

  /* 

        <div className="filters">
        <select>
          <option value="">Select Category</option>
          {filters.categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      <div className="chart-container">
        <FlowChart data={data} width={800} height={500} />
      </div>

  */
}

export default App;