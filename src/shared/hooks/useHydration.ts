"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect if the component has been hydrated on the client.
 * Use this to conditionally render content that depends on client-only data
 * like the current date/time to avoid hydration mismatches.
 */
export function useHydration() {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

/**
 * Hook to get the current date, but only after hydration.
 * Returns null during SSR and initial render to avoid hydration mismatches.
 */
export function useCurrentDate() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  return currentDate;
}
