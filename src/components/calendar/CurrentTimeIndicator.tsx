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
  const [position, setPosition] = useState(() => calculatePosition());

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

  useEffect(() => {
    // Update every minute
    const interval = setInterval(() => {
      setPosition(calculatePosition());
    }, 60000);

    return () => clearInterval(interval);
  }, [startHour, endHour, hourHeight]);

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
