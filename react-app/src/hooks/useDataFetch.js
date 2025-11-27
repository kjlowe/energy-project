// Import React hooks for state management and side effects
import { useState, useEffect } from 'react';

// Custom hook for fetching data and filters from an external API
export const useDataFetch = () => {
  
  // State management for data fetching: data/filters storage, loading status, and error handling
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [filters, setFilters] = useState({ categories: [], timeframes: [] });
  const [billingData, setBillingData] = useState({ records: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // useEffect hook runs once when component mounts (empty dependency array)
  useEffect(() => {

    // Async function to handle the data fetching process
    const fetchData = async () => {

      try {
        // Set loading to true at the start of fetch operation. This helps show 
        // loading indicators in the UI.
        setLoading(true);

        const useLocalhost = false; // set to false to use remote IP
        const ip_address = useLocalhost ? 'localhost' : '137.184.124.65';
        
        // Make concurrent API calls to fetch both data and filters
        // Using Promise.all for better performance than sequential calls
        const [dataResponse, filtersResponse, billingDataResponse] = await Promise.all([
          fetch(`http://${ip_address}:5000/api/data`),
          fetch(`http://${ip_address}:5000/api/filters`),
          fetch(`http://${ip_address}:5000/api/billing-data`)
        ]);

        // Check if both HTTP responses are successful (status 200-299)
        if (!dataResponse.ok || !filtersResponse.ok || !billingDataResponse.ok) {
          throw new Error('Failed to fetch data');
        }

        // Parse JSON data from both responses
        const dataResult = await dataResponse.json();
        const filtersResult = await filtersResponse.json();
        const billingDataResult = await billingDataResponse.json();
        
        // Update state with the fetched data
        setData(dataResult);
        setFilters(filtersResult);
        setBillingData(billingDataResult);

      } catch (err) {
        // If any error occurs, store the error message in state
        setError(err.message);

      } finally {
        // Always set loading to false when fetch operation completes
        // (whether successful or failed)
        setLoading(false);
      }
    };

    // Call the fetchData function immediately when component mounts
    fetchData();

  }, []); // Empty dependency array means this effect runs only once on mount

  // Return all state values for consuming components
  return { data, filters, billingData, loading, error };
};