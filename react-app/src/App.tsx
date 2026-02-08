import useDataFetch from '@hooks/useDataFetch';
import Solar from '@components/Solar';

const App: React.FC = () => {
  const { billingData, loading, error } = useDataFetch();

  if (loading) {
    return <div className="loading">🔄 Loading data visualization...</div>;
  }

  if (error) {
    return <div className="error">❌ Error loading data: {error}</div>;
  }

  return (
    <div className="App">
      <div>
        <Solar data={billingData} width={400} height={400} />
      </div>
    </div>
  );
};

export default App;
