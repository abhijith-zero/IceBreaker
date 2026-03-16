import { useState, useEffect, useRef } from "react";

/**
 * useSessionTimer
 * Returns elapsed seconds + a formatted mm:ss string.
 * Starts automatically, stops when active=false.
 */
export function useSessionTimer(active = true) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active) {
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [active]);

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const seconds = String(elapsed % 60).padStart(2, "0");

  return { elapsed, formatted: `${minutes}:${seconds}` };
}
