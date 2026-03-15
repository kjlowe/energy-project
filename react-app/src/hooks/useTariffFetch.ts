import { useState, useEffect } from 'react';
import type { TariffSchedule } from '@/types/generated/tariff';

interface UseTariffFetchResult {
  tariffSchedule: TariffSchedule | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching PG&E E-TOU-C tariff schedule from the Flask API.
 * Tariff schedule includes rates, baseline quantities, and TOU period definitions.
 */
const useTariffFetch = (): UseTariffFetchResult => {
  const [tariffSchedule, setTariffSchedule] = useState<TariffSchedule | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTariff = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use environment-based API URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Fetch tariff schedule
        const response = await fetch(`${apiUrl}/api/tariff-schedule`);

        // Check if HTTP response is successful
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse JSON data
        const data = await response.json() as TariffSchedule;
        setTariffSchedule(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tariff schedule';
        setError(errorMessage);
        console.error('Error fetching tariff schedule:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchTariff();
  }, []); // Empty dependency array - runs once on mount

  return { tariffSchedule, loading, error };
};

export default useTariffFetch;
