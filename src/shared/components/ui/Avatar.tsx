"use client";

import { cn } from "@/shared/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

export function Avatar({ src, name, className }: AvatarProps) {
  const initials = name
    ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  if (src) {
    return (
      <img
        src={src}
        alt={name || "Avatar"}
        className={cn(
          "rounded-full object-cover bg-muted",
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs",
        className
      )}
    >
      {initials}
    </div>
  );
}
