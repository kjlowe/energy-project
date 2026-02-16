import { useState } from 'react';

interface UseMonthNavigationResult {
  monthIdx: number;
  setMonthIdx: (idx: number) => void;
  handlePrevMonth: () => void;
  handleNextMonth: () => void;
}

/**
 * Custom hook for managing month navigation state.
 * Provides navigation handlers for previous/next month buttons.
 */
export function useMonthNavigation(totalMonths: number): UseMonthNavigationResult {
  const [monthIdx, setMonthIdx] = useState<number>(0);

  const handlePrevMonth = () => {
    if (monthIdx > 0) {
      setMonthIdx(monthIdx - 1);
    }
  };

  const handleNextMonth = () => {
    if (monthIdx < totalMonths - 1) {
      setMonthIdx(monthIdx + 1);
    }
  };

  return { monthIdx, setMonthIdx, handlePrevMonth, handleNextMonth };
}
