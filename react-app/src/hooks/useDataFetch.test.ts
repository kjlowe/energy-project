import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import useDataFetch from './useDataFetch';

describe('useDataFetch Hook', () => {
  describe('Successful Data Fetching', () => {
    it('should fetch and return billing data successfully', async () => {
      const { result } = renderHook(() => useDataFetch());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.billingData).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check billing data loaded
      expect(result.current.error).toBeNull();
      expect(result.current.billingData).not.toBeNull();
    });

    it('should set first billing year as billingData', async () => {
      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check billingData properties
      expect(result.current.billingData).not.toBeNull();
      expect(result.current.billingData).toHaveProperty('id');
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
      expect(result.current.billingData).toBeNull(); // No data to set
    });
  });

  describe('Error Handling', () => {
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
      expect(result.current.billingData).toBeNull();
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
      expect(result.current.billingData).toBeNull();
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
      expect(result.current.billingData).toBeNull();
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
    });
  });
});
