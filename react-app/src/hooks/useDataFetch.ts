import { useState, useEffect } from 'react';
import type {
  BillingYearsResponse,
  BillingYearWithId,
} from '@/types/api';

interface UseDataFetchResult {
  billingYears: BillingYearWithId[];
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching billing data from the Flask API.
 */
const useDataFetch = (): UseDataFetchResult => {
  const [billingYears, setBillingYears] = useState<BillingYearWithId[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use environment-based API URL
        // Development: http://localhost:5000
        // Staging: http://137.184.124.65:5000
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Fetch billing years data
        const billingYearsResponse = await fetch(`${apiUrl}/api/billing-years`);

        // Check if HTTP response is successful
        if (!billingYearsResponse.ok) {
          throw new Error('Failed to fetch billing data from API');
        }

        // Parse JSON data (snake_case from Python API matches TypeScript types)
        const billingYearsResult = await billingYearsResponse.json() as BillingYearsResponse;

        // Set all billing years
        if (billingYearsResult.billing_years) {
          setBillingYears(billingYearsResult.billing_years);
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

  return { billingYears, loading, error };
};

export default useDataFetch;
