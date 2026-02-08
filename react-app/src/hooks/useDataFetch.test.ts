import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { server } from '../test/mocks/server';
import useDataFetch from './useDataFetch';

describe('useDataFetch Hook', () => {
  describe('Successful Data Fetching', () => {
    it('should fetch and return all data successfully', async () => {
      const { result } = renderHook(() => useDataFetch());

      // Initially loading
      expect(result.current.loading).toBe(true);
      expect(result.current.data).toBeNull();
      expect(result.current.filters).toBeNull();
      expect(result.current.billingData).toBeNull();

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check all data loaded
      expect(result.current.error).toBeNull();
      expect(result.current.data).not.toBeNull();
      expect(result.current.filters).not.toBeNull();
      expect(result.current.billingData).not.toBeNull();
    });

    it('should set first billing year as billingData', async () => {
      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Check billingData properties
      expect(result.current.billingData).not.toBeNull();
      // Note: API returns snake_case, but hook should handle it
      expect(result.current.billingData).toHaveProperty('id');
    });

    it('should fetch flow chart data', async () => {
      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.data).not.toBeNull();
      expect(result.current.data?.nodes).toBeDefined();
      expect(result.current.data?.edges).toBeDefined();
      expect(result.current.data?.nodes.length).toBeGreaterThan(0);
    });

    it('should fetch filters data', async () => {
      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.filters).not.toBeNull();
      expect(result.current.filters?.categories).toBeDefined();
      expect(result.current.filters?.timeframes).toBeDefined();
      expect(result.current.filters?.categories.length).toBeGreaterThan(0);
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

    it('should handle null response fields gracefully', async () => {
      server.use(
        http.get('http://localhost:5000/api/data', () => {
          return HttpResponse.json({ nodes: [], edges: [] });
        }),
        http.get('http://localhost:5000/api/filters', () => {
          return HttpResponse.json({ categories: [], timeframes: [] });
        }),
        http.get('http://localhost:5000/api/billing-years', () => {
          return HttpResponse.json({ billing_years: [], count: 0 });
        })
      );

      const { result } = renderHook(() => useDataFetch());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ nodes: [], edges: [] });
      expect(result.current.filters).toEqual({ categories: [], timeframes: [] });
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
      expect(result.current.error).toContain('Failed to fetch data');
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
    });

    it('should handle partial API failures', async () => {
      // Only billing-years endpoint fails
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
      // All data should be null due to Promise.all
      expect(result.current.data).toBeNull();
      expect(result.current.filters).toBeNull();
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
