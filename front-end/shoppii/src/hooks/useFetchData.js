import { useState, useEffect } from "react";
import { fetchData } from "../services/api";

export const useFetchData = (endpoint) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false); // Initialize loading as false
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!endpoint) {
      // If endpoint is null or falsy, return default state
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    const getData = async () => {
      setLoading(true);
      try {
        const result = await fetchData(endpoint);
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, [endpoint]);

  return { data, loading, error };
};
