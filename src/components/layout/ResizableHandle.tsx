"use client";

import { Separator } from "react-resizable-panels";
import { cn } from "@/lib/utils";

interface ResizableHandleProps {
  className?: string;
  direction?: "horizontal" | "vertical";
  disabled?: boolean;
}

export function ResizableHandle({
  className,
  direction = "horizontal",
  disabled = false,
}: ResizableHandleProps) {
  return (
    <Separator
      className={cn(
        "group relative flex items-center justify-center",
        "transition-colors duration-150",
        direction === "horizontal"
          ? "w-1 cursor-col-resize hover:bg-primary/20 active:bg-primary/40"
          : "h-1 cursor-row-resize hover:bg-primary/20 active:bg-primary/40",
        disabled && "cursor-default !hover:bg-transparent pointer-events-none",
        className
      )}
    >
      {/* Visual indicator - shows on hover */}
      <div
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity duration-150",
          "bg-primary/60 rounded-full",
          direction === "horizontal" ? "w-0.5 h-8" : "h-0.5 w-8",
          disabled && "hidden"
        )}
      />
    </Separator>
  );
}
