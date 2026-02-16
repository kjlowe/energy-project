import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useYearNavigation } from './useYearNavigation';

describe('useYearNavigation Hook', () => {
  describe('Initial State', () => {
    it('should start with yearIdx = 0', () => {
      const { result } = renderHook(() => useYearNavigation(5));

      expect(result.current.yearIdx).toBe(0);
    });
  });

  describe('handleNextYear', () => {
    it('should increment yearIdx when not at boundary', () => {
      const { result } = renderHook(() => useYearNavigation(5));

      act(() => {
        result.current.handleNextYear();
      });

      expect(result.current.yearIdx).toBe(1);
    });

    it('should not increment yearIdx beyond total years', () => {
      const { result } = renderHook(() => useYearNavigation(3));

      // Navigate to last year
      act(() => {
        result.current.setYearIdx(2); // Last year (0-indexed)
      });

      // Try to go beyond
      act(() => {
        result.current.handleNextYear();
      });

      expect(result.current.yearIdx).toBe(2); // Should stay at last year
    });
  });

  describe('handlePrevYear', () => {
    it('should decrement yearIdx when not at boundary', () => {
      const { result } = renderHook(() => useYearNavigation(5));

      // Navigate to year 2
      act(() => {
        result.current.setYearIdx(2);
      });

      act(() => {
        result.current.handlePrevYear();
      });

      expect(result.current.yearIdx).toBe(1);
    });

    it('should not decrement yearIdx below 0', () => {
      const { result } = renderHook(() => useYearNavigation(5));

      // Already at first year (0)
      act(() => {
        result.current.handlePrevYear();
      });

      expect(result.current.yearIdx).toBe(0); // Should stay at 0
    });
  });

  describe('setYearIdx', () => {
    it('should directly set yearIdx to specified value', () => {
      const { result } = renderHook(() => useYearNavigation(5));

      act(() => {
        result.current.setYearIdx(3);
      });

      expect(result.current.yearIdx).toBe(3);
    });
  });

  describe('Boundary Conditions', () => {
    it('should handle single year (totalYears = 1)', () => {
      const { result } = renderHook(() => useYearNavigation(1));

      // Can't go next from year 0
      act(() => {
        result.current.handleNextYear();
      });
      expect(result.current.yearIdx).toBe(0);

      // Can't go prev from year 0
      act(() => {
        result.current.handlePrevYear();
      });
      expect(result.current.yearIdx).toBe(0);
    });

    it('should handle zero years (totalYears = 0)', () => {
      const { result } = renderHook(() => useYearNavigation(0));

      expect(result.current.yearIdx).toBe(0);

      // Handlers should not crash
      act(() => {
        result.current.handleNextYear();
      });
      expect(result.current.yearIdx).toBe(0);

      act(() => {
        result.current.handlePrevYear();
      });
      expect(result.current.yearIdx).toBe(0);
    });
  });
});
