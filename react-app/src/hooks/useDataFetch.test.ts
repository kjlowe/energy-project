import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import useDataFetch from './useDataFetch';

describe('useDataFetch Hook', () => {
  describe('Successful Data Fetching', () => {
    it('should fetch and return billing years array successfully', async () => {
      const { result } = renderHook(() => useDataFetch());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.billingYears).toEqual([]);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check billing years array loaded
      expect(result.current.error).toBeNull();
      expect(result.current.billingYears).toBeInstanceOf(Array);
      expect(result.current.billingYears.length).toBeGreaterThan(0);
    });

    it('should set all billing years in array', async () => {
      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check billingYears properties
      expect(result.current.billingYears).toBeInstanceOf(Array);
      expect(result.current.billingYears[0]).toHaveProperty('id');
      expect(result.current.billingYears[0]).toHaveProperty('billing_months');
    });
  });

  describe('Empty Response Handling', () => {
    it('should handle empty billing_years array', async () => {
      server.use(
        http.get('http://localhost:5000/api/billing-years', () => {
          return HttpResponse.json({
            billing_years: [],
            count: 0,
          });
        })
      );

      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.billingYears).toEqual([]); // Empty array
    });
  });

  describe('Error Handling', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      // Suppress console.error during error handling tests
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    it('should handle API error responses', async () => {
      server.use(
        http.get('http://localhost:5000/api/billing-years', () => {
          return HttpResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      expect(result.current.error).toContain('Failed to fetch billing data');
      expect(result.current.billingYears).toEqual([]);
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('http://localhost:5000/api/billing-years', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.billingYears).toEqual([]);
    });

    it('should handle API failure', async () => {
      server.use(
        http.get('http://localhost:5000/api/billing-years', () => {
          return HttpResponse.json({}, { status: 500 });
        })
      );

      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should have error
      expect(result.current.error).toBeTruthy();
      expect(result.current.billingYears).toEqual([]);
    });
  });

  describe('Loading State', () => {
    it('should start with loading=true', () => {
      const { result } = renderHook(() => useDataFetch());

      expect(result.current.loading).toBe(true);
    });

    it('should set loading=false after fetch completes', async () => {
      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading=false even on error', async () => {
      // Suppress console.error for this error test
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      server.use(
        http.get('http://localhost:5000/api/billing-years', () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();

      consoleErrorSpy.mockRestore();
    });
  });
});
