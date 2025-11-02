import { useState, useEffect } from 'react';

export const useDataFetch = () => {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [filters, setFilters] = useState({ categories: [], timeframes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both data and filters using external IP
        const [dataResponse, filtersResponse] = await Promise.all([
          fetch('http://137.184.124.65:5000/api/data'),
          fetch('http://137.184.124.65:5000/api/filters')
        ]);

        if (!dataResponse.ok || !filtersResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        const dataResult = await dataResponse.json();
        const filtersResult = await filtersResponse.json();
        
        setData(dataResult);
        setFilters(filtersResult);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, filters, loading, error };
};