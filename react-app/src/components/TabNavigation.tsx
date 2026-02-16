import React from 'react';

export type ViewMode = 'month' | 'year';

interface TabNavigationProps {
  /** Currently active tab */
  activeTab: ViewMode;
  /** Callback when tab is clicked */
  onTabChange: (tab: ViewMode) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '10px 20px',
    border: '1px solid #ccc',
    borderBottom: isActive ? 'none' : '1px solid #ccc',
    backgroundColor: isActive ? '#fff' : '#f0f0f0',
    cursor: 'pointer',
    fontWeight: isActive ? 'bold' : 'normal',
    marginRight: '5px',
  });

  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', borderBottom: '1px solid #ccc' }}>
        <button
          onClick={() => onTabChange('month')}
          style={tabStyle(activeTab === 'month')}
          aria-selected={activeTab === 'month'}
          role="tab"
        >
          Month by Month
        </button>
        <button
          onClick={() => onTabChange('year')}
          style={tabStyle(activeTab === 'year')}
          aria-selected={activeTab === 'year'}
          role="tab"
        >
          Full Year Data
        </button>
      </div>
    </div>
  );
};

export default TabNavigation;
