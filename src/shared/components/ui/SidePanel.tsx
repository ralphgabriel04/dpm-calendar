"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SidePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  side?: "left" | "right";
  width?: "sm" | "md" | "lg";
}

export function SidePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  showCloseButton = true,
  side = "right",
  width = "md",
}: SidePanelProps) {
  const widthClasses = {
    sm: "w-[320px]",
    md: "w-[400px] sm:w-[450px]",
    lg: "w-[500px] sm:w-[600px]",
  };

  const sideClasses = {
    left: "left-0 data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
    right: "right-0 data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            "fixed inset-0 z-50",
            "bg-black/30 backdrop-blur-[2px]",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
        />
        <Dialog.Content
          className={cn(
            "fixed top-0 bottom-0 z-50 flex flex-col",
            "bg-card border-l shadow-2xl",
            "duration-300 ease-out",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            widthClasses[width],
            sideClasses[side],
            className
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4 border-b bg-card/95 backdrop-blur-sm sticky top-0 z-10">
              <div>
                {title && (
                  <Dialog.Title className="text-lg font-semibold">
                    {title}
                  </Dialog.Title>
                )}
                {description && (
                  <Dialog.Description className="text-sm text-muted-foreground">
                    {description}
                  </Dialog.Description>
                )}
              </div>
              {showCloseButton && (
                <Dialog.Close className="rounded-full p-2 hover:bg-accent transition-colors">
                  <X className="h-5 w-5" />
                  <span className="sr-only">Fermer</span>
                </Dialog.Close>
              )}
            </div>
          )}

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export const SidePanelTrigger = Dialog.Trigger;
export const SidePanelClose = Dialog.Close;
