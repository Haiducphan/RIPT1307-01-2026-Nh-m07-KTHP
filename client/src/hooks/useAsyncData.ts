import { useEffect, useState } from 'react';

export function useAsyncData<T>(requestFn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await requestFn();
      setData(result);
      return result;
    } catch (requestError) {
      setError(requestError);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, deps);

  return {
    data,
    loading,
    error,
    refresh
  };
}
