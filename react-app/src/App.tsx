import { useEffect, useState } from 'react';
import useDataFetch from '@hooks/useDataFetch';
import useMetadataFetch from '@hooks/useMetadataFetch';
import { useYearNavigation } from '@hooks/useYearNavigation';
import { useViewMode } from '@hooks/useViewMode';
import MonthlyBillingView from '@components/MonthlyBillingView';
import YearSelector from '@components/YearSelector';
import TabNavigation from '@components/TabNavigation';
import YearlyBillingView from '@components/YearlyBillingView';
import { MetadataModal } from '@components/MetadataModal';
import { generateYearLabel } from '@/utils/yearLabel';

const App: React.FC = () => {
  const { billingYears, loading, error } = useDataFetch();
  const { metadata, loading: metadataLoading, error: metadataError } = useMetadataFetch();

  // Year navigation state
  const { yearIdx, setYearIdx, handlePrevYear, handleNextYear } =
    useYearNavigation(billingYears.length);

  // View mode state (month vs year)
  const { viewMode, setViewMode } = useViewMode('month');

  // Metadata modal state
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);

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
        {/* Metadata Error Display */}
        {metadataError && (
          <div style={{
            padding: '12px',
            backgroundColor: '#f8d7da',
            color: '#721c24',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginTop: '16px',
            marginBottom: '16px',
          }}>
            <strong>Metadata Error:</strong> {metadataError}
          </div>
        )}

        {/* View Metadata Button */}
        <div style={{ marginTop: '16px', marginBottom: '16px' }}>
          <button
            onClick={() => setIsMetadataModalOpen(true)}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: metadataLoading ? 'not-allowed' : 'pointer',
              opacity: metadataLoading ? 0.6 : 1,
            }}
            disabled={metadataLoading}
          >
            {metadataLoading ? 'Loading Metadata...' : 'View Metadata'}
          </button>
        </div>

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

        {/* Metadata Modal */}
        {isMetadataModalOpen && (
          <MetadataModal
            metadata={metadata}
            onClose={() => setIsMetadataModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default App;
