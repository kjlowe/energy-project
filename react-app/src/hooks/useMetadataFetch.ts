import { useState, useEffect } from 'react';
import type { BillingStructureMetadata } from '@/types/generated/metadata';

interface UseMetadataFetchResult {
  metadata: BillingStructureMetadata | null;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook for fetching billing metadata from the Flask API.
 * Metadata includes units, data sources, and field origins for all billing fields.
 */
const useMetadataFetch = (): UseMetadataFetchResult => {
  const [metadata, setMetadata] = useState<BillingStructureMetadata | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use environment-based API URL
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

        // Fetch metadata
        const response = await fetch(`${apiUrl}/api/billing-metadata`);

        // Check if HTTP response is successful
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse JSON data
        const data = await response.json() as BillingStructureMetadata;
        setMetadata(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch metadata';
        setError(errorMessage);
        console.error('Error fetching metadata:', err);
      } finally {
        setLoading(false);
      }
    };

    void fetchMetadata();
  }, []); // Empty dependency array - runs once on mount

  return { metadata, loading, error };
};

export default useMetadataFetch;
