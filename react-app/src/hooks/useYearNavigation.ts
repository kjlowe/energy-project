import { useState } from 'react';

interface UseYearNavigationResult {
  yearIdx: number;
  setYearIdx: (idx: number) => void;
  handlePrevYear: () => void;
  handleNextYear: () => void;
}

/**
 * Custom hook for managing year navigation state.
 * Provides boundary-aware navigation functions to prevent going out of range.
 *
 * @param totalYears - Total number of years available
 * @returns Year navigation state and handlers
 */
export function useYearNavigation(totalYears: number): UseYearNavigationResult {
  const [yearIdx, setYearIdx] = useState<number>(0);

  const handlePrevYear = () => {
    if (yearIdx > 0) {
      setYearIdx(yearIdx - 1);
    }
  };

  const handleNextYear = () => {
    if (yearIdx < totalYears - 1) {
      setYearIdx(yearIdx + 1);
    }
  };

  return { yearIdx, setYearIdx, handlePrevYear, handleNextYear };
}
