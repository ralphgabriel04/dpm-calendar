"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CurrentTimeIndicatorProps {
  startHour?: number;
  endHour?: number;
  hourHeight?: number;
  className?: string;
}

export function CurrentTimeIndicator({
  startHour = 0,
  endHour = 24,
  hourHeight = 60,
  className,
}: CurrentTimeIndicatorProps) {
  // Initialize to null to avoid hydration mismatch - calculate only on client
  const [position, setPosition] = useState<number | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    function calculatePosition() {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = startHour * 60;
      const endMinutes = endHour * 60;

      // Check if current time is within view
      if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
        return null;
      }

      const offsetMinutes = currentMinutes - startMinutes;
      const top = (offsetMinutes / 60) * hourHeight;

      return top;
    }

    // Calculate immediately on mount
    setPosition(calculatePosition());

    // Update every minute
    const interval = setInterval(() => {
      setPosition(calculatePosition());
    }, 60000);

    return () => clearInterval(interval);
  }, [isMounted, startHour, endHour, hourHeight]);

  if (position === null) {
    return null;
  }

  return (
    <div
      className={cn("absolute left-0 right-0 z-20 pointer-events-none", className)}
      style={{ top: position }}
    >
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5" />
        <div className="flex-1 h-0.5 bg-red-500" />
      </div>
    </div>
  );
}
