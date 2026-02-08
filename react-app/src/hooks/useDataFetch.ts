import { useState, useEffect } from 'react';
import type {
  BillingYearsResponse,
  BillingYearWithId,
  FlowChartDataResponse,
  FiltersResponse,
} from '@/types/api';

interface UseDataFetchResult {
  data: FlowChartDataResponse | null;
  filters: FiltersResponse | null;
  billingData: BillingYearWithId | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching data from the Flask API.
 * Fetches flow chart data, filters, and billing years concurrently.
 */
const useDataFetch = (): UseDataFetchResult => {
  const [data, setData] = useState<FlowChartDataResponse | null>(null);
  const [filters, setFilters] = useState<FiltersResponse | null>(null);
  const [billingData, setBillingData] = useState<BillingYearWithId | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const useLocalhost = true; // set to false to use remote IP
        const ip_address = useLocalhost ? 'localhost' : '137.184.124.65';

        // Make concurrent API calls for better performance
        const [dataResponse, filtersResponse, billingYearsResponse] = await Promise.all([
          fetch(`http://${ip_address}:5000/api/data`),
          fetch(`http://${ip_address}:5000/api/filters`),
          fetch(`http://${ip_address}:5000/api/billing-years`),
        ]);

        // Check if all HTTP responses are successful
        if (!dataResponse.ok || !filtersResponse.ok || !billingYearsResponse.ok) {
          throw new Error('Failed to fetch data from API');
        }

        // Parse JSON data (snake_case from Python API matches TypeScript types)
        const dataResult = await dataResponse.json() as FlowChartDataResponse;
        const filtersResult = await filtersResponse.json() as FiltersResponse;
        const billingYearsResult = await billingYearsResponse.json() as BillingYearsResponse;

        // Update state with data
        setData(dataResult);
        setFilters(filtersResult);

        // Use first billing year if available
        if (billingYearsResult.billing_years && billingYearsResult.billing_years.length > 0) {
          setBillingData(billingYearsResult.billing_years[0] ?? null);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchData();
  }, []); // Empty dependency array - runs once on mount

  return { data, filters, billingData, loading, error };
};

export default useDataFetch;
