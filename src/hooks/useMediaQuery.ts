"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  // Start with null to indicate "not yet determined" during SSR
  const [matches, setMatches] = useState<boolean | null>(null);

  useEffect(() => {
    const media = window.matchMedia(query);

    const updateMatches = () => setMatches(media.matches);
    updateMatches();

    media.addEventListener("change", updateMatches);
    return () => media.removeEventListener("change", updateMatches);
  }, [query]);

  // During SSR and initial hydration, return false (desktop-first approach)
  // This prevents hydration mismatches
  return matches ?? false;
}

export function useIsMobile() {
  return useMediaQuery("(max-width: 1023px)");
}

export function useIsTablet() {
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop() {
  return useMediaQuery("(min-width: 1024px)");
}
