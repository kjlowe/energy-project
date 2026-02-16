import { useState, useMemo } from 'react';

export type ViewMode = 'month' | 'year';

interface UseViewModeResult {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isMonthView: boolean;
  isYearView: boolean;
}

/**
 * Custom hook for managing tab/view mode state.
 * Provides boolean helpers for conditional rendering.
 *
 * @param initialMode - Initial view mode (defaults to 'month')
 * @returns View mode state and computed boolean helpers
 */
export function useViewMode(initialMode: ViewMode = 'month'): UseViewModeResult {
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);

  const isMonthView = useMemo(() => viewMode === 'month', [viewMode]);
  const isYearView = useMemo(() => viewMode === 'year', [viewMode]);

  return { viewMode, setViewMode, isMonthView, isYearView };
}
