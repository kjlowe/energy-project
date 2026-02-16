import { useEffect } from 'react';
import useDataFetch from '@hooks/useDataFetch';
import { useYearNavigation } from '@hooks/useYearNavigation';
import { useViewMode } from '@hooks/useViewMode';
import MonthlyBillingView from '@components/MonthlyBillingView';
import YearSelector from '@components/YearSelector';
import TabNavigation from '@components/TabNavigation';
import YearlyBillingView from '@components/YearlyBillingView';
import { generateYearLabel } from '@/utils/yearLabel';

const App: React.FC = () => {
  const { billingYears, loading, error } = useDataFetch();

  // Year navigation state
  const { yearIdx, setYearIdx, handlePrevYear, handleNextYear } =
    useYearNavigation(billingYears.length);

  // View mode state (month vs year)
  const { viewMode, setViewMode } = useViewMode('month');

  // Reset to month view when year changes
  useEffect(() => {
    setViewMode('month');
  }, [yearIdx, setViewMode]);

  if (loading) {
    return <div className="loading">🔄 Loading data visualization...</div>;
  }

  if (error) {
    return <div className="error">❌ Error loading data: {error}</div>;
  }

  if (billingYears.length === 0) {
    return <div className="error">No billing data available</div>;
  }

  // Get current billing year
  const currentBillingYear = billingYears[yearIdx];

  // Safety check (shouldn't happen due to length check above)
  if (!currentBillingYear) {
    return <div className="error">Invalid billing year selected</div>;
  }

  // Generate year label
  const yearLabel = generateYearLabel(currentBillingYear);

  return (
    <div className="App">
      <div style={{ padding: '20px' }}>
        {/* Year Selector */}
        <YearSelector
          yearIdx={yearIdx}
          totalYears={billingYears.length}
          yearLabel={yearLabel}
          onPrevYear={handlePrevYear}
          onNextYear={handleNextYear}
          onYearChange={setYearIdx}
        />

        {/* Tab Navigation */}
        <TabNavigation activeTab={viewMode} onTabChange={setViewMode} />

        {/* Conditional Content */}
        {viewMode === 'month' ? (
          <MonthlyBillingView data={currentBillingYear} width={400} height={400} />
        ) : (
          <YearlyBillingView data={currentBillingYear} />
        )}
      </div>
    </div>
  );
};

export default App;
