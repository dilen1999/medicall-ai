import { useEffect, useState } from "react";

export function useApiData(fetcher, deps = [], { pollMs } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    function load(isInitial) {
      if (isInitial) setLoading(true);
      setError(null);
      fetcher()
        .then((result) => {
          if (!cancelled) setData(result);
        })
        .catch((err) => {
          if (!cancelled) setError(err.message || String(err));
        })
        .finally(() => {
          if (!cancelled && isInitial) setLoading(false);
        });
    }

    load(true);

    let intervalId;
    if (pollMs) {
      intervalId = setInterval(() => load(false), pollMs);
    }

    return () => {
      cancelled = true;
      if (intervalId) clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}
