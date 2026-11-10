import { useEffect, useState } from 'react';

// The current time, refreshed every intervalMs (for countdowns).
// The interval is cleared when the component unmounts.
export const useNow = (intervalMs = 30000) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return now;
};
