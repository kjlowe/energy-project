import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useViewMode } from './useViewMode';

describe('useViewMode Hook', () => {
  describe('Initial State', () => {
    it('should default to month view', () => {
      const { result } = renderHook(() => useViewMode());

      expect(result.current.viewMode).toBe('month');
      expect(result.current.isMonthView).toBe(true);
      expect(result.current.isYearView).toBe(false);
    });

    it('should respect custom initial mode', () => {
      const { result } = renderHook(() => useViewMode('year'));

      expect(result.current.viewMode).toBe('year');
      expect(result.current.isMonthView).toBe(false);
      expect(result.current.isYearView).toBe(true);
    });
  });

  describe('setViewMode', () => {
    it('should toggle to year view', () => {
      const { result } = renderHook(() => useViewMode());

      act(() => {
        result.current.setViewMode('year');
      });

      expect(result.current.viewMode).toBe('year');
      expect(result.current.isMonthView).toBe(false);
      expect(result.current.isYearView).toBe(true);
    });

    it('should toggle to month view', () => {
      const { result } = renderHook(() => useViewMode('year'));

      act(() => {
        result.current.setViewMode('month');
      });

      expect(result.current.viewMode).toBe('month');
      expect(result.current.isMonthView).toBe(true);
      expect(result.current.isYearView).toBe(false);
    });

    it('should toggle multiple times', () => {
      const { result } = renderHook(() => useViewMode());

      // Month → Year
      act(() => {
        result.current.setViewMode('year');
      });
      expect(result.current.viewMode).toBe('year');

      // Year → Month
      act(() => {
        result.current.setViewMode('month');
      });
      expect(result.current.viewMode).toBe('month');

      // Month → Year again
      act(() => {
        result.current.setViewMode('year');
      });
      expect(result.current.viewMode).toBe('year');
    });
  });

  describe('Boolean Helpers', () => {
    it('should correctly compute isMonthView', () => {
      const { result } = renderHook(() => useViewMode('month'));

      expect(result.current.isMonthView).toBe(true);

      act(() => {
        result.current.setViewMode('year');
      });

      expect(result.current.isMonthView).toBe(false);
    });

    it('should correctly compute isYearView', () => {
      const { result } = renderHook(() => useViewMode('month'));

      expect(result.current.isYearView).toBe(false);

      act(() => {
        result.current.setViewMode('year');
      });

      expect(result.current.isYearView).toBe(true);
    });
  });
});
