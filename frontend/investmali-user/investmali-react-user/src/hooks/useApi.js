import { useState, useCallback } from 'react';
import { apiRequest } from '../services/api';

export const useApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const callApi = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest(endpoint, options);
      setData(response);
      return { data: response, error: null };
    } catch (err) {
      console.error('API Error:', err);
      setError(err);
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return { callApi, loading, error, data };
};

export default useApi;
