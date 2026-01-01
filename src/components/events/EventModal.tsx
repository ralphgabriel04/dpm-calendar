"use client";

import { Modal } from "@/components/ui/Modal";
import { EventForm, type EventFormData } from "./EventForm";

interface EventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<EventFormData>;
  calendars: Array<{ id: string; name: string; color: string }>;
  onSubmit: (data: EventFormData) => void;
  isLoading?: boolean;
  mode?: "create" | "edit";
}

export function EventModal({
  open,
  onOpenChange,
  initialData,
  calendars,
  onSubmit,
  isLoading,
  mode = "create",
}: EventModalProps) {
  const handleSubmit = (data: EventFormData) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={mode === "create" ? "Nouvel événement" : "Modifier l'événement"}
      className="max-w-lg"
    >
      <EventForm
        initialData={initialData}
        calendars={calendars}
        onSubmit={handleSubmit}
        onCancel={() => onOpenChange(false)}
        isLoading={isLoading}
        mode={mode}
      />
    </Modal>
  );
}
