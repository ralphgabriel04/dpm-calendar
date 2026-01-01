"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium",
          "ring-offset-background transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "active:scale-[0.98]",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-md shadow-primary/25":
              variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow-md shadow-destructive/25":
              variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-accent":
              variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80":
              variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-10 px-5 py-2 rounded-full": size === "default",
            "h-9 px-4 rounded-full": size === "sm",
            "h-12 px-8 rounded-full text-base": size === "lg",
            "h-10 w-10 rounded-full": size === "icon",
            "h-8 w-8 rounded-full": size === "icon-sm",
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
