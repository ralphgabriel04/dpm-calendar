"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { name: "Rouge", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Ambre", value: "#F59E0B" },
  { name: "Jaune", value: "#EAB308" },
  { name: "Citron", value: "#84CC16" },
  { name: "Vert", value: "#22C55E" },
  { name: "Émeraude", value: "#10B981" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Bleu", value: "#3B82F6" },
  { name: "Indigo", value: "#6366F1" },
  { name: "Violet", value: "#8B5CF6" },
  { name: "Fuchsia", value: "#D946EF" },
  { name: "Rose", value: "#EC4899" },
  { name: "Gris", value: "#6B7280" },
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
  disabled?: boolean;
}

export function ColorPicker({
  value,
  onChange,
  className,
  disabled,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);

  const selectedColor = value || PRESET_COLORS[8].value; // Default blue

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          disabled={disabled}
        >
          <div
            className="h-5 w-5 rounded-full border border-border"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-sm">
            {PRESET_COLORS.find((c) => c.value === selectedColor)?.name || "Couleur"}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3" align="start">
        <div className="grid grid-cols-7 gap-2">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              className={cn(
                "h-7 w-7 rounded-full border-2 transition-transform hover:scale-110",
                value === color.value
                  ? "border-foreground"
                  : "border-transparent"
              )}
              style={{ backgroundColor: color.value }}
              onClick={() => {
                onChange(color.value);
                setOpen(false);
              }}
              title={color.name}
            >
              {value === color.value && (
                <Check className="h-4 w-4 mx-auto text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
        {/* Custom color input */}
        <div className="mt-3 pt-3 border-t">
          <label className="text-xs text-muted-foreground">Couleur personnalisée</label>
          <div className="flex gap-2 mt-1">
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => onChange(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border-0 p-0"
            />
            <input
              type="text"
              value={selectedColor}
              onChange={(e) => {
                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                  onChange(e.target.value);
                }
              }}
              className="flex-1 h-8 px-2 text-sm rounded border border-input bg-background"
              placeholder="#000000"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface ColorPickerInlineProps {
  value?: string;
  onChange: (color: string) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ColorPickerInline({
  value,
  onChange,
  className,
  size = "md",
}: ColorPickerInlineProps) {
  const sizeClasses = {
    sm: "h-5 w-5",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {PRESET_COLORS.map((color) => (
        <button
          key={color.value}
          className={cn(
            "rounded-full border-2 transition-transform hover:scale-110",
            sizeClasses[size],
            value === color.value
              ? "border-foreground"
              : "border-transparent"
          )}
          style={{ backgroundColor: color.value }}
          onClick={() => onChange(color.value)}
          title={color.name}
        >
          {value === color.value && (
            <Check
              className={cn(
                "mx-auto text-white drop-shadow",
                size === "sm" ? "h-3 w-3" : "h-4 w-4"
              )}
            />
          )}
        </button>
      ))}
    </div>
  );
}

export { PRESET_COLORS };
